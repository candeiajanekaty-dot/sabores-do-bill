const {rpc,reply,validUUID}=require('../lib/pix.cjs');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return reply(405,{error:'Use POST.'});
 if(process.env.WHATSAPP_AUTOMATION_ENABLED!=='true')return reply(503,{error:'O atendimento está em configuração. Tente novamente mais tarde.'});
 if(typeof event.body!=='string'||event.body.length>24000)return reply(413,{error:'Pedido muito grande.'});
 let b;try{b=JSON.parse(event.isBase64Encoded?Buffer.from(event.body,'base64').toString():event.body);}catch{return reply(400,{error:'Dados inválidos.'});}
 const link=String(b.link||'');
 const short=/^[A-Za-z0-9_-]{22}$/.test(link);
 const parts=link.split('.');
 if((!short&&(parts.length!==2||!parts.every(validUUID)))||!['consultar','cotar','confirmar','editar'].includes(b.acao))return reply(400,{error:'Abra o link pessoal enviado pelo WhatsApp da loja.'});
 try{return reply(200,await rpc(short?'bill_online_curto':'bill_online_operar',{...(short?{p_codigo:link}:{p_id:parts[0],p_segredo:parts[1]}),p_acao:b.acao,p_dados:b.dados||null,p_versao:Number.isInteger(b.versao)?b.versao:null}));}
 catch{return reply(400,{error:'Não foi possível concluir. Confira os dados, disponibilidade dos produtos e o valor para troco. Se o link expirou, envie CARDÁPIO no WhatsApp da loja. Nenhum pedido será duplicado ao tentar novamente.'});}
};
