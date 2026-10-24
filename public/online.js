// Finalização pública por link pessoal recebido no WhatsApp.
(()=>{
 if(pdvMode)return;
 const params=new URLSearchParams(location.search);
 let link=params.get('p')||params.get('atendimento');
 if(link){try{sessionStorage.setItem('bill-online-link',link);history.replaceState(null,'',location.pathname+location.hash);}catch{}}
 else try{link=sessionStorage.getItem('bill-online-link');}catch{}
 let last=null,poll=null,inFlight=false;
 const banner=document.querySelector('.demo');
 const announce=opened=>{banner.textContent=opened?'LOJA ABERTA • Monte seu pedido e confira os valores antes de enviar.':'LOJA FECHADA • Aceitamos pedidos antecipados. Horário de atendimento a confirmar pela equipe.';};
 async function call(acao,extra={}){const r=await fetch('/.netlify/functions/online-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({link,acao,...extra})});const b=await r.json();if(!r.ok)throw Error(b.error||'Não foi possível enviar.');return b;}
 async function store(){try{const rows=await BillDB.request('bill_loja?select=aberta,horarios&id=eq.true');announce(rows[0]?.aberta===true);const h=document.querySelector('.business-hours');if(h&&rows[0]?.horarios)h.innerHTML='<b>Horário habitual</b><br>'+esc(BillHours.text(rows[0].horarios))+'<br><small>Pode haver alterações. Confira o aviso de loja aberta ou fechada.</small>';}catch{banner.textContent='Consulte a disponibilidade da loja pelo WhatsApp.';}}
 store();setInterval(()=>{if(document.visibilityState==='visible')store();},30000);
 document.querySelector('.basket-note').textContent='Seu pedido será enviado após sua confirmação.';
 function success(r){clearInterval(poll);cart=[];notes='';save();renderCart();showDialog(`<h2>Pedido #${esc(r.numero)} recebido!</h2><p class="success-order">Total: <b>${money(Math.round(Number(r.total)*100))}</b></p><p>${r.antecipado?'Este é um pedido antecipado. Aguarde a equipe confirmar quando poderá atender.':'Aguarde a confirmação da equipe pelo WhatsApp.'}</p><p>O pagamento permanece pendente. O pedido ainda não foi encaminhado à cozinha.</p>`);}
 function quotation(r){
  last=r;clearInterval(poll);const q=r.cotacao;
  showDialog(`<h2>Confira seu pedido</h2><p>${esc(r.dados?.nome||'')} · ${r.dados?.tipo_entrega==='entrega'?'Entrega':'Retirada'}${r.dados?.endereco?'<br>'+esc(r.dados.endereco):''}</p><ul class="review-list">${q.itens.map(i=>`<li>${i.quantidade}× ${esc(i.nome)} — ${money(Math.round(Number(i.subtotal)*100))}${i.observacoes?'<br>'+esc(i.observacoes):''}</li>`).join('')}</ul><p>Subtotal: ${money(Math.round(Number(q.subtotal)*100))}<br>Desconto: ${money(Math.round(Number(q.desconto)*100))}<br>Entrega: ${money(Math.round((Number(q.total)-Number(q.subtotal)+Number(q.desconto))*100))}</p><div class="total-line total"><span>Total</span><b>${money(Math.round(Number(q.total)*100))}</b></div><p>Se a loja estiver fechada ao enviar, seu pedido será antecipado, sem promessa de horário. Aguarde a equipe confirmar.</p><button class="primary full" id="online-confirm">Confirmar e enviar pedido</button><button class="secondary" id="online-back">Voltar e editar</button><p id="online-result" role="status"></p>`);
  $('online-back').onclick=edit;
  $('online-confirm').onclick=async()=>{const b=$('online-confirm');b.disabled=true;try{const x=await call('confirmar',{versao:last.versao});if(x.revisar){quotation(x);$('online-result').textContent='Os preços mudaram. Confira o novo total e confirme novamente.';}else success(x);}catch(e){$('online-result').textContent=e.message;b.disabled=false;}};
 }
 async function wait(){if(inFlight)return;inFlight=true;try{const r=await call('consultar');announce(r.aberta);if(r.pedido){success(r.pedido);return;}if(r.estado==='cotado'){quotation(r);return;}$('online-result').textContent='Aguardando a equipe informar a taxa. Você também pode fechar esta janela e voltar pelo mesmo link.';}catch(e){if($('online-result'))$('online-result').textContent=e.message;}finally{inFlight=false;}}
 review=async function(){
  clearInterval(poll);if(!cart.length)return;
  if(!link){showDialog('<h2>Continue pelo WhatsApp</h2><p>Solicite o link pessoal do cardápio na conversa com a loja. Ele vincula o pedido ao seu WhatsApp para receber as confirmações.</p>');return;}
  if(!billLive||!billPromoReady){toast('Aguarde o cardápio conectar e tente novamente.');return;}
  let state;try{state=await call('consultar');announce(state.aberta);if(state.pedido){success(state.pedido);return;}if(state.estado==='cotado'&&state.cotacao){quotation(state);return;}if(state.estado==='aguardando_taxa'){waiting();return;}}catch(e){showDialog('<h2>Não foi possível continuar</h2><p>'+esc(e.message)+'</p>');return;}
  form(state);
 };
 async function edit(){try{await call('editar');clearInterval(poll);$('dialog').close();toast('Ajuste seu carrinho e clique em Continuar pedido.');}catch(e){$('online-result').textContent=e.message;}}
 function waiting(){showDialog('<h2>Consultando a entrega</h2><p>A equipe vai conferir seu endereço e informar a taxa. Seu pedido ainda não foi enviado à cozinha.</p><button class="secondary" id="online-check">Verificar taxa</button><button class="secondary" id="online-edit">Editar solicitação</button><p id="online-result" role="status">Aguardando atendimento…</p>');$('online-check').onclick=wait;$('online-edit').onclick=edit;poll=setInterval(()=>{if(document.visibilityState==='visible'&&$('dialog').open)wait();},15000);}
 function deliveryFields(){
  if(typeof BillEntregas==='undefined')return '';
  return '<label>CEP (opcional)<input id="online-cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000"></label><button type="button" class="secondary" id="online-cep-search">Buscar endereço pelo CEP</button><p id="online-cep-status" role="status"></p><label>Bairro de entrega em Pato Branco<select id="online-neighborhood" required><option value="">Selecione seu bairro</option>'+BillEntregas.bairros.map(b=>'<option value="'+esc(b.nome)+'">'+esc(b.nome)+' — '+money(b.taxa*100)+'</option>').join('')+'<option value="__outro">Outro bairro de Pato Branco — '+money(BillEntregas.outros*100)+'</option></select></label><label id="online-other-box" hidden>Qual é o bairro?<input id="online-other-neighborhood" maxlength="100" autocomplete="address-level3"></label><p id="online-delivery-fee" role="status">Escolha o bairro para conferir a taxa de entrega.</p>';
 }
 function form(state){
  const total=calculate(cart).total;
  showDialog(`<h2>${state.aberta?'Vamos finalizar?':'Pedido antecipado'}</h2><p>${state.aberta?'Confira seus dados.':'Estamos fechados. Sua solicitação aguardará a equipe confirmar quando poderá atender.'}</p><form id="online-form" class="checkout-fields"><label>Seu nome<input id="online-name" required minlength="2" maxlength="120" value="${esc(state.nome||'')}" autocomplete="name"></label><p class="checkout-warning">Confira como quer ser chamado. O nome do perfil do WhatsApp pode ser diferente.</p><label>WhatsApp do pedido<input readonly value="${esc(state.telefone||'Identificado pelo WhatsApp')}" aria-label="Telefone recebido pelo WhatsApp"></label>${mode==='entrega'?deliveryFields()+'<label>Rua / logradouro (confira ou preencha)<textarea id="online-address" required minlength="3" maxlength="250" autocomplete="address-line1">'+esc((state.endereco_salvo||'').split('\n')[0])+'</textarea></label><label>Número da casa<input id="online-number" required maxlength="20" placeholder="Ex.: 21 ou S/N" autocomplete="address-line2"></label><label>Complemento (opcional)<input id="online-complement" maxlength="80" placeholder="Apartamento, bloco, referência…"></label><label><input id="online-save-address" type="checkbox" '+(state.endereco_salvo?'checked':'')+'> Guardar este endereço para facilitar meus próximos pedidos.</label><label><input type="checkbox" required> Conferi o endereço e quero receber este pedido nele.</label><p>A entrega é em Pato Branco. A taxa depende do bairro escolhido; confira se ele corresponde ao endereço. Você confirma o total antes de enviar.</p>':'<p>Retirada no estabelecimento • sem taxa de entrega.</p>'}<label>Pagamento<select id="online-payment" required><option value="">Selecione</option><option value="credito_maquininha">Crédito na maquininha</option><option value="debito_maquininha">Débito na maquininha</option><option value="dinheiro">Dinheiro</option></select></label><label id="online-change-box" hidden>Troco para R$ (deixe vazio se não precisar)<input id="online-change" type="number" min="0.01" max="100000" step="0.01" inputmode="decimal"></label><label>Observações<textarea id="online-notes" maxlength="500">${esc(notes)}</textarea></label><p>Produtos: ${money(total)}. Pagamento na entrega ou retirada. Pix automático estará disponível após a conclusão dos testes.</p><label><input type="checkbox" required> Conferi os itens e adicionais e quero receber os avisos deste pedido pelo WhatsApp.</label><p><a href="privacidade.html" target="_blank" rel="noopener">Privacidade e uso dos dados</a></p><button class="primary full" id="online-next">Conferir total</button><p id="online-result" role="status"></p></form>`);
  if($('online-neighborhood'))$('online-neighborhood').onchange=()=>{
   const bairro=$('online-neighborhood').value,outro=bairro==='__outro';
   $('online-other-box').hidden=!outro;$('online-other-neighborhood').required=outro;
   const fee=outro?BillEntregas.outros:BillEntregas.bairros.find(b=>b.nome===bairro)?.taxa;
   $('online-delivery-fee').textContent=fee===undefined?'Escolha o bairro para conferir a taxa de entrega.':'Taxa de entrega: '+money(fee*100)+'. Total com os produtos: '+money(total+fee*100)+'.';
  };
  if(mode==='entrega'&&state.endereco_salvo&&typeof BillCEP!=='undefined'&&typeof BillEntregas!=='undefined'){
   const first=state.endereco_salvo.split('\n')[0].split(',').map(x=>x.trim()),number=first[1];
   if(number&&/^(?:[0-9][0-9A-Za-z /-]*|s\/?n)$/i.test(number)){
    $('online-address').value=first[0];$('online-number').value=number;
    $('online-complement').value=first.slice(2).filter(x=>!/^CEP:/i.test(x)).join(', ');
    const cep=state.endereco_salvo.match(/CEP:\s*([0-9-]+)/i);if(cep)$('online-cep').value=cep[1];
   }
   const match=state.endereco_salvo.match(/\nBairro: (.+?) - Pato Branco\/PR/);
   if(match){const found=BillCEP.bairro(match[1],BillEntregas.bairros);$('online-neighborhood').value=found?found.nome:'__outro';$('online-other-neighborhood').value=found?'':match[1];$('online-neighborhood').onchange();}
  }
  if(typeof BillCEP!=='undefined'&&typeof BillEntregas!=='undefined'&&$('online-cep'))BillCEP.ligar({get:$,lista:BillEntregas.bairros,mudouBairro:()=> $('online-neighborhood').onchange()});
  $('online-payment').onchange=()=>{$('online-change-box').hidden=$('online-payment').value!=='dinheiro';};
  $('online-form').onsubmit=async e=>{e.preventDefault();const b=$('online-next');b.disabled=true;try{
   const dados={nome:$('online-name').value.trim(),tipo_entrega:mode,...(mode==='entrega'&&$('online-neighborhood')?{bairro:$('online-neighborhood').value==='__outro'?$('online-other-neighborhood').value.trim():$('online-neighborhood').value,cidade:'Pato Branco'}:{}),endereco:mode==='entrega'&&$('online-number')?[$('online-address').value.trim(),$('online-number').value.trim(),$('online-complement')?.value.trim(),$('online-cep')?.value?'CEP: '+$('online-cep').value.trim():''].filter(Boolean).join(', '):($('online-address')?.value||''),pagamento:$('online-payment').value,troco_para:$('online-payment').value==='dinheiro'&&$('online-change').value!==''?Number($('online-change').value):null,observacoes:$('online-notes').value,salvar_endereco:mode==='entrega'&&!!$('online-save-address')?.checked,itens:cart.map(x=>({id:x.cat==='kit'?MENU.kit.productId:x.id,tipo:x.cat==='adicionais'?'adicional':'produto',quantidade:x.qty,...(x.borda?{borda:x.borda}:{}),...(x.cat==='kit'?{sabores:x.mix}:{})}))};
   notes=dados.observacoes;save();const r=await call('cotar',{dados});if(r.registrado){success(r);return;}if(r.estado==='aguardando_taxa')waiting();else quotation(r);
  }catch(e){if($('online-result'))$('online-result').textContent=e.message;b.disabled=false;}};
 }
 $('review').onclick=()=>review();$('review').innerHTML='Continuar pedido <span>→</span>';
 $('dialog').addEventListener('close',()=>clearInterval(poll));
})();
