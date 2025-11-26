// Importamos el servicio 'blogService'.
// En una arquitectura de capas, el controlador NO debe acceder a la base de datos directamente.
// Delega esa responsabilidad al servicio.
import blogService from "../services/blog.service.js";

// Importamos 'fs-extra'. Es una versión mejorada del módulo 'fs' (file system) de Node.js.
// Lo usaremos aquí principalmente para eliminar imágenes si algo sale mal (limpieza).
import fs from "fs-extra";

// ==========================================
// CREAR UN BLOG
// ==========================================
const createBlog = async (req, res) => {
  try {
    // Desestructuramos el título y contenido que vienen en el cuerpo de la petición (form-data o JSON).
    const { title, content } = req.body;

    // Validación: Verificamos si existe 'req.file'.
    // Esto asume que usas un middleware como Multer antes de llegar aquí para procesar la subida de archivos.
    // Si no hay archivo, detenemos la ejecución y respondemos con error 400 (Bad Request).
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Preparamos el objeto de datos para enviar al servicio.
    const blogData = {
      title,
      content,
      // req.file.filename es el nombre con el que Multer guardó la imagen en el disco.
      image: req.file.filename,
      // req.user._id sugiere que hay un middleware de autenticación previo (como JWT)
      // que decodificó el token y añadió la info del usuario al objeto 'req'.
      author: req.user._id,
    };

    // Llamamos al método asíncrono del servicio para guardar en la base de datos.
    const newBlog = await blogService.createBlog(blogData);

    // Si todo sale bien, respondemos con 201 (Created) y el objeto creado.
    res.status(201).json(newBlog);
  } catch (error) {
    // MANEJO DE ERRORES CRÍTICO:
    // Si falla la creación en la base de datos (ej. título duplicado), la imagen YA SE SUBIÓ
    // por el middleware Multer antes de entrar a esta función.
    // Debemos borrarla para no tener archivos "huérfanos" (basura) en el servidor.
    if (req.file) await fs.remove(req.file.path);

    // Respondemos con error 400 y el mensaje del error.
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// ACTUALIZAR UN BLOG
// ==========================================
const updateBlog = async (req, res) => {
  try {
    // Obtenemos el ID del blog desde la URL (ej: /blogs/12345).
    const { id } = req.params;
    // Obtenemos los posibles nuevos datos de texto.
    const { title, content } = req.body;

    // Construcción dinámica del objeto de actualización.
    // Solo agregamos las propiedades si existen. Esto evita sobrescribir con 'undefined' o 'null'
    // campos que el usuario no quiso cambiar.
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    // Verificamos si el usuario subió una imagen nueva.
    // Si subió archivo, tomamos el nombre; si no, es undefined.
    const newImage = req.file ? req.file.filename : undefined;

    // Llamamos al servicio pasando:
    // 1. El ID del blog a editar.
    // 2. Los datos de texto a cambiar.
    // 3. La nueva imagen (o undefined si no la hay). El servicio se encargará de borrar la imagen VIEJA si llega una nueva.
    const updatedBlog = await blogService.updateBlog(id, updateData, newImage);

    // Devolvemos el blog actualizado.
    res.json(updatedBlog);
  } catch (error) {
    // LIMPIEZA DE ERROR:
    // Si el usuario subió una imagen nueva, pero la actualización en BD falló (ej. ID no válido),
    // borramos la imagen NUEVA recién subida para no ocupar espacio inútilmente.
    if (req.file) await fs.remove(req.file.path);

    // Manejo específico: Si el servicio lanza un error de "Blog not found", devolvemos 404.
    if (error.message === "Blog not found") {
      return res.status(404).json({ message: error.message });
    }
    // Para cualquier otro error, devolvemos 400.
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// ELIMINAR UN BLOG
// ==========================================
const deleteBlog = async (req, res) => {
  try {
    // Llamamos al servicio para eliminar el blog usando el ID de la URL.
    // El servicio también debería encargarse de borrar la imagen asociada del disco.
    await blogService.deleteBlog(req.params.id);

    // Respondemos con un mensaje de éxito simple (JSON).
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    // Si el ID no existe en la BD.
    if (error.message === "Blog not found") {
      return res.status(404).json({ message: error.message });
    }
    // Error 500 (Internal Server Error) para fallos inesperados en el servidor/BD.
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// OBTENER TODOS LOS BLOGS
// ==========================================
const getAllBlogs = async (req, res) => {
  try {
    // Llama al servicio para obtener la lista completa.
    const blogs = await blogService.getAllBlogs();
    // Devuelve el array de blogs en formato JSON.
    res.json(blogs);
  } catch (error) {
    // Si falla la lectura, devuelve error 500.
    res.status(500).json({ message: error.message });
  }
};

// Exportamos las funciones para usarlas en el archivo de rutas (routes).
export { createBlog, updateBlog, deleteBlog, getAllBlogs };

/*
Puntos Clave de este código:
Manejo de Archivos (fs-extra): Lo más importante de este controlador es cómo maneja la limpieza. 
Observa los bloques catch. Si la base de datos falla al crear o actualizar, 
el código es lo suficientemente inteligente para borrar el archivo que Multer acaba de subir. 
Esto previene que tu servidor se llene de "imágenes basura" que no pertenecen a ningún blog.

Separación de Responsabilidades: El controlador solo se preocupa de HTTP (req, res, status codes) 
y validación básica de entrada (si hay archivo o no). Toda la lógica pesada (buscar en BD, 
lógica de reemplazo de imagen antigua, etc.) se delega a blogService.

Actualización Parcial: En updateBlog, no se obliga a actualizar todo. 
Se crea el objeto updateData dinámicamente. 
Esto permite peticiones PATCH efectivas donde solo envías el título y nada más cambia.
 */
