// 1. IMPORTACIÓN DE MONGOOSE
// Importamos la librería Mongoose. Mongoose es un ODM (Object Data Modeling)
// que nos permite interactuar con la base de datos MongoDB utilizando
// sintaxis de JavaScript moderna en lugar de comandos puros de base de datos.
import mongoose from "mongoose";

// 2. DEFINICIÓN DEL ESQUEMA (SCHEMA)
// Creamos una nueva instancia de un esquema. El esquema actúa como el "plano" o
// la "plantilla" estructural. Define qué campos deben tener los documentos,
// qué tipos de datos almacenan y las reglas de validación (si son obligatorios, etc.).
const blogSchema = new mongoose.Schema(
  {
    // --- CAMPO: TÍTULO ---
    title: {
      type: String, // Define que el dato debe ser texto.
      required: true, // VALIDACIÓN: Impide guardar el blog si falta el título.
      trim: true, // LIMPIEZA: Elimina espacios vacíos al inicio y final.
      // Ej: "  Mi Blog  " se guarda automáticamente como "Mi Blog".
    },

    // --- CAMPO: CONTENIDO ---
    content: {
      type: String, // El cuerpo del blog también es texto.
      required: true, // Es obligatorio; no se puede crear un post vacío.
    },

    // --- CAMPO: IMAGEN ---
    image: {
      type: String, // Generalmente aquí se guarda la URL de la imagen (ej: Cloudinary o S3),
      // no el archivo binario de la imagen en sí.
      required: true, // Es obligatorio tener una imagen para el blog.
    },

    // --- CAMPO: AUTOR (RELACIÓN ENTRE COLECCIONES) ---
    author: {
      // Aquí no guardamos el nombre del autor, sino su ID único de base de datos (`_id`).
      // ObjectId es un tipo de dato especial de MongoDB para identificadores únicos.
      type: mongoose.Schema.Types.ObjectId,

      // REFERENCIA ('ref'): Esto conecta este esquema con el modelo "User".
      // Es crucial para hacer "Population". Permite que, al pedir un blog,
      // Mongoose busque automáticamente los datos del usuario (nombre, avatar)
      // usando este ID.
      ref: "User",

      required: true, // Un blog no puede existir sin un autor asignado.
    },
  },

  // 3. OPCIONES DEL ESQUEMA
  // Este segundo objeto configura el comportamiento del esquema.
  {
    timestamps: true, // AUTOMATIZACIÓN: Mongoose crea y gestiona automáticamente dos campos:
    // 1. createdAt: Fecha exacta de creación.
    // 2. updatedAt: Fecha de la última modificación.
    // No tienes que configurar estas fechas manualmente.
  }
);

// 4. CREACIÓN DEL MODELO
// Mongoose compila el esquema `blogSchema` en un Modelo llamado "Blog".
// Un "Modelo" es la clase que usamos para interactuar con la DB (crear, buscar, borrar).
// NOTA: MongoDB convertirá automáticamente el nombre "Blog" a minúsculas y plural
// para crear la colección: la colección se llamará "blogs".
const Blog = mongoose.model("Blog", blogSchema);

// 5. EXPORTACIÓN
// Exportamos el modelo para poder usarlo en los controladores (controllers),
// donde haremos operaciones como `Blog.find()`, `Blog.create()`, etc.
export default Blog;

/*
Puntos clave explicados:
Tipado fuerte: Aunque MongoDB es flexible (NoSQL), 
Mongoose nos fuerza a respetar una estructura (String, ObjectId, etc.) para mantener la integridad de los datos.

Relaciones: La parte más crítica es el campo author. Gracias a ref: "User", 
estás creando una relación similar a una Foreign Key en SQL, lo que permite vincular un post con su creador.

Timestamps: Al usar { timestamps: true }, te ahorras mucho código manual para gestionar cuándo se creó o editó un post.
*/
