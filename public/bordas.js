// Bordas pertencem ao pastel escolhido; não participam dos descontos dos produtos.
let billBordersReady=false;
const billBorderFlavors=['Chocolate','Cheddar','Chocolate branco','Dois amores'];
const billCalculateWithoutBorders=calculate;
calculate=function(items,promos){
 const r=billCalculateWithoutBorders(items,promos);
 const extra=items.reduce((sum,i)=>sum+(billBorderFlavors.includes(i.borda)&&['kids','tradicional'].includes(i.cat)?(i.cat==='kids'?200:400)*i.qty:0),0);
 return {...r,subtotal:r.subtotal+extra,total:r.total+extra};
};
BillDB.request('rpc/bill_bordas_versao',{method:'POST',body:{}}).then(v=>{billBordersReady=v===1;}).catch(()=>{});
function openBorder(id,key){
 const it=MENU[key].items.find(p=>p.id===id);if(!it)return;
 const cost=key==='kids'?200:400;
 showDialog(`<div class="eyebrow">DO SEU JEITO</div><h2>${esc(it.name)}</h2><p>${esc(labels[key])} · ${money(Math.round(it.price*100))}</p><form id="border-form"><fieldset class="border-options"><legend>Quer borda recheada?</legend><label><input type="radio" name="border" value="" checked> Sem borda <span>Sem acréscimo</span></label>${billBorderFlavors.map(f=>`<label><input type="radio" name="border" value="${esc(f)}" ${billBordersReady?'':'disabled'}> ${esc(f)} <span>+ ${money(cost)}</span></label>`).join('')}</fieldset>${billBordersReady?'':'<p>As bordas ainda não estão habilitadas. A equipe precisa aplicar a atualização do cardápio.</p>'}<label class="border-count">Quantidade <input id="border-qty" type="number" min="1" max="99" step="1" value="1" required inputmode="numeric"></label><button class="primary full" type="submit">Adicionar ao pedido <span id="border-total">${money(Math.round(it.price*100))}</span></button></form>`);
 const form=$('border-form');const chosen=()=>form.querySelector('input[name=border]:checked').value;
 form.oninput=()=>{$('border-total').textContent=money((Math.round(it.price*100)+(chosen()?cost:0))*(Number($('border-qty').value)||1));};
 form.onsubmit=e=>{e.preventDefault();const borda=chosen(),qty=Number($('border-qty').value);if(!Number.isInteger(qty)||qty<1||qty>99)return;if(borda&&!billBordersReady)return;
 const old=cart.find(p=>p.id===id&&p.cat===key&&(p.borda||'')===borda);
 if(old){if(old.qty+qty>99){toast('Limite de 99 unidades por opção.');return;}old.qty+=qty;}
 else cart.push({id,cat:key,name:it.name,cents:Math.round(it.price*100),qty,...(borda?{borda,bordaCents:cost}:{})});
 $('dialog').close();renderCart();toast('Pastel adicionado ao pedido');};
}
renderCart();renderProductQuantities();
