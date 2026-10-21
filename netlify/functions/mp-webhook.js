const L=require('../lib/pix.cjs');
exports.handler=async event=>L.handler(async()=>{
 if(event.httpMethod!=='POST')throw new L.AppError('Método não permitido.',405);const {live}=L.config();if(!L.verifySignature(event,process.env.MP_WEBHOOK_SECRET))throw new L.AppError('Assinatura inválida.',401);
 const b=L.body(event),id=event.queryStringParameters['data.id'];if(b.type!=='payment'||String(b.data?.id)!==id)throw new L.AppError('Notificação incompatível.',400);
 const [p,seller]=await Promise.all([L.mp('/v1/payments/'+encodeURIComponent(id)),L.mp('/users/me')]);const cid=p.metadata?.bill_cobranca_id;if(!L.validUUID(cid))return {ignored:true};
 const rows=await L.json(L.SB+'/rest/v1/bill_pix_cobrancas?select=*&id=eq.'+cid,{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY}});if(!rows[0])return {ignored:true};await L.syncPayment(p,rows[0],seller,live);return {received:true};
},event);
