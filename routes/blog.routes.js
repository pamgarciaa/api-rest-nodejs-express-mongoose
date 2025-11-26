/* =============================================================================
ARCHIVO: blog.routes.js
UBICACIÓN: /routes/
DESCRIPCIÓN: Definición de rutas para la entidad "Blog".
Este archivo actúa como un mapa de tráfico: recibe peticiones HTTP y decide
quién las maneja basándose en la URL y el método (GET, POST, etc.).
=============================================================================
*/

// 1. IMPORTACIÓN DE DEPENDENCIAS CORE
// Express es necesario aquí para utilizar su módulo 'Router', que nos permite
// crear manejadores de rutas modulares y montables.
import express from "express";

// 2. IMPORTACIÓN DE CONTROLADORES (Lógica de Negocio)
// Estas funciones son el destino final de la ruta. Ellas interactúan con la base de datos
// y devuelven la respuesta al cliente.
// - createBlog: Crea un nuevo post.
// - updateBlog: Modifica un post existente.
// - deleteBlog: Elimina un post.
// - getAllBlogs: Obtiene la lista de posts (pública).
import {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
} from "../controllers/blog.controller.js";

// 3. IMPORTACIÓN DE MIDDLEWARES (Guardianes e Intermediarios)
// Los middlewares son funciones que se ejecutan ANTES de llegar al controlador.

// 'protect': Verifica si el usuario está autenticado (generalmente validando un token JWT).
// Si no hay token válido, detiene la petición y lanza un error 401 (Unauthorized).
import { protect } from "../middlewares/auth.middleware.js";

// 'checkRole': Verifica si el usuario tiene permisos suficientes.
// Recibe un array de roles permitidos. Si el usuario no tiene ese rol,
// detiene la petición y lanza un error 403 (Forbidden).
import { checkRole } from "../middlewares/role.middleware.js";

// 'upload': Middleware (probablemente usando Multer) para manejar la subida de archivos.
// Procesa datos 'multipart/form-data', guarda el archivo y deja la info en 'req.file'.
import upload from "../middlewares/upload.middleware.js";

// 4. INICIALIZACIÓN DEL ROUTER
// Creamos una instancia del enrutador. Todas las rutas definidas aquí
// son relativas a donde este archivo sea montado en 'app.js' (ej: /api/blogs).
const router = express.Router();

/*
-------------------------------------------------------------------------
RUTA: OBTENER TODOS LOS BLOGS
Método: GET
URL: / (ejemplo: localhost:3000/api/blogs/)
Acceso: Público
-------------------------------------------------------------------------
*/
// Al ser pública, no pasamos por 'protect' ni 'checkRole'.
// La petición va directa al controlador 'getAllBlogs'.
router.get("/", getAllBlogs);

/*
-------------------------------------------------------------------------
RUTA: CREAR UN BLOG
Método: POST
URL: /
Acceso: Privado (Requiere Token + Rol Admin o Moderador)
Flujo de ejecución (Importante):
1. protect: ¿Eres quien dices ser?
2. checkRole: ¿Tienes permiso de 'admin' o 'moderator'?
3. upload.single("image"): Procesa la subida del archivo. Busca un campo 
   llamado "image" en el formulario.
4. createBlog: Si todo lo anterior pasa, se ejecuta la lógica de creación.
-------------------------------------------------------------------------
*/
router.post(
  "/",
  protect,
  checkRole(["admin", "moderator"]),
  upload.single("image"),
  createBlog
);

/*
-------------------------------------------------------------------------
RUTA: ACTUALIZAR UN BLOG
Método: PUT
URL: /:id (El ':id' es un parámetro dinámico, ej: /api/blogs/64a7b...)
Acceso: Privado (Admin/Moderator)
Nota: También permite subir una nueva imagen si se desea.
-------------------------------------------------------------------------
*/
router.put(
  "/:id", // Express capturará este valor y lo pondrá en req.params.id
  protect,
  checkRole(["admin", "moderator"]),
  upload.single("image"), // Maneja actualización de imagen si se envía una nueva
  updateBlog
);

/*
-------------------------------------------------------------------------
RUTA: ELIMINAR UN BLOG
Método: DELETE
URL: /:id
Acceso: Privado (Admin/Moderator)
Nota: No necesitamos 'upload' aquí porque no se envían archivos al borrar.
-------------------------------------------------------------------------
*/
router.delete("/:id", protect, checkRole(["admin", "moderator"]), deleteBlog);

// 5. EXPORTACIÓN
// Exportamos el router configurado para que pueda ser importado en el archivo principal
// del servidor (index.js o app.js) y usado con app.use('/api/blogs', blogRoutes).
export default router;

/*
Resumen de conceptos clave aplicados:
Encadenamiento de Middlewares: En las rutas POST, PUT y DELETE, puedes ver cómo se apilan las funciones (protect, 
luego checkRole, luego upload). Si una falla (ej. el token es inválido en protect), las siguientes nunca se ejecutan.

Rutas Dinámicas: El uso de /:id permite que una sola definición de ruta maneje actualizaciones o eliminaciones 
para cualquier blog específico, capturando su ID único.

Inyección de Dependencias: El router no sabe cómo se guarda un blog en la base de datos, 
solo sabe a quién llamar (createBlog) cuando llega una petición válida.
*/
