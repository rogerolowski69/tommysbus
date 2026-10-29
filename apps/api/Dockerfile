# Tommy's Bus API — Django + gunicorn
FROM docker.io/library/python:3.12-slim AS base
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /usr/local/bin/uv
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv PATH="/opt/venv/bin:$PATH"
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
# collectstatic needs settings to import; the key is build-only and discarded.
RUN DJANGO_SECRET_KEY=build-only-not-secret DATABASE_URL=sqlite:////tmp/x.db \
    python manage.py collectstatic --noinput --settings=config.settings.dev

RUN useradd --system --create-home --uid 10001 app && chown -R app /app
USER app
EXPOSE 8000
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--access-logfile", "-"]
