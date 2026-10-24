// Lista de bairros de Pato Branco para escolher e conferir a taxa.
(function(root){
 const grupos=[
  {taxa:10,bairros:['Amadori','Parzianello','Brasília','Bancários','Baixada','Centro','Cadorin','La Salle','Pinheiros','Sambugaro','São Vicente']},
  {taxa:12,bairros:['Bortot','Bonato','Cristo Rei','Menino Deus','Santa Terezinha','Vila Esperança','Vila Isabel','Jardim Primavera','Jardim das Américas','Anchieta','Industrial','Trevo da Guarani','São Luiz']},
  {taxa:14,bairros:['Bela Vista','Fraron','Industrial 2','Novo Horizonte','Pinheirinho','Parque do Som','Parque do Som 2','São Francisco','Trevo Catani','Planalto','Parque Industrial','Paulo Afonso']}
 ];
 const bairros=grupos.flatMap(g=>g.bairros.map(nome=>({nome,taxa:g.taxa}))).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
 const api={grupos,bairros,outros:16};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BillEntregas=api;
})(typeof window!=='undefined'?window:globalThis);
