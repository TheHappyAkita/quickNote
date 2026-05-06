# Setup & Deployment

## Requirements

- **Node.js** 20 or later
- **npm** 9 or later

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url>
cd quickNote
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

### 3. Generate a session secret

The session password must be at least 32 characters:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output as `NUXT_SESSION_PASSWORD` in `.env`.

### 4. Create a user

Hash your password with bcrypt (cost factor 10):

```bash
node -e "const b=require('bcryptjs'); b.hash('yourpassword', 10).then(console.log)"
```

Set `AUTH_USERS` in `.env` with the resulting hash:

```env
AUTH_USERS=[{"username":"alice","passwordHash":"$2a$10$..."}]
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_SESSION_PASSWORD` | **Yes** | — | Session encryption key, min 32 chars |
| `AUTH_USERS` | **Yes** | `[]` | JSON array of `{ username, passwordHash }` objects |
| `NOTES_DIR` | No | `~/.quickNote` | Directory where notes and pages are stored |
| `PORT` | No | `3000` | HTTP port for the production server |

### Multiple users

```env
AUTH_USERS=[
  {"username":"alice","passwordHash":"$2a$10$..."},
  {"username":"bob","passwordHash":"$2a$10$..."}
]
```

### Custom notes directory

```env
NOTES_DIR=/home/alice/Documents/notes
```

The directory is created automatically if it does not exist.

---

## Production Build

```bash
npm run build
```

This compiles the app to `.output/`. Start the production server:

```bash
node .output/server/index.mjs
```

Or set the port:

```bash
PORT=8080 node .output/server/index.mjs
```

### Preview locally before deploying

```bash
npm run preview
```

---

## Docker

Create a `Dockerfile` alongside `quickNote/`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output ./output

ENV PORT=3000
EXPOSE 3000

CMD ["node", "output/server/index.mjs"]
```

Build and run:

```bash
docker build -t quicknote .
docker run -d \
  -p 3000:3000 \
  -v /your/notes/path:/root/.quickNote \
  -e NUXT_SESSION_PASSWORD=<secret> \
  -e AUTH_USERS='[{"username":"alice","passwordHash":"$2a$10$..."}]' \
  quicknote
```

### Docker Compose

```yaml
services:
  quicknote:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./notes:/root/.quickNote
    environment:
      NUXT_SESSION_PASSWORD: ${NUXT_SESSION_PASSWORD}
      AUTH_USERS: ${AUTH_USERS}
    restart: unless-stopped
```

---

## Reverse Proxy (nginx)

Example nginx configuration for running behind a reverse proxy:

```nginx
server {
    listen 80;
    server_name notes.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Use [Certbot](https://certbot.eff.org/) to add HTTPS.

---

## Upgrading

```bash
git pull
npm install
npm run build
```

Restart the server process. Notes are stored on the filesystem and are never affected by upgrades.
