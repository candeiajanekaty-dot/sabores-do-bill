(()=>{
 const obs=new MutationObserver(()=>{
  const receipt=$('detail-body').querySelector('.bill-receipt'),box=$('detail-body').querySelector('.no-print');if(!receipt||!box||box.querySelector('[data-pix-manual]'))return;
  const number=receipt.querySelector('.eyebrow')?.textContent.replace('PEDIDO #','').trim(),o=orders.find(x=>String(x.numero)===number);
  if(!o?.pix_manual||o.pagamento_status==='pago')return;
  const b=document.createElement('button');b.className='secondary full';b.dataset.pixManual=o.id;b.textContent='Conferir crédito do Pix na conta';box.append(b);
  b.onclick=async()=>{const value=window.prompt('Abra a conta da loja e confira o crédito. Informe o valor recebido deste pedido, sem R$. Não confirme apenas pelo comprovante.');if(value===null)return;const n=Number(value.trim().replace(',','.'));if(!Number.isFinite(n)||Math.round(n*100)!==Math.round(Number(o.total)*100)){window.alert('O valor informado deve corresponder ao total do pedido.');return;}if(!window.confirm('Você verificou que o Pix de '+fmt(n)+' entrou na conta da loja? Isso liberará o pedido para a impressão automática.'))return;
   b.disabled=true;try{await BillDB.request('rpc/bill_pix_manual_confirmar',{method:'POST',body:{p_pedido:o.id,p_valor:n},admin:true});$('detail-dialog').close();await load();}catch(e){$('panel-error').textContent=e.message;b.disabled=false;}
  };
 });obs.observe($('detail-body'),{childList:true,subtree:true});
})();
