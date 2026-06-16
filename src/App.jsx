import { useState, useEffect, useRef } from "react";
import mod1 from "./data/mod1.json";
import mod2 from "./data/mod2.json";
import mod3 from "./data/mod3.json";
import mod4 from "./data/mod4.json";
import mod5 from "./data/mod5.json";
import mod6 from "./data/mod6.json";
import mod7 from "./data/mod7.json";

const C = {
  bg:"#1a2218", bg2:"#212d1f", bg3:"#273324",
  border:"#2e3d2b", text:"#e8e0cc", muted:"#6b7d62",
  accent:"#c8a84b", cream:"#f0e8d0", sage:"#8fa882",
  green:"#6db87a", red:"#d96060", blue:"#70b4d4",
  purple:"#a98fe8", orange:"#e0845a",
};
const MOD_COLOR = { "1":"#6db87a", "2":"#d4a847", "3":"#5a9fd4", "4":"#d4795a", "5":"#c77dd6", "6":"#5ac7b0", "7":"#e0845a" };
const DIFF_COLOR = { easy:"#6db87a", medium:"#d4a847", hard:"#d96060" };
const RED_SUITS = new Set(["♥","♦"]);

function getScore(prog){
  if(!prog||prog.seen===0)return 0;
  const acc=prog.correct/prog.seen,seen=prog.seen;
  if(acc>=0.8&&seen>=4)return 4;
  if(acc>=0.7&&seen>=3)return 3;
  if(acc>=0.5&&seen>=2)return 2;
  return 1;
}
function getWeight(prog){return[8,6,3,1.5,0.5][getScore(prog)];}
const SCORE_LABEL=["Unseen","Struggling","Learning","Solid","Mastered"];
const SCORE_COLOR=["#6b7d62","#d96060","#d4a847","#a8d4b0","#6db87a"];

function weightedSample(questions,progress,n){
  const pool=questions.map(q=>({q,w:getWeight(progress[q.id])}));
  const target=Math.min(n,pool.length);
  const result=[];
  for(let i=0;i<target;i++){
    const total=pool.reduce((s,x)=>s+x.w,0);
    let r=Math.random()*total,idx=0;
    for(;idx<pool.length;idx++){r-=pool[idx].w;if(r<=0)break;}
    idx=Math.min(idx,pool.length-1);
    result.push(pool[idx].q);pool.splice(idx,1);
  }
  return result;
}
function loadProgress(){try{return JSON.parse(localStorage.getItem("ppt_v1")||"{}");}catch{return{};}}
function saveProgress(p){try{localStorage.setItem("ppt_v1",JSON.stringify(p));}catch{}}

function BoardCard({ card, small }) {
  const rank = card.slice(0,-1), suit = card.slice(-1);
  const col = RED_SUITS.has(suit) ? "#c0392b" : "#1a1f2e";
  const w = small ? 44 : 54, h = small ? 60 : 74;
  return (
    <div style={{width:w,height:h,borderRadius:10,background:"#f5f0e8",border:"1px solid #d8ceba",boxShadow:"0 3px 12px rgba(0,0,0,0.3)",position:"relative",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{position:"absolute",top:4,left:5,fontSize:small?13:15,fontWeight:900,color:col,lineHeight:1,fontFamily:"Georgia,serif"}}>{rank}</span>
      <span style={{fontSize:small?20:26,color:col,lineHeight:1}}>{suit}</span>
    </div>
  );
}

function Board({ boardStr }) {
  const parts = boardStr.split("→").map(s=>s.trim());
  const flopCards = parts[0].split(" ").filter(Boolean);
  const turnCard = parts[1] || null;
  return (
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      {flopCards.map((c,i)=><BoardCard key={i} card={c}/>)}
      {turnCard && (<><span style={{color:C.muted,fontSize:18,fontWeight:700,margin:"0 2px"}}>→</span><BoardCard card={turnCard}/></>)}
    </div>
  );
}

const RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];
function handLabel(r, c) {
  if (r === c) return RANKS[r] + RANKS[c];
  if (r < c)  return RANKS[r] + RANKS[c] + "s";
  return RANKS[c] + RANKS[r] + "o";
}

function RangeGrid({ selected, onToggle, revealed, correctSet, presetSet }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(13, 1fr)",gap:2,width:"100%",maxWidth:430,margin:"0 auto",touchAction:"manipulation"}}>
      {RANKS.map((_, r) =>
        RANKS.map((_, c) => {
          const label = handLabel(r, c);
          const inPreset = !presetSet || presetSet.has(label);
          const isSelected = selected.has(label);
          const isCorrect = correctSet && correctSet.has(label);
          let bg = C.bg3, border = C.border, color = C.muted, opacity = 1;

          // Hands outside the preset range are dimmed & non-interactive
          if (presetSet && !inPreset) {
            bg = "#161d14"; border = "#1c2418"; color = "#333d2e"; opacity = 0.4;
          } else if (!revealed) {
            if (isSelected) { bg = `${C.accent}40`; border = C.accent; color = C.cream; }
          } else {
            if (isCorrect && isSelected)      { bg = "rgba(109,184,122,0.35)"; border = C.green; color = "#c8e8d0"; }
            else if (isCorrect && !isSelected){ bg = "rgba(112,180,212,0.30)"; border = C.blue;  color = "#c0e0f0"; }
            else if (!isCorrect && isSelected){ bg = "rgba(217,96,96,0.35)";  border = C.red;   color = "#f0c0c0"; }
          }
          const isPair = r === c;
          const tappable = !revealed && inPreset;
          return (
            <button key={label} onClick={() => tappable && onToggle(label)} disabled={!tappable} style={{aspectRatio:"1",padding:0,fontSize:8.5,fontWeight:isPair?800:600,fontFamily:"'Inter',-apple-system,sans-serif",background:bg,border:`1px solid ${border}`,borderRadius:4,color,opacity,cursor:tappable?"pointer":"default",WebkitTapHighlightColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,outline:"none"}}>{label}</button>
          );
        })
      )}
    </div>
  );
}

const RANGE_QUESTIONS = [
  {
    id: "rng_proto_01", module: "3", category: "Range Narrowing", difficulty: "medium",
    scenario: "A TAG opens 3 BB from UTG (conservative 9.8% range). Everyone folds.",
    question: "Select every hand in a TAG's conservative UTG opening range.",
    correctRange: ["AA","KK","QQ","JJ","TT","99","88","77","66","AKs","AQs","AJs","ATs","KQs","KJs","JTs","AKo","AQo","AJo","KQo"],
    explanation: "UTG conservative = 66+, ATs+, KJs+, JTs, AJo+, KQo (9.8%). This is your App 1 knowledge applied in reverse — instead of deciding what to open, you reconstruct what villain opened. Range reading always starts from position + player type.",
  },
  {
    id: "rng_proto_02", module: "3", category: "Range Narrowing", difficulty: "hard",
    scenario: "A TAG opens UTG (9.8%). You call from BTN. Flop: K♠ 7♦ 2♣. The TAG c-bets 3/4 pot.",
    question: "A TAG c-bets this dry king-high flop with value hands and good semi-bluff candidates, checking medium-strength hands. Select the hands MOST likely in their c-betting range.",
    correctRange: ["AA","KK","77","AKs","AKo","KQs","AQs","AJs","ATs","AQo","AJo"],
    explanation: "On K72 rainbow a TAG value-bets AA, AK (top pair top kicker), KK/77 (sets), KQs. AQ/AJ/ATs c-bet as bluffs with overcard equity — this dry board misses their opponent's calling range so bluffing works. They check back QQ-88 (medium strength, pot control) and JTs (gives up). Note KK is in — flopped top set.",
  },
  {
    id: "rng_proto_03", module: "3", category: "Range Narrowing", difficulty: "hard",
    scenario: "A TAG opens UTG, you call BTN. Flop K♠ 7♦ 2♣ — TAG c-bets, you call. Turn: 3♥. The TAG fires a second barrel (double barrel).",
    question: "Your flop call signals a king or a pair to the TAG. They double-barrel only hands that beat your continuing range or have strong equity. Select their realistic double-barrel range.",
    correctRange: ["AA","KK","77","AKs","AKo"],
    explanation: "When you call the flop c-bet on K72, the TAG reads you for Kx or 88-QQ. The blank 3♥ changes nothing. A solid TAG now barrels only value: AA, AK, sets (KK, 77). The AQ/AJ bluffs from the flop give up — you called once, you're not folding to a second barrel. Range narrowed from 11 combo-types to 5. This street-by-street shrinking is the core of hand reading.",
  },
];

const SESSION_SIZES = [10, 15, 20, 34];

export default function App(){
  const [screen, setScreen] = useState("home");
  const [progress, setProgress] = useState(loadProgress);
  const [moduleF, setModuleF] = useState("all");
  const [sessionSize, setSessionSize] = useState(15);
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState({correct:0,wrong:0});
  const [streak, setStreak] = useState(0);
  const [gridSelected, setGridSelected] = useState(new Set());
  const scrollRef = useRef(null);

  useEffect(()=>saveProgress(progress),[progress]);

  const allQuestions = [...mod1, ...mod2, ...mod3, ...mod4, ...mod5, ...mod6, ...mod7];
  const filtered = allQuestions.filter(q => moduleF === "all" ? true : q.module === moduleF);

  const totalAttempts = Object.values(progress).reduce((a,p)=>a+p.seen,0);
  const totalCorrect = Object.values(progress).reduce((a,p)=>a+p.correct,0);
  const accuracy = totalAttempts>0?Math.round(totalCorrect/totalAttempts*100):0;
  const scores = allQuestions.map(q=>getScore(progress[q.id]));
  const counts = [0,1,2,3,4].map(s=>scores.filter(x=>x===s).length);

  function startSession(){
    if(!filtered.length)return;
    setQueue(weightedSample(filtered,progress,sessionSize));
    setIdx(0);setSelected(null);setRevealed(false);
    setGridSelected(new Set());
    setSession({correct:0,wrong:0});setStreak(0);
    setScreen("quiz");
  }

  function recordResult(qid, ok){
    setStreak(s=>ok?s+1:0);
    setSession(s=>({correct:s.correct+(ok?1:0),wrong:s.wrong+(ok?0:1)}));
    const prev=progress[qid]||{seen:0,correct:0};
    setProgress(p=>({...p,[qid]:{seen:prev.seen+1,correct:prev.correct+(ok?1:0)}}));
  }

  function chooseMC(i){
    if(revealed)return;
    setSelected(i);setRevealed(true);
    const q=queue[idx];
    recordResult(q.id, i===q.correct);
    setTimeout(()=>scrollRef.current?.scrollTo({top:0,behavior:"smooth"}),80);
  }

  function submitGrid(){
    if(revealed)return;
    const q=queue[idx];
    const correct=new Set(q.correctRange);
    let hits=0, wrong=0;
    gridSelected.forEach(h=>{ if(correct.has(h))hits++; else wrong++; });
    const pct = correct.size>0 ? hits/(correct.size+wrong) : 0;
    setRevealed(true);
    recordResult(q.id, pct>=0.7);
  }

  function next(){
    if(idx+1>=queue.length){setScreen("result");return;}
    setIdx(i=>i+1);setSelected(null);setRevealed(false);
    setGridSelected(new Set());
    scrollRef.current?.scrollTo({top:0,behavior:"instant"});
  }

  const q=queue[idx];
  const accent=q?(MOD_COLOR[q.module]||C.accent):C.accent;

  // ════════ MODULE 0 — INTRO ════════
  if(screen==="intro"){
    const sections = [
      {
        h: "The shift you're training",
        b: "Losing players ask: \"I have this hand — will I lose if they have something better?\" That's single-hand, fear-based thinking. Winning players ask: \"What does Villain's whole range look like, and how does this board hit their range versus mine?\" Every module here trains that second question until it becomes automatic.",
      },
      {
        h: "Why range thinking wins",
        b: "Villain doesn't have one hand — they have a range of possible hands based on their position and actions. The board hits that range in a predictable way. If you can see which hands they're likely to hold and how the board connects, you know how often they can continue, what they'll do, and how to respond — regardless of your own two cards.",
      },
      {
        h: "How the modules build",
        b: "Module 1 (Board × Range): which hands from a given position connect with a board. Module 2a (Whose Board?): judge which player's range a flop favors and why. Module 3 (Range Narrowing): watch a range shrink street by street as Villain's actions remove combos. Module 4 (Player Types): how Villain's type — nit, calling station, LAG, TAG — changes their range and your response. Module 5 (Your Response): only now does your hand matter — the action falls out of the read.",
      },
      {
        h: "The end state",
        b: "When this clicks, you'll pause on every flop — even hands you're not in — and instinctively ask \"whose board is this?\" The action becomes obvious because you've done the reading. The app builds the reflex; the tables cement it. This takes months, not a weekend. That's normal.",
      },
    ];
    return (
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,sans-serif",color:C.text,paddingTop:"env(safe-area-inset-top,0px)"}}>
        <div style={{maxWidth:430,margin:"0 auto",padding:"16px 20px 60px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
            <button onClick={()=>setScreen("home")} style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 14px",color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',-apple-system,sans-serif",WebkitTapHighlightColor:"transparent"}}>← Home</button>
            <span style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.14em",textTransform:"uppercase"}}>Module 0</span>
          </div>
          <h1 style={{margin:"0 0 6px",fontSize:30,fontWeight:900,color:C.cream,letterSpacing:"-0.03em",lineHeight:1.05}}>Why this<br/>works</h1>
          <p style={{margin:"0 0 28px",fontSize:13,color:C.muted}}>The thinking shift behind every module</p>

          {sections.map((s,i)=>(
            <div key={i} style={{marginBottom:18,background:C.bg2,borderRadius:14,border:`1px solid ${C.border}`,padding:"18px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:24,height:24,borderRadius:7,background:`${C.accent}22`,color:C.accent,fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                <h2 style={{margin:0,fontSize:16,fontWeight:800,color:C.cream}}>{s.h}</h2>
              </div>
              <p style={{margin:0,fontSize:14,fontWeight:500,color:C.sage,lineHeight:1.7}}>{s.b}</p>
            </div>
          ))}

          <button onClick={()=>setScreen("home")} style={{width:"100%",height:54,marginTop:8,borderRadius:14,background:C.accent,color:"#1a2218",fontSize:16,fontWeight:800,border:"none",cursor:"pointer",fontFamily:"'Inter',-apple-system,sans-serif",WebkitTapHighlightColor:"transparent"}}>Start training →</button>
        </div>
      </div>
    );
  }

  if(screen==="home")return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,sans-serif",color:C.text,paddingTop:"env(safe-area-inset-top,0px)"}}>
      <div style={{maxWidth:430,margin:"0 auto",padding:"28px 20px 170px"}}>
        <div style={{marginBottom:26}}>
          <p style={{margin:"0 0 5px",fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.14em",textTransform:"uppercase"}}>Level 2 · Postflop · TAG baseline</p>
          <h1 style={{margin:0,fontSize:34,fontWeight:900,color:C.cream,letterSpacing:"-0.03em",lineHeight:1.05}}>Postflop<br/>Trainer</h1>
        </div>

        <div style={{background:C.bg2,borderRadius:14,border:`1px solid ${C.border}`,padding:"18px 16px",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:5}}>Progress</div>
              <div style={{fontSize:28,fontWeight:900,color:C.accent,letterSpacing:"-0.02em",lineHeight:1}}>{accuracy>0?`${accuracy}%`:"—"}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>{totalAttempts} attempts · {allQuestions.length} questions total</div>
            </div>
            <div>
              {[["Mastered",4],["Solid",3],["Learning",2],["Struggling",1],["Unseen",0]].map(([l,s])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:SCORE_COLOR[s],flexShrink:0}}/>
                  <span style={{fontSize:11,color:C.muted,width:72}}>{l}</span>
                  <span style={{fontSize:11,fontWeight:700,color:counts[s]>0?SCORE_COLOR[s]:C.border}}>{counts[s]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",gap:1}}>
            {[4,3,2,1,0].map(s=>(
              <div key={s} style={{flex:counts[s],background:SCORE_COLOR[s],minWidth:counts[s]>0?2:0,transition:"flex .5s"}}/>
            ))}
          </div>
        </div>

        <button onClick={()=>setScreen("intro")} style={{width:"100%",height:48,marginBottom:18,borderRadius:12,background:C.bg2,border:`1px solid ${C.accent}40`,color:C.accent,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',-apple-system,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,WebkitTapHighlightColor:"transparent"}}>
          <span style={{fontSize:15}}>◆</span> Module 0 — Why this works (read first)
        </button>

        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Module</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:22}}>
          {[
            {key:"all", label:"All Modules",            sub:`${allQuestions.length} questions`,                  color:C.accent},
            {key:"1",   label:"1 · Board Texture",      sub:"Wet/dry & whose range a board favors",             color:MOD_COLOR["1"]},
            {key:"2",   label:"2 · Hand-Strength Tiers", sub:"Strong / medium / draw / weak \u2014 the 4 buckets", color:MOD_COLOR["2"]},
            {key:"3",   label:"3 · The C-Bet Decision",  sub:"The 9 factors: when to bet, check, delay",         color:MOD_COLOR["3"]},
            {key:"4",   label:"4 · Turn & River Barrels", sub:"Double/triple barrel & when to give up",          color:MOD_COLOR["4"]},
            {key:"5",   label:"5 · Playing as the Caller", sub:"Postflop when you're NOT the aggressor",          color:MOD_COLOR["5"]},
            {key:"6",   label:"6 · Range Reading",       sub:"Relative strength; narrow villain's range",        color:MOD_COLOR["6"]},
            {key:"7",   label:"7 · Read & Exploit",      sub:"HUD stats \u2192 player types \u2192 deviations",    color:MOD_COLOR["7"]},
          ].map(m=>{
            const active = moduleF===m.key;
            const count = m.key==="all"?allQuestions.length:allQuestions.filter(q=>q.module===m.key).length;
            return(
              <button key={m.key} onClick={()=>setModuleF(m.key)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderRadius:12,border:`1.5px solid ${active?m.color:C.border}`,background:active?`${m.color}18`:C.bg2,cursor:"pointer",textAlign:"left",fontFamily:"'Inter',-apple-system,sans-serif",WebkitTapHighlightColor:"transparent"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:active?m.color:C.text,marginBottom:2}}>{m.label}</div>
                  <div style={{fontSize:11,color:C.muted}}>{m.sub}</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:active?m.color:C.muted,background:active?`${m.color}20`:C.bg3,padding:"4px 10px",borderRadius:8}}>{count}</div>
              </button>
            );
          })}
        </div>

        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:9}}>Session size</div>
        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {SESSION_SIZES.map(n=>(
            <button key={n} onClick={()=>setSessionSize(n)} style={{flex:1,height:36,borderRadius:10,border:`1.5px solid ${sessionSize===n?C.accent:C.border}`,background:sessionSize===n?`${C.accent}28`:"transparent",color:sessionSize===n?C.accent:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',-apple-system,sans-serif",WebkitTapHighlightColor:"transparent"}}>{n}</button>
          ))}
        </div>
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:`linear-gradient(transparent,${C.bg} 32%,${C.bg})`,padding:"16px 20px",paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 16px)"}}>
        <button onClick={startSession} disabled={!filtered.length} style={{width:"100%",height:56,borderRadius:14,background:filtered.length?C.accent:"#2e3d2b",color:filtered.length?"#1a2218":C.muted,fontSize:16,fontWeight:800,border:"none",cursor:filtered.length?"pointer":"default",fontFamily:"'Inter',-apple-system,sans-serif",letterSpacing:"-0.01em",boxShadow:filtered.length?"0 0 32px rgba(200,168,75,0.22)":"none",WebkitTapHighlightColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {filtered.length>0?<><span>Start {Math.min(sessionSize,filtered.length)} questions</span><span style={{background:"rgba(0,0,0,0.18)",borderRadius:8,padding:"2px 10px",fontSize:13,fontWeight:800}}>SR</span></>:"No questions"}
        </button>
        {totalAttempts>0&&(
          <button onClick={()=>{setProgress({});saveProgress({});}} style={{width:"100%",marginTop:8,height:40,borderRadius:10,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"'Inter',-apple-system,sans-serif",WebkitTapHighlightColor:"transparent"}}>Reset progress</button>
        )}
      </div>
    </div>
  );

  if(screen==="quiz"&&q){
    const isGrid = !!q.correctRange;
    const qScore = getScore(progress[q.id]);
    const correctSet = isGrid ? new Set(q.correctRange) : null;

    let gridStats = null;
    if (isGrid && revealed) {
      let hits=0, wrong=0, missed=0;
      gridSelected.forEach(h=>{ if(correctSet.has(h))hits++; else wrong++; });
      correctSet.forEach(h=>{ if(!gridSelected.has(h))missed++; });
      gridStats = {hits, wrong, missed, total:correctSet.size};
    }

    return(
      <div style={{position:"fixed",inset:0,background:C.bg,color:C.text,fontFamily:"'Inter',-apple-system,sans-serif",display:"flex",flexDirection:"column",paddingTop:"env(safe-area-inset-top,0px)",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        <div style={{flexShrink:0,padding:"12px 18px 8px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <button onClick={()=>setScreen("home")} style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 14px",color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',-apple-system,sans-serif",WebkitTapHighlightColor:"transparent"}}>← Home</button>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {streak>0&&<span style={{fontSize:13,fontWeight:700,color:C.green,background:"rgba(109,184,122,0.15)",padding:"4px 10px",borderRadius:8}}>🔥 {streak}</span>}
              <span style={{fontSize:11,fontWeight:700,color:DIFF_COLOR[q.difficulty],background:`${DIFF_COLOR[q.difficulty]}22`,padding:"4px 10px",borderRadius:8,textTransform:"capitalize"}}>{q.difficulty}</span>
              <span style={{fontSize:13,fontWeight:700,color:C.muted}}>{idx+1}<span style={{color:C.border}}>/{queue.length}</span></span>
            </div>
          </div>
          <div style={{height:3,background:C.bg3,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${((idx+1)/queue.length)*100}%`,background:accent,borderRadius:2,transition:"width .25s"}}/>
          </div>
        </div>

        <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"8px 18px 24px",WebkitOverflowScrolling:"touch"}}>
          <div style={{maxWidth:430,margin:"0 auto"}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:800,color:accent,background:`${accent}20`,padding:"4px 10px",borderRadius:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>{q.category}</span>
              {q.sequence && (
                <span style={{fontSize:11,fontWeight:700,color:"#a98fe8",background:"rgba(169,143,232,0.16)",padding:"4px 10px",borderRadius:8}}>Hand {q.sequence} · Step {q.step}</span>
              )}
              <span style={{fontSize:10,fontWeight:700,color:SCORE_COLOR[qScore],background:`${SCORE_COLOR[qScore]}18`,padding:"4px 10px",borderRadius:8,marginLeft:"auto"}}>{SCORE_LABEL[qScore]}</span>
            </div>

            <div style={{background:C.bg2,borderRadius:16,border:`1px solid ${accent}30`,padding:"18px",marginBottom:12}}>
              {q.scenario && (
                <p style={{margin:"0 0 12px",fontSize:13,fontWeight:500,color:C.sage,lineHeight:1.6}}>{q.scenario}</p>
              )}
              {q.hud && (
                <div style={{margin:"0 0 14px",padding:"10px 14px",background:"rgba(224,132,90,0.10)",border:"1px solid rgba(224,132,90,0.3)",borderRadius:10}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#e0845a",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>HUD</div>
                  <div style={{fontSize:13,fontWeight:600,color:C.cream,fontFamily:"'Inter',-apple-system,sans-serif"}}>{q.hud}</div>
                </div>
              )}
              {q.board && (
                <div style={{marginBottom:14}}><Board boardStr={q.board}/></div>
              )}
              <p style={{margin:0,fontSize:16,fontWeight:700,color:C.cream,lineHeight:1.5,letterSpacing:"-0.01em"}}>{q.question}</p>
            </div>

            {!isGrid ? (
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {q.options.map((opt,i)=>{
                  let bg=C.bg2,bc=C.border,tc=C.sage,icon=null;
                  if(revealed){
                    if(i===q.correct){bg="rgba(109,184,122,0.10)";bc=C.green;tc="#8fd49e";icon="✓";}
                    else if(i===selected){bg="rgba(217,96,96,0.10)";bc=C.red;tc=C.red;icon="✗";}
                    else{tc=C.border;}
                  }
                  return(
                    <button key={i} onClick={()=>chooseMC(i)} disabled={revealed} style={{width:"100%",minHeight:54,padding:"14px 16px",borderRadius:12,border:`1.5px solid ${bc}`,background:bg,color:tc,fontSize:14,fontWeight:600,cursor:revealed?"default":"pointer",textAlign:"left",fontFamily:"'Inter',-apple-system,sans-serif",lineHeight:1.45,display:"flex",alignItems:"center",justifyContent:"space-between",outline:"none",WebkitTapHighlightColor:"transparent"}}>
                      <span style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                        <span style={{fontSize:11,fontWeight:800,color:revealed?tc:C.border,flexShrink:0,marginTop:2}}>{String.fromCharCode(65+i)}</span>
                        <span>{opt}</span>
                      </span>
                      {icon&&<span style={{fontWeight:900,fontSize:18,flexShrink:0,marginLeft:12}}>{icon}</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{q.preset_range ? "Narrow from the previous range" : "Tap hands to select"}</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.accent}}>{gridSelected.size} selected</span>
                </div>
                <RangeGrid
                  selected={gridSelected}
                  onToggle={(h)=>{
                    const nx=new Set(gridSelected);
                    nx.has(h)?nx.delete(h):nx.add(h);
                    setGridSelected(nx);
                  }}
                  revealed={revealed}
                  correctSet={correctSet}
                  presetSet={q.preset_range ? new Set(q.preset_range) : null}
                />
                {revealed && gridStats && (
                  <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:C.green,fontWeight:700}}>✓ {gridStats.hits} hit</span>
                    <span style={{fontSize:12,color:C.blue,fontWeight:700}}>○ {gridStats.missed} missed</span>
                    <span style={{fontSize:12,color:C.red,fontWeight:700}}>✗ {gridStats.wrong} too loose</span>
                  </div>
                )}
                {!revealed && (
                  <button onClick={submitGrid} disabled={gridSelected.size===0} style={{width:"100%",height:50,marginTop:12,borderRadius:12,background:gridSelected.size>0?C.purple:C.bg3,color:gridSelected.size>0?"#1a2218":C.muted,fontSize:15,fontWeight:800,border:"none",cursor:gridSelected.size>0?"pointer":"default",fontFamily:"'Inter',-apple-system,sans-serif",WebkitTapHighlightColor:"transparent"}}>
                    Check my range
                  </button>
                )}
              </div>
            )}

            {revealed && q.stat_raiser && (
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <div style={{flex:1,background:C.bg2,borderRadius:12,border:`1px solid ${C.border}`,padding:"12px 14px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>Raiser range</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#70b4d4"}}>{q.stat_raiser}</div>
                </div>
                <div style={{flex:1,background:C.bg2,borderRadius:12,border:`1px solid ${C.border}`,padding:"12px 14px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>Caller range</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#e0845a"}}>{q.stat_caller}</div>
                </div>
              </div>
            )}
            {revealed&&(
              <div style={{background:"rgba(109,184,122,0.07)",borderRadius:14,border:"1px solid rgba(109,184,122,0.2)",padding:"16px",marginBottom:12}}>
                {q.draws && (
                  <div style={{marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
                    <p style={{margin:"0 0 4px",fontSize:10,fontWeight:800,color:C.blue,letterSpacing:"0.12em",textTransform:"uppercase"}}>Draws present</p>
                    <p style={{margin:0,fontSize:13,fontWeight:500,color:C.sage,lineHeight:1.6}}>{q.draws}</p>
                  </div>
                )}
                <p style={{margin:0,fontSize:14,fontWeight:500,color:C.sage,lineHeight:1.7}}>{q.explanation}</p>
              </div>
            )}

            {revealed&&(
              <button onClick={next} style={{width:"100%",height:56,borderRadius:14,background:C.accent,color:"#1a2218",fontSize:16,fontWeight:800,border:"none",cursor:"pointer",fontFamily:"'Inter',-apple-system,sans-serif",letterSpacing:"-0.01em",boxShadow:"0 0 28px rgba(200,168,75,0.2)",WebkitTapHighlightColor:"transparent",marginBottom:4}}>
                {idx+1>=queue.length?"See Results →":"Next →"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if(screen==="result"){
    const total=session.correct+session.wrong;
    const acc=total>0?Math.round(session.correct/total*100):0;
    const grade=acc>=85?{l:"Excellent",c:C.green}:acc>=65?{l:"Good",c:C.accent}:{l:"Keep drilling",c:C.red};
    return(
      <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter',-apple-system,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",textAlign:"center",paddingTop:"calc(env(safe-area-inset-top,0px) + 32px)",paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 32px)"}}>
        <div style={{fontSize:52,marginBottom:16}}>🃏</div>
        <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.14em",textTransform:"uppercase"}}>Session Complete</p>
        <h2 style={{margin:"0 0 4px",fontSize:56,fontWeight:900,color:C.cream,letterSpacing:"-0.04em",lineHeight:1}}>{acc}%</h2>
        <p style={{margin:"0 0 32px",fontSize:14,fontWeight:700,color:grade.c,letterSpacing:"0.06em",textTransform:"uppercase"}}>{grade.l}</p>
        <div style={{width:"100%",maxWidth:340,background:C.bg2,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px",marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[["Correct",session.correct,C.green],["Wrong",session.wrong,C.red],["Total",total,C.accent]].map(([l,v,c])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:900,color:c,letterSpacing:"-0.02em"}}>{v}</div>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{width:"100%",maxWidth:340}}>
          <button onClick={startSession} style={{width:"100%",height:56,borderRadius:14,background:C.accent,color:"#1a2218",fontSize:16,fontWeight:800,border:"none",cursor:"pointer",marginBottom:10,fontFamily:"'Inter',-apple-system,sans-serif",boxShadow:"0 0 28px rgba(200,168,75,0.2)",WebkitTapHighlightColor:"transparent"}}>Another {sessionSize}</button>
          <button onClick={()=>setScreen("home")} style={{width:"100%",height:46,borderRadius:12,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',-apple-system,sans-serif",WebkitTapHighlightColor:"transparent"}}>← Back to Home</button>
        </div>
      </div>
    );
  }
  return null;
}
