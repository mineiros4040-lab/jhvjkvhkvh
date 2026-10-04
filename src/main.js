import "./style.css";

const KEY="af-db";
let db=JSON.parse(localStorage.getItem(KEY)||"null")||{next:1,customers:[],orders:[]};
const statuses=["Aberta","Em análise","Aguardando aprovação","Aguardando peça","Em reparo","Pronto para retirada","Entregue","Cancelada"];
const types=["Placa de vídeo","Placa-mãe Desktop","Notebook","Celular","Computador Desktop","Outro"];
const $=s=>document.querySelector(s);
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const customer=id=>db.customers.find(x=>x.id===id)||{name:"—",cpf:"—",phone:"—"};

function shell(content,active){
  const nav=[["dashboard","⌂","Dashboard"],["orders","▣","Ordens de Serviço"],["customers","♙","Clientes"],["equipment","▱","Equipamentos"],["reports","◈","Relatórios"]];
  $("#app").innerHTML='<aside><div class="brand"><b>AF</b><div><strong>AF INFORMÁTICA</strong><small>Gestão Técnica</small></div></div><nav>'+
    nav.map(x=>'<button class="'+(active===x[0]?"active":"")+'" data-go="'+x[0]+'">'+x[1]+'<span>'+x[2]+"</span></button>").join("")+
    '</nav><div class="user">AF · Administrador</div></aside><main><header><b>AF INFORMÁTICA</b><span>●</span></header>'+content+"</main>";
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
}
function go(page){({dashboard,orders,customers,equipment,reports}[page]||dashboard)();}
function head(kicker,title,desc,button){return '<section class="head"><div><small>'+kicker+'</small><h1>'+title+'</h1><p>'+desc+'</p></div>'+(button||"")+"</section>";}
function button(text,cls,action){return '<button class="'+cls+'" id="actionBtn">'+text+"</button>";}
function dashboard(){
 const open=db.orders.filter(o=>!["Entregue","Cancelada"].includes(o.status)).length;
 const repair=db.orders.filter(o=>o.status==="Em reparo").length;
 const ready=db.orders.filter(o=>o.status==="Pronto para retirada").length;
 const total=db.orders.reduce((a,o)=>a+(+o.value||0),0);
 shell(head("VISÃO GERAL","Olá, administrador 👋","Controle sua assistência técnica em um só lugar.",button("+ Nova Ordem de Serviço","primary"))+
 '<div class="cards"><div><i>▣</i><small>OS abertas</small><b>'+open+'</b></div><div><i>⚒</i><small>Em reparo</small><b>'+repair+'</b></div><div><i>✓</i><small>Prontos</small><b>'+ready+'</b></div><div><i>R$</i><small>Valor em OS</small><b>'+money(total)+'</b></div></div>'+
 '<section class="panel"><div class="panelhead"><div><h2>Ordens recentes</h2><p>Últimos atendimentos</p></div><button class="link" id="all">Ver todas →</button></div>'+orderTable(db.orders.slice(-8).reverse())+'</section>'+
 '<section class="panel"><div class="panelhead"><div><h2>Fluxo da oficina</h2><p>Distribuição atual</p></div></div>'+
 statuses.slice(0,6).map(s=>{const n=db.orders.filter(o=>o.status===s).length;return '<div class="barrow"><span>'+s+'</span><div><i style="width:'+Math.min(100,n*20+3)+'%"></i></div><b>'+n+"</b></div>"}).join("")+"</section>");
 $("#actionBtn").onclick=newOrder; $("#all").onclick=orders; bindOpen();
}
function orderTable(rows){
 return '<div class="table"><table><thead><tr><th>OS</th><th>Cliente</th><th>Equipamento</th><th>Status</th><th>Valor</th><th></th></tr></thead><tbody>'+
 (rows.map(o=>'<tr><td><b class="red">'+o.number+'</b></td><td>'+esc(customer(o.customerId).name)+'</td><td>'+esc(o.brand)+" · "+esc(o.model)+'</td><td><span class="status">'+esc(o.status)+'</span></td><td>'+money(o.value)+'</td><td><button class="link open" data-id="'+o.id+'">Abrir</button></td></tr>').join("")||'<tr><td colspan="6" class="empty">Nenhuma OS cadastrada.</td></tr>')+
 "</tbody></table></div>";
}
function bindOpen(){document.querySelectorAll(".open").forEach(b=>b.onclick=()=>detail(b.dataset.id));}
function orders(){
 shell(head("ATENDIMENTO","Ordens de Serviço","Cadastre, pesquise e acompanhe cada reparo.",button("+ Nova OS","primary"))+
 '<section class="panel"><div class="filters"><input id="q" placeholder="Pesquisar OS, cliente, modelo ou serial..."><select id="sf"><option value="">Todos os status</option>'+statuses.map(s=>"<option>"+s+"</option>").join("")+'</select></div><div id="list"></div></section>',"orders");
 $("#actionBtn").onclick=newOrder; const render=()=>{const q=$("#q").value.toLowerCase(),s=$("#sf").value;$("#list").innerHTML=orderTable(db.orders.filter(o=>(!s||o.status===s)&&(o.number+" "+customer(o.customerId).name+" "+o.model+" "+o.serial).toLowerCase().includes(q)));bindOpen()};$("#q").oninput=render;$("#sf").onchange=render;render();
}
function customers(){
 shell(head("CADASTRO","Clientes","Base de clientes e histórico.",button("+ Novo Cliente","primary"))+
 '<section class="panel"><div class="table"><table><thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>OS</th><th>Total</th></tr></thead><tbody>'+
 (db.customers.map(c=>{const os=db.orders.filter(o=>o.customerId===c.id);return '<tr><td><b>'+esc(c.name)+'</b><br><small>'+esc(c.email||"")+'</small></td><td>'+esc(c.cpf)+'</td><td>'+esc(c.phone)+'</td><td>'+os.length+'</td><td>'+money(os.reduce((a,o)=>a+(+o.value||0),0))+"</td></tr>"}).join("")||'<tr><td colspan="5" class="empty">Nenhum cliente cadastrado.</td></tr>')+
 "</tbody></table></div></section>","customers");
 $("#actionBtn").onclick=customerModal;
}
function customerModal(){
 const m=document.createElement("div");m.className="modal";m.innerHTML='<div class="dialog"><button class="x">×</button><small>NOVO CLIENTE</small><h2>Cadastrar cliente</h2><form id="cf"><label>Nome completo*<input name="name" required></label><label>CPF<input name="cpf" placeholder="000.000.000-00"></label><label>Telefone*<input name="phone" required placeholder="(64) 99999-9999"></label><label>E-mail<input name="email" type="email"></label><label>Endereço<input name="address"></label><button class="primary">Salvar cliente</button></form></div>';
 document.body.append(m);m.querySelector(".x").onclick=()=>m.remove();m.querySelector("#cf").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);db.customers.push({id:crypto.randomUUID(),name:f.get("name"),cpf:f.get("cpf"),phone:f.get("phone"),email:f.get("email"),address:f.get("address")});save();m.remove();customers();toast("Cliente cadastrado com sucesso!")};
}
function newOrder(){
 if(!db.customers.length){customerModal();toast("Cadastre um cliente antes de criar a OS.");return}
 shell(head("NOVA OS","Criar Ordem de Serviço","O número será gerado automaticamente.",'<button class="ghost" id="cancel">Cancelar</button>')+
 '<form class="form panel" id="of"><h2>01 · Cliente</h2><label>Cliente<select name="customerId" required><option value="">Selecione...</option>'+db.customers.map(c=>'<option value="'+c.id+'">'+esc(c.name)+" — "+esc(c.phone)+"</option>").join("")+'</select></label><h2>02 · Equipamento</h2><div class="grid"><label>Tipo<select name="type">'+types.map(t=>"<option>"+t+"</option>").join("")+'</select></label><label>Marca<input name="brand" required placeholder="Ex.: ASUS"></label><label>Modelo<input name="model" required></label><label>Serial / IMEI<input name="serial"></label><label>Memória<input name="memory" placeholder="Ex.: 16 GB"></label><label>Valor estimado<input name="value" type="number" step=".01"></label></div><h2>03 · Defeito informado</h2><label>Defeito suposto / relato<textarea name="defect" required rows="5"></textarea></label><div class="grid"><label>Estado físico<textarea name="physical" rows="3"></textarea></label><label>Acessórios recebidos<textarea name="accessories" rows="3"></textarea></label></div><button class="primary">✓ Gerar Ordem de Serviço</button></form>','orders');
 $("#cancel").onclick=orders;$("#of").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),num="AF-"+new Date().getFullYear()+"-"+String(db.next++).padStart(6,"0");db.orders.push({id:crypto.randomUUID(),number:num,customerId:f.get("customerId"),type:f.get("type"),brand:f.get("brand"),model:f.get("model"),serial:f.get("serial"),memory:f.get("memory"),value:+f.get("value")||0,defect:f.get("defect"),physical:f.get("physical"),accessories:f.get("accessories"),status:"Aberta",date:new Date().toLocaleDateString("pt-BR")});save();toast("OS "+num+" criada com sucesso!");detail(db.orders.at(-1).id)};
}
function detail(id){
 const o=db.orders.find(x=>x.id===id),c=customer(o.customerId);
 shell(head("ORDEM DE SERVIÇO",o.number,esc(c.name)+" · "+o.date,'<div><button class="ghost" id="print">Imprimir</button> <button class="primary" id="advance">Atualizar status</button></div>')+
 '<div class="detail"><section class="panel"><div class="panelhead"><div><h2>Resumo do atendimento</h2><p>Dados registrados na entrada</p></div><span class="status">'+esc(o.status)+'</span></div><div class="info"><div><small>Cliente</small><b>'+esc(c.name)+'</b><span>'+esc(c.cpf)+" · "+esc(c.phone)+'</span></div><div><small>Equipamento</small><b>'+esc(o.brand)+" "+esc(o.model)+'</b><span>'+esc(o.type)+" · "+esc(o.memory||"Não informado")+'</span></div><div><small>Serial / IMEI</small><b>'+esc(o.serial||"Não informado")+'</b></div><div><small>Valor</small><b class="price">'+money(o.value)+'</b></div></div><div class="note"><small>DEFEITO INFORMADO PELO CLIENTE</small><p>'+esc(o.defect)+'</p></div></section><section class="panel"><div class="panelhead"><div><h2>Andamento</h2><p>Fluxo da ordem</p></div></div><div class="steps">'+statuses.slice(0,7).map((s,i)=>'<div class="'+(statuses.indexOf(o.status)>=i?"done":"")+'"><i></i>'+s+"</div>").join("")+'</div></section><section class="panel full"><div class="panelhead"><div><h2>Diagnóstico técnico</h2><p>Área preparada para diagnóstico, testes e componentes.</p></div></div><div class="empty">🔧 Módulo técnico preparado para a próxima etapa.</div></section></div>','orders');
 $("#print").onclick=()=>window.print();$("#advance").onclick=()=>{const i=statuses.indexOf(o.status);o.status=statuses[(i+1)%statuses.length];save();toast("Status: "+o.status);detail(id)};
}
function equipment(){shell(head("ATIVOS","Equipamentos","Equipamentos vinculados às OS." )+'<section class="panel">'+orderTable(db.orders)+"</section>","equipment");bindOpen()}
function reports(){const total=db.orders.reduce((a,o)=>a+(+o.value||0),0);shell(head("GESTÃO","Relatórios","Indicadores da operação.")+'<div class="cards"><div><i>R$</i><small>Faturamento</small><b>'+money(total)+'</b></div><div><i>▣</i><small>Total de OS</small><b>'+db.orders.length+'</b></div><div><i>♙</i><small>Clientes</small><b>'+db.customers.length+'</b></div><div><i>✓</i><small>Entregues</small><b>'+db.orders.filter(o=>o.status==="Entregue").length+'</b></div></div><section class="panel"><div class="panelhead"><h2>Por tipo de equipamento</h2></div>'+types.map(t=>{const n=db.orders.filter(o=>o.type===t).length;return '<div class="barrow"><span>'+t+'</span><div><i style="width:'+Math.min(100,n*25+3)+'%"></i></div><b>'+n+"</b></div>"}).join("")+"</section>","reports")}
function toast(text){const x=document.createElement("div");x.className="toast";x.textContent=text;document.body.append(x);setTimeout(()=>x.classList.add("show"),20);setTimeout(()=>x.remove(),2600)}
window.go=go;window.newOrder=newOrder;window.detail=detail;window.print=()=>window.print();window.customerModal=customerModal;
dashboard();