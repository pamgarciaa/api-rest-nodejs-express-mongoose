/**
 * 1. IMPORTACIÓN DE DEPENDENCIAS
 * ---------------------------------------------------------
 * Aquí importamos bibliotecas externas (node_modules) y
 * módulos locales (tus propios archivos). Se usa la sintaxis
 * ES6 (import/export) en lugar de CommonJS (require).
 */

// Importa el framework principal para crear el servidor web.
// Express simplifica el manejo de rutas, peticiones y respuestas HTTP.
import express from "express";

// Middleware para analizar (parsear) las cookies que vienen en la cabecera
// de las peticiones (req.headers.cookie). Es esencial para leer tokens JWT
// o datos de sesión almacenados en el navegador.
import cookieParser from "cookie-parser";

// Importa las rutas definidas en otros archivos. Esto ayuda a mantener
// el código modular. 'authRoutes' manejará login/registro y 'blogRoutes'
// manejará el CRUD de los posts.
import authRoutes from "./routes/auth.routes.js";
import blogRoutes from "./routes/blog.routes.js";

// Importa un middleware personalizado (creado por ti). Probablemente
// registre en la consola información sobre cada petición (URL, método, tiempo).
import logger from "./middlewares/logger.middleware.js";

// Carga las variables de entorno desde un archivo .env. Esto es crucial
// para ocultar secretos como contraseñas de DB o claves de API.
import dotenv from "dotenv";

// Importa la función que establece la conexión con la base de datos (ej. MongoDB).
import connectDB from "./config/database.config.js";

/**
 * 2. INICIALIZACIÓN Y CONFIGURACIÓN
 * ---------------------------------------------------------
 */

// Crea la instancia de la aplicación Express. 'app' es el objeto principal
// que usaremos para configurar todo el servidor.
const app = express();

// Lee el archivo .env y carga las variables en process.env.
// Debe hacerse lo antes posible, antes de usar cualquier variable secreta.
dotenv.config();

// Ejecuta la conexión a la base de datos. Es una función asíncrona,
// pero aquí se llama sin 'await' (lo cual es común en el arranque,
// asumiendo que connectDB maneja sus propios errores o logs).
connectDB();

/**
 * 3. MIDDLEWARES GLOBALES
 * ---------------------------------------------------------
 * Los middlewares son funciones que se ejecutan en medio de la petición
 * y la respuesta. El orden aquí es CRÍTICO.
 */

// Permite que tu servidor entienda JSON. Si alguien envía un POST con
// datos JSON, esto los transforma en un objeto JavaScript accesible en 'req.body'.
app.use(express.json());

// Activa el parseo de cookies. Ahora puedes acceder a ellas fácilmente
// mediante 'req.cookies'.
app.use(cookieParser());

// Ejecuta tu logger personalizado en cada petición que llegue al servidor.
// Útil para depuración y monitoreo.
app.use(logger);

// Configura una carpeta estática.
// Si alguien pide "tudominio.com/uploads/imagen.png", Express buscará
// ese archivo directamente en la carpeta "uploads" del servidor y lo enviará.
// Es esencial para mostrar imágenes subidas por los usuarios.
app.use("/uploads", express.static("uploads"));

/**
 * 4. DEFINICIÓN DE RUTAS
 * ---------------------------------------------------------
 * Aquí montamos los grupos de rutas importados anteriormente.
 */

// Prefijo "/api/users". Cualquier ruta dentro de authRoutes se concatenará aquí.
// Ejemplo: si authRoutes tiene una ruta "/login", la URL final será "/api/users/login".
app.use("/api/users", authRoutes);

// Prefijo "/api/blogs". Ejemplo: "/api/blogs/create", "/api/blogs/all".
app.use("/api/blogs", blogRoutes);

/**
 * 5. ARRANQUE DEL SERVIDOR
 * ---------------------------------------------------------
 */

// Define el puerto. Intenta usar el puerto definido en las variables de entorno (.env).
// Si no existe (ej. en desarrollo local sin configurar), usa el 3000 por defecto.
// El operador || actúa como un "fallback".
const PORT = process.env.PORT || 3000;

// Pone al servidor a "escuchar" peticiones en el puerto definido.
// El callback (la función flecha) se ejecuta una vez que el servidor está listo.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/*
Resumen Conceptual
Tu código sigue el patrón clásico de una API REST moderna en Node.js:

Configuración: Cargas secretos (dotenv) y conectas la Base de Datos (connectDB).

Pre-procesamiento (Middlewares): Antes de que lleguen a tus rutas, 
limpias y preparas los datos (conviertes JSON a objetos, lees cookies, registras logs).

Enrutamiento: Diriges el tráfico. Si es de usuarios va a authRoutes, si es de contenido va a blogRoutes.

Archivos: Sirves archivos físicos (imágenes) públicamente.

Ejecución: Levantas el servidor en un puerto específico.
*/
