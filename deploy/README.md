# PetPulse single-VM deployment draft

This layout serves the React build and exposes Spring/FastAPI through one Nginx
origin. It is a deployment template, not an automated installer.

## Directory layout

```text
/opt/petpulse/backend/app.jar
/opt/petpulse/fastapi/app
/opt/petpulse/fastapi/models
/opt/petpulse/fastapi/.venv
/var/www/petpulse/index.html
/var/www/petpulse/assets
/etc/petpulse/backend.env
/etc/petpulse/fastapi.env
```

Run Spring and FastAPI as the unprivileged `petpulse` user. Environment files
must be readable only by that user and root and must not be copied into the web
root.

## Production environment

Frontend build-time values:

```text
VITE_API_BASE_URL=/api
```

`VITE_SPRING_API_TARGET` is a Vite development-server setting and is not needed
in the production build. The browser never calls FastAPI directly.

Spring `/etc/petpulse/backend.env` includes at least:

```text
SPRING_PROFILES_ACTIVE=prod
SERVER_ADDRESS=127.0.0.1
SERVER_PORT=8080
DB_URL=jdbc:postgresql://managed-postgresql-host:5432/petpulse
DB_USERNAME=replace-me
DB_PASSWORD=replace-me
JWT_SECRET=replace-with-at-least-32-random-bytes
JWT_EXPIRATION_SECONDS=3600
FASTAPI_BASE_URL=http://127.0.0.1:8000
FASTAPI_CONNECT_TIMEOUT_SECONDS=3
FASTAPI_READ_TIMEOUT_SECONDS=30
CHAT_FASTAPI_READ_TIMEOUT_SECONDS=300
APP_CORS_ALLOWED_ORIGINS=
FLYWAY_BASELINE_ON_MIGRATE=false
```

`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` are mandatory in the
`prod` profile. Use `sslmode=require` (or the managed database provider's
required TLS parameters) in `DB_URL`. Keep `FLYWAY_BASELINE_ON_MIGRATE=false`
for a new empty database; `true` is only for the separately verified existing
database adoption procedure in `Backend/app/DEPLOYMENT.md`.

FastAPI `/etc/petpulse/fastapi.env` includes:

```text
GEMINI_API_KEY=replace-me
GEMINI_MODEL=gemini-3.6-flash
CORS_ALLOWED_ORIGINS=
```

Same-origin browser requests do not require production CORS allowlists. Do not
replace the empty values with `*`.

## Build and copy

1. Build Spring with `./gradlew clean bootJar`, then copy the generated JAR to
   `/opt/petpulse/backend/app.jar`.
2. Copy `FastAPI/petpulse_ai` to `/opt/petpulse/fastapi`, create its virtual
   environment there, and install `requirements.txt`. Runtime inference needs
   `app/`, `models/pet_risk_pipeline.pkl`, `app/data/wellness_knowledge_base.json`,
   `app/data/vet_knowledge_corpus.json`, and `requirements.txt`. The training
   CSV, `scripts/`, tests, and `requirements-dev.txt` are not required at runtime.
   A complete Chroma index additionally needs every file under
   `app/data/chroma_db/`, including `chroma.sqlite3`. That SQLite file is ignored
   by Git in this repository, so either copy a verified generated index as a
   deployment artifact or intentionally use the built-in JSON lookup fallback.
3. Build React with `npm ci && npm run build`, empty the old static release only
   after preserving a rollback copy, and copy the contents of `Frontend/dist/`
   into `/var/www/petpulse/`.
4. Install the unit files from `deploy/systemd/` into `/etc/systemd/system/`.
5. Install `deploy/nginx/petpulse.conf` as an enabled Nginx site after replacing
   `server_name` and adding the production TLS certificate configuration.

## Start and verify

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now petpulse-fastapi petpulse-backend
sudo systemctl status petpulse-fastapi petpulse-backend
sudo nginx -t
sudo systemctl reload nginx
```

Verify an auth route through Nginx (this project does not currently include the
Actuator dependency), load a React nested route directly to confirm SPA fallback,
and send a chatbot request while checking that tokens arrive incrementally.
Inspect service output with `journalctl -u petpulse-backend` and
`journalctl -u petpulse-fastapi`. Before installing the units, verify that
`/usr/bin/java`, `/opt/petpulse/fastapi/.venv/bin/python`, the working
directories, and the `petpulse` user/group exist and are readable by that user.

The services intentionally have no hard dependency on each other. Spring can
start while FastAPI is down; only AI gateway calls fail until FastAPI is ready.
Starting FastAPI first remains the recommended operational order.

## Network boundary

- Security group/firewall: expose 80 and 443 only.
- Bind Spring to `127.0.0.1:8080` and FastAPI to `127.0.0.1:8000`.
- Do not expose PostgreSQL through this VM; connect outbound to managed
  PostgreSQL using its restricted network rules.
- Terminate HTTPS at Nginx and forward `Host`, `X-Real-IP`,
  `X-Forwarded-For`, and `X-Forwarded-Proto`.

The chatbot request flows through the authenticated Spring endpoint
`/api/ai/chat/stream`; Nginx never exposes a browser route to FastAPI. Its exact
location disables proxy buffering, cache, and gzip because it is a POST SSE
stream. Nginx and the upstream socket use five-minute idle timeouts, while
Spring MVC also limits the total async request to five minutes. These are not
browser retry policies. The frontend supports user cancellation through
`AbortController` but does not automatically reconnect.
