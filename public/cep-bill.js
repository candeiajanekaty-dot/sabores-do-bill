(function(root){
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/^bairro\s+/,'').replace(/\s+/g,' ');
 function bairro(nome,lista){const aliases={frarom:'fraron','sao fracisco':'sao francisco','industrial ii':'industrial 2'};const key=aliases[normalize(nome)]||normalize(nome);return lista.find(b=>normalize(b.nome)===key)||null;}
 async function buscar(valor,request=fetch){
  const cep=String(valor).replace(/\D/g,'');if(!/^\d{8}$/.test(cep))throw Error('Informe um CEP com 8 números.');
  const response=await request('https://viacep.com.br/ws/'+cep+'/json/',{signal:AbortSignal.timeout(6000)});
  if(!response.ok)throw Error('Não foi possível consultar o CEP. Preencha o endereço manualmente.');
  const d=await response.json();if(d.erro)throw Error('CEP não encontrado. Confira o CEP ou preencha manualmente.');
  if(normalize(d.localidade)!=='pato branco'||d.uf!=='PR')throw Error('Este CEP é de outra cidade. Nossas entregas são em Pato Branco - PR.');
  return {cep,rua:String(d.logradouro||''),bairro:String(d.bairro||'')};
 }
 function ligar({get,lista,mudouBairro}){
  let version=0,lastCEP='';
  const campo=get('online-cep'),button=get('online-cep-search'),status=get('online-cep-status');
  campo.oninput=()=>{version++;status.textContent='';};
  campo.onblur=()=>{const cep=campo.value.replace(/\D/g,'');if(cep.length===8&&cep!==lastCEP)button.onclick();};
  button.onclick=async()=>{
   const current=++version,valor=campo.value,rua=get('online-address'),numero=get('online-number'),seletor=get('online-neighborhood'),outro=get('online-other-neighborhood');
   const oldRua=rua.value,oldBairro=seletor.value,oldOutro=outro.value;
   button.disabled=true;status.textContent='Consultando CEP…';
   try{
    const d=await buscar(valor);
    if(current!==version||get('online-cep')!==campo)return;
    // Não substitui alterações feitas pela pessoa enquanto a consulta estava em andamento.
    if(rua.value!==oldRua||seletor.value!==oldBairro||outro.value!==oldOutro){status.textContent='O endereço foi alterado durante a consulta. Confira os dados ou busque novamente.';return;}
    lastCEP=String(valor).replace(/\D/g,'');
    rua.value=d.rua;
    const found=bairro(d.bairro,lista);
    seletor.value=found?found.nome:(d.bairro?'__outro':'');outro.value=found?'':d.bairro;
    mudouBairro();
    status.textContent=d.rua&&d.bairro?'Endereço preenchido. Confira os dados e informe o número.':'Este CEP não informa rua ou bairro. Complete os campos manualmente.';
    numero.focus?.();
   }catch(e){if(current===version&&get('online-cep')===campo)status.textContent=e.message||'Consulta indisponível. Preencha manualmente.';}
   finally{if(get('online-cep')===campo)button.disabled=false;}
  };
 }
 const api={normalize,bairro,buscar,ligar};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BillCEP=api;
})(typeof window!=='undefined'?window:globalThis);
