/**
 * Módulo compartido de conexión QR.
 * Usado por admin (index.html) y cliente (connect.html).
 */

/**
 * Llama a /api/connect/:number y empieza a hacer polling del QR.
 * @param {object} opts
 * @param {string}   opts.number     - Número a conectar
 * @param {string}   opts.password   - X-Password header
 * @param {function} opts.onQR       - (dataUrl) → se llama cada vez que hay QR nuevo
 * @param {function} opts.onReady    - () → se llama cuando el teléfono queda conectado
 * @param {function} opts.onError    - (msg) → se llama ante error
 * @returns {function} stopPolling   - llámala para cancelar el polling
 */
async function connectAndPoll({ number, password, onQR, onReady, onError }) {
  let interval = null;

  const stop = () => { if (interval) { clearInterval(interval); interval = null; } };

  let res;
  try {
    res = await fetch(`/api/connect/${number}`, {
      method: 'POST',
      headers: { 'X-Password': password },
    }).then(r => r.json());
  } catch (e) {
    onError('Error de red. Verificá la conexión.');
    return stop;
  }

  if (res.error) { onError(res.error); return stop; }

  const sessionId = res.sessionId;

  interval = setInterval(async () => {
    try {
      const data = await fetch(`/api/qr/${sessionId}`, {
        headers: { 'X-Password': password },
      }).then(r => r.json());

      if (data.status === 'ready') {
        stop();
        onReady();
        return;
      }
      if (data.status === 'failed' || data.status === 'disconnected') {
        stop();
        onError('Error al conectar. Intentá de nuevo.');
        return;
      }
      if (data.qr) {
        onQR(data.qr);
      }
    } catch {}
  }, 3000);

  return stop;
}
