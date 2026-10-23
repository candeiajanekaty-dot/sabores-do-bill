// Harness local: não é necessário instalar dependências no site.
const {PGlite}=require('../../.helpers/pgtest/node_modules/@electric-sql/pglite');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA bill_privado; GRANT USAGE ON SCHEMA bill_privado TO authenticated; CREATE FUNCTION bill_privado.e_administrador() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT current_setting('test.admin',true)='yes' $$;`);
 const sql=fs.readFileSync('gestao-bill/sql/Conectar_WhatsApp_Bill.sql','utf8');await db.exec(sql);await db.exec(sql);
 const batch=JSON.stringify([{message_id:'wamid.test',telefone:'5546999999999',nome:'Cliente',tipo:'text',texto:'Oi',enviado_em:'2026-10-22T18:00:00Z'}]);
 const receive=()=>db.query('SELECT public.bill_whatsapp_receber($1,$2,$3::jsonb) AS n',['123','456',batch]);
 await db.exec('SET ROLE service_role');assert.equal((await receive()).rows[0].n,1);assert.equal((await receive()).rows[0].n,0);
 await db.exec("RESET ROLE; SET ROLE authenticated; SET test.admin='no';");assert.equal((await db.query('SELECT * FROM public.bill_whatsapp_mensagens')).rows.length,0);await assert.rejects(receive);
 await db.exec("SET test.admin='yes';");assert.equal((await db.query('SELECT * FROM public.bill_whatsapp_mensagens')).rows.length,1);await assert.rejects(()=>db.exec("INSERT INTO public.bill_whatsapp_mensagens(conta_id) VALUES('x')"));await assert.rejects(()=>db.exec('DELETE FROM public.bill_whatsapp_mensagens'));
 await db.exec('RESET ROLE; SET ROLE anon;');await assert.rejects(receive);await assert.rejects(()=>db.query('SELECT * FROM public.bill_whatsapp_mensagens'));
 await db.exec('RESET ROLE');await db.exec(sql);assert.equal((await db.query('SELECT count(*)::int AS n FROM public.bill_whatsapp_mensagens')).rows[0].n,1);
 await db.close();console.log('PASSOU WhatsApp: instalação repetida preserva dados, deduplicação e permissões de administrador/service_role/anon.');
})().catch(e=>{console.error(e);process.exit(1);});
