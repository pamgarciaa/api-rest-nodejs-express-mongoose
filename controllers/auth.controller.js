// ==========================================
// IMPORTACIONES
// ==========================================
// Importamos la capa de servicio donde reside la lógica de negocio pura (validaciones, llamadas a BD).
// Esto mantiene el controlador limpio ("Separation of Concerns").
import authService from "../services/auth.service.js";
// Utilidad para crear JSON Web Tokens (JWT) para la autenticación.
import generateToken from "../utils/generateToken.util.js";
// El modelo de usuario de Mongoose para interactuar con la base de datos MongoDB.
import User from "../models/user.model.js";
// fs-extra es una versión mejorada del módulo nativo 'fs' (file system).
// Lo usaremos para gestionar archivos físicos (borrar imágenes).
import fs from "fs-extra";

/**
 * ==========================================
 * HELPER: sendTokenResponse
 * ==========================================
 * Función auxiliar para centralizar la respuesta de éxito en login y registro.
 * Genera el token, configura la cookie HTTP-Only (seguridad) y envía el JSON.
 * @param {Object} user - El objeto usuario obtenido de la BD.
 * @param {Number} statusCode - Código HTTP (200 para login, 201 para registro).
 * @param {Object} res - Objeto respuesta de Express.
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Generamos el JWT usando el ID del usuario.
  const token = generateToken(user._id);

  // Configuración de seguridad de la cookie
  const options = {
    // La cookie expira en 30 días. Cálculo: 30 días * 24h * 60m * 60s * 1000ms.
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    // httpOnly: true es CRÍTICO. Impide que JavaScript en el frontend (XSS) acceda a la cookie.
    httpOnly: true,
    // secure: true solo envía la cookie por HTTPS. Se activa solo en producción.
    secure: process.env.NODE_ENV === "production",
    // sameSite: 'strict' protege contra ataques CSRF (Cross-Site Request Forgery).
    sameSite: "strict",
  };

  //

  // Enviamos la respuesta:
  // 1. Establecemos el status (200 o 201).
  // 2. Adjuntamos la cookie llamada "jwt".
  // 3. Enviamos un JSON con datos públicos del usuario (evitando enviar la contraseña).
  res.status(statusCode).cookie("jwt", token, options).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
    role: user.role,
  });
};

/**
 * ==========================================
 * CONTROLADOR: register
 * ==========================================
 * Maneja el registro de nuevos usuarios, incluyendo la subida de imagen de perfil.
 */
const register = async (req, res) => {
  try {
    // Operador ternario para la imagen:
    // Si multer (middleware de subida) procesó un archivo (req.file), usamos ese nombre.
    // Si no, asignamos una imagen por defecto.
    const pictureName = req.file ? req.file.filename : "default-avatar.png";

    // Preparamos los datos para el servicio.
    // ...req.body copia todos los campos de texto (email, password, etc.).
    // Sobrescribimos o añadimos profilePicture con el nombre del archivo final.
    const userData = {
      ...req.body,
      profilePicture: pictureName,
    };

    // Llamamos al servicio para crear el usuario en la BD.
    const user = await authService.registerUser(userData);

    // Si todo va bien, enviamos el token y la respuesta 201 (Created).
    sendTokenResponse(user, 201, res);
  } catch (error) {
    // MANEJO DE ERRORES CON LIMPIEZA DE ARCHIVOS
    // Si el registro falla (ej: email duplicado), pero la imagen ya se subió al servidor...
    // ...debemos borrar esa imagen para no llenar el servidor de archivos "huerfanos".
    if (req.file && req.file.path) {
      await fs.remove(req.file.path); // Elimina el archivo físico subido.
    }
    // Retornamos error 400 (Bad Request).
    res.status(400).json({ message: error.message });
  }
};

/**
 * ==========================================
 * CONTROLADOR: login
 * ==========================================
 * Autentica al usuario mediante email y contraseña.
 */
const login = async (req, res) => {
  try {
    // Extraemos credenciales del cuerpo de la petición.
    const { email, password } = req.body;

    // El servicio verifica si el usuario existe y si la contraseña coincide.
    const user = await authService.loginUser(email, password);

    // Generamos cookie y respuesta exitosa 200 (OK).
    sendTokenResponse(user, 200, res);
  } catch (error) {
    // Si falla (credenciales erróneas), devolvemos 401 (Unauthorized).
    res.status(401).json({ message: error.message });
  }
};

/**
 * ==========================================
 * CONTROLADOR: logout
 * ==========================================
 * Cierra la sesión "destruyendo" la cookie del token.
 */
const logout = (req, res) => {
  // Reemplazamos la cookie "jwt" con un string vacío.
  res.cookie("jwt", "", {
    httpOnly: true,
    // Truco: Establecemos la fecha de expiración en el pasado (new Date(0)).
    // Esto obliga al navegador a eliminar la cookie inmediatamente.
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

/**
 * ==========================================
 * CONTROLADOR: remove
 * ==========================================
 * Elimina un usuario por su ID (probablemente solo para admins).
 */
const remove = async (req, res) => {
  try {
    // req.params.id viene de la URL (ej: /api/users/remove/:id).
    await authService.deleteUser(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * ==========================================
 * CONTROLADOR: getAllUsers
 * ==========================================
 * Obtiene el listado completo de usuarios.
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (error) {
    // Error 500 para fallos del servidor.
    res.status(500).json({ message: error.message });
  }
};

/**
 * ==========================================
 * CONTROLADOR: forgotPassword
 * ==========================================
 * Inicia el flujo de recuperación de contraseña enviando un PIN/Email.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // El servicio genera un token/PIN y envía el correo.
    const pin = await authService.forgotPassword(email);

    // NOTA: Devolver el PIN en la respuesta (res.json) suele ser para desarrollo/debug.
    // En producción estricta, solo deberías enviar el mensaje de éxito.
    res.json({
      message: "Email sent successfully",
      pin: pin,
    });
  } catch (error) {
    // Distinguimos si el error es "Usuario no encontrado" (404) u otro fallo (500).
    const status = error.message === "User not found" ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * ==========================================
 * CONTROLADOR: resetPassword
 * ==========================================
 * Finaliza el flujo de recuperación estableciendo la nueva contraseña.
 */
const resetPassword = async (req, res) => {
  try {
    // Recibe el token (o PIN) y la nueva contraseña.
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * ==========================================
 * CONTROLADOR: updateUserProfile
 * ==========================================
 * Actualiza datos del usuario y gestiona el reemplazo de la foto de perfil.
 */
const updateUserProfile = async (req, res) => {
  try {
    // req.user._id viene del middleware de autenticación (que decodificó el token previamente).
    const userId = req.user._id;

    // Verificamos que el usuario exista antes de intentar nada.
    const currentUser = await User.findById(userId);
    if (!currentUser)
      return res.status(404).json({ message: "User not found" });

    // Construimos dinámicamente el objeto de actualizaciones.
    // Solo agregamos los campos que realmente vienen en el req.body.
    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.phone) updates.phone = req.body.phone;

    // LOGICA DE REEMPLAZO DE IMAGEN
    if (req.file) {
      // 1. Asignamos el nombre de la nueva imagen subida.
      updates.profilePicture = req.file.filename;

      // 2. Limpieza de la imagen antigua:
      // Si el usuario ya tenía foto Y NO ES la foto por defecto...
      if (
        currentUser.profilePicture &&
        currentUser.profilePicture !== "default-avatar.png"
      ) {
        // Construimos la ruta de la imagen vieja.
        const oldPath = "uploads/" + currentUser.profilePicture;
        // Verificamos si el archivo existe físicamente y lo borramos.
        // Esto es crucial para no acumular basura en el disco duro.
        if (await fs.pathExists(oldPath)) {
          await fs.remove(oldPath);
        }
      }
    }

    // Llamamos al servicio para aplicar los cambios en la BD.
    const updatedUser = await authService.updateUserProfile(userId, updates);
    res.json(updatedUser);
  } catch (error) {
    // LIMPIEZA EN CASO DE ERROR
    // Si la actualización en la BD falla, pero subimos una foto nueva,
    // debemos borrar esa foto nueva porque no se vinculó a nadie.
    if (req.file && req.file.path) {
      await fs.remove(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
};

// Exportamos todas las funciones para usarlas en las rutas (routes).
export {
  register,
  login,
  logout,
  remove,
  getAllUsers,
  forgotPassword,
  resetPassword,
  updateUserProfile,
};

/*
Puntos Clave Explicados
Seguridad (Cookies): En sendTokenResponse, se usan las mejores prácticas. 
httpOnly evita el robo de sesiones mediante scripts (XSS), y sameSite: 'strict' 
previene que otras páginas hagan peticiones en nombre del usuario (CSRF).

Manejo de Archivos (fs-extra): Tanto en register como en updateUserProfile, 
hay una lógica defensiva importante. Si la base de datos falla al guardar el usuario, 
el código usa fs.remove para borrar la imagen que se acaba de subir. Esto mantiene limpia la carpeta uploads/.

Lógica de Actualización: En updateUserProfile, el código no solo sube la foto nueva, 
sino que busca y borra la foto antigua (siempre que no sea la foto por defecto). 
Esto es vital para optimizar el almacenamiento del servidor.
*/
