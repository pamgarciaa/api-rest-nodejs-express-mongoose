# Blog API Backend 🚀

API Backend robusta desarrollada con Node.js y Express para una plataforma de blogging. Incluye autenticación segura, gestión de roles, subida de imágenes y arquitectura basada en servicios.

## 📋 Características

- **Autenticación Segura:** Registro y Login usando JWT (JSON Web Tokens) almacenados en cookies HTTP-only.
- **Gestión de Roles:** Sistema de permisos (User, Moderator, Admin).
- **CRUD de Blogs:** Creación, lectura, actualización y eliminación de artículos.
- **Gestión de Usuarios:** Actualización de perfil, recuperación de contraseña (PIN) y administración de usuarios.
- **Subida de Archivos:** Manejo de imágenes para avatares de perfil y portadas de blogs usando Multer.
- **Arquitectura Limpia:** Separación de preocupaciones (Rutas -> Controladores -> Servicios -> Modelos).

## 🛠️ Tecnologías

- **Node.js** - Entorno de ejecución.
- **Express** - Framework web.
- **MongoDB & Mongoose** - Base de datos y ODM.
- **JWT & Cookie-Parser** - Manejo de sesiones seguras.
- **Bcrypt** - Hashing de contraseñas.
- **Multer** - Subida de archivos.

## ⚙️ Instalación y Configuración
- **Crea un archivo .env en la raíz del proyecto y añade las siguientes variables:
- **PORT**=3000
- **MONGO_URI**=tu_cadena_de_conexion_mongodb
- **JWT_SECRET**=tu_secreto_super_seguro
- **NODE_ENV**=development
