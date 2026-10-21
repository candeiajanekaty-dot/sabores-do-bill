const {reply}=require('../lib/pix.cjs');
exports.handler=async()=>reply(200,{enabled:process.env.PIX_ENABLED==='true'&&!!process.env.MP_ACCESS_TOKEN&&!!process.env.SUPABASE_SERVICE_ROLE_KEY&&!!process.env.MP_WEBHOOK_SECRET&&['test','production'].includes(process.env.MP_MODE),mode:process.env.MP_MODE==='production'?'production':'test'});
