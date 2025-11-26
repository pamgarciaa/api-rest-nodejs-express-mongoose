/**
 * 1. IMPORTACIÓN DE DEPENDENCIAS
 * ------------------------------------------------------------------
 * 'mongoose': Es una biblioteca ODM (Object Data Modeling).
 * Sirve de puente entre tu aplicación Node.js y la base de datos MongoDB.
 * Nos permite crear esquemas, validar datos y realizar consultas de forma sencilla.
 */
import mongoose from "mongoose";

/**
 * 'dotenv': Es un módulo esencial para la seguridad y configuración.
 * Su función es cargar variables de entorno desde un archivo '.env'
 * hacia el objeto global 'process.env' de Node.js.
 * Esto evita que escribas contraseñas o URIs reales directamente en el código.
 */
import dotenv from "dotenv";

/**
 * 2. CONFIGURACIÓN DE VARIABLES DE ENTORNO
 * ------------------------------------------------------------------
 * Al ejecutar este método, la librería lee el archivo .env de tu raíz
 * y hace disponibles las variables. Sin esta línea, 'process.env.MONGO_URI'
 * sería undefined.
 */
dotenv.config();

/**
 * 3. DEFINICIÓN DE LA FUNCIÓN DE CONEXIÓN
 * ------------------------------------------------------------------
 * Se define como 'async' (asíncrona) porque la conexión a una base de datos
 * es una operación de E/S (Entrada/Salida) que toma tiempo y devuelve una Promesa.
 * No queremos bloquear el hilo principal mientras esperamos la conexión.
 */
const connectDB = async () => {
  // Bloque TRY-CATCH para manejo de errores robusto.
  try {
    /**
     * Intento de conexión:
     * 'await': Pausa la ejecución de esta función hasta que la promesa se resuelva.
     * 'process.env.MONGO_URI': Accede a la cadena de conexión segura (ej: mongodb+srv://...)
     * definida en tu archivo .env.
     */
    await mongoose.connect(process.env.MONGO_URI);

    // Si la línea anterior no lanza error, significa que estamos conectados.
    console.log("MongoDB connected successfully");
  } catch (error) {
    /**
     * MANEJO DE ERRORES CRÍTICOS
     * --------------------------------------------------------------
     * Si la conexión falla (contraseña errónea, servidor caído, IP bloqueada),
     * el código salta inmediatamente aquí.
     */
    console.error("MongoDB connection error:", error);

    /**
     * 'process.exit(1)':
     * Esto detiene forzosamente la ejecución de toda la aplicación Node.js.
     * El '1' indica que el programa terminó con un error (un '0' sería éxito).
     *
     * ¿Por qué hacer esto?
     * Si la base de datos no funciona, es probable que tu API/Backend no sirva
     * para nada. Es mejor "fallar rápido" y reiniciar el contenedor o servicio
     * que dejar la app corriendo en un estado "zombi".
     */
    process.exit(1);
  }
};

/**
 * 4. EXPORTACIÓN
 * ------------------------------------------------------------------
 * Exportamos la función 'connectDB' por defecto para poder importarla
 * en el punto de entrada de la aplicación (usualmente index.js o server.js)
 * y ejecutarla antes de levantar el servidor Express.
 */
export default connectDB;

/*
Resumen de conceptos clave explicados:
ODM (Mongoose): Traduce objetos de código a documentos de base de datos.

Asincronía (Async/Await): Permite esperar a que la base de datos responda sin congelar la aplicación.

Seguridad (Dotenv): Separa las credenciales del código fuente.

Fail Fast (Process.exit): Estrategia para detener la aplicación si falta un componente crítico como la base de datos.
 */
