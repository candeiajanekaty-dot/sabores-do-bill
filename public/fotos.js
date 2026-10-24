// Fotos originais fornecidas pelo restaurante. O link salvo no PDV tem prioridade.
(function(root){
 const files={
  'carne':'carne','banana com canela':'banana-com-canela',
  'carne com queijo':'Carne_Queijo','chocolate branco':'Chocolate_Branco',
  'chocolate preto':'Chocolate_Preto','dois amores':'Dois_Amores','frango':'Frango',
  'frango com cheddar':'Frango_Cheddar','frango com queijo':'Frango_Queijo',
  'pizza':'Pizza','queijo':'Queijo','romeu e julieta':'Romeu_Julieta'
 };
 const asset=name=>'images/produtos/'+name+'.jpeg';
 function forProduct(name,category,saved){
  if(typeof saved==='string'&&saved.startsWith('https://'))return saved;
  if(category==='kit')return asset('Mini_Pasteis');
  const key=String(name||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  if(category==='bebidas'){const drinks={'coca-cola lata':'coca-cola-tradicional.jfif','coca-cola zero lata':'coca-cola-zero.jpg','guarana antarctica lata':'guarana-antartica.webp'};return drinks[key]?'images/produtos/'+drinks[key]:'';}
  if(!['kids','tradicional'].includes(category))return '';
  return key==='carne com queijo'?'images/produtos/carne-com-queijo.png':files[key]?asset(files[key]):'';
 }
 const api={forProduct,miniSavory:asset('Mini_Pasteis'),miniSweet:asset('Mini_Pasteis_Doce')};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.BillPhotos=api;
})(globalThis);
