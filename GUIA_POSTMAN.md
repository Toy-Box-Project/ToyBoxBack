# Guía de pruebas con Postman — ToyBox API

## Requisitos previos

1. Servidor corriendo: `node index.js` (en `ToyBoxBack/`)
2. Base de datos importada con schema y seed
3. Postman con la colección `ToyBox_Postman_Collection.json` importada

---

## Credenciales del seed

| Rol           | Email                       | Contraseña |
|---------------|-----------------------------|------------|
| administrator | carlos.admin@example.com    | toybox01   |
| administrator | laura.admin@example.com     | toybox02   |
| moderator     | ricardo.mod@example.com     | toybox03   |
| moderator     | sara.mod@example.com        | toybox04   |
| user          | clara.user@example.com      | toybox08   |
| user          | pablo.user@example.com      | toybox09   |
| user          | lucia.user@example.com      | toybox10   |

---

## PASO 1 — Verificar que el servidor responde

Carpeta **✅ Health Check** → `Health`

- Método: `GET /health`
- Resultado esperado: `200 OK` con `{ "status": "ok" }`

---

## PASO 2 — Login como usuario normal

Carpeta **🔐 Auth** → `Login`

Body:
```json
{
  "email": "clara.user@example.com",
  "password": "toybox08"
}
```

- Resultado esperado: `200 OK` con `{ "token": "...", "user": { ... } }`
- El token se guarda automáticamente en `{{token}}`
- El `user_id` se guarda automáticamente en `{{user_id}}`

---

## PASO 3 — Login como administrador

Carpeta **🔐 Auth** → `Login (Admin)`

Body:
```json
{
  "email": "carlos.admin@example.com",
  "password": "toybox01"
}
```

- El token se guarda automáticamente en `{{admin_token}}`

---

## PASO 4 — Explorar categorías

Carpeta **🏷️ Categories** → `Get All Categories`

- Método: `GET /categories`
- No requiere token
- Resultado esperado: array con 8 categorías
- El `category_id` de la primera se guarda en `{{category_id}}`

---

## PASO 5 — Listar productos publicados

Carpeta **📦 Products** → `List Products (público)`

- Método: `GET /products?page=1&limit=12`
- No requiere token
- Resultado esperado: `{ data: [...], total: ..., page: 1, ... }`
- El `product_id` del primer resultado se guarda en `{{product_id}}`

Prueba también los filtros activando los query params opcionales:
- `search=lego` → filtra por título
- `categoryId=2` → solo Construcciones y bloques
- `minPrice=5&maxPrice=15` → rango de precio

---

## PASO 6 — Ver un producto específico

Carpeta **📦 Products** → `Get Product by ID`

- Método: `GET /products/1`
- No requiere token
- Resultado esperado: datos del producto + array `photos`

---

## PASO 7 — Crear un producto propio

Carpeta **📦 Products** → `Create Product`

- Requiere `{{token}}` (usuario normal)
- Body:
```json
{
  "title": "Mi juguete de prueba",
  "description": "Juguete en perfecto estado",
  "price": 12.50,
  "fk_categories_id": 1,
  "location": "Madrid"
}
```
- Resultado esperado: `201 Created` con el producto en estado `draft`
- El `product_id` del nuevo producto se guarda en `{{product_id}}`

---

## PASO 8 — Subir imagen al producto

Carpeta **📦 Products** → `Upload Images (form-data)`

- Requiere `{{token}}`
- En Postman: Body → form-data → campo `images` → tipo File → selecciona una imagen JPG/PNG
- Resultado esperado: `201 Created` con array de fotos

---

## PASO 9 — Publicar el producto

Carpeta **📦 Products** → `Publish Product`

- Método: `PATCH /products/{{product_id}}/publish`
- Requiere `{{token}}`
- El producto debe tener al menos 1 imagen (paso 8)
- Resultado esperado: `200 OK` con `conservation_status: "published"`

---

## PASO 10 — Añadir a favoritos

> Usa otro usuario logueado o el mismo (no tiene restricción de "propio")

Carpeta **❤️ Favorites** → `Add Favorite`

- Método: `POST /favorites/{{product_id}}`
- Requiere `{{token}}`
- Resultado esperado: `201 Created` con mensaje de confirmación

Luego:
- `List Favorites` → ver todos tus favoritos
- `Remove Favorite` → quitar el favorito

---

## PASO 11 — Iniciar un chat sobre un producto

> El producto debe estar `published` y ser de otro usuario.
> Usa el producto con ID 1 (vendedor: `mod_ricardo`, tú eres `clara`).

Carpeta **💬 Chats** → `Start Chat`

Body:
```json
{
  "fk_product_id": 1
}
```

- Resultado esperado: `201 Created` con la conversación
- El `chat_id` se guarda en `{{chat_id}}`

Luego:
- `Get Chat Messages` → ver mensajes (vacío al principio)
- `Send Message` → enviar un mensaje
- `List My Chats` → ver todas tus conversaciones
- `Mark Chat as Read` → marcar como leído

---

## PASO 12 — Crear una reserva

> El producto debe estar `published` y ser de otro usuario.
> Usa producto ID 1 (del seed, publicado).

Carpeta **📅 Reservations** → `Create Reservation`

Body:
```json
{
  "fk_product_id": 1
}
```

- Resultado esperado: `201 Created` con la reserva en estado `pending`
- El `reservation_id` se guarda en `{{reservation_id}}`
- El producto pasa a estado `reserved` automáticamente

Opciones tras crear la reserva:
- `Cancel Reservation` → devuelve el producto a `published`
- `Complete Reservation` → marca el producto como `sold` y crea la orden

---

## PASO 13 — Ver órdenes (tras completar reserva)

Carpeta **🛒 Orders**

- `Get My Purchases` → compras realizadas
- `Get My Sales` → ventas realizadas (con el token del vendedor)

---

## PASO 14 — Escribir una reseña (tras compra completada)

> Solo puedes reseñar si tienes una orden completada del artículo.

Carpeta **⭐ Reviews** → `Create Review`

Body:
```json
{
  "rating": 5,
  "comment": "Artículo en perfectas condiciones",
  "fk_items_id": 1,
  "fk_reviewed_id": 3
}
```

> `fk_reviewed_id` es el ID del vendedor (usuario 3 = mod_ricardo en el seed)

---

## PASO 15 — Reportar un producto

Carpeta **📦 Products** → `Report Product`

- El producto debe estar `published` y no ser tuyo
- Body:
```json
{
  "reason": "Descripción engañosa del producto"
}
```
- Resultado esperado: `201 Created` y el producto pasa a `under_review`

---

## PASO 16 — Panel de administración

Asegúrate de usar `{{admin_token}}` (paso 3).

### Stats
`GET /admin/stats` → métricas globales: productos por estado, ventas, usuarios, categorías top

### Gestión de usuarios
- `List Users` → `GET /admin/users?page=1&limit=20`
- Filtros opcionales: `role=moderator`, `status=active`, `email=...`
- `Change User Role` → `PATCH /admin/users/{{user_id}}/role`
  ```json
  { "role": "moderator" }
  ```
  Valores válidos: `user`, `moderator`, `administrator`
- `Change User Status` → `PATCH /admin/users/{{user_id}}/active`
  ```json
  { "status": "blocked" }
  ```
  Valores válidos: `active`, `blocked`

### Gestión de reportes
- `List Reports` → ver reportes pendientes
- `Get Report by ID` → detalle + historial de moderación
- `Approve Report (reactivar artículo)` → vuelve el producto a `published`
  ```json
  { "notes": "El artículo cumple las normas" }
  ```
- `Withdraw Report (eliminar artículo)` → marca el producto como `removed`
  ```json
  { "notes": "Artículo retirado por incumplir las normas" }
  ```

---

## PASO 17 — Gestión de categorías (admin)

Con `{{admin_token}}`:

- `Create Category` → `POST /categories`
  ```json
  { "name": "Nueva categoría", "description": "Descripción opcional" }
  ```
- `Update Category` → `PUT /categories/{{category_id}}`
- `Delete Category` → `DELETE /categories/{{category_id}}`

---

## PASO 18 — Editar perfil de usuario

Carpeta **👤 Users** → `Update Profile`

- Método: `PUT /users/{{user_id}}`
- Solo puedes editar tu propio perfil
- Body (todos los campos son opcionales):
```json
{
  "username": "nuevo_username",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "phone_number": "612345678",
  "user_city": "Sevilla",
  "user_province": "Sevilla",
  "user_zipcode": "41001"
}
```

### Subir avatar
`PATCH /users/{{user_id}}/avatar`
- Body → form-data → campo `avatar` → tipo File → imagen JPG/PNG

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | Token ausente o expirado | Volver a hacer Login |
| `403 Forbidden` | No tienes permisos | Usar `{{admin_token}}` para rutas de admin |
| `404 Not Found` | El ID no existe | Verificar que el recurso existe en la BD |
| `409 Conflict` | Estado inválido para la operación | Leer el mensaje de error, el estado del producto no permite esa acción |
| `400 Bad Request` | Campos faltantes o inválidos | Revisar el body del request |

---

## Flujo completo de compra-venta (resumen)

```
[Vendedor] Crear producto → Subir imagen → Publicar
[Comprador] Ver producto → Iniciar chat → Crear reserva → Completar reserva
[Comprador] Ver orden en /orders/purchases
[Vendedor]  Ver orden en /orders/sales
[Comprador] Crear reseña del vendedor
```
