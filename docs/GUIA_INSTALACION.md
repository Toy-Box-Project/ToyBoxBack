# Guía de Instalación – ToyBox

Instrucciones paso a paso para levantar el proyecto ToyBox completo en desarrollo local y en producción.

---

## Requisitos Previos

Asegúrate de tener instalado:

- **Node.js 22+** – [Descargar](https://nodejs.org/)
- **npm 10+** – Viene con Node.js
- **MySQL 8.0+** – [Descargar](https://dev.mysql.com/downloads/mysql/)
- **Git** – Para clonar el repositorio
- **Angular CLI 21+** – `npm install -g @angular/cli@latest`

**Opcional (pero recomendado):**
- **MySQL Workbench** – Interfaz gráfica para MySQL
- **Postman o VSCode REST Client** – Para probar la API

---

### Verificar Node.js

````bash
node -v    # Debe ser v22.x.x o superior
npm -v     # Debe ser 10.x.x o superior
````
---

## Instalación en Desarrollo Local

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/toybox.git
cd toybox
```

### Paso 2: Configurar Base de Datos MySQL

#### 2.1 Crear la base de datos

```bash
# Acceder a MySQL
mysql -u root -p

# Dentro de MySQL CLI
CREATE DATABASE toybox;
EXIT;
```

#### 2.2 Importar el schema

```bash
# Desde la terminal (en la carpeta del proyecto)
mysql -u root -p toybox < backend/BBDD/structure_toybox.sql

# Ingresa tu contraseña MySQL cuando se te pida
```

#### 2.3 Importar datos de ejemplo (opcional)

```bash
mysql -u root -p toybox < backend/BBDD/seed.sql
```

**Verificar que funcionó:**

```bash
mysql -u root -p toybox

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
EXIT;
```

### Paso 3: Configurar Backend

#### 3.1 Crear archivo .env

```bash
cd backend
cp .env.example .env
```

#### 3.2 Editar .env con tus valores

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos (MySQL local)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA_MYSQL
DB_NAME=toybox

# Cloudinary (obtén en https://cloudinary.com - recomendado) -
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# JWT (genera con: openssl rand -base64 32)
JWT_SECRET=genera_una_cadena_aleatoria_base64_aqui
JWT_EXPIRES_IN=7d
```

*** Contraseñas enviadas por correo ***

#### 3.3 Instalar dependencias

```bash
npm install
```

#### 3.4 Iniciar servidor backend

````bash
# Instalar dependencias (si no las instalaste en 3.3)
npm install

# Modo desarrollo con hot reload
npm run dev

# Output esperado:
# ✓ Servidor ejecutándose en http://localhost:3000
# ✓ Conectado a BD toybox en localhost:3306
# 
# Si ves errores de BD, verifica credenciales en .env
````

**Backend listo en:** `http://localhost:3000`

### Paso 4: Configurar Frontend

#### 4.1 Instalar dependencias

```bash
cd ../frontend
npm install
```

#### 4.2 Verificar URL del backend

**Archivo:** `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000'
};
```

#### 4.3 Iniciar servidor Angular

```bash
# En una NUEVA terminal (mantener otra con el backend)
ng serve -o

# Se abre automáticamente en http://localhost:4200
```

**Frontend listo en:** `http://localhost:4200`

---

## ✅ Verificación de Instalación

### Checklist

- [ ] Base de datos importada correctamente
- [ ] Backend iniciado sin errores (puerto 3000)
- [ ] Frontend iniciado sin errores (puerto 4200)
- [ ] Puedes acceder a `http://localhost:4200`
- [ ] No hay errores en la consola del navegador

### Test Rápido

1. **Abrir navegador en:** `http://localhost:4200`
2. **Ir a login:** `/auth/login`
3. **Intentar acceso con credenciales de prueba** (ver `USUARIOS_PRUEBA.md`)

Si ves la página sin errores, ¡todo funciona! ✅

---

## 🧪 Usuarios de Prueba

Para probar diferentes roles sin crear usuarios manuales:
Incluidos en `seed.sql` (ya importados)

*** Contraseñas enviadas por correo  ***
---

## 🔧 Configuración de Cloudinary (Opcional)

### Opción 1: Sin Cloudinary (Más rápido)

Las imágenes funcionarán pero se mostrarán como **placeholders genéricos**.

- Salta este paso
- Las credenciales `CLOUDINARY_*` en `.env` pueden quedar vacías
- Todo funciona igual, solo sin subida real de imágenes

**Recomendado para:** Testing rápido, demostración inicial

---

### Opción 2: Con Cloudinary (Recomendado)

Para subida real de imágenes a Cloudinary (la experiencia completa):

1. **Espera el email** con las credenciales de Cloudinary
2. **En el archivo `.env` del backend**, reemplaza:
```env
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
```
   Con los valores recibidos por email

3. **Reinicia el backend:**
```bash
   npm run dev
```

4. **Verifica que funciona:**
   - Intenta subir una foto en crear producto o perfil
   - Las imágenes aparecerán sin placeholder
