import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();
const app=express();
app.use(cors());
app.use(express.json());

const PORT=process.env.PORT||3000;
const APP_ID=process.env.DERIV_APP_ID||"1089";
const TOKEN=process.env.DERIV_API_TOKEN||"";
const ALLOW_REAL=String(process.env.ALLOW_REAL_TRADING).toLowerCase()==="true";
let bot={running:false,mode:"demo",direction:"RISE",stake:1,duration:1,strategy:"Last digit momentum"};

function derivSocket(){
  return new Promise((resolve,reject)=>{
    const ws=new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${encodeURIComponent(APP_ID)}`);
    const t=setTimeout(()=>{try{ws.close()}catch{};reject(new Error("Deriv connection timeout"))},10000);
    ws.once("open",()=>{clearTimeout(t);resolve(ws)});
    ws.once("error",e=>{clearTimeout(t);reject(e)});
  });
}
function rpc(ws,payload){
  return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(new Error("Deriv response timeout")),12000);
    const onMsg=data=>{try{const j=JSON.parse(data.toString());if(j.req_id!==payload.req_id)return;clearTimeout(t);ws.off("message",onMsg);if(j.error)reject(new Error(j.error.message));else resolve(j)}catch(e){reject(e)}};
    ws.on("message",onMsg);ws.send(JSON.stringify(payload));
  });
}
let req=1;

app.get("/api/health",(req,res)=>res.json({ok:true,realTrading:ALLOW_REAL}));
app.get("/api/tick",async(req,res)=>{
  const symbol=req.query.symbol||"R_10";
  let ws;
  try{ws=await derivSocket();const j=await rpc(ws,{ticks:symbol,subscribe:1,req_id:req++});const price=j.tick?.quote;try{ws.close()}catch{};return res.json({symbol,price});}
  catch(e){try{ws?.close()}catch{};return res.status(502).json({error:e.message})}
});
app.post("/api/bot/start",(req,res)=>{
  const {mode="demo",direction="RISE",stake=1,duration=1,strategy="Last digit momentum"}=req.body||{};
  if(mode==="real" && !ALLOW_REAL)return res.status(403).json({error:"Real trading is disabled on this server. Set ALLOW_REAL_TRADING=true only after testing."});
  if(mode==="real" && !TOKEN)return res.status(500).json({error:"DERIV_API_TOKEN is not configured on the backend."});
  bot={running:true,mode,direction,stake:Number(stake),duration:Number(duration),strategy};
  res.json({ok:true,message:mode==="real"?"Real bot started.":"Paper bot started."});
});
app.post("/api/bot/stop",(req,res)=>{bot.running=false;res.json({ok:true,message:"Bot stopped."})});
app.get("/api/bot/status",(req,res)=>res.json(bot));

app.get("/api/account/balance",async(req,res)=>{
  if(!TOKEN)return res.status(400).json({error:"No server-side Deriv token configured."});
  let ws;
  try{ws=await derivSocket();await rpc(ws,{authorize:TOKEN,req_id:req++});const j=await rpc(ws,{balance:1,req_id:req++});try{ws.close()}catch{};res.json({balance:j.balance?.balance,currency:j.balance?.currency});}
  catch(e){try{ws?.close()}catch{};res.status(502).json({error:e.message})}
});

/*
  REAL TRADE ENGINE:
  This starter deliberately does not auto-buy contracts. To add live execution,
  implement a strategy with strict risk limits, then call Deriv's proposal and
  buy APIs from this server. Keep the token server-side and require explicit
  user consent. Paper mode is the default.
*/
app.listen(PORT,()=>console.log(`TradeBot backend listening on http://localhost:${PORT}`));
