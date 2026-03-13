# Plan: Automatización de Browser con Puppeteer/Playwright

## Estado actual

`whatsapp-web.js` usa Puppeteer internamente para controlar Chrome y mantener la sesión de WhatsApp Web. Nosotros no tocamos Puppeteer directamente — lo hace la librería por nosotros. Eso nos da WhatsApp gratis, pero nos deja ciegos y sin control sobre el browser.

---

## Por qué tomar control directo

Hoy usamos el browser solo para conectar WhatsApp (escanear QR al setup). Pero el mismo browser que ya tenemos corriendo puede hacer mucho más:

- **Web scraping** como feature para los bots de los clientes
- **Automatizaciones web** programables: llenar formularios, consultar portales, extraer datos
- **Integración con flujos del bot**: el bot recibe un mensaje → dispara una acción en un sitio web → responde con el resultado

Esto convierte al bot en un agente con capacidad de actuar en la web, no solo de responder mensajes.

---

## La decisión de arquitectura pendiente

Antes de implementar, hay que resolver en qué stack vive el control del browser:

### Opción A — Seguir en Node.js
- Puppeteer es nativo en Node.js, la integración es directa
- Mantiene la coherencia con el código actual
- Limitación: el ecosistema de IA/agentes es Python-first; si en el futuro queremos LangChain, LangGraph, etc., Node.js queda relegado

### Opción B — Mover el control del browser a Python
- Usar **Playwright** (Python) en lugar de Puppeteer (Node.js) — misma capacidad, mejor ecosistema para IA
- El backend Python puede orquestar tanto las automatizaciones web como los agentes de IA
- Requiere migrar o reescribir la capa de WhatsApp Web (o mantener Node.js solo para eso, como adaptador)
- Es la opción que tiene más sentido si vamos a un backend Python (ver `ARQUITECTURA_EVOLUCION.md`)

**Decisión recomendada: Opción B**, en línea con la migración a Python.

---

## Casos de uso como features para clientes

| Feature | Descripción |
|---------|-------------|
| **Consulta de estado** | El bot consulta un portal web (ej: estado de un pedido, turno médico) y responde al cliente |
| **Scraping de precios** | El bot extrae precios o disponibilidad de un sitio y los informa |
| **Formulario automatizado** | El bot completa un formulario online en nombre del cliente |
| **Notificación por cambio** | Monitoreo de una página: si cambia algo, el bot avisa al cliente |

Estas features son activables por empresa, en línea con el modelo de features progresivos de la plataforma.

---

## Scope del worktree

Este documento es la base del worktree `feature/puppeteer-automation`. El trabajo en ese worktree incluye:

1. **Proof of concept**: controlar un browser desde Python con Playwright, independiente de whatsapp-web.js
2. **Definir la interfaz**: cómo el bot le pide una tarea al browser y recibe el resultado
3. **Primer feature real**: un caso de uso concreto elegido con el cliente (ej: consulta de estado)
4. **Integración con el flujo de mensajes**: trigger desde un mensaje → acción en browser → respuesta

---

## Dependencias

- Decisión de arquitectura tomada (`ARQUITECTURA_EVOLUCION.md`)
- Python backend mínimo corriendo (no hace falta que esté completo)
- Al menos una empresa con un caso de uso real para testear

---

*Documento vivo. Se actualiza cuando avanza la decisión de arquitectura.*
