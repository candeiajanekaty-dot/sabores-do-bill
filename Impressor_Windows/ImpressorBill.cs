using System;
using System.IO;
using System.Net;
using System.Text;
using System.Drawing;
using System.Drawing.Printing;
using System.Windows.Forms;
using System.Web.Script.Serialization;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;
using System.Globalization;

public class BillPrinter : Form {
 const string Api="https://sepbenhymdholhjvwtdj.supabase.co";
 const string PublicKey="sb_publishable_FYDrWLN3wo20EhlCBzRZfw__JeO0p4w";
 static readonly JavaScriptSerializer Json=new JavaScriptSerializer();
 static readonly CultureInfo Pt=new CultureInfo("pt-BR");
 readonly string Dir=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"SaboresDoBillImpressor");
 TextBox email=new TextBox(),password=new TextBox(),log=new TextBox();
 ComboBox printers=new ComboBox();Button test=new Button(),start=new Button(),stop=new Button();
 System.Windows.Forms.Timer timer=new System.Windows.Forms.Timer();
 string access,refresh,device,since,printer;DateTime expires;bool running,busy,tested;
 public BillPrinter(){
  Text="Sabores do Bill — impressão automática 58 mm";Width=660;Height=570;MinimumSize=new Size(620,530);StartPosition=FormStartPosition.CenterScreen;
  var layout=new TableLayoutPanel{Dock=DockStyle.Fill,ColumnCount=2,RowCount=8,Padding=new Padding(18)};layout.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute,130));layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,100));Controls.Add(layout);
  layout.Controls.Add(new Label{Text="E-mail do PDV",AutoSize=true},0,0);email.Dock=DockStyle.Fill;layout.Controls.Add(email,1,0);
  layout.Controls.Add(new Label{Text="Senha do PDV",AutoSize=true},0,1);password.UseSystemPasswordChar=true;password.Dock=DockStyle.Fill;layout.Controls.Add(password,1,1);
  layout.Controls.Add(new Label{Text="Impressora USB",AutoSize=true},0,2);printers.DropDownStyle=ComboBoxStyle.DropDownList;printers.Dock=DockStyle.Fill;foreach(string p in PrinterSettings.InstalledPrinters)printers.Items.Add(p);if(printers.Items.Count>0)printers.SelectedIndex=0;layout.Controls.Add(printers,1,2);
  var buttons=new FlowLayoutPanel{AutoSize=true,Dock=DockStyle.Fill};test.Text="1. Testar impressão";test.AutoSize=true;start.Text="2. Ativar automática";start.AutoSize=true;stop.Text="Pausar";stop.Enabled=false;stop.AutoSize=true;buttons.Controls.AddRange(new Control[]{test,start,stop});layout.Controls.Add(buttons,0,3);layout.SetColumnSpan(buttons,2);
  var note=new Label{AutoSize=true,MaximumSize=new Size(590,0),Text="Selecione a impressora de 58 mm. A senha fica só na memória deste programa. Mantenha este programa aberto e o computador ligado. O Android continua acompanhando os pedidos."};layout.Controls.Add(note,0,4);layout.SetColumnSpan(note,2);
  log.Multiline=true;log.ReadOnly=true;log.ScrollBars=ScrollBars.Vertical;log.Dock=DockStyle.Fill;layout.Controls.Add(log,0,5);layout.SetColumnSpan(log,2);layout.RowStyles.Add(new RowStyle(SizeType.Absolute,34));layout.RowStyles.Add(new RowStyle(SizeType.Absolute,34));layout.RowStyles.Add(new RowStyle(SizeType.Absolute,38));layout.RowStyles.Add(new RowStyle(SizeType.Absolute,42));layout.RowStyles.Add(new RowStyle(SizeType.Absolute,76));layout.RowStyles.Add(new RowStyle(SizeType.Percent,100));
  Directory.CreateDirectory(Dir);LoadSettings();if(printers.Items.Contains(printer))printers.SelectedItem=printer;
  printers.SelectedIndexChanged+=(s,e)=>{tested=false;};
  test.Click+=(s,e)=>TestPrinter();start.Click+=async(s,e)=>await Activate();stop.Click+=(s,e)=>Pause();
  timer.Interval=5000;timer.Tick+=async(s,e)=>{if(running&&!busy)await Tick();};
  FormClosing+=(s,e)=>{if(busy){e.Cancel=true;MessageBox.Show("Aguarde terminar o envio atual antes de fechar.");return;}timer.Stop();};
  Write("Impressão pausada. Primeiro faça o teste de papel.");
 }
 void Write(string text){log.AppendText(DateTime.Now.ToString("HH:mm:ss")+"  "+text+Environment.NewLine);}
 void LoadSettings(){try{var d=ReadFile("config.json");device=S(d,"device");since=S(d,"since");printer=S(d,"printer");}catch{}if(String.IsNullOrEmpty(device))device=Guid.NewGuid().ToString();}
 Dictionary<string,object> ReadFile(string file){return (Dictionary<string,object>)Json.DeserializeObject(File.ReadAllText(Path.Combine(Dir,file),Encoding.UTF8));}
 void SaveFile(string file,object data){string path=Path.Combine(Dir,file),temp=path+".tmp";File.WriteAllText(temp,Json.Serialize(data),Encoding.UTF8);if(File.Exists(path))File.Replace(temp,path,null);else File.Move(temp,path);}
 static string S(Dictionary<string,object> d,string key){return d!=null&&d.ContainsKey(key)&&d[key]!=null?Convert.ToString(d[key],CultureInfo.InvariantCulture):"";}
 static Dictionary<string,object> D(object o){return o as Dictionary<string,object>??new Dictionary<string,object>();}
 static decimal N(Dictionary<string,object> d,string key){decimal n;Decimal.TryParse(S(d,key),NumberStyles.Any,CultureInfo.InvariantCulture,out n);return n;}
 static string Money(decimal n){return n.ToString("C2",Pt);}
 object Request(string path,object body,bool authenticated){
  var request=(HttpWebRequest)WebRequest.Create(Api+path);request.Method="POST";request.ContentType="application/json";request.Timeout=15000;request.ReadWriteTimeout=15000;request.Headers["apikey"]=PublicKey;if(authenticated)request.Headers["Authorization"]="Bearer "+access;
  byte[] bytes=Encoding.UTF8.GetBytes(Json.Serialize(body));request.ContentLength=bytes.Length;using(var stream=request.GetRequestStream())stream.Write(bytes,0,bytes.Length);
  using(var response=request.GetResponse())using(var reader=new StreamReader(response.GetResponseStream()))return Json.DeserializeObject(reader.ReadToEnd());
 }
 void SetSession(object obj){var d=D(obj);access=S(d,"access_token");refresh=S(d,"refresh_token");if(String.IsNullOrEmpty(access))throw new Exception("Acesso não autorizado");expires=DateTime.UtcNow.AddSeconds(Convert.ToDouble(d["expires_in"],CultureInfo.InvariantCulture)-90);}
 void EnsureSession(){if(DateTime.UtcNow>=expires)SetSession(Request("/auth/v1/token?grant_type=refresh_token",new{refresh_token=refresh},false));}
 object Rpc(string name,object data){EnsureSession();return Request("/rest/v1/rpc/"+name,data,true);}
 void TestPrinter(){
  if(printers.SelectedItem==null){MessageBox.Show("Selecione a impressora instalada no Windows.");return;}
  printer=printers.SelectedItem.ToString();
  try{PrintLines(new List<string>{"SABORES DO BILL","TESTE DE IMPRESSAO 58 mm","--------------------------------","Carne com queijo","Borda de chocolate","RETIRADA / ENTREGA",Money(12.90m),DateTime.Now.ToString("dd/MM/yyyy HH:mm"),"Fim do teste"});tested=MessageBox.Show("O papel saiu completo e legível na impressora correta?","Conferir teste",MessageBoxButtons.YesNo)==DialogResult.Yes;if(tested)Write("Teste de papel conferido. Pronto para ativar.");}
  catch{tested=false;MessageBox.Show("Não foi possível enviar o teste. Confira impressora, porta USB e papel.");}
 }
 async Task Activate(){
  if(!tested){MessageBox.Show("Faça e confira o teste da impressora primeiro.");return;}
  if(String.IsNullOrWhiteSpace(email.Text)||String.IsNullOrEmpty(password.Text)){MessageBox.Show("Informe o e-mail e a senha que já usa no PDV.");return;}
  start.Enabled=false;test.Enabled=false;printers.Enabled=false;email.Enabled=false;password.Enabled=false;
  string user=email.Text.Trim(),pass=password.Text;bool initial=String.IsNullOrEmpty(since);
  try{
   await Task.Run(()=>{SetSession(Request("/auth/v1/token?grant_type=password",new{email=user,password=pass},false));if(!Object.Equals(Rpc("bill_verificar_acesso",new{}),true))throw new Exception();Rpc("bill_impressao_pendencias",new{});});
   password.Clear();
   if(initial)since=DateTime.UtcNow.ToString("o");
   SaveFile("config.json",new{device=device,since=since,printer=printer});
   running=true;stop.Enabled=true;timer.Start();Write("ATIVA. Pedidos novos entram na fila. Antecipados aguardam liberação; Pix aguarda pagamento.");await Tick();
  }catch{Write("Não foi possível ativar. Confira login, internet e execução do SQL de impressão no Supabase.");Pause();}
 }
 void Pause(){running=false;timer.Stop();stop.Enabled=false;if(!busy){start.Enabled=true;test.Enabled=true;printers.Enabled=true;email.Enabled=true;password.Enabled=true;}Write("PAUSADA. Os pedidos continuam no PDV.");}
 async Task Tick(){
  if(busy)return;busy=true;
  try{string message=await Task.Run(()=>ProcessOne());if(!String.IsNullOrEmpty(message))Write(message);}
  catch{Write("Falha de conexão ou envio. Nenhuma comanda será repetida automaticamente por essa falha. Confira as pendências no PDV.");}
  finally{busy=false;if(!running){start.Enabled=true;test.Enabled=true;printers.Enabled=true;email.Enabled=true;password.Enabled=true;}}
 }
 void FlushPending(){
  string path=Path.Combine(Dir,"pendente.json");if(!File.Exists(path))return;var p=ReadFile("pendente.json");string id=S(p,"id"),result=S(p,"resultado");
  Rpc("bill_impressao_resultado",new{p_dispositivo=device,p_pedido=id,p_resultado=result=="enviado"?"enviado":"incerto"});File.Delete(path);
 }
 string ProcessOne(){
  FlushPending();
  var job=D(Rpc("bill_impressao_pegar",new{p_dispositivo=device,p_desde=since}));string action=S(job,"acao");if(action=="")return null;
  if(action=="confirmar"){Rpc("bill_impressao_confirmar",new{p_dispositivo=device,p_pedido=S(job,"id")});return "Pedido confirmado e encaminhado à cozinha.";}
  var order=D(job["pedido"]);string id=S(order,"id");
  // Registro em disco e no banco antecede a impressão: um reinício nunca repete cegamente.
  SaveFile("pendente.json",new{id=id,resultado="reservado"});
  try{PrintLines(Receipt(order,job["itens"]));}
  catch{SaveFile("pendente.json",new{id=id,resultado="incerto"});FlushPending();return "Pedido #"+S(order,"numero")+": envio incerto. Confira papel e pendências no PDV.";}
  SaveFile("pendente.json",new{id=id,resultado="enviado"});FlushPending();
  Rpc("bill_impressao_confirmar",new{p_dispositivo=device,p_pedido=id});return "Pedido #"+S(order,"numero")+": aceito pela fila do Windows e confirmado. Confira a saída do papel.";
 }
 // Largura da coluna de texto em mm. Se o lado direito sair cortado, diminua (48, depois 46).
 const float ColumnMm=52f;
 // Sobra de papel no fim da comanda (para destacar). Diminua para o papel sair mais curto.
 const float TearMm=8f;
 class Row{public string Left,Right;public bool Big;}
 static float LarguraTexto(Graphics g,string s,Font f){return g.MeasureString(s,f,1000,StringFormat.GenericTypographic).Width;}
 // Linhas normais: só separa por quebra de linha (a quebra por largura real é feita em PrintLines).
 static void Add(List<string> list,string value){foreach(string raw in (value??"").Replace("\r","").Split('\n'))list.Add(raw);}
 // Linha com valor alinhado à direita (esquerda \t direita).
 static void AddPair(List<string> list,string left,string right){list.Add((left??"").Replace("\r"," ").Replace("\n"," ").Replace("\t"," ")+"\t"+right);}
 List<string> Receipt(Dictionary<string,object> o,object items){
  const string Sep="---------------------------------";
  var lines=new List<string>();var client=D(o.ContainsKey("dados_cliente")?o["dados_cliente"]:null);
  DateTime created;string date=DateTime.TryParse(S(o,"created_at"),out created)?created.ToLocalTime().ToString("dd/MM/yyyy HH:mm"):DateTime.Now.ToString("dd/MM/yyyy HH:mm");Add(lines,date);Add(lines,"PEDIDO #"+S(o,"numero"));Add(lines,"@L@"+S(client,"nome"));Add(lines,S(o,"tipo_entrega")=="entrega"?"@L@ENTREGA":"@L@RETIRADA");Add(lines,S(client,"telefone"));Add(lines,S(client,"endereco"));
  string payment=S(o,"pagamento_metodo"),label=payment=="dinheiro"?"Dinheiro":payment=="pix"?"Pix":payment=="credito_maquininha"?"Crédito na maquininha":payment=="debito_maquininha"?"Débito na maquininha":"Cartão na maquininha";
  Add(lines,"Pagamento: "+label);Add(lines,"Situação: "+(S(o,"pagamento_status")=="pago"?"Pago":"Pendente"));if(payment=="dinheiro"&&N(o,"troco_para")>0){AddPair(lines,"Troco para:",Money(N(o,"troco_para")));AddPair(lines,"Levar troco:",Money(N(o,"valor_troco")));}
  Add(lines,Sep);foreach(object item in (IEnumerable)items){var it=D(item);string itemName=S(it,"nome_produto");if(itemName.StartsWith("Borda de ")&&itemName.Contains(" — "))itemName="Borda "+itemName.Substring(9).Split(new string[]{" — "},StringSplitOptions.None)[0];AddPair(lines,S(it,"quantidade")+"x "+itemName,Money(N(it,"subtotal")));if(S(it,"observacoes")!="")Add(lines,"Obs: "+S(it,"observacoes"));}
  Add(lines,Sep);AddPair(lines,"Produtos:",Money(N(o,"subtotal")));AddPair(lines,"Desconto:",Money(N(o,"valor_desconto")));AddPair(lines,"Entrega:",Money(N(o,"taxa_entrega")));AddPair(lines,"@L@TOTAL",Money(N(o,"total")));if(S(o,"observacoes")!="")Add(lines,"OBSERVAÇÕES: "+S(o,"observacoes"));return lines;
 }
 void PrintLines(List<string> lines){
  using(var document=new PrintDocument())using(var font=new Font("Courier New",6.5f,FontStyle.Regular))using(var large=new Font("Courier New",8,FontStyle.Bold)){
   document.PrinterSettings.PrinterName=printer;if(!document.PrinterSettings.IsValid)throw new Exception("Impressora inválida");
   document.PrintController=new StandardPrintController();document.DocumentName="Sabores do Bill - Comanda";
   var rows=new List<Row>();
   float bodyStep=2.6f,largeStep=3.25f,needed=2f;
   // Quebra as linhas pela largura real da fonte, calculando de antemão a altura exata da comanda.
   using(var measure=document.PrinterSettings.CreateMeasurementGraphics()){
    measure.PageUnit=GraphicsUnit.Millimeter;
    foreach(string raw in lines){
     bool big=raw.StartsWith("@L@");string all=big?raw.Substring(3):raw;Font current=big?large:font;
     string text=all,right=null;float avail=ColumnMm;int tab=all.IndexOf('\t');
     if(tab>=0){text=all.Substring(0,tab);right=all.Substring(tab+1);avail=ColumnMm-LarguraTexto(measure,right,current)-1.5f;}
     bool first=true;
     while(text.Length>0){
      int count=text.Length;
      while(count>1&&LarguraTexto(measure,text.Substring(0,count),current)>avail)count--;
      if(count<text.Length&&text[count]!=' '){int word=text.LastIndexOf(' ',count-1);if(word>count/2)count=word;}
      rows.Add(new Row{Left=text.Substring(0,count),Right=first?right:null,Big=big});
      needed+=big?largeStep:bodyStep;text=text.Substring(count).TrimStart();first=false;avail=ColumnMm;
     }
    }
   }
   // Papel de 58 mm (228 = centésimos de polegada) com a altura exata do conteúdo: uma página só.
   int heightHundredths=(int)Math.Ceiling((needed+TearMm)/25.4*100);
   document.DefaultPageSettings.PaperSize=new PaperSize("Bobina 58mm",228,heightHundredths);
   document.DefaultPageSettings.Margins=new Margins(0,0,0,0);
   int index=0;
   document.PrintPage+=(s,e)=>{
    e.Graphics.PageUnit=GraphicsUnit.Millimeter;
    // Usa a área realmente imprimível da impressora e centraliza a coluna nela.
    RectangleF area=e.Graphics.VisibleClipBounds;
    float x=area.Left+Math.Max(0f,(area.Width-ColumnMm)/2f),y=area.Top+1f;
    while(index<rows.Count){
     var row=rows[index];Font f=row.Big?large:font;
     e.Graphics.DrawString(row.Left,f,Brushes.Black,x,y,StringFormat.GenericTypographic);
     if(row.Right!=null){float w=LarguraTexto(e.Graphics,row.Right,f);e.Graphics.DrawString(row.Right,f,Brushes.Black,x+ColumnMm-w,y,StringFormat.GenericTypographic);}
     y+=row.Big?largeStep:bodyStep;index++;
    }
    e.HasMorePages=false; // nunca gera segunda página
   };
   document.Print();
  }
 }
 [STAThread] public static void Main(){bool first;using(var mutex=new Mutex(true,"Local\\SaboresDoBillImpressor",out first)){if(!first){MessageBox.Show("O Impressor Bill já está aberto neste computador.");return;}ServicePointManager.SecurityProtocol=SecurityProtocolType.Tls12;Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);Application.Run(new BillPrinter());}}
}
