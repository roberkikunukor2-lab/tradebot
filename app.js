const API = (localStorage.getItem("apiBase") || "http://localhost:3000").replace(/\/$/,"");
const $ = s => document.querySelector(s);
let running=false, price=1000, chartData=[], history=[], logs=[], timer=null;

function log(msg){logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);$("#log").innerHTML=logs.slice(0,80).map(x=>`<div>${x}</div>`).join("")}
function setConnection(ok){$("#dot").style.background=ok?"#22c58b":"#e06a6a";$("#connectionText").textContent=ok?"Backend connected":"Disconnected"}
function draw(){
  const c=$("#chart"), dpr=devicePixelRatio||1, w=c.clientWidth, h=280;
  c.width=w*dpr;c.height=h*dpr;const x=c.getContext("2d");x.scale(dpr,dpr);x.clearRect(0,0,w,h);
  x.strokeStyle="#e9edf3";x.lineWidth=1;
  for(let i=1;i<5;i++){let y=i*h/5;x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke()}
  if(chartData.length<2)return;
  const min=Math.min(...chartData),max=Math.max(...chartData),range=max-min||1;
  x.strokeStyle="#18a36f";x.lineWidth=2;x.beginPath();
  chartData.forEach((v,i)=>{const px=i*(w/(chartData.length-1));const py=18+(max-v)/range*(h-36);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();
}
async function get(path,opts={}){const r=await fetch(API+path,{...opts,headers:{"Content-Type":"application/json",...(opts.headers||{})}});if(!r.ok)throw new Error(await r.text());return r.json()}
async function tick(){
  try{
    const j=await get("/api/tick?symbol=R_10");
    if(j.price){price=Number(j.price);$("#latestPrice").textContent=price.toFixed(2);chartData.push(price);if(chartData.length>90)chartData.shift();draw()}
    setConnection(true);
  }catch(e){setConnection(false)}
}
async function start(){
  const mode=$("#mode").value, payload={mode,direction:$("#direction").value,stake:Number($("#stake").value),duration:Number($("#duration").value),strategy:$("#strategy").value};
  try{
    const j=await get("/api/bot/start",{method:"POST",body:JSON.stringify(payload)});
    running=true;$("#startBtn").disabled=true;$("#stopBtn").disabled=false;$("#botStatus").textContent="Running";$("#botDetail").textContent=mode==="real"?"Real account":"Paper trading";$("#modeBadge").textContent=mode.toUpperCase();log(j.message||"Bot started");timer=setInterval(tick,1000);
  }catch(e){$("#notice").textContent="Start failed: "+e.message;log("Start failed")}
}
async function stop(){
  try{await get("/api/bot/stop",{method:"POST"});log("Bot stopped")}catch(e){log("Stop request failed")}
  running=false;$("#startBtn").disabled=false;$("#stopBtn").disabled=true;$("#botStatus").textContent="Stopped";$("#botDetail").textContent="Ready to start";clearInterval(timer)
}
function nav(){
  document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$("#"+b.dataset.page).classList.remove("hidden");document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));b.classList.add("active");$("#pageTitle").textContent=b.textContent})
}
$("#startBtn").onclick=start;$("#stopBtn").onclick=stop;$("#clearLog").onclick=()=>{logs=[];$("#log").innerHTML=""};
$("#mode").onchange=()=>{$("#notice").textContent=$("#mode").value==="real"?"Real mode sends trades through your server-side Deriv token. Test with demo first.":"Paper mode does not place real trades."};
$("#saveSettings").onclick=()=>{$("#settingsSaved").classList.remove("hidden");setTimeout(()=>$("#settingsSaved").classList.add("hidden"),1800);log("Settings saved locally")};
window.addEventListener("resize",draw);nav();log("Dashboard loaded");tick();setInterval(tick,2000);draw();
