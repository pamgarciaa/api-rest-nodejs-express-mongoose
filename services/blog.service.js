// IMPORTACIONES
// Importamos el modelo de Mongoose. Este es el objeto que interactúa directamente con MongoDB.
import Blog from "../models/blog.model.js";

// Importamos 'fs-extra', una librería que mejora el módulo nativo 'fs' (file system) de Node.js.
// Se usa aquí para verificar si existen archivos y borrarlos (gestión de imágenes).
import fs from "fs-extra";

// --- FUNCIÓN: CREAR BLOG ---
// Recibe un objeto 'blogData' con la información del post (título, contenido, autor, etc.).
const createBlog = async (blogData) => {
  // Utiliza el método .create() de Mongoose.
  // Esto valida los datos contra el Schema y, si todo está bien, guarda el documento en MongoDB.
  return await Blog.create(blogData);
};

// --- FUNCIÓN: OBTENER TODOS LOS BLOGS ---
const getAllBlogs = async () => {
  // 1. Blog.find(): Busca todos los documentos en la colección 'blogs'.
  // 2. .populate("author", "username email"): Esto es crucial.
  //    En lugar de devolver solo el _id del autor (que es lo que se guarda en el blog),
  //    Mongoose busca en la colección de 'users' y rellena el campo 'author' con el objeto completo.
  //    El segundo parámetro ("username email") indica que SOLO queremos esos dos campos,
  //    excluyendo la contraseña u otros datos sensibles del usuario.
  return await Blog.find().populate("author", "username email");
};

// --- FUNCIÓN: ACTUALIZAR BLOG ---
// Recibe el ID del blog, los datos a actualizar (updateData) y opcionalmente un nombre de imagen nueva.
const updateBlog = async (id, updateData, newImageFilename) => {
  // Paso 1: Buscamos el blog actual en la base de datos para obtener su información previa.
  const blog = await Blog.findById(id);

  // Validación: Si no existe, lanzamos un error para detener la ejecución.
  if (!blog) throw new Error("Blog not found");

  // Paso 2: Lógica de reemplazo de imagen.
  // Si nos llega un 'newImageFilename', significa que el usuario subió una foto nueva.
  if (newImageFilename) {
    // Verificamos si el blog YA tenía una imagen guardada anteriormente.
    if (blog.image) {
      // Construimos la ruta donde debería estar la imagen vieja.
      const oldPath = "uploads/" + blog.image;

      // Usamos fs-extra para ver si el archivo físico existe en el disco.
      if (await fs.pathExists(oldPath)) {
        // Si existe, la borramos para no acumular basura en el servidor.
        await fs.remove(oldPath);
      }
    }
    // Asignamos el nombre de la NUEVA imagen al objeto de datos que vamos a guardar.
    updateData.image = newImageFilename;
  }

  // Paso 3: Actualizar el documento en memoria.
  // Object.assign toma el documento original (blog) y le sobreescribe las propiedades de 'updateData'.
  // Esto es útil porque actualiza solo los campos que vinieron en 'updateData'.
  Object.assign(blog, updateData);

  // Paso 4: Persistencia.
  // Guardamos los cambios en MongoDB. Usar .save() aquí es importante porque dispara
  // las validaciones de Mongoose y cualquier 'middleware' (pre/post hooks) que tengas definido.
  await blog.save();

  // Devolvemos el blog ya actualizado.
  return blog;
};

// --- FUNCIÓN: ELIMINAR BLOG ---
const deleteBlog = async (id) => {
  // Paso 1: Buscar el blog antes de borrarlo.
  // ¿Por qué? Porque necesitamos saber si tiene una imagen asociada para borrarla del disco.
  const blog = await Blog.findById(id);

  if (!blog) throw new Error("Blog not found");

  // Paso 2: Gestión de limpieza de archivos.
  // Si el blog tiene una propiedad imagen...
  if (blog.image) {
    const imagePath = "uploads/" + blog.image;
    // Verificamos que el archivo exista y lo eliminamos físicamente.
    if (await fs.pathExists(imagePath)) {
      await fs.remove(imagePath);
    }
  }

  // Paso 3: Borrado en Base de Datos.
  // Ahora que está limpio el disco, borramos el documento de MongoDB.
  await Blog.findByIdAndDelete(id);

  return true; // Retornamos true para confirmar éxito.
};

// Exportamos todas las funciones como un objeto por defecto para poder importarlas en el controlador.
export default {
  createBlog,
  getAllBlogs,
  updateBlog,
  deleteBlog,
};

/*
Conceptos Clave en este archivo
Gestión de Archivos (fs-extra): El código es muy cuidadoso con el almacenamiento ("Storage"). 
Tanto en updateBlog como en deleteBlog, se asegura de borrar la imagen antigua del servidor (uploads/). 
Si no se hiciera esto, tu servidor se llenaría de imágenes "huérfanas" que ya no pertenecen a ningún blog.

Object.assign + save() vs findByIdAndUpdate: En la función de actualizar, 
el desarrollador eligió una estrategia manual: buscar, modificar el objeto y luego guardar (save()).

Ventaja: Permite manipular lógica compleja (como el borrado de imágenes) entre la búsqueda y el guardado. 
También activa los "hooks" de Mongoose (validaciones personalizadas antes de guardar).

Diferencia: Si usara findByIdAndUpdate directamente, 
sería más difícil gestionar el borrado de la imagen antigua 
porque la base de datos se actualizaría en una sola operación atómica sin darte acceso fácil al valor anterior.

Population (.populate): En getAllBlogs, 
el uso de .populate("author", ...) transforma este servicio de una simple consulta a una Base de Datos Relacional. 
Une la colección de Blogs con la de Usuarios para que el Frontend reciba directamente el nombre del autor, 
sin tener que hacer una segunda petición.

*/
