# Visión del Proyecto — Bot Farm

## El nombre

**Bot Farm** — Una granja de bots al servicio de empresas y personas.

El nombre del repositorio actual (`whatsapp_bot`) es provisional. La visión es más grande: una plataforma que gestiona múltiples bots, para múltiples empresas, sobre múltiples canales de comunicación.

---

## La misión

> Llevar tecnología de punta a personas que solo tienen un celular.

Hay gente que no sabe lo que es un bot, no quiere saber, y no tiene por qué saber. Solo tiene un teléfono. Queremos que esa gente, y las empresas que les hablan, se beneficien de automatización, organización y comunicación inteligente — sin que nadie tenga que entender cómo funciona por adentro.

---

## El modelo

### Para empresas
- Cada empresa tiene sus propios bots, sus propios contactos, su propia lógica
- La empresa configura qué contactos puede atender cada bot
- Los mensajes se registran, se organizan, se pueden responder desde un panel

### Para personas (contactos)
- No instalan nada. No se registran en nada
- Solo usan WhatsApp o Telegram como siempre
- El bot responde, los atiende, los conecta

### Modelo de negocio
- **Gratis** para amigos y proyectos propios (GM Olivia, empresa del hermano, etc.)
- **Pago** para empresas externas que quieran el servicio
- El valor está en la gestión, la confiabilidad y el soporte — no en el código en sí

---

## Las entidades clave

```
Empresa (Company)
  ├── Nombre, logo, plan
  ├── Contactos[]  ← la entidad más importante
  │     ├── Nombre
  │     └── Canales: WhatsApp, Telegram, email (futuro)
  └── Bots[]
        ├── Canal: WhatsApp | Telegram | (otros)
        ├── Mensaje de respuesta automática
        └── Contactos permitidos (subset de los contactos de la empresa)
```

**El contacto es el centro.** No el bot, no el número. Una persona real, con nombre, que puede comunicarse por uno o varios canales.

---

## La granja de bots

Hoy: un `index.js` que crea clientes de WhatsApp en base a `phones.json`.

Mañana: una plataforma que:
- Gestiona N bots por empresa
- Soporta WhatsApp y Telegram (y en el futuro, más canales)
- Tiene un panel de administración web
- Permite responder mensajes desde el panel
- Tiene alertas cuando un contacto no fue atendido
- Puede escalar sin tocar código

---

## Lo que ya tenemos

| Cosa | Estado |
|------|--------|
| Bot WA multi-teléfono | ✅ funcionando |
| Bot Telegram | ✅ funcionando |
| DB SQLite con mensajes | ✅ funcionando |
| API REST básica | ✅ funcionando |
| Panel admin web | ✅ funcionando (básico) |
| Watchdog de reconexión | ⚠️ en revisión |
| Lista de contactos por empresa | 🔜 planeado |
| Conversaciones unificadas | 🔜 planeado |
| Respuesta desde el panel | 🔜 planeado |
| Alertas de no atención | 🔜 planeado |

---

## Clientes actuales (fase gratuita)

- **GM Olivia** — bot de guardia, atiende consultas fuera de horario
- **Empresa del hermano** — TBD

---

## Hoja de ruta macro

### Ahora — Estabilizar la base
- Resolver watchdog (`ESTADO_WATCHDOG.md`)
- Implementar lista de contactos real en DB (`PLAN_LISTA_CLIENTES.md`)

### Próximo — Experiencia completa
- Conversaciones unificadas (un hilo por contacto, sin importar el canal)
- Respuesta manual desde el panel admin
- Alertas: si no se respondió en X minutos → notificar

### Después — Producto
- Multi-empresa con login propio
- Planes y billing
- Onboarding de nuevas empresas sin tocar código
- Más canales (Instagram DM, email)

---

## Qué NO es esto

- No es un CRM completo (aunque puede parecerse en el futuro)
- No es un servicio de spam o marketing masivo
- No es un chatbot con IA (puede integrarse, pero no es el foco)
- No es para reemplazar atención humana — es para organizarla y complementarla

---

*Documento vivo. Se actualiza conforme evoluciona la visión.*
