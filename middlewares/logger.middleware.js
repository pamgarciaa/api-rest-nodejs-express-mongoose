/**
 * ARCHIVO: middlewares/logger.middleware.js
 * CONTEXTO: Express.js (Node.js)
 *
 * ¿QUÉ ES ESTO?
 * Es una función "Middleware". En Express, los middlewares son funciones que se ejecutan
 * durante el ciclo de vida de una petición HTTP. Tienen acceso a la petición, a la respuesta
 * y a la función para pasar el turno al siguiente paso.
 */

// DEFINICIÓN DE LA FUNCIÓN
// Se define una función flecha (arrow function) asignada a la constante 'logger'.
// Recibe tres parámetros obligatorios en este orden:
// 1. req (Request): Objeto con toda la info que envía el cliente (navegador/postman).
// 2. res (Response): Objeto con métodos para responder al cliente (aunque aquí solo observamos).
// 3. next (NextFunction): Una función callback CRUCIAL que le dice a Express "he terminado, sigue con el siguiente".
const logger = (req, res, next) => {
  // PASO 1: OBTENER LA FECHA Y HORA (TIMESTAMP)
  // 'new Date()': Instancia la fecha y hora exacta del momento en que llega la petición.
  // '.toISOString()': Convierte esa fecha al formato estándar ISO 8601 (ej: 2023-11-26T10:00:00.000Z).
  // Es ideal para logs porque es un formato universal, ordenable y no depende de la zona horaria local del servidor.
  const timestamp = new Date().toISOString();

  // PASO 2: REGISTRAR EL MENSAJE (LOGGING)
  // 'console.log': Imprime el mensaje en la terminal donde corre el servidor.
  // Se usan "Template Literals" (las comillas invertidas ` `) para interpolar variables:
  // - [${timestamp}]: Para saber CUÁNDO ocurrió.
  // - ${req.method}: El verbo HTTP utilizado (GET, POST, DELETE, PUT, etc.).
  // - ${req.originalUrl}: La ruta exacta que se pidió (ej: '/api/usuarios' o '/home?search=algo').
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

  // PASO 3: CEDER EL CONTROL
  // Ejecutamos la función next().
  // IMPORTANTE: Si olvidamos esta línea, la petición se quedará "colgada" (loading) infinitamente.
  // next() permite que la solicitud continúe hacia otros middlewares o hacia el controlador final.
  next();
};

// EXPORTACIÓN DEL MÓDULO (Sintaxis ES Modules)
// 'export default': Hace que esta función sea el valor principal que se obtiene al importar este archivo.
// Permitirá usarlo en tu archivo principal (app.js o index.js) con: import logger from './middlewares/logger.middleware.js'
export default logger;
