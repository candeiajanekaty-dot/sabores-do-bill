(()=>{
 const host=document.createElement('section');host.className='store-control';host.innerHTML='<div><strong id="store-label">Consultando loja…</strong><p>Edite os horários habituais na aba Configurações. O botão define o atendimento. Fechada: aceita antecipados, sem prometer horário.</p></div><button id="store-toggle" class="primary" disabled>Aguarde…</button><p id="store-error" role="status"></p>';$('panel').prepend(host);
 const fees=document.createElement('section');fees.innerHTML='<h3>Entregas aguardando taxa</h3><p>Confira o endereço e informe a taxa. O cliente precisará confirmar o total no cardápio.</p><div id="online-fees"></div><h3>Avisos do WhatsApp</h3><div id="online-outbox"></div>';$('section-whatsapp').append(fees);
 let opened=false,loading=false;
 async function refresh(){
  if(loading||!BillDB.signedIn||$('panel').hidden)return;loading=true;
  try{
   const rows=await BillDB.request('bill_loja?select=aberta&id=eq.true');opened=rows[0]?.aberta===true;
   $('store-label').textContent=opened?'LOJA ABERTA':'LOJA FECHADA • Aceitando antecipados';$('store-toggle').textContent=opened?'Fechar loja':'Abrir loja';$('store-toggle').disabled=false;
   const [pending,out]=await Promise.all([BillDB.request('bill_online?select=id,nome,dados,criado_em&estado=eq.aguardando_taxa&expira=gt.'+encodeURIComponent(new Date().toISOString())+'&order=criado_em.asc&limit=100',{admin:true}),BillDB.request('bill_whatsapp_saidas?select=id,telefone,estado,erro,criado_em&order=id.desc&limit=15',{admin:true})]);
   if(!BillDB.signedIn||$('panel').hidden)return;
   if(!$('online-fees').contains(document.activeElement))$('online-fees').innerHTML=pending.length?pending.map(s=>`<form data-fee="${s.id}" class="order-card"><h4>${esc(s.nome)}</h4><p>${esc(s.dados?.endereco)}</p><p>${(s.dados?.itens||[]).reduce((n,x)=>n+Number(x.quantidade),0)} item(ns) • ${esc(s.dados?.pagamento)}</p><label>Taxa de entrega (R$)<input type="number" name="taxa" required min="0" max="500" step="0.01" inputmode="decimal"></label><button class="secondary">Enviar taxa para confirmação</button><p role="status"></p></form>`).join(''):'<p>Nenhuma entrega aguardando taxa.</p>';
   const labels={pendente:'Aguardando envio',enviando:'Enviando',enviada:'Aceita pela Meta',falhou:'Falha',incerta:'Envio não confirmado',expirada:'Janela encerrada',cancelada:'Avisos desativados pelo cliente'};
   $('online-outbox').innerHTML=out.map(s=>`<p>${esc(s.telefone)} • ${esc(labels[s.estado]||s.estado)}${s.erro?' — '+esc(s.erro):''}</p>`).join('')||'<p>Nenhum aviso ainda.</p>';
   $('store-error').textContent='';
  }catch{$('store-error').textContent='Controle indisponível. Execute Atendimento_Online_Bill.sql e atualize a página.';}finally{loading=false;}
 }
 $('store-toggle').onclick=async()=>{const b=$('store-toggle');b.disabled=true;try{await BillDB.request('rpc/bill_loja_alterar',{method:'POST',body:{p_aberta:!opened},admin:true});await refresh();}catch(e){$('store-error').textContent=e.message;b.disabled=false;}};
 fees.onsubmit=async e=>{const f=e.target.closest('[data-fee]');if(!f)return;e.preventDefault();const b=f.querySelector('button');b.disabled=true;try{await BillDB.request('rpc/bill_online_taxa',{method:'POST',body:{p_id:f.dataset.fee,p_taxa:Number(f.elements.taxa.value)},admin:true});f.querySelector('[role=status]').textContent='Taxa informada. Aguardando confirmação do cliente.';f.reset();b.disabled=false;await refresh();}catch(e){f.querySelector('[role=status]').textContent=e.message;b.disabled=false;}};
 const previousCard=orderCard;orderCard=function(o){let html=previousCard(o);if(o.antecipado){const badge='<p class="advance-label">PEDIDO ANTECIPADO'+(o.liberado_em?' • Liberado pela equipe':' • Aguardando revisão')+'</p>';html=html.replace('<h3>',badge+'<h3>');if(!o.liberado_em&&o.status==='recebido')html=html.replace(/<button class="primary full"[^>]*>.*?<\/button>/,'<button class="primary full" data-release="'+o.id+'">Revisado — liberar comanda</button>');}return html;};
 const previousClick=$('orders').onclick;$('orders').onclick=async e=>{const b=e.target.closest('[data-release]');if(!b)return previousClick(e);b.disabled=true;try{await BillDB.request('rpc/bill_online_liberar',{method:'POST',body:{p_id:b.dataset.release},admin:true});await load();}catch(e){$('panel-error').textContent=e.message;b.disabled=false;}};
 new MutationObserver(()=>{if($('panel').hidden){$('online-fees').innerHTML='';$('online-outbox').innerHTML='';}else refresh();}).observe($('panel'),{attributes:true,attributeFilter:['hidden']});
 refresh();setInterval(()=>{if(document.visibilityState==='visible')refresh();},20000);
})();
