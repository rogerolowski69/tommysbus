# Tommy's Bus — common tasks. Run `just` to list recipes.

set dotenv-load := false

compose := env("COMPOSE", "podman compose -f infra/compose.yaml --env-file .env")

# List recipes
default:
    @just --list

# Install dependencies and create .env (with a random secret key) if missing
setup:
    #!/usr/bin/env sh
    set -e
    if [ ! -f .env ]; then
      cp .env.example .env
      key=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
      sed -i "s/^DJANGO_SECRET_KEY=.*/DJANGO_SECRET_KEY=$key/" .env
    fi
    cd apps/api && uv sync
    cd ../web && pnpm install

# Start PostgreSQL (127.0.0.1:5442)
db:
    {{compose}} up -d db

# Stop PostgreSQL (data volume is kept)
db-down:
    {{compose}} stop db

# Apply database migrations
[working-directory: 'apps/api']
migrate:
    uv run python manage.py migrate

# Load fictional demo data; `just seed --reset` wipes first
[working-directory: 'apps/api']
seed *args:
    uv run python manage.py seed_demo {{args}}

# Create a Django admin login
[working-directory: 'apps/api']
superuser:
    uv run python manage.py createsuperuser

# Run Django on :8000
[working-directory: 'apps/api']
api:
    uv run python manage.py runserver 127.0.0.1:8000

# Run Next.js on :3000
[working-directory: 'apps/web']
web:
    pnpm dev

# Regenerate the OpenAPI schema and the typed frontend client
schema:
    cd apps/api && uv run python manage.py spectacular --file schema.yaml --validate
    cd apps/web && pnpm gen:api

# Backend tests (needs the db running)
[working-directory: 'apps/api']
test *args:
    uv run pytest {{args}}

# Lint + type-check backend and frontend
check:
    cd apps/api && uv run ruff check . && uv run ruff format --check . && uv run pyright
    cd apps/web && pnpm lint && pnpm typecheck

# Playwright booking-flow tests (needs db + api running and seeded)
[working-directory: 'apps/web']
e2e *args:
    pnpm test:e2e {{args}}

# Run the whole stack in containers (db + api + web)
up:
    {{compose}} --profile full up -d --build

# Stop the container stack (including any tunnel)
down:
    {{compose}} --profile full --profile tunnel down

# Publish the container stack on a temporary https://*.trycloudflare.com URL
tunnel:
    {{compose}} --profile full --profile tunnel up -d --build
    @just tunnel-url

# Print the current public tunnel URL
tunnel-url:
    #!/usr/bin/env sh
    for i in $(seq 1 30); do
      url=$({{compose}} logs tunnel 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1)
      [ -n "$url" ] && { echo "Public URL: $url"; exit 0; }
      sleep 2
    done
    echo "Tunnel URL not found yet; check: {{compose}} logs tunnel" >&2; exit 1

# Stop only the public tunnel (site stays running locally)
tunnel-down:
    {{compose}} --profile tunnel stop tunnel
