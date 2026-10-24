// Caixa de entrada administrativa. Não cria pedidos nem envia respostas.
(()=>{
  let busy = false, generation = 0;
  const clear = () => {generation++; $('whatsapp-list').innerHTML=''; $('whatsapp-status').textContent='';};
  async function refresh(){
    if(busy || !BillDB.signedIn || $('panel').hidden || $('section-whatsapp').hidden) return;
    const current = generation;
    busy=true;
    $('whatsapp-status').textContent='Buscando mensagens…';
    try {
      const rows=await BillDB.request('rpc/bill_whatsapp_caixa',{method:'POST',body:{},admin:true});
      if(current!==generation || !BillDB.signedIn || $('panel').hidden) return;
      $('whatsapp-list').innerHTML=rows.length ? rows.map(m=>`<article class="whatsapp-message"><div class="order-top"><b>${esc(m.nome||'Cliente')}</b><time>${esc(new Date(m.enviado_em).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}))}</time></div><small>${esc(m.telefone)}</small><p>${esc(m.texto||'Mensagem de tipo '+m.tipo+' — conteúdo não exibido nesta etapa.')}</p></article>`).join('') : '<p>Nenhuma conversa automática para mostrar. Conversas encaminhadas à equipe pelo comando 2 ficam no WhatsApp Business.</p>';
      $('whatsapp-status').textContent='Últimas '+rows.length+' mensagens · Atualizado às '+new Date().toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo'})+'.';
    } catch {
      if(current===generation && BillDB.signedIn && !$('panel').hidden) $('whatsapp-status').textContent='Não foi possível carregar as mensagens. Confira a conexão e a execução do SQL Atendimento_Humano_Bill.sql.';
    } finally {busy=false;}
  }
  $('whatsapp-refresh').onclick=refresh;
  new MutationObserver(()=>{if($('panel').hidden) clear(); else refresh();}).observe($('panel'),{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(()=>{if(!$('section-whatsapp').hidden) refresh();}).observe($('section-whatsapp'),{attributes:true,attributeFilter:['hidden']});
  setInterval(()=>{if(document.visibilityState==='visible')refresh();},20000);
})();
