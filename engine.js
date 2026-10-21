let BILL_PROMOTIONS={kids:{ativo:false,preco:29.9},familia:{ativo:false,preco:44.9}};
function setPromotions(value){BILL_PROMOTIONS=value||{kids:{ativo:false,preco:29.9},familia:{ativo:false,preco:44.9}};}
function calculate(cart, promos=BILL_PROMOTIONS){
 const kids=[],trad=[];let subtotal=0;
 for(const x of cart){subtotal+=x.cents*x.qty;if(['kids','tradicional'].includes(x.cat))for(let n=0;n<x.qty;n++)(x.cat==='kids'?kids:trad).push(x.cents);}
 kids.sort((a,b)=>a-b);trad.sort((a,b)=>a-b);
 const sum=(a,n)=>a.slice(0,n).reduce((s,x)=>s+x,0);let best={discount:0,k:0,f:0};
 for(let f=0;f<=(promos.familia.ativo?Math.min(Math.floor(trad.length/2),kids.length):0);f++){
 const k=promos.kids.ativo?Math.floor((kids.length-f)/3):0,discount=sum(trad,2*f)+sum(kids,f+3*k)-f*Math.round(promos.familia.preco*100)-k*Math.round(promos.kids.preco*100);
 if(discount>best.discount)best={discount,k,f};
 }
 return {subtotal,...best,total:subtotal-best.discount};
}
if(typeof module!=='undefined')module.exports={calculate,setPromotions};
