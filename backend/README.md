# 🚀 Backend INDUSECC - Plataforma de Auditoría y Calidad

## 📋 Descripción

Backend profesional para la plataforma INDUSECC, una solución integral para gestión de auditorías, hallazgos, usuarios y eventos del calendario. Desarrollado con Node.js, Express y MongoDB.

## ✨ Características

- ✅ Autenticación con JWT y tokens de actualización
- ✅ Control de roles y permisos basado en roles (RBAC)
- ✅ Validación completa de datos de entrada
- ✅ Paginación en todos los endpoints GET
- ✅ Búsqueda y filtros avanzados
- ✅ Logging centralizado
- ✅ Manejo de errores robusto
- ✅ Seguridad mejorada (helmet, rate limiting, CORS)
- ✅ Estadísticas y reportes
- ✅ Base de datos MongoDB con Mongoose

## 🛠 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (Atlas o local)
- Git

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repo-url>
cd indusecc-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto basado en `.env.example`:

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# Base de datos
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/indusecc-os

# JWT
JWT_SECRET=tu_secreto_muy_largo_y_aleatorio_aqui
JWT_EXPIRE=1h
JWT_REFRESH_SECRET=otro_secreto_largo_aleatorio
JWT_REFRESH_EXPIRE=7d

# Servidor
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3001

# Email (opcional)
EMAIL_SERVICE=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_app
```

### 4. Iniciar el servidor

**Desarrollo (con auto-reload):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Estructura del Proyecto

```
src/
├── config/
│   └── environment.js          # Configuración centralizada
├── controllers/                # Lógica de negocio
│   ├── authController.js
│   ├── userController.js
│   ├── auditController.js
│   ├── findingController.js
│   └── calendarController.js
├── middleware/                 # Middlewares personalizados
│   ├── auth.js                # Autenticación y autorización
│   ├── validation.js          # Validación de datos
│   └── errorHandler.js        # Manejo de errores
├── models/                     # Esquemas de Mongoose
│   ├── User.js
│   ├── Audit.js
│   ├── Finding.js
│   └── Calendar.js
├── routes/                     # Definición de rutas
│   ├── auth.js
│   ├── users.js
│   ├── audits.js
│   ├── findings.js
│   └── calendars.js
├── utils/                      # Funciones utilitarias
│   ├── logger.js              # Logging centralizado
│   └── validators.js          # Validadores personalizados
└── server.js                   # Punto de entrada principal
```

## 🔐 Autenticación

### Roles Disponibles

| Rol | Descripción |
|-----|-------------|
| **SUPER_ADMIN** | Acceso total a todas las funcionalidades |
| **ADMIN** | Gestión de auditorías, hallazgos y usuarios limitado |
| **CONSULTOR** | Creación y edición de auditorías y hallazgos |
| **COLABORADOR** | Solo lectura de auditorías y hallazgos |

### Flujo de Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@indusecc.com",
  "password": "admin123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@indusecc.com",
      "name": "Administrador",
      "role": "ADMIN"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### Usar Token en Requests

Incluir en el header `Authorization`:

```
Authorization: Bearer <accessToken>
```

## 📡 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro (solo SUPER_ADMIN)
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/profile` - Obtener perfil
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/logout` - Logout

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `POST /api/users` - Crear usuario (SUPER_ADMIN)
- `PUT /api/users/:id` - Actualizar usuario (SUPER_ADMIN)
- `DELETE /api/users/:id` - Eliminar usuario (SUPER_ADMIN)
- `PATCH /api/users/:id/status` - Cambiar estado
- `GET /api/users/stats` - Estadísticas

### Auditorías
- `GET /api/audits` - Listar auditorías
- `GET /api/audits/:id` - Obtener auditoría
- `POST /api/audits` - Crear auditoría (ADMIN, CONSULTOR)
- `PUT /api/audits/:id` - Actualizar auditoría
- `DELETE /api/audits/:id` - Eliminar auditoría
- `PATCH /api/audits/:id/status` - Cambiar estado
- `PATCH /api/audits/:id/assign` - Asignar auditoría
- `GET /api/audits/stats` - Estadísticas

### Hallazgos
- `GET /api/findings` - Listar hallazgos
- `GET /api/findings/:id` - Obtener hallazgo
- `POST /api/findings` - Crear hallazgo (ADMIN, CONSULTOR)
- `PUT /api/findings/:id` - Actualizar hallazgo
- `DELETE /api/findings/:id` - Eliminar hallazgo
- `PATCH /api/findings/:id/status` - Cambiar estado
- `PATCH /api/findings/:id/assign` - Asignar hallazgo
- `GET /api/findings/stats` - Estadísticas

### Calendario
- `GET /api/calendars` - Listar eventos
- `GET /api/calendars/:id` - Obtener evento
- `POST /api/calendars` - Crear evento
- `PUT /api/calendars/:id` - Actualizar evento
- `DELETE /api/calendars/:id` - Eliminar evento
- `GET /api/calendars/upcoming` - Eventos próximos
- `GET /api/calendars/type/:type` - Eventos por tipo
- `GET /api/calendars/stats` - Estadísticas

## 🔍 Ejemplos de Uso

### Crear una auditoría

```bash
POST /api/audits
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Auditoría Interna Q1 2026",
  "description": "Revisión de procesos de Calidad y Producción",
  "date": "2026-03-15",
  "assignedTo": "507f1f77bcf86cd799439011"
}
```

### Crear un hallazgo

```bash
POST /api/findings
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Falta de documentación",
  "description": "El proceso de manufactura no está documentado",
  "severity": "Alta",
  "audit": "507f1f77bcf86cd799439012",
  "assignedTo": "507f1f77bcf86cd799439011"
}
```

### Obtener hallazgos con filtros

```bash
GET /api/findings?page=1&limit=10&severity=Alta&status=Abierto&search=documentacion
Authorization: Bearer <token>
```

## 🧪 Testing

Ejecutar tests:

```bash
npm test
```

Con coverage:

```bash
npm test -- --coverage
```

## 📝 Validación de Datos

El backend valida automáticamente:

- **Emails**: Formato válido
- **Contraseñas**: Min 8 caracteres, mayúsculas, minúsculas, números
- **Fechas**: Formato ISO 8601
- **IDs de MongoDB**: Formato válido
- **Roles**: Solo valores permitidos
- **Estados**: Solo valores permitidos

Ejemplos de validación:

```json
{
  "email": "usuario@example.com",
  "password": "Segura123!",
  "name": "Juan Pérez",
  "role": "CONSULTOR"
}
```

## 🔒 Seguridad

### Características de Seguridad Implementadas

1. **JWT**: Tokens con expiración corta y refresh tokens
2. **Helmet**: Headers de seguridad HTTP
3. **Rate Limiting**: Límite de 100 requests/15 minutos por IP
4. **CORS**: Configurado para dominios específicos
5. **Bcrypt**: Hash de contraseñas con 10 rondas
6. **Validación**: Entrada validada en todos los endpoints
7. **Logging**: Auditoría de acciones importantes
8. **HTTPS**: Recomendado en producción

### Checklist de Seguridad para Producción

- [ ] Cambiar JWT_SECRET a valor muy seguro
- [ ] Cambiar credenciales de MongoDB
- [ ] Configurar CORS para dominios específicos
- [ ] Habilitar HTTPS/SSL
- [ ] Configurar backups automáticos de MongoDB
- [ ] Implementar rate limiting más restrictivo
- [ ] Agregar 2FA para SUPER_ADMIN
- [ ] Configurar firewall y WAF
- [ ] Monitorear logs regularmente
- [ ] Implementar sistema de alertas

## 📊 Respuestas Estándar

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operación realizada exitosamente",
  "data": {
    // Datos específicos de la operación
  }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "code": "ERROR_CODE",
  "details": [] // Opcional, para errores de validación
}
```

## 🛠 Desarrollo

### Agregar un nuevo endpoint

1. Crear el controlador en `src/controllers/`
2. Crear las validaciones en `src/middleware/validation.js`
3. Crear las rutas en `src/routes/`
4. Importar las rutas en `src/server.js`

### Debugging

El backend emite logs detallados. Para ver logs en desarrollo:

```bash
NODE_ENV=development npm run dev
```

Ver archivo de logs:

```bash
tail -f logs/app.log
```

## 🚀 Deployment

### Heroku

```bash
git push heroku main
```

### Docker

Crear `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Construir imagen:

```bash
docker build -t indusecc-backend .
docker run -p 3000:3000 --env-file .env indusecc-backend
```

## 📞 Soporte

Para reportar bugs o solicitar funcionalidades, abrir un issue en GitHub.

## 📄 Licencia

ISC License - Copyright © 2026 INDUSECC

## 👥 Equipo

- Backend Developer: Tu Nombre
- Frontend Developer: Nombre
- Diseño: Nombre

---

**Última actualización**: Abril 2026
