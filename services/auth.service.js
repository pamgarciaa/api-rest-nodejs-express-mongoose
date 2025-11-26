/**
 * 📂 Archivo: services/auth.service.js
 * 📝 Descripción: Contiene toda la lógica de negocio relacionada con la autenticación y gestión de usuarios.
 */

// Importamos 'crypto', un módulo nativo de Node.js.
// Se usa aquí específicamente para generar números aleatorios seguros (el token de reseteo).
import crypto from "crypto";

// Importamos el Modelo de Usuario (Mongoose).
// Es la interfaz que nos permite interactuar con la colección 'users' en MongoDB.
import User from "../models/user.model.js";

/**
 * 1️⃣ Registro de Usuario
 * Recibe un objeto con los datos crudos, valida duplicados y crea el registro.
 */
const registerUser = async (userData) => {
  // Desestructuración: Extraemos las propiedades necesarias del objeto recibido.
  const { username, email, password, profilePicture } = userData;

  // Verificación de existencia: Consultamos a la BD si ya hay alguien con ese email.
  const userExists = await User.findOne({ email });

  // Si userExists no es null, lanzamos un error para detener el proceso.
  // Este error será capturado posteriormente por el Controlador.
  if (userExists) {
    throw new Error("User already exists");
  }

  // Creación: Usamos .create() que es un atajo de Mongoose para instanciar y guardar (save).
  // NOTA: Aquí se pasa la contraseña en texto plano. Se asume que el modelo 'User'
  // tiene un "pre-save hook" (middleware) que hashea la contraseña antes de guardarla.
  const user = await User.create({
    username,
    email,
    password,
    profilePicture,
  });

  // Retornamos el objeto usuario creado al controlador.
  return user;
};

/**
 * 2️⃣ Inicio de Sesión (Login)
 * Verifica credenciales y retorna el usuario si son correctas.
 */
const loginUser = async (email, password) => {
  // Buscamos el usuario por email.
  // .select("+password"): Esto es CRÍTICO. Normalmente, en el modelo User, el campo password
  // suele estar marcado con { select: false } para que no viaje en consultas normales.
  // Aquí forzamos su inclusión porque necesitamos comparar la contraseña.
  const user = await User.findOne({ email }).select("+password");

  // Si no existe el usuario, lanzamos error genérico por seguridad.
  if (!user) throw new Error("Invalid email or password");

  // Verificación de contraseña:
  // .matchPassword() NO es un método estándar de Mongoose. Es un "Instance Method" personalizado
  // que debió ser definido en user.model.js (usualmente usando bcrypt.compare).
  const isMatch = await user.matchPassword(password);

  // Si las contraseñas no coinciden (hash vs texto plano), error.
  if (!isMatch) throw new Error("Invalid email or password");

  // Retornamos el usuario (que luego el controlador usará para generar un JWT, por ejemplo).
  return user;
};

/**
 * 3️⃣ Eliminar Usuario
 * Busca por ID y elimina el documento.
 */
const deleteUser = async (id) => {
  // Primero verificamos que el usuario exista antes de intentar borrar.
  const user = await User.findById(id);

  if (!user) throw new Error("User not found");

  // Procedemos a la eliminación física del documento en la base de datos.
  await User.findByIdAndDelete(id);

  return true;
};

/**
 * 4️⃣ Obtener todos los usuarios
 * Útil para paneles de administración o listas de comunidad.
 */
const getAllUsers = async () => {
  // .find(): Trae todos los documentos de la colección.
  // .select("-password"): PROYECCIÓN NEGATIVA. Asegura que el campo password
  // sea excluido de la respuesta, protegiendo la seguridad de los datos.
  return await User.find().select("-password");
};

/**
 * 5️⃣ Olvidé mi contraseña (Solicitud)
 * Genera un token temporal y lo guarda en el usuario.
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  // Generación del Token:
  // Crea un número aleatorio entero entre 100000 y 999999 (un PIN de 6 dígitos).
  // .toString() lo convierte a texto para guardarlo en la BD.
  const resetToken = crypto.randomInt(100000, 999999).toString();

  // Asignamos el token al documento del usuario en memoria.
  user.resetPasswordToken = resetToken;

  // Establecemos expiración: Hora actual + 3.600.000 milisegundos (1 hora).
  user.resetPasswordExpire = Date.now() + 3600000;

  // Guardamos los cambios en la base de datos.
  // NOTA: Si hay validaciones en el modelo, este save() las disparará.
  await user.save();

  // Retornamos el token para que el controlador se lo envíe al usuario (usualmente por email).
  return resetToken;
};

/**
 * 6️⃣ Restablecer contraseña (Ejecución)
 * Recibe el token y la nueva contraseña para efectuar el cambio.
 */
const resetPassword = async (token, newPassword) => {
  // Consulta compuesta (Query):
  // Buscamos un usuario que cumpla DOS condiciones simultáneamente:
  // 1. Que tenga el token coincidente.
  // 2. Que su fecha de expiración sea MAYOR ($gt - Greater Than) que la hora actual.
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  // Si no encuentra nada, es porque el token es incorrecto o ya expiró.
  if (!user) {
    throw new Error("Invalid or expired PIN");
  }

  // Actualizamos la contraseña.
  // Al igual que en register, el "pre-save hook" del modelo se encargará de hashearla.
  user.password = newPassword;

  // Limpieza: Borramos el token y la fecha de expiración para que este PIN
  // no pueda volver a usarse (Single Use Token).
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // Guardamos los cambios.
  await user.save();

  return true;
};

/**
 * 7️⃣ Actualizar Perfil
 * Modifica datos generales del usuario.
 */
const updateUserProfile = async (userId, updateData) => {
  // findByIdAndUpdate toma 3 argumentos: ID, los datos a cambiar, y opciones.
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true, // IMPORTANTE: Devuelve el documento *modificado* (no el original).
    runValidators: true, // IMPORTANTE: Ejecuta las validaciones del Schema (ej. formato de email) en la actualización.
  }).select("-password"); // De nuevo, excluimos la contraseña del resultado.

  if (!user) throw new Error("User not found");
  return user;
};

// Exportamos todas las funciones en un objeto por defecto
// para ser importadas en el controlador (ej: authController.js).
export default {
  registerUser,
  loginUser,
  deleteUser,
  getAllUsers,
  forgotPassword,
  resetPassword,
  updateUserProfile,
};

/*
Puntos clave que asume este código:
Middleware de Mongoose: El código asume fuertemente que el archivo user.model.js tiene lógica oculta. Específicamente, un middleware .pre('save') para encriptar la contraseña si esta ha sido modificada. Si eso no existe en el modelo, estás guardando contraseñas en texto plano (lo cual sería una grave falla de seguridad).

Validación de Errores: Este servicio lanza errores (throw new Error), pero no gestiona códigos HTTP (como 404 o 500). Eso es correcto, ya que esa responsabilidad recae en el Controlador, quien llamará a estas funciones dentro de un bloque try-catch.

Método Personalizado: Asume que existe user.matchPassword(password) en el esquema del modelo.
*/
