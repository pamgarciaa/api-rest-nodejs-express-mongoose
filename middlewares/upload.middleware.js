/**
 * ==========================================
 * CONFIGURACIÓN DE MULTER (MIDDLEWARE)
 * ==========================================
 * Este archivo configura cómo se gestionarán las subidas de archivos
 * al servidor. Se encarga de recibir el archivo, validarlo, renombrarlo
 * y guardarlo en una carpeta específica.
 */

// 1. IMPORTACIONES
// Importa 'multer', la librería estándar de Node.js para manejar 'multipart/form-data' (subida de archivos).
import multer from "multer";

// Importa 'fs-extra', una versión mejorada del módulo de sistema de archivos (fs) nativo.
// Se usa aquí para asegurar que la carpeta de destino exista antes de guardar nada.
import fs from "fs-extra";

// Define el nombre de la carpeta donde se guardarán los archivos.
const uploadDir = "uploads";

// 2. VERIFICACIÓN DE DIRECTORIO
// fs.ensureDirSync verifica si la carpeta 'uploads' existe.
// Si no existe, la crea automáticamente de forma síncrona (detiene la ejecución hasta que se crea).
// Esto evita errores fatales de "directorio no encontrado" al intentar guardar un archivo.
fs.ensureDirSync(uploadDir);

// 3. CONFIGURACIÓN DEL ALMACENAMIENTO (STORAGE)
// Define cómo y dónde se guardarán los archivos en el disco duro.
const storage = multer.diskStorage({
  // A) DESTINATION: Controla en qué carpeta se guarda el archivo.
  destination: function (req, file, cb) {
    // 'cb' es el callback (una función que avisa a multer que hemos terminado).
    // El primer parámetro es null (no hubo error).
    // El segundo parámetro es la ruta de la carpeta ('uploads').
    cb(null, uploadDir);
  },

  // B) FILENAME: Controla con qué nombre se guardará el archivo en el disco.
  filename: function (req, file, cb) {
    // Extrae la extensión del archivo original (ej. 'imagen.png' -> 'png').
    // split('.') divide el texto por puntos y pop() toma el último elemento.
    const ext = file.originalname.split(".").pop();

    // Genera un sufijo único para evitar que dos archivos se llamen igual y se sobrescriban.
    // Date.now(): Marca de tiempo actual (milisegundos).
    // Math.random(): Número aleatorio para añadir más entropía.
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // Construye el nombre final: "nombreDelCampo-timestamp-random.extension"
    // cb(null, nombre_final) indica que todo fue bien.
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  },
});

// 4. FILTRO DE ARCHIVOS (FILE FILTER)
// Función para decidir si aceptamos el archivo o lo rechazamos antes de subirlo.
const fileFilter = (req, file, cb) => {
  // Verificamos el 'mimetype' (tipo de medio).
  // Si empieza con 'image/', aceptamos jpg, png, gif, webp, etc.
  if (file.mimetype.startsWith("image/")) {
    // cb(null, true) -> No hay error, aceptamos el archivo (true).
    cb(null, true);
  } else {
    // Si no es imagen, rechazamos la subida generando un error.
    // cb(Error, false) -> Hay un error, rechazamos el archivo (false).
    cb(new Error("image only"), false);
  }
};

// 5. INICIALIZACIÓN DE MULTER
// Creamos la instancia final del middleware pasando la configuración definida arriba.
const upload = multer({
  storage: storage, // Usamos la configuración de disco definida.

  fileFilter: fileFilter, // Usamos el filtro de seguridad para imágenes.

  // Límites de seguridad para evitar ataques o sobrecarga del servidor.
  limits: {
    // fileSize: Tamaño máximo en bytes.
    // 1024 * 1024 * 5 = 5 Megabytes (MB).
    fileSize: 1024 * 1024 * 5,
  },
});

// Exportamos el middleware configurado para usarlo en las rutas (ej: router.post('/upload', upload.single('file'), ...))
export default upload;
