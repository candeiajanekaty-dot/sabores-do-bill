const {rpc}=require('./pix.cjs');
async function flush(limit=2){
 if(process.env.WHATSAPP_AUTOMATION_ENABLED!=='true'||!process.env.WHATSAPP_ACCESS_TOKEN)return;
 for(let i=0;i<limit;i++){
  const template=process.env.WHATSAPP_STATUS_TEMPLATE;
  const job=await rpc('bill_whatsapp_saida',{p_acao:'pegar',p_modelo:!!template});if(!job)return;
  let result;
  const outside=Date.now()-Date.parse(job.mensagem_em)>23*60*60*1000;
  const content=outside&&template&&Array.isArray(job.modelo)?{type:'template',template:{name:template,language:{code:'pt_BR'},components:[{type:'body',parameters:job.modelo.map(text=>({type:'text',text:String(text)}))}]}}:{type:'text',text:{preview_url:false,body:job.texto}};
  try{
   const response=await fetch(`https://graph.facebook.com/v26.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,{method:'POST',headers:{Authorization:'Bearer '+process.env.WHATSAPP_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to:job.telefone,...content}),signal:AbortSignal.timeout(6000)});
   const data=await response.json();
   result=response.ok&&data.messages?.[0]?.id?{p_acao:'enviada',p_message:data.messages[0].id}:{p_acao:response.status>=500?'incerta':'falhou',p_erro:'Meta: código '+String(data.error?.code||response.status)};
  }catch{result={p_acao:'incerta',p_erro:'Sem confirmação do envio. Confira a conversa antes de reenviar.'};}
  await rpc('bill_whatsapp_saida',{p_id:job.id,...result});
 }
}
module.exports={flush};
