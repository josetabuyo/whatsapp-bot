const express = require('express');
const fs = require('fs');
const QRCode = require('qrcode');

module.exports = function createApi({ clients, liveConfig, reloadLiveConfig, createPhoneClient, CONFIG_PATH }) {
  const router = express.Router();

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
  const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD || 'conectar';

  // --- Auth helpers ---
  function isAdmin(req) { return req.headers['x-password'] === ADMIN_PASSWORD; }
  function isClient(req) { return req.headers['x-password'] === CLIENT_PASSWORD || isAdmin(req); }

  function requireAdmin(req, res, next) {
    if (isAdmin(req)) return next();
    res.status(401).json({ error: 'No autorizado' });
  }

  function requireClient(req, res, next) {
    if (isClient(req)) return next();
    res.status(401).json({ error: 'No autorizado' });
  }

  // --- POST /api/auth ---
  router.post('/auth', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) return res.json({ ok: true, role: 'admin' });
    if (password === CLIENT_PASSWORD) return res.json({ ok: true, role: 'client' });
    res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
  });

  // --- Config helpers ---
  function readConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }

  function saveConfig(config) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    reloadLiveConfig(config);
  }

  // --- GET /api/bots --- (admin) — bots con sus teléfonos agrupados
  router.get('/bots', requireAdmin, (req, res) => {
    const config = readConfig();
    const result = config.bots.map(bot => ({
      id: bot.id,
      name: bot.name,
      autoReplyMessage: bot.autoReplyMessage,
      phones: bot.phones.map(phone => {
        const sessionId = `${bot.id}-${phone.number}`;
        return {
          number: phone.number,
          allowedContacts: phone.allowedContacts || [],
          autoReplyMessage: phone.autoReplyMessage || null,
          sessionId,
          status: clients[sessionId]?.status || 'stopped',
        };
      }),
    }));
    res.json(result);
  });

  // --- PUT /api/bots/:botId --- (admin)
  router.put('/bots/:botId', requireAdmin, (req, res) => {
    const { botId } = req.params;
    const { name, autoReplyMessage } = req.body;
    const config = readConfig();
    const bot = config.bots.find(b => b.id === botId);
    if (!bot) return res.status(404).json({ error: 'Bot no encontrado' });
    if (name) bot.name = name;
    if (autoReplyMessage) bot.autoReplyMessage = autoReplyMessage;
    saveConfig(config);
    res.json({ ok: true });
  });

  // --- DELETE /api/bots/:botId --- (admin)
  router.delete('/bots/:botId', requireAdmin, (req, res) => {
    const { botId } = req.params;
    const config = readConfig();
    const bot = config.bots.find(b => b.id === botId);
    if (!bot) return res.status(404).json({ error: 'Bot no encontrado' });
    for (const phone of bot.phones) {
      const sessionId = `${botId}-${phone.number}`;
      if (clients[sessionId]) {
        try { clients[sessionId].client.destroy(); } catch {}
        delete clients[sessionId];
      }
    }
    config.bots = config.bots.filter(b => b.id !== botId);
    saveConfig(config);
    res.json({ ok: true });
  });

  // --- GET /api/phones --- (admin)
  router.get('/phones', requireAdmin, (req, res) => {
    const config = readConfig();
    const result = [];
    for (const bot of config.bots) {
      for (const phone of bot.phones) {
        const sessionId = `${bot.id}-${phone.number}`;
        result.push({
          botId: bot.id,
          botName: bot.name,
          number: phone.number,
          allowedContacts: phone.allowedContacts || [],
          autoReplyMessage: phone.autoReplyMessage || bot.autoReplyMessage,
          sessionId,
          status: clients[sessionId]?.status || 'stopped',
        });
      }
    }
    res.json(result);
  });

  // --- POST /api/phones --- (admin)
  router.post('/phones', requireAdmin, (req, res) => {
    const { botId, botName, number, allowedContacts, autoReplyMessage } = req.body;
    if (!botId || !number) return res.status(400).json({ error: 'botId y number son requeridos' });

    const config = readConfig();
    let bot = config.bots.find(b => b.id === botId);

    if (!bot) {
      if (!botName || !autoReplyMessage) {
        return res.status(400).json({ error: 'Bot nuevo requiere botName y autoReplyMessage' });
      }
      bot = { id: botId, name: botName, autoReplyMessage, phones: [] };
      config.bots.push(bot);
    }

    if (bot.phones.find(p => p.number === number)) {
      return res.status(409).json({ error: 'El número ya existe en este bot' });
    }

    const phoneEntry = { number, allowedContacts: allowedContacts || [] };
    if (autoReplyMessage) phoneEntry.autoReplyMessage = autoReplyMessage;
    bot.phones.push(phoneEntry);

    saveConfig(config);
    res.status(201).json({ ok: true, sessionId: `${botId}-${number}` });
  });

  // --- PUT /api/phones/:number --- (admin)
  router.put('/phones/:number', requireAdmin, (req, res) => {
    const { number } = req.params;
    const { allowedContacts, autoReplyMessage } = req.body;
    const config = readConfig();

    let found = false;
    for (const bot of config.bots) {
      const phone = bot.phones.find(p => p.number === number);
      if (phone) {
        if (allowedContacts !== undefined) phone.allowedContacts = allowedContacts;
        if (autoReplyMessage !== undefined) {
          if (autoReplyMessage) phone.autoReplyMessage = autoReplyMessage;
          else delete phone.autoReplyMessage;
        }
        found = true;
        break;
      }
    }

    if (!found) return res.status(404).json({ error: 'Número no encontrado' });
    saveConfig(config);
    res.json({ ok: true });
  });

  // --- DELETE /api/phones/:number --- (admin)
  router.delete('/phones/:number', requireAdmin, (req, res) => {
    const { number } = req.params;
    const config = readConfig();

    let found = false;
    for (const bot of config.bots) {
      const idx = bot.phones.findIndex(p => p.number === number);
      if (idx !== -1) {
        const sessionId = `${bot.id}-${number}`;
        if (clients[sessionId]) {
          try { clients[sessionId].client.destroy(); } catch {}
          delete clients[sessionId];
        }
        bot.phones.splice(idx, 1);
        found = true;
        break;
      }
    }

    if (!found) return res.status(404).json({ error: 'Número no encontrado' });
    config.bots = config.bots.filter(b => b.phones.length > 0);
    saveConfig(config);
    res.json({ ok: true });
  });

  // --- POST /api/connect/:number --- (client)
  router.post('/connect/:number', requireClient, (req, res) => {
    const { number } = req.params;
    const config = readConfig();

    let found = null;
    for (const bot of config.bots) {
      const phone = bot.phones.find(p => p.number === number);
      if (phone) {
        found = { botId: bot.id, number, sessionId: `${bot.id}-${number}` };
        break;
      }
    }

    if (!found) return res.status(404).json({ error: 'Número no encontrado. Contactá al administrador.' });

    const { sessionId } = found;
    const existing = clients[sessionId];
    if (existing && ['connecting', 'qr_ready', 'ready'].includes(existing.status)) {
      return res.json({ ok: true, status: existing.status, sessionId });
    }

    createPhoneClient(found);
    res.json({ ok: true, status: 'connecting', sessionId });
  });

  // --- GET /api/qr/:sessionId --- (client)
  router.get('/qr/:sessionId', requireClient, async (req, res) => {
    const { sessionId } = req.params;
    const state = clients[sessionId];

    if (!state) return res.status(404).json({ error: 'Sesión no iniciada' });
    if (state.status === 'ready') return res.json({ status: 'ready' });
    if (!state.qr) return res.status(202).json({ status: state.status });

    try {
      const dataUrl = await QRCode.toDataURL(state.qr, { margin: 2 });
      res.json({ qr: dataUrl, status: state.status });
    } catch (err) {
      res.status(500).json({ error: 'Error generando QR' });
    }
  });

  // --- GET /api/messages --- (admin)
  router.get('/messages', requireAdmin, (req, res) => {
    const { db } = require('./db');
    const rows = db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 100').all();
    res.json(rows);
  });

  return router;
};
