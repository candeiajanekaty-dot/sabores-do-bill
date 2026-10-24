// Recuperação explícita de envio incerto; nunca reimprime sozinha.
(()=>{
 const host=document.createElement('section');host.className='promotions-panel';host.style.marginTop='28px';
 host.innerHTML='<h2>Impressão automática</h2><p class="management-note">O programa Impressor Bill precisa estar aberto no computador Windows principal. A confirmação indica envio aceito pela fila do Windows; confira papel e conexão. Pedidos anteriores à primeira ativação continuam com impressão manual.</p><button id="print-refresh" class="secondary">Conferir pendências de impressão</button><p id="print-status" role="status"></p><div id="print-pending"></div>';
 $('section-configuracoes').append(host);
 async function refresh(){if(!BillDB.signedIn)return;try{const list=await BillDB.request('rpc/bill_impressao_pendencias',{method:'POST',body:{},admin:true});$('print-status').textContent=list.length?'Confira a impressora antes de decidir se precisa de uma nova via.':'Nenhuma pendência de envio registrada.';$('print-pending').innerHTML=list.map(j=>'<article class="catalog-card"><h3>Pedido #'+esc(j.numero)+'</h3><p>'+esc(j.estado==='reservado'?'Envio interrompido ou ainda em andamento':j.estado==='incerto'?'Envio não confirmado':'Enviado ao Windows; confirmação pendente')+'</p><p>'+esc(j.detalhe||'Confira se o papel saiu antes de autorizar outra tentativa.')+'</p><button class="secondary" data-resolve="saiu" data-order="'+esc(j.id)+'">O papel saiu — confirmar</button> <button class="secondary" data-resolve="reimprimir" data-order="'+esc(j.id)+'">Não saiu — autorizar nova tentativa</button></article>').join('');}catch{$('print-status').textContent='Impressão automática ainda não configurada no banco ou conexão indisponível.';}}
 $('print-refresh').onclick=refresh;
 host.onclick=async e=>{const b=e.target.closest('[data-resolve]');if(!b)return;const action=b.dataset.resolve;
 if(!window.confirm(action==='saiu'?'Conferiu que esta comanda saiu completa? O pedido será confirmado.':'Confira também a fila do Windows: se ela ainda contém esta comanda, uma nova tentativa pode duplicar o papel. Autorizar mesmo assim?'))return;
 b.disabled=true;try{await BillDB.request('rpc/bill_impressao_resolver',{method:'POST',body:{p_pedido:b.dataset.order,p_acao:action},admin:true});await refresh();await load();}catch(e){$('print-status').textContent=e.message;b.disabled=false;}
 };
})();
