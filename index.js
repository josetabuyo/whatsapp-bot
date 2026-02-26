require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { logMessage, markAnswered } = require('./db');

const AUTO_REPLY_MESSAGE = process.env.AUTO_REPLY_MESSAGE;
const ALLOWED_CONTACT = process.env.ALLOWED_CONTACT;

let botReadyTime = null;

if (!AUTO_REPLY_MESSAGE) {
  console.error('ERROR: AUTO_REPLY_MESSAGE no está definido en .env');
  process.exit(1);
}

if (!ALLOWED_CONTACT) {
  console.error('ERROR: ALLOWED_CONTACT no está definido en .env');
  process.exit(1);
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('\nEscanea este QR con WhatsApp (Dispositivos vinculados → Vincular dispositivo):\n');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('Autenticado. Sesión guardada en .wwebjs_auth/');
});

client.on('ready', () => {
  botReadyTime = Date.now();
  console.log(`Bot listo. Escuchando mensajes...`);
});

client.on('auth_failure', (msg) => {
  console.error('Error de autenticación:', msg);
  process.exit(1);
});

client.on('disconnected', (reason) => {
  console.warn('Cliente desconectado:', reason);
});

client.on('message', async (msg) => {
  // Ignorar mensajes propios y de grupos
  if (msg.fromMe || msg.from.endsWith('@g.us')) return;

  // Ignorar mensajes anteriores al inicio del bot
  if (botReadyTime && msg.timestamp * 1000 < botReadyTime) return;

  const phone = msg.from.replace('@c.us', '');
  let name = null;

  try {
    const contact = await msg.getContact();
    name = contact.pushname || contact.name || null;
  } catch {
    // Si no se puede obtener el contacto, continuamos sin nombre
  }

  // Solo responder al contacto permitido
  if (name !== ALLOWED_CONTACT) return;

  const msgId = logMessage(phone, name, msg.body);
  console.log(`[${new Date().toISOString()}] Mensaje de ${name || phone}: "${msg.body}"`);

  try {
    await msg.reply(AUTO_REPLY_MESSAGE);
    markAnswered(msgId);
    console.log(`  → Respuesta automática enviada (id: ${msgId})`);
  } catch (err) {
    console.error(`  → Error al responder:`, err.message);
  }
});

client.initialize();
