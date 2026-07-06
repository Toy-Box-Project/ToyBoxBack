# ToyBoxBack — Source Overview

Technical reference for the `src/` directory of the ToyBoxBack API: a Node.js/Express backend for a second-hand toy marketplace (listings, favorites, orders/reservations, reviews, reports, notifications, and real-time chat).

## Architecture

- **Runtime/framework**: Node.js with **Express**.
- **Database**: **MySQL**, accessed through the **`mysql2/promise`** driver via a connection pool (`src/config/db.js`). There is **no Mongoose/Sequelize ORM** — all data access is hand-written, parameterized SQL living in `src/models/*.js`. "Models" in this codebase are plain modules of `async` functions (`pool.query(...)`), not schema classes.
- **Auth**: stateless **JWT** (`jsonwebtoken`), read from an `Authorization: Bearer <token>` header or an httpOnly `token` cookie.
- **File uploads**: `multer` (in-memory storage) + **Cloudinary** for persistent image hosting.
- **Real-time**: `socket.io`, JWT-authenticated at the handshake, used for the chat feature.
- **Validation**: `express-validator`, invoked declaratively in route definitions and centrally checked by a shared middleware.

## Folder structure

```
src/
├── config/        # Environment-driven setup: DB pool, Cloudinary SDK
├── controllers/    # Express request handlers (business logic, one file per resource)
├── middlewares/    # Cross-cutting request pipeline concerns (auth, roles, validation, uploads, errors)
├── models/         # Raw-SQL data-access functions, one file per DB table/domain
├── routes/         # Express routers mapping HTTP method + path -> middleware chain -> controller
└── sockets/        # Socket.io setup and real-time chat event handling
```

### `config/`
- `db.js` — creates and exports the shared `mysql2/promise` connection pool (from `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `connectionLimit: 10`). Imported by every model module; there is a single pool for the whole app.
- `cloudinary.js` — configures the Cloudinary SDK from env vars and exposes `uploadBufferToCloudinary(buffer, options)`, a promise-based wrapper around Cloudinary's stream upload API, used to persist images received via `multer`.

### `controllers/`
One file per resource (`auth`, `category`, `chat`, `favorite`, `item`, `notification`, `order`, `report`, `reservation`, `review`, `stats`, `user`). Each exports Express handlers `(req, res)` / `(req, res, next)` that:
- read input from `req.body` / `req.params` / `req.query` / `req.user` (the last populated by the auth middleware),
- call one or more functions from the matching `models/*.model.js` file,
- enforce any resource-specific authorization (e.g. ownership checks, role checks) not already covered by route middleware,
- respond with JSON and the appropriate HTTP status code, or delegate errors to the centralized error handler via `next(err)`.

### `middlewares/`
- `auth.js` — `authenticate`: verifies the JWT (header first, cookie fallback) and sets `req.user = { id_users, role }`; responds `401` if missing/invalid.
- `checkRole.js` — `requireRole(...roles)`: factory middleware that must run **after** `authenticate`; responds `401` if unauthenticated, `403` if the user's role isn't in the allow-list.
- `validate.js` — `validate`: runs after `express-validator` validation chains declared inline in route files; responds `422` with the collected error list if any validation failed.
- `upload.js` — configures `multer` with in-memory storage, an image-only `fileFilter`, and a 5 MB size limit; the resulting buffer is later pushed to Cloudinary by the controller.
- `errorHandler.js` — the final, 4-argument Express error-handling middleware; logs the error and returns a uniform `{ error: message }` JSON body with the error's `status`/`statusCode` or `500`.

### `models/`
Data-access modules (`category`, `conversation`, `favorite`, `item`, `notification`, `order`, `report`, `reservation`, `review`, `user`). Each function runs one or more parameterized SQL statements against the shared pool and returns plain rows/objects (or `null`/an aggregated object for list+pagination results). Notable patterns:
- `user.model.js` defines a `SAFE_FIELDS` column list to avoid ever returning the password hash from read queries.
- Soft-delete/anonymization patterns are used instead of hard deletes in places (e.g. account deactivation scrambles PII and flips `status`).
- List endpoints generally support pagination (`page`/`limit`) and optional `LIKE`/equality filters built up dynamically.

### `routes/`
One router per resource (`admin`, `auth`, `category`, `chat`, `favorite`, `item`, `notification`, `order`, `reservation`, `review`, `user`). Each route line composes the middleware chain explicitly, e.g.:

```js
router.post('/:id/images', authenticate, upload.array('images', 5), uploadImages);
```

Routes are one of: **public** (no middleware), **protected** (`authenticate` only), **role-restricted** (`authenticate` + `requireRole(...)`), **validated** (`express-validator` rule chain + `validate`), and/or **file-upload** (`upload` from `middlewares/upload.js`). Every route registration has an inline comment stating its method, path, purpose, and which of these apply. `auth.routes.js` additionally rate-limits `register`/`login` via `express-rate-limit`.

### `sockets/`
- `chat.socket.js` — initializes `socket.io` (`initSocket(httpServer)`) with a JWT handshake middleware (`socket.handshake.auth.token`); exports `emitNewMessage(conversationId, message)` for controllers to push new chat messages out in real time.

## Request lifecycle

```
HTTP request
  → routes/*.routes.js        (matches method + path)
  → middlewares (as chained)  (authenticate → requireRole → validation rules → validate → upload, as applicable)
  → controllers/*.controller.js (reads req, calls model functions, applies business/authorization rules)
  → models/*.model.js         (parameterized SQL against the mysql2 pool)
  ← controller sends JSON response, or calls next(err)
  ← middlewares/errorHandler.js (if next(err) was called) sends a uniform error response
```

## Authentication & authorization

- **Authentication**: `middlewares/auth.js` verifies a JWT signed with `process.env.JWT_SECRET`. Token source precedence: `Authorization: Bearer <token>` header first (useful for Postman/mobile clients), then the httpOnly `token` cookie set by `login`/`register` (used by browser sessions). On success it sets `req.user = { id_users, role }`; on failure it responds `401` directly, short-circuiting the request.
- **Authorization**: two layers —
  1. **Role-based**, via `middlewares/checkRole.js`'s `requireRole(...roles)`, applied at the route level for endpoints restricted to specific roles (e.g. `admin`). Must run after `authenticate` since it depends on `req.user`.
  2. **Ownership/resource-level**, implemented inline inside individual controllers where a role check alone isn't sufficient (e.g. a user editing only their own item, order, or review). These checks are documented in the JSDoc of the relevant controller functions.

## Real-time chat (Socket.io)

`sockets/chat.socket.js` sets up a room-based broadcast model:
- On connection, a socket authenticates via a JWT passed in `socket.handshake.auth.token` (rejected otherwise) and automatically joins a personal room `user:<id_users>`.
- Clients additionally join/leave a `conversation:<id_conversation>` room on demand via the `join_conversation` / `leave_conversation` events while actively viewing a conversation.
- `emitNewMessage(conversationId, message)` (called from the chat controller after a message is persisted) emits `new_message` to the conversation's room (for anyone with that chat open) and `new_message_notification` to the recipient's personal room (so they're notified even if the conversation isn't open).

## Conventions

- **Error handling**: controllers either respond directly with an appropriate status code or delegate to `next(err)`, which is caught by the single centralized `errorHandler` middleware registered last in the Express app — ensuring a consistent `{ error: message }` response shape and centralized logging.
- **Validation**: input validation is declared per-route using `express-validator` rule arrays (e.g. `itemRules`, `registerRules`) defined at the top of each route file, followed by the shared `validate` middleware that turns accumulated errors into a single `422` response before the request ever reaches the controller.
- **File uploads**: binary uploads never touch disk — `multer` buffers them in memory (`middlewares/upload.js`, image-only, 5 MB limit), and controllers forward the buffer to `uploadBufferToCloudinary` (`config/cloudinary.js`) to persist it and obtain a public URL, which is then stored via the relevant model function.
- **No ORM/schema files**: since the DB layer is raw SQL, there are no schema/migration definitions inside `src/`; column names and constraints are implicit in the SQL strings within each `models/*.model.js` file (now documented via JSDoc on each function).
