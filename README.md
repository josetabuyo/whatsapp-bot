# WhatsApp Bot MVP

Bot de WhatsApp para negocios que responde automáticamente mensajes entrantes y registra cada conversación en SQLite, preparando la base para alertas por tiempo en Fase 2.

---

## Stack

| Componente | Tecnología | Razón |
|---|---|---|
| Integración WA | `whatsapp-web.js` | Gratuito, funciona con número regular vía QR. No requiere cuenta Business ni API oficial |
| Runtime | Node.js | Ecosistema nativo de whatsapp-web.js |
| Persistencia | SQLite (`better-sqlite3`) | Un archivo, sin servidor, consultable con SQL. Prepara Fase 2 |
| Configuración | `.env` | Mensaje y configs sin tocar código |
| Sesión WA | Archivo local (`.wwebjs_auth/`) | Evita re-escanear QR en cada reinicio |

**Por qué no la API oficial de WhatsApp Business:** Requiere aprobación de Meta, número dedicado, y tiene costo. Para un MVP con número propio, `whatsapp-web.js` es la opción práctica.

---

## Arquitectura

```
Usuario escribe al número
        │
        ▼
whatsapp-web.js (Puppeteer + WhatsApp Web)
        │
        ├─► db.js → SQLite (data/messages.db)
        │     logMessage(phone, name, body)  → answered=0
        │
        └─► msg.reply(AUTO_REPLY_MESSAGE)
              │
              ▼
        db.js → markAnswered(id)  → answered=1
```

### Schema SQLite

```sql
CREATE TABLE messages (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  phone     TEXT NOT NULL,       -- número remitente (sin @c.us)
  name      TEXT,                -- nombre del contacto (si disponible)
  body      TEXT NOT NULL,       -- contenido del mensaje
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  answered  INTEGER DEFAULT 0    -- 0=no respondido, 1=respondido (para Fase 2)
);
```

---

## Instalación y primer arranque

### Requisitos

- Node.js 18+
- Google Chrome o Chromium instalado (Puppeteer lo usa internamente)

### Pasos

```bash
# 1. Clonar / copiar el proyecto
cd whatsapp_bot

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu mensaje de respuesta
```

**.env:**
```
PHONE_NUMBER=5491112345678
AUTO_REPLY_MESSAGE=Hola! Recibimos tu mensaje. En breve te atendemos. Gracias por contactarnos!
```

```bash
# 4. Arrancar el bot
node index.js
```

### Vincular WhatsApp

1. Aparece un QR en la terminal
2. Abrir WhatsApp en el teléfono
3. **Dispositivos vinculados → Vincular dispositivo**
4. Escanear el QR
5. El bot imprime `Bot listo. Escuchando mensajes...`

En reinicios posteriores, la sesión se restaura automáticamente desde `.wwebjs_auth/` — no hay que volver a escanear.

---

## Arrancar el servidor

```bash
# Arranca el servidor y guarda el output en monitor/monitor.log
start_server_monitor
```

En otra terminal, para seguir el log en tiempo real:
```bash
check_monitor
```

> Estos son aliases definidos en `~/.zshrc`. `start_server_monitor` hace `npm start | tee monitor/monitor.log`.
> Se recomienda siempre usar `start_server_monitor` en lugar de `node index.js` directamente, así el log queda persistido para diagnóstico.

---

## Ver logs de mensajes

```bash
# Todos los mensajes
sqlite3 data/messages.db "SELECT * FROM messages;"

# Mensajes no respondidos (útil para Fase 2)
sqlite3 data/messages.db "SELECT * FROM messages WHERE answered = 0;"

# Últimos 10 mensajes
sqlite3 data/messages.db "SELECT * FROM messages ORDER BY id DESC LIMIT 10;"
```

---

## Roadmap

| Fase | Estado | Descripción |
|------|--------|-------------|
| Fase 1 — MVP | ✅ Completo | Respuesta automática + registro en SQLite |
| Fase 2 — Alertas | 🔜 Próximo | Si no se respondió en X min, notificar a contactos de guardia vía WhatsApp |
| Fase 3 — Producción | 📋 Futuro | API oficial de WhatsApp Business, multi-agente, panel web |

### Fase 2 (preview)

Agregar un `setInterval` en `index.js` que consulte:

```sql
SELECT * FROM messages
WHERE answered = 0
  AND timestamp < datetime('now', '-5 minutes');
```

Y envíe un mensaje de alerta a los números definidos en `.env` (ej. `ALERT_NUMBERS=5491187654321,5491198765432`).

---

## Advertencia

`whatsapp-web.js` es una librería no oficial que automatiza WhatsApp Web. Su uso puede violar los **Términos de Servicio de WhatsApp/Meta**. Para uso comercial a escala o producción crítica, considerar migrar a la [API oficial de WhatsApp Business](https://business.whatsapp.com/products/platform).

Para recibir y responder mensajes de clientes con un número propio (sin spam masivo), el riesgo de ban es bajo, pero existe.

---

## Estructura del proyecto

```
whatsapp_bot/
├── index.js          # Cliente WA y lógica principal
├── db.js             # SQLite: logMessage() y markAnswered()
├── .env              # Variables de entorno (NO commitear)
├── .env.example      # Template de configuración
├── .gitignore
├── package.json
├── data/
│   └── messages.db   # Base de datos (auto-creada, en .gitignore)
└── .wwebjs_auth/     # Sesión de WhatsApp (auto-creada, en .gitignore)
```
