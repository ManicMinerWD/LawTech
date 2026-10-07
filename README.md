# LawTech

LawTech: a knowledgebase and case management system for lawyers to track clients and manage cases.

- **Backend**: Node.js + Express + better-sqlite3 (REST API + JWT auth + audit log + document versioning)
- **Frontend**: vanilla JS single-page app (dashboard, clients, cases, matters, knowledgebase, documents, AI Studio suite)

## Getting started

```bash
npm install
npm start
```

Open http://localhost:3000

## Default credentials

The database is seeded on first startup with a demo admin account:

- Email: `admin@lawtech.com`
- Password: `admin123`

## API overview

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/health` | Health check |
| GET | `/api/clients` | List clients (optional `?search=`) |
| POST | `/api/clients` | Create a client |
| PUT | `/api/clients/:id` | Update a client |
| DELETE | `/api/clients/:id` | Delete a client |
| GET | `/api/cases` | List cases (optional `?clientId=` / `?search=`) |
| POST | `/api/cases` | Create a case |
| GET | `/api/matters` | List matters |
| POST | `/api/matters` | Create a matter |
| GET | `/api/articles` | List knowledgebase articles |
| POST | `/api/articles` | Create an article |
| GET | `/api/documents` | List documents |
| POST | `/api/documents` | Upload/attach a document |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in and return a JWT |

## Production / Docker

A `Dockerfile` is included for running the app in a container. It bakes the
native `better-sqlite3` module against the Node version you tag the image on,
runs as a non-root `node` user, and ships the DB runtime dir for persistence.

```bash
# Build
docker build -t lawtech .

# Run (default admin credentials, override with env vars)
docker run -d --name lawtech -p 3000:3000 \
  -e ADMIN_EMAIL=admin@lawtech.com \
  -e ADMIN_PASSWORD=admin123 \
  lawtech
```

See the `Dockerfile` for the full environment variable table.

## Tech stack

- Node.js >= 18
- Express 4
- better-sqlite3 (synchronous SQLite)
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- uuid (IDs)
- multer (file uploads)
- cors, dotenv

## Notes

- `.gitignore` covers `node_modules/`, `*.log`, `.env`, `.DS_Store`, and the SQLite DB files (`lawtech.db`, `lawtech.db-wal`, `lawtech.db-shm`).
- The SQLite database is auto-seeded on first run via `database.js` — you don't need to commit it.
