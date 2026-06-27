# ToyBoxBack — API REST

Backend del proyecto ToyBox. Node.js 20+ · Express 5 · MySQL 8 (Aiven) · JWT · bcrypt.

---

## Setup local

```bash
npm install
cp .env.example .env   # completar con tus credenciales
npm run dev
```

El servidor arranca en `http://localhost:3000`.

---

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default 3000) |
| `DB_HOST` | Host MySQL |
| `DB_PORT` | Puerto MySQL (default 3306) |
| `DB_USER` | Usuario MySQL |
| `DB_PASSWORD` | Contraseña MySQL |
| `DB_NAME` | Nombre de la base de datos |
| `JWT_SECRET` | Clave secreta para firmar JWT |
| `JWT_EXPIRES_IN` | Expiración del token (ej. `7d`) |

---

## Base de datos

```bash
mysql -u <user> -p <dbname> < BBDD/toybox_schema.sql
mysql -u <user> -p <dbname> < BBDD/seed.sql
```

---

## Endpoints

### Auth
| Método | Ruta | Auth |
|---|---|---|
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |

### Categorías
| Método | Ruta | Auth | Rol |
|---|---|---|---|
| GET | `/categories` | No | — |
| POST | `/categories` | Sí | admin |
| PUT | `/categories/:id` | Sí | admin |
| DELETE | `/categories/:id` | Sí | admin |

### Productos
| Método | Ruta | Auth | Rol |
|---|---|---|---|
| GET | `/products` | No | — |
| GET | `/products/:id` | No | — |
| POST | `/products` | Sí | user |
| PUT | `/products/:id` | Sí | owner/admin |
| DELETE | `/products/:id` | Sí | owner/admin |
| POST | `/products/:id/images` | Sí | owner |
| PATCH | `/products/:id/publish` | Sí | owner |
| PATCH | `/products/:id/sold` | Sí | owner |
| POST | `/products/:id/report` | Sí | user |

### Usuarios
| Método | Ruta | Auth | Rol |
|---|---|---|---|
| GET | `/users/:id` | No | — |
| PUT | `/users/:id` | Sí | owner |
| PATCH | `/users/:id/avatar` | Sí | owner |

### Admin
| Método | Ruta | Auth | Rol |
|---|---|---|---|
| GET | `/admin/users` | Sí | admin |
| PATCH | `/admin/users/:id/role` | Sí | admin |
| PATCH | `/admin/users/:id/active` | Sí | admin |
| GET | `/admin/stats` | Sí | admin |
| GET | `/admin/reports` | Sí | mod/admin |
| GET | `/admin/reports/:id` | Sí | mod/admin |
| PATCH | `/admin/reports/:productId/approve` | Sí | mod/admin |
| PATCH | `/admin/reports/:productId/withdraw` | Sí | mod/admin |

### Chats
| Método | Ruta | Auth |
|---|---|---|
| POST | `/chats` | Sí |
| GET | `/chats` | Sí |
| GET | `/chats/:id` | Sí |
| GET | `/chats/:id/messages` | Sí |
| POST | `/chats/:id/messages` | Sí |
| PATCH | `/chats/:id/read` | Sí |

### Reservas
| Método | Ruta | Auth |
|---|---|---|
| POST | `/reservations` | Sí |
| GET | `/reservations/my` | Sí |
| PATCH | `/reservations/:id/cancel` | Sí |
| PATCH | `/reservations/:id/complete` | Sí |

### Órdenes
| Método | Ruta | Auth |
|---|---|---|
| GET | `/orders/purchases` | Sí |
| GET | `/orders/sales` | Sí |
| GET | `/orders/:id` | Sí |

### Reseñas
| Método | Ruta | Auth |
|---|---|---|
| GET | `/reviews/product/:productId` | No |
| POST | `/reviews` | Sí |

### Favoritos
| Método | Ruta | Auth |
|---|---|---|
| GET | `/favorites` | Sí |
| POST | `/favorites/:productId` | Sí |
| DELETE | `/favorites/:productId` | Sí |

---

## Stack

- **Runtime:** Node.js ≥22 · **Framework:** Express 5
- **BD:** MySQL 8 vía `mysql2/promise`
- **Auth:** JWT + `bcryptjs`
- **Validación:** `express-validator` · **Rate limiting:** `express-rate-limit`
- **Uploads:** `multer` → `uploads/`
