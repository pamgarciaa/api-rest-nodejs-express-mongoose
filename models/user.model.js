/* * IMPORTACIONES
 * ------------------------------------------------------------------
 * mongoose: La librería ODM (Object Data Modeling) que nos permite interactuar
 * con MongoDB de forma estructurada usando esquemas y modelos.
 * * bcrypt: Librería estándar de la industria para el hashing de contraseñas.
 * Nunca guardamos contraseñas en texto plano.
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";

/*
 * DEFINICIÓN DEL ESQUEMA (Schema)
 * ------------------------------------------------------------------
 * El esquema es el "plano" o la estructura que tendrán los documentos de usuarios
 * en la base de datos. Define tipos de datos, validaciones y valores por defecto.
 */
const userSchema = mongoose.Schema(
  {
    username: {
      type: String, // Debe ser texto
      required: true, // Campo obligatorio: no se guarda el usuario sin esto
      unique: true, // Crea un índice en MongoDB para evitar duplicados
      trim: true, // Elimina espacios en blanco al inicio y final (" user " -> "user")
    },
    email: {
      type: String,
      required: true,
      unique: true, // Asegura que no existan dos cuentas con el mismo correo
      trim: true,
      lowercase: true, // Convierte "User@Email.com" a "user@email.com" antes de guardar
      // Validación Regex (Expresión Regular): Asegura que tenga formato texto@texto.texto
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      /* * IMPORTANTE: select: false
       * Esto es una medida de seguridad crítica. Cuando hagas una consulta como
       * 'User.find()', este campo NO vendrá incluido en los resultados por defecto.
       * Evita exponer el hash de la contraseña accidentalmente al frontend.
       * Si la necesitas (ej. para login), debes pedirla explícitamente con .select('+password').
       */
      select: false,
    },
    profilePicture: {
      type: String,
      // Si el usuario no sube foto, se asigna esta ruta automáticamente
      default: "./uploads/profile_pictures/defaultimage.png",
    },
    address: {
      type: String,
      default: "", // Valor inicial vacío en lugar de 'null' o 'undefined'
    },
    phone: {
      type: String,
      default: "",
    },
    // Campos para la lógica de "Olvidé mi contraseña"
    resetPasswordToken: String, // Aquí se guardará el token temporal enviado por email
    resetPasswordExpire: Date, // Aquí se define cuándo caduca ese token
    role: {
      type: String,
      // enum: Restringe el valor. Solo se aceptan estas 3 cadenas exactas.
      // Cualquier otro valor lanzará un error de validación.
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
  },
  /* * OPCIONES DEL ESQUEMA
   * timestamps: true -> Mongoose añade y gestiona automáticamente dos campos:
   * - createdAt: Fecha de creación del documento.
   * - updatedAt: Fecha de la última modificación.
   */
  { timestamps: true }
);

/*
 * MIDDLEWARE: PRE-SAVE HOOK
 * ------------------------------------------------------------------
 * Esta función se ejecuta JUSTO ANTES de que el documento se guarde (.save()) en la BD.
 * Se usa para encriptar la contraseña.
 * Nota: Se usa 'function()' y no arrow function '=>' para tener acceso al contexto 'this'.
 */
userSchema.pre("save", async function () {
  /*
   * this.isModified("password"):
   * Verifica si el campo 'password' ha cambiado en esta operación.
   * Si el usuario solo está actualizando su 'address' o 'email', NO queremos
   * volver a encriptar la contraseña que ya está encriptada (se rompería el login).
   */
  if (!this.isModified("password")) {
    return; // Si no cambió la contraseña, termina aquí y continúa con el guardado.
  }

  // Generamos un "salt" (sal). Es un dato aleatorio que se añade al hash
  // para que dos contraseñas iguales ("123456") generen hashes diferentes.
  // 10 es el costo de procesamiento (equilibrio entre seguridad y velocidad).
  const salt = await bcrypt.genSalt(10);

  // Reemplazamos la contraseña plana por su versión hasheada antes de ir a la BD.
  this.password = await bcrypt.hash(this.password, salt);
});

/*
 * MÉTODOS DE INSTANCIA
 * ------------------------------------------------------------------
 * Son funciones que puedes llamar sobre un usuario específico recuperado de la BD.
 * Ejemplo de uso: await user.matchPassword(passwordIngresadaEnLogin)
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt.compare: Compara la contraseña texto plano (enteredPassword)
  // con el hash encriptado guardado en la base de datos (this.password).
  // Devuelve true si coinciden, false si no.
  return bcrypt.compare(enteredPassword, this.password);
};

/*
 * CREACIÓN DEL MODELO
 * ------------------------------------------------------------------
 * Compila el esquema en un modelo. "User" será el nombre de la colección
 * en MongoDB (Mongoose lo pluraliza y pone en minúsculas: 'users').
 */
const User = mongoose.model("User", userSchema);

export default User;
