# Plan: Migración a Backend Python — ✅ COMPLETADO

## Estado

**Etapa 1 completa y mergeada a master** (2026-03-13).

El backend Python corre en producción. El frontend React también. Todo en master.

---

## Lo que se construyó

| Componente | Descripción |
|-----------|-------------|
| `backend/main.py` | FastAPI app + arranque de bots Telegram vía lifespan |
| `backend/db.py` | SQLite async con SQLAlchemy |
| `backend/config.py` | Lectura de `phones.json` |
| `backend/api/auth.py` | POST /api/auth con roles admin/client |
| `backend/api/bots.py` | CRUD de bots y teléfonos |
| `backend/api/phones.py` | CRUD de teléfonos |
| `backend/api/messages.py` | GET /api/messages |
| `backend/api/telegram_api.py` | Endpoints específicos de Telegram |
| `backend/api/whatsapp.py` | Endpoints para WhatsApp (adaptador Node.js) |
| `backend/bots/telegram_bot.py` | Reemplaza `telegram.js` completamente |
| `frontend/` | React + Vite: login, dashboard, connect QR |
| `frontend/tests/` | Tests de Playwright: login, proxy, dashboard |

---

## Cómo arrancar

```bash
# Backend (desde _/)
start_fastapi_monitor

# Frontend (desde _/)
start_frontend_monitor
```

Aliases definidos en `~/.zshrc`, apuntan a master (`_/`).

---

## Próxima etapa

Ver `ARQUITECTURA_EVOLUCION.md` — Etapa 2: Adaptador WA como microservicio.
