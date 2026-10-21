const L=require('../lib/pix.cjs');
exports.handler=async event=>L.handler(async()=>{
 if(event.httpMethod!=='POST')throw new L.AppError('Método não permitido.',405);const {live}=L.config(),token=await L.admin(event),b=L.body(event);const c=await L.chargeForOrder(b.pedido_id,token);if(!c?.pagamento_id)throw new L.AppError('Cobrança ainda não gerada.',404);
 const [p,seller]=await Promise.all([L.mp('/v1/payments/'+encodeURIComponent(c.pagamento_id)),L.mp('/users/me')]);return L.syncPayment(p,c,seller,live);
},event);
