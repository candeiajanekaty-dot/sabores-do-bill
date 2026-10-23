// Fotos originais fornecidas pelo restaurante. O link salvo no PDV tem prioridade.
(function(root){
 const files={
  'carne com queijo':'carne-com-queijo','chocolate branco':'chocolate-branco',
  'chocolate preto':'chocolate-preto','dois amores':'dois-amores','frango':'frango',
  'frango com cheddar':'frango-com-cheddar','frango com queijo':'frango-com-queijo',
  'pizza':'pizza','queijo':'queijo','romeu e julieta':'romeu-e-julieta'
 };
 const asset=name=>'images/produtos/'+name+'.jpeg';
 function forProduct(name,category,saved){
  if(typeof saved==='string'&&saved.startsWith('https://'))return saved;
  if(category==='kit')return asset('mini-pasteis');
  if(!['kids','tradicional'].includes(category))return '';
  const key=String(name||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  return files[key]?asset(files[key]):'';
 }
 const api={forProduct,miniSavory:asset('mini-pasteis'),miniSweet:asset('mini-pasteis-doces')};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.BillPhotos=api;
})(globalThis);
