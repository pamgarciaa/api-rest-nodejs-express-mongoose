// Importamos la librería jsonwebtoken.
// Esta librería es fundamental para generar y, en este caso, VERIFICAR tokens de autenticación (JWT).
import jwt from "jsonwebtoken";

// Importamos el modelo de Mongoose 'User'.
// Lo necesitamos para buscar en la base de datos si el usuario asociado al token realmente existe.
import User from "../models/user.model.js";

// Definimos la función middleware 'protect'.
// Al ser un middleware de Express, recibe automáticamente:
// req: La solicitud del cliente (donde viene el token).
// res: La respuesta que enviaremos.
// next: Una función para indicar que todo salió bien y pasar al siguiente controlador.
const protect = async (req, res, next) => {
  // Declaramos la variable token que usaremos para almacenar la cadena JWT si la encontramos.
  let token;

  // 1. EXTRACCIÓN DEL TOKEN
  // Aquí intentamos leer el token desde las cookies de la solicitud (req.cookies).
  // Específicamente busca una cookie llamada 'jwt'.
  // Nota: Para que esto funcione, se debe usar 'cookie-parser' en el servidor y el token debe haberse guardado previamente en una cookie (usualmente HttpOnly por seguridad).
  token = req.cookies.jwt;

  // 2. VERIFICACIÓN DE EXISTENCIA
  // Comprobamos si la variable 'token' tiene algún valor.
  if (token) {
    try {
      // 3. DECODIFICACIÓN Y VALIDACIÓN (Punto crítico)
      // jwt.verify intenta descifrar el token usando tu CLAVE SECRETA (process.env.JWT_SECRET).
      // Si el token fue alterado, caducó o la firma no coincide, esta línea lanzará un error y saltará al 'catch'.
      // Si es válido, 'decoded' contendrá la información que guardaste en el token (payload), usualmente el 'id' del usuario.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. BÚSQUEDA DEL USUARIO Y ADJUNTARLO A LA REQUEST
      // Usamos el ID que venía dentro del token (decoded.id) para buscar al usuario en MongoDB.
      // .select("-password"): ESTO ES MUY IMPORTANTE. Le dice a Mongoose "tráeme al usuario pero NO me traigas el campo password".
      // Guardamos el usuario encontrado en 'req.user'. Esto hace que en las siguientes rutas (ej: actualizar perfil) tengas acceso a los datos del usuario logueado simplemente usando req.user.
      req.user = await User.findById(decoded.id).select("-password");

      // 5. CONTINUAR FLUJO
      // Si todo lo anterior funcionó, llamamos a next().
      // Esto le dice a Express: "Este usuario está autorizado, pasa a la siguiente función (el controlador de la ruta)".
      return next();
    } catch (error) {
      // 6. MANEJO DE ERRORES DE TOKEN (Token inválido)
      // Si entramos aquí es porque jwt.verify falló (token falso, expirado o malformado).
      // Respondemos con un 401 (Unauthorized) y detenemos la ejecución.
      console.error(error); // (Opcional: buena práctica loguear el error interno)
      return res.status(401).json({ message: "Not authorized: invalid token" });
    }
  }

  // 7. MANEJO DE ERRORES DE AUSENCIA (No hay token)
  // Si el 'if (token)' inicial fue falso (no había cookie 'jwt'), el código llega directamente aquí.
  // Significa que el usuario ni siquiera intentó enviar credenciales.
  return res.status(401).json({ message: "Not authorized: no token" });
};

// Exportamos la función para poder usarla en las rutas (ej: router.get('/profile', protect, getUserProfile))
export { protect };

/*
Resumen visual de lo que ocurre:
Entrada: Llega una petición.

Lectura: El código busca req.cookies.jwt.

Decisión A (Sin token): Si no hay cookie, devuelve error 401: no token.

Decisión B (Con token):

Verifica la firma digital del token.

Si el token es falso/expirado -> Error 401: invalid token.

Si el token es real -> Busca al usuario en la DB, quita la contraseña y lo guarda en req.user.

Salida: Ejecuta next() para permitir el acceso a la ruta privada.
*/
