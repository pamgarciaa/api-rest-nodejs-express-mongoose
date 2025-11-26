/* ARCHIVO: routes/auth.routes.js
  DESCRIPCIÓN: Este archivo define las rutas (endpoints) relacionadas con la autenticación y gestión de usuarios.
  Utiliza el enrutador de Express para modularizar la aplicación.
*/

// Importa el framework Express. Necesario para crear la instancia del Router.
import express from "express";

// Importa los controladores desde 'auth.controller.js'.
// Estos son las funciones finales que contienen la lógica de negocio (ej: guardar en DB, generar token, etc.)
// que se ejecutarán cuando alguien visite estas rutas.
import {
  register, // Función para registrar un nuevo usuario
  login, // Función para iniciar sesión (dar acceso)
  logout, // Función para cerrar sesión (limpiar cookies/tokens)
  remove, // Función para eliminar un usuario (requiere permisos)
  getAllUsers, // Función para listar todos los usuarios (requiere permisos)
  resetPassword, // Función para establecer una nueva contraseña
  forgotPassword, // Función para iniciar el proceso de recuperación de contraseña
  updateUserProfile, // Función para editar datos del usuario logueado
} from "../controllers/auth.controller.js";

// Importa el middleware de protección (verifica si el usuario tiene un token JWT válido/sesión activa).
// Si no pasa esta verificación, la solicitud se detiene aquí y devuelve error 401.
import { protect } from "../middlewares/auth.middleware.js";

// Importa el middleware de roles (verifica si el usuario tiene un rol específico, ej: 'admin').
// Se ejecuta DESPUÉS de 'protect'.
import { checkRole } from "../middlewares/role.middleware.js";

// Importa la configuración de Multer (middleware para subida de archivos).
// Permite procesar datos de tipo 'multipart/form-data' (imágenes, documentos).
import upload from "../middlewares/upload.middleware.js";

// Inicializa el objeto Router de Express.
// Esto permite definir rutas que luego se pueden montar en la aplicación principal (ej: app.use('/api/auth', router)).
const router = express.Router();

// ---------------- DEFINICIÓN DE RUTAS ----------------

// RUTA: POST /register
// 1. 'upload.single("profilePicture")': Middleware que intercepta la request, busca un archivo en el campo "profilePicture",
//    lo guarda (en disco/nube) y añade la info del archivo a 'req.file'.
// 2. 'register': Controlador final que crea el usuario en la base de datos usando los datos del body y la imagen.
router.post("/register", upload.single("profilePicture"), register);

// RUTA: POST /login
// Recibe credenciales (email/password) y ejecuta el controlador 'login' para autenticar y devolver token/cookie.
router.post("/login", login);

// RUTA: POST /logout
// Ejecuta 'logout' para limpiar las cookies de autenticación o invalidar la sesión.
router.post("/logout", logout);

// RUTA: GET /getallusers
// FLUJO DE EJECUCIÓN:
// 1. 'protect': ¿El usuario está logueado? Si sí, pasa a 'next()'.
// 2. 'checkRole("admin")': ¿El usuario logueado es admin? Si sí, pasa a 'next()'.
// 3. 'getAllUsers': Controlador final que devuelve la lista de usuarios.
router.get("/getallusers", protect, checkRole("admin"), getAllUsers);

// RUTA: POST /forgotpassword
// Inicia recuperación. El usuario envía su email y el controlador envía un enlace/código.
router.post("/forgotpassword", forgotPassword);

// RUTA: POST /resetpassword
// Finaliza recuperación. El usuario envía el token recibido y la nueva contraseña para actualizarla.
router.post("/resetpassword", resetPassword);

// RUTA: DELETE /:id
// El ":id" es un parámetro dinámico (ej: /delete/12345). Se accede mediante 'req.params.id'.
// Solo un usuario logueado ('protect') y que sea administrador ('checkRole') puede borrar a otro usuario.
router.delete("/:id", protect, checkRole("admin"), remove);

// RUTA: PUT /profile
// Actualiza el perfil del propio usuario logueado.
// 1. 'protect': Asegura que sepamos QUIÉN está intentando actualizar (req.user).
// 2. 'upload.single(...)': Permite al usuario subir una nueva foto de perfil si lo desea.
// 3. 'updateUserProfile': Actualiza los datos en la DB.
router.put(
  "/profile",
  protect,
  upload.single("profilePicture"),
  updateUserProfile
);

// Exporta el router configurado para ser importado en 'index.js' o 'app.js'.
export default router;

/*
Análisis de puntos clave:
Orden de los Middlewares: En rutas como getallusers, el orden es vital.
 Primero verificamos identidad (protect), luego autorización (checkRole), 
 y finalmente ejecutamos la acción. Si invirtiéramos el orden, 
 fallaría porque checkRole necesita saber quién es el usuario (información que provee protect).

Manejo de Archivos: Las rutas /register y /profile incluyen upload.single. 
Esto significa que el cliente (Frontend/Postman) debe enviar los datos como FormData, no como JSON puro.

Seguridad: Las rutas administrativas (delete, getallusers) están blindadas con doble capa de seguridad.
*/
