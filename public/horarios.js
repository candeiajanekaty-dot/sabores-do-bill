(function(root){
 const days=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
 function text(rows){return (Array.isArray(rows)?rows:[]).filter(x=>x.ativo).map(x=>`${days[x.dia]}${x.opcional?' (conforme disponibilidade)':''}: ${x.abre} às ${x.fecha}${x.fecha<x.abre?' do dia seguinte':''}`).join(' • ')||'Atendimento conforme disponibilidade';}
 const api={days,text};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BillHours=api;
})(globalThis);
