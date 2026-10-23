// Recebimento autenticado e saudação com link pessoal para o cardápio.
const crypto = require('node:crypto');
const {rpc, reply} = require('../lib/pix.cjs');
const MAX_BYTES = 1024 * 1024;
const equal = (a, b) => {
  const x = Buffer.from(a || ''), y = Buffer.from(b || '');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
exports.handler = async event => {
  const method = event.httpMethod;
  if (!['GET', 'POST'].includes(method)) return {...reply(405, {error:'Método não permitido.'}), headers:{...reply(405,{}).headers, Allow:'GET, POST'}};
  if (method === 'GET') {
    const q = event.queryStringParameters || {};
    if (!process.env.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN.length < 32) return reply(503, {error:'Verificação não configurada.'});
    if (q['hub.mode'] !== 'subscribe' || !equal(q['hub.verify_token'], process.env.WHATSAPP_VERIFY_TOKEN) || !/^\d{1,100}$/.test(q['hub.challenge'] || '')) return reply(403, {error:'Verificação recusada.'});
    return {statusCode:200, headers:{'Content-Type':'text/plain', 'Cache-Control':'no-store'}, body:q['hub.challenge']};
  }
  const secret = process.env.WHATSAPP_APP_SECRET, account = process.env.WHATSAPP_WABA_ID, phone = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!secret || !/^\d+$/.test(account || '') || !/^\d+$/.test(phone || '') || !process.env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, {error:'Recebimento não configurado.'});
  if (typeof event.body !== 'string' || event.body.length > MAX_BYTES * 2) return reply(413, {error:'Conteúdo muito grande.'});
  const raw = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
  if (raw.length > MAX_BYTES) return reply(413, {error:'Conteúdo muito grande.'});
  const h = Object.fromEntries(Object.entries(event.headers || {}).map(([k,v])=>[k.toLowerCase(),v]));
  const signature = h['x-hub-signature-256'];
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
  if (!/^sha256=[a-f0-9]{64}$/i.test(signature || '') || !equal(signature, expected)) return reply(401, {error:'Assinatura inválida.'});
  let payload;
  try { payload = JSON.parse(raw.toString('utf8')); } catch { return reply(400, {error:'JSON inválido.'}); }
  if (payload?.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) return reply(400, {error:'Evento inválido.'});
  const messages = [];
  for (const entry of payload.entry) {
    if (String(entry?.id) !== account) continue;
    for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
      const value = change?.value;
      if (change?.field !== 'messages' || value?.messaging_product !== 'whatsapp' || String(value?.metadata?.phone_number_id) !== phone) continue;
      for (const m of Array.isArray(value.messages) ? value.messages : []) {
        // Não armazenar mídia, payload bruto ou dados internos da Meta.
        if (typeof m?.id !== 'string' || !m.id.length || m.id.length > 512 || !/^\d{8,20}$/.test(m.from || '') || !/^\d{1,12}$/.test(m.timestamp || '')) return reply(400, {error:'Mensagem inválida.'});
        const time = Number(m.timestamp);
        if (time < 0 || time > 253402300799) return reply(400, {error:'Data inválida.'});
        const contact = (Array.isArray(value.contacts) ? value.contacts : []).find(c=>c.wa_id === m.from);
        const type = typeof m.type === 'string' ? m.type.slice(0,40) : 'desconhecido';
        const text = type === 'text' ? m.text?.body : type === 'button' ? m.button?.text : type === 'interactive' ? (m.interactive?.button_reply?.title || m.interactive?.list_reply?.title) : null;
        messages.push({message_id:m.id, telefone:m.from, nome:typeof contact?.profile?.name === 'string' ? contact.profile.name.slice(0,200) : '', tipo:type, texto:typeof text === 'string' ? text.slice(0,10000) : null, enviado_em:new Date(time * 1000).toISOString()});
      }
    }
  }
  if (!messages.length) return reply(200, {received:true}); // status de entrega e eventos de outra conta não criam mensagens
  if (messages.length > 100) return reply(413, {error:'Muitas mensagens no mesmo evento.'});
  try {
    // Só responder sucesso após confirmação da transação; a Meta pode repetir em caso de falha.
    await rpc('bill_whatsapp_receber', {p_conta:account, p_numero:phone, p_mensagens:messages});
    if(process.env.WHATSAPP_AUTOMATION_ENABLED==='true'){try{await require('../lib/whatsapp-send.cjs').flush(1);}catch{/* Fila persistida para execução agendada. */}}
    return reply(200, {received:true});
  } catch {
    return reply(503, {error:'Não foi possível guardar as mensagens. Tente novamente.'});
  }
};
