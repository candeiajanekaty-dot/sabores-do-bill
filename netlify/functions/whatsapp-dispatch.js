const {flush}=require('../lib/whatsapp-send.cjs');
exports.handler=async event=>{
 let payload;try{payload=JSON.parse(event.body||'{}');}catch{return {statusCode:403};}
 if(!payload.next_run)return {statusCode:403};
 try{await flush(1);return {statusCode:200};}catch{return {statusCode:503};}
};
