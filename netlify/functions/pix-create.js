const L=require('../lib/pix.cjs');
exports.handler=async event=>L.handler(async()=>{
 if(event.httpMethod!=='POST')throw new L.AppError('Método não permitido.',405);
 const {live}=L.config();if(process.env.PIX_ENABLED!=='true'||!process.env.MP_WEBHOOK_SECRET)throw new L.AppError('Pix ainda não habilitado.',503);
 const token=await L.admin(event),b=L.body(event);if(!L.validUUID(b.pedido_id))throw new L.AppError('Pedido inválido.');
 const email=String(b.email||'').trim(),cpf=String(b.cpf||'').replace(/\D/g,'');if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||!L.cpfValid(cpf))throw new L.AppError('Informe e-mail e CPF válidos para o Pix.');
 const site=process.env.URL||'https://sabores-do-bill.netlify.app';if(!/^https:\/\/[^/]+$/.test(site))throw new L.AppError('URL do site inválida.',503);
 // Authorization is checked before the service role reserves the database-calculated amount.
 const reserved=await L.rpc('bill_pix_preparar',{p_pedido:b.pedido_id,p_pagador:{email,identification:{type:'CPF',number:cpf}}});const c=Array.isArray(reserved)?reserved[0]:reserved;if(!c)throw new L.AppError('Reserva do Pix não encontrada.',502);
 if(c.live_mode!==null&&c.live_mode!==live)throw new L.AppError('Crie um novo pedido para testar em outro ambiente.',409);
 const seller=await L.mp('/users/me');if(!live&&!process.env.MP_ACCESS_TOKEN.startsWith('TEST-')&&!seller.tags?.includes('test_user'))throw new L.AppError('Use credenciais de teste ou uma conta de vendedor de teste; produção não está habilitada.',503);
 let p;if(c.pagamento_id){p=await L.mp('/v1/payments/'+encodeURIComponent(c.pagamento_id));}else{
 p=await L.mp('/v1/payments',{method:'POST',headers:{'X-Idempotency-Key':c.chave},body:JSON.stringify({transaction_amount:Number(c.valor),description:'Sabores do Bill — pedido '+b.pedido_id,payment_method_id:'pix',payer:c.pagador,external_reference:c.pedido_id,metadata:{bill_cobranca_id:c.id},notification_url:site+'/.netlify/functions/mp-webhook'})});}
 return await L.syncPayment(p,c,seller,live);
},event);
