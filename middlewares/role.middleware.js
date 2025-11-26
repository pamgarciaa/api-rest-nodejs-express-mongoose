// 1. Definición de una "Función de Orden Superior" (Higher-Order Function).
// Esta función NO es el middleware en sí, sino una fábrica que CREA el middleware.
// Recibe un array de 'allowedRoles' (ej: ['admin', 'manager']) y utiliza
// el concepto de 'Closure' para recordar estos roles cuando se ejecute la petición.
const checkRole = (allowedRoles) => {
  // 2. Retorno del Middleware real de Express.
  // Esta es la función que Express ejecutará cada vez que llegue una petición a la ruta.
  // Tiene acceso a:
  // - req: El objeto de la solicitud (que debería contener los datos del usuario).
  // - res: El objeto para enviar la respuesta al cliente.
  // - next: La función para pasar el control al siguiente middleware o controlador.
  return (req, res, next) => {
    // 3. Validación de permisos (La lógica central).
    // Se evalúan dos condiciones obligatorias:
    // A. (req.user): Verifica que exista un usuario en la petición.
    //    NOTA: Esto asume que un middleware previo (como validación de JWT) ya
    //    decodificó el token e inyectó la información del usuario en 'req.user'.
    // B. allowedRoles.includes(req.user.role): Verifica si el rol del usuario
    //    actual existe dentro del array de roles permitidos que pasamos al inicio.
    if (req.user && allowedRoles.includes(req.user.role)) {
      // 4. Autorización concedida.
      // Si el usuario existe y tiene el rol correcto, llamamos a next().
      // Esto permite que la solicitud avance hacia la siguiente función (generalmente
      // el controlador que devuelve los datos o realiza la acción).
      next();
    } else {
      // 5. Autorización denegada.
      // Si no hay usuario o el rol no coincide, detenemos el flujo aquí.
      // Usamos 'res' para devolver una respuesta inmediata y evitar que se
      // ejecute el controlador de la ruta.
      res
        // Establecemos el código de estado HTTP 403 (Forbidden).
        // Diferente al 401 (Unauthorized), el 403 significa: "Sé quién eres,
        // pero no tienes permiso para ver este recurso".
        .status(403)
        // Enviamos la respuesta en formato JSON explicando el error al cliente.
        .json({ message: "Access denied: Insufficient permissions" });
    }
  };
};

// 6. Exportación del módulo.
// Se exporta usando la sintaxis de módulos ES6 para poder importarlo
// en las definiciones de rutas (ej: router.post('/', checkRole(['admin']), controller)).
export { checkRole };

/*
Resumen de conceptos clave utilizados:
Closure: La función interna recuerda la variable allowedRoles incluso 
después de que la función externa checkRole haya terminado de ejecutarse.

Inyección de Dependencias (Implícita): El código asume que req.user ya existe. 
Esto hace que este middleware sea dependiente de uno anterior (autenticación) para funcionar correctamente.

Control de Flujo: El uso de next() vs res.json(...) actúa como una compuerta lógica; o pasas, o te rechazo.
*/
