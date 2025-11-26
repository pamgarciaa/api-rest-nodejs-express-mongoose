// 1. IMPORTACIÓN DE LA LIBRERÍA
// Importamos el paquete 'jsonwebtoken'. Este es el estándar de la industria
// para crear tokens de acceso seguros (RFC 7519). Nos permite cifrar y firmar datos.
import jwt from "jsonwebtoken";

// 2. DEFINICIÓN DE LA FUNCIÓN
// Definimos una función flecha (arrow function) llamada 'generateToken'.
// Recibe un único parámetro: 'id'.
// Generalmente, este 'id' es el identificador único del usuario en tu base de datos (ej. MongoDB _id).
const generateToken = (id) => {
  // 3. GENERACIÓN Y FIRMA (El núcleo de la función)
  // jwt.sign() es el método que crea el string del token. Toma 3 argumentos:
  //
  // A) EL PAYLOAD (Carga útil): { id }
  //    Es un objeto que contiene los datos que queremos guardar dentro del token.
  //    Aquí se usa la sintaxis abreviada de ES6: es lo mismo que escribir { id: id }.
  //    Cualquiera que decodifique el token podrá ver este ID, pero no podrá modificarlo sin invalidar la firma.
  //
  // B) LA LLAVE SECRETA: process.env.JWT_SECRET
  //    Esta es la "contraseña" que usa el servidor para firmar digitalmente el token.
  //    'process.env' accede a las variables de entorno del sistema operativo o archivo .env.
  //    Esto asegura que si alguien roba tu código, no tenga la llave para falsificar tokens.
  //
  // C) LAS OPCIONES: { expiresIn: "1d" }
  //    Configuración adicional. Aquí definimos cuándo caduca el token.
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d", // El token dejará de ser válido automáticamente después de 1 día.
  });
};

// 4. EXPORTACIÓN
// Exportamos la función por defecto para que pueda ser importada en controladores
// (por ejemplo, en authController.js) con cualquier nombre, aunque usualmente se usa el mismo.
export default generateToken;

/* 
Profundización en los conceptos clave
Para entender este archivo al 100%, hay que desglosar los tres pilares que componen la función jwt.sign:

1. El Payload ({ id })
Es la información que "viaja" dentro del token.

¿Por qué solo el ID? Por seguridad y eficiencia. No se recomienda guardar datos sensibles (como contraseñas) ni objetos muy grandes en el token, ya que el token se envía en cada petición HTTP. Con el ID es suficiente para que el servidor, al recibir el token de vuelta, busque al usuario en la base de datos.

2. La Firma (process.env.JWT_SECRET)
Es lo que hace al token seguro.

Funcionamiento: La librería toma el id, toma la fecha de expiración y los mezcla con tu JWT_SECRET usando un algoritmo matemático.

Seguridad: Si un hacker intenta cambiar el id dentro del token pero no tiene tu palabra secreta (JWT_SECRET), la firma matemática no coincidirá y tu servidor rechazará el token inmediatamente.

3. La Caducidad (expiresIn: "1d")
Es una medida de seguridad temporal.

Propósito: Si alguien roba el token de un usuario (por ejemplo, en una red Wi-Fi pública), solo podrá usarlo durante el tiempo restante de ese día. Pasadas las 24 horas, el token es basura digital y el usuario real deberá iniciar sesión nuevamente para obtener uno nuevo.

¿Dónde encaja esto en tu aplicación?
Este archivo es un servicio utilitario. El flujo típico es:

Login: El usuario envía email y contraseña.

Validación: Tu controlador verifica que la contraseña sea correcta.

Llamada a esta función: Si la contraseña es correcta, tu controlador llama a generateToken(usuario._id).

Respuesta: El servidor responde al frontend entregando este string generado (el token).

Almacenamiento: El frontend guarda este token y lo envía en cada futura petición para decir "Soy yo, ya inicié sesión".
*/
