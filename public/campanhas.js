window.BillCampaign={items:[],available:false};
(()=>{
 const originalCalculate=calculate;
 calculate=function(items,promos){
  const r=originalCalculate(items,promos);let name='';
  for(const c of BillCampaign.items){
   if(!c.ativo||(c.inicio&&Date.parse(c.inicio)>Date.now())||(c.fim&&Date.parse(c.fim)<=Date.now()))continue;
   const vals=[];
   for(const i of items){const id=i.cat==='kit'?MENU.kit.productId:i.id;if(i.cat==='adicionais'||(c.produtos&&!c.produtos.includes(id)))continue;for(let n=0;n<i.qty;n++)vals.push(i.cents);}
   vals.sort((a,b)=>a-b);const sum=vals.reduce((a,b)=>a+b,0);if(sum<Math.round(Number(c.minimo)*100))continue;
   let d;
   if(c.tipo==='percentual')d=Math.round(sum*Number(c.valor)/100);
   else if(c.tipo==='fixo')d=Math.min(sum,Math.round(Number(c.valor)*100));
   else{const groups=Math.floor(vals.length/c.quantidade);d=Math.max(0,vals.slice(0,groups*c.quantidade).reduce((a,b)=>a+b,0)-groups*Math.round(Number(c.valor)*100));}
   if(d>r.discount){r.discount=d;r.k=0;r.f=0;name=c.nome;}
  }
  r.total=r.subtotal-r.discount;r.promoName=name;return r;
 };
 const originalRefresh=refreshPromotions;
 refreshPromotions=async function(){
  await originalRefresh();
  try{BillCampaign.items=await BillDB.request('rpc/bill_promocoes_ativas',{method:'POST',body:{}});BillCampaign.available=true;}catch{BillCampaign.items=[];BillCampaign.available=false;billPromoReady=false;}
  let box=$('campaign-offers');if(!box){box=document.createElement('div');box.id='campaign-offers';box.className='campaign-offers';$('promo-offers').after(box);}
  box.hidden=!BillCampaign.items.length;box.innerHTML=BillCampaign.items.map(c=>`<article><b>${esc(c.nome)}</b><p>${esc(c.descricao||'')}${c.minimo>0?' · Mínimo nos participantes: '+money(Math.round(Number(c.minimo)*100)):''}</p><small>${c.tipo==='percentual'?Number(c.valor)+'% de desconto':c.tipo==='fixo'?money(Math.round(Number(c.valor)*100))+' de desconto':c.quantidade+' unidades por '+money(Math.round(Number(c.valor)*100))}${c.produtos?' · Em produtos selecionados':' · Nos produtos do cardápio'} · Não acumulativa</small></article>`).join('');renderCart();
 };
 refreshPromotions();setInterval(()=>{if(document.visibilityState==='visible'&&billLive)refreshPromotions();},60000);
})();
