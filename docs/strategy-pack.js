const STRATEGY_KEY='arcana_strategy_pack_v1';
const PROFILE_KEY='arcana_profile_v2';
const PACK_VERSION='0.9.2-economy';
const SEASON_DAYS=30;
const SEASON_EPOCH=new Date('2026-08-01T00:00:00Z').getTime();
const DAY=86400000;

const DOCTRINES={
  balanced:{id:'balanced',icon:'⚖️',name:'Equilíbrio',desc:'Curva estável, mão inicial equilibrada e +1 reembaralhamento.',bonus:'Mais consistência, menos extremos.'},
  aggro:{id:'aggro',icon:'🔥',name:'Pressão',desc:'Prioriza criaturas baratas e ameaças rápidas no topo da Reserva.',bonus:'Começos mais explosivos.'},
  control:{id:'control',icon:'🛡️',name:'Controle',desc:'Prioriza Guardas, remoções, cura e cartas de maior impacto.',bonus:'Mais respostas e jogo longo.'},
  tempo:{id:'tempo',icon:'⚡',name:'Tempo',desc:'Prioriza custos 2–4, compra de cartas e cartas de valor imediato.',bonus:'Turnos mais eficientes.'}
};

const RANKS=[
  {name:'Bronze',min:0,icon:'🥉'},
  {name:'Prata',min:300,icon:'🥈'},
  {name:'Ouro',min:700,icon:'🥇'},
  {name:'Platina',min:1200,icon:'💠'},
  {name:'Arcano',min:1800,icon:'🔮'},
  {name:'Lenda',min:2600,icon:'👑'}
];

function parse(v,f=null){try{return JSON.parse(v)}catch{return f}}
function todayKey(){return new Date().toISOString().slice(0,10)}
function weekKey(){
  const d=new Date(), onejan=new Date(d.getFullYear(),0,1);
  const w=Math.ceil((((d-onejan)/DAY)+onejan.getDay()+1)/7);
  return `${d.getFullYear()}-W${String(w).padStart(2,'0')}`;
}
function seasonInfo(){
  const idx=Math.max(0,Math.floor((Date.now()-SEASON_EPOCH)/(SEASON_DAYS*DAY)));
  const start=SEASON_EPOCH+idx*SEASON_DAYS*DAY;
  const end=start+SEASON_DAYS*DAY;
  return {id:`S${idx+1}`,number:idx+1,start,end,daysLeft:Math.max(0,Math.ceil((end-Date.now())/DAY))};
}
function fresh(){
  const s=seasonInfo();
  return {
    version:1,
    doctrine:'balanced',
    seasonId:s.id,
    seasonXp:0,
    seasonLevel:1,
    claimed:[],
    coins:0,
    essence:0,
    rankedPoints:0,
    wins:0,
    losses:0,
    streak:0,
    bestStreak:0,
    matches:0,
    cardsPlayed:0,
    missions:{dailyKey:'',weeklyKey:'',items:[]},
    achievements:{},
    titles:['Iniciado'],
    selectedTitle:'Iniciado',
    cosmetics:[],
    lastMatchId:null,
    appliedMatchId:null
  };
}
function load(){
  const base=fresh(), saved=parse(localStorage.getItem(STRATEGY_KEY),{})||{};
  const s={...base,...saved,missions:{...base.missions,...(saved.missions||{})},achievements:{...(saved.achievements||{})}};
  const season=seasonInfo();
  if(s.seasonId!==season.id){
    s.seasonId=season.id;s.seasonXp=0;s.seasonLevel=1;s.claimed=[];
    s.rankedPoints=Math.floor((s.rankedPoints||0)*.65);
  }
  ensureMissions(s);
  return s;
}
let state=load();
function save(){
  state.seasonLevel=Math.max(1,Math.min(30,1+Math.floor((state.seasonXp||0)/180)));
  localStorage.setItem(STRATEGY_KEY,JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('arcana:economy',{detail:{coins:Number(state.coins||0),essence:Number(state.essence||0)}}));
  renderHub();
}
function addReward({xp=0,coins=0,essence=0}={}){
  state.seasonXp=(state.seasonXp||0)+xp;
  state.coins=(state.coins||0)+coins;
  state.essence=(state.essence||0)+essence;
}
function spend(currency,amount){
  if(!['coins','essence'].includes(currency)||!Number.isFinite(amount)||amount<=0)return false;
  if(Number(state[currency]||0)<amount)return false;
  state[currency]=Number(state[currency]||0)-amount;save();return true;
}
function grant(reward={}){addReward(reward);save();return state}
function resetMissions(){state.missions={dailyKey:'',weeklyKey:'',items:[]};ensureMissions(state);save();return state.missions}
function rank(){
  let r=RANKS[0];
  for(const x of RANKS)if(state.rankedPoints>=x.min)r=x;
  return r;
}
function dailyTemplates(){
  return [
    {id:'d_win1',label:'Vença 1 partida',type:'win',goal:1,reward:{xp:90,coins:80}},
    {id:'d_play2',label:'Jogue 2 partidas',type:'match',goal:2,reward:{xp:70,coins:60}},
    {id:'d_cards12',label:'Jogue 12 cartas',type:'card',goal:12,reward:{xp:80,coins:50}},
    {id:'d_win2',label:'Vença 2 partidas',type:'win',goal:2,reward:{xp:130,coins:110}},
    {id:'d_cards20',label:'Jogue 20 cartas',type:'card',goal:20,reward:{xp:110,essence:25}}
  ];
}
function weeklyTemplates(){
  return [
    {id:'w_win5',label:'Vença 5 partidas',type:'win',goal:5,reward:{xp:350,coins:300,essence:50}},
    {id:'w_play10',label:'Jogue 10 partidas',type:'match',goal:10,reward:{xp:300,coins:250}},
    {id:'w_cards80',label:'Jogue 80 cartas',type:'card',goal:80,reward:{xp:320,essence:80}}
  ];
}
function seededPick(arr,seed,count){
  let x=0;for(const c of seed)x=(x*31+c.charCodeAt(0))>>>0;
  const pool=[...arr],out=[];
  while(pool.length&&out.length<count){
    x=(1664525*x+1013904223)>>>0;
    out.push(pool.splice(x%pool.length,1)[0]);
  }
  return out;
}
function ensureMissions(s){
  const dk=todayKey(),wk=weekKey();
  if(s.missions.dailyKey!==dk){
    const oldWeekly=(s.missions.items||[]).filter(x=>x.scope==='weekly'&&s.missions.weeklyKey===wk);
    s.missions.dailyKey=dk;
    s.missions.items=[
      ...seededPick(dailyTemplates(),dk,3).map(x=>({...x,scope:'daily',progress:0,claimed:false})),
      ...oldWeekly
    ];
  }
  if(s.missions.weeklyKey!==wk){
    s.missions.weeklyKey=wk;
    s.missions.items=[
      ...(s.missions.items||[]).filter(x=>x.scope==='daily'),
      ...seededPick(weeklyTemplates(),wk,2).map(x=>({...x,scope:'weekly',progress:0,claimed:false}))
    ];
  }
}
function progress(type,amount=1){
  ensureMissions(state);
  for(const m of state.missions.items||[])if(m.type===type&&!m.claimed)m.progress=Math.min(m.goal,(m.progress||0)+amount);
}
function missionClaim(id){
  const m=(state.missions.items||[]).find(x=>x.id===id&&x.progress>=x.goal&&!x.claimed);
  if(!m)return;
  m.claimed=true;addReward(m.reward);toast(`Missão concluída: +${m.reward.xp||0} XP`);
  save();
}
function seasonReward(level){
  if(level%10===0)return {coins:500,essence:140,label:'Baú Arcano'};
  if(level%5===0)return {coins:260,essence:70,label:'Baú Raro'};
  if(level%3===0)return {essence:35,label:'Essência'};
  return {coins:100,label:'Ouro'};
}
function claimSeason(level){
  if(level>state.seasonLevel||state.claimed.includes(level))return;
  const r=seasonReward(level);addReward(r);state.claimed.push(level);
  toast(`Recompensa do nível ${level} coletada`);
  save();
}
function checkAchievements(){
  const checks=[
    ['first_win',state.wins>=1,'Primeira Vitória'],
    ['wins10',state.wins>=10,'Veterano'],
    ['cards100',state.cardsPlayed>=100,'Arquimago'],
    ['streak5',state.bestStreak>=5,'Imparável'],
    ['rank1000',state.rankedPoints>=1000,'Competidor']
  ];
  for(const [id,ok,title] of checks){
    if(ok&&!state.achievements[id]){
      state.achievements[id]=Date.now();
      if(!state.titles.includes(title))state.titles.push(title);
      toast(`Conquista desbloqueada: ${title}`);
    }
  }
}
function cardScore(c,mode){
  const cost=Number(c.cost??c.playCost??0),txt=`${c.text||''} ${(c.kw||[]).join(' ')}`.toLowerCase();
  const unit=c.type==='unit',spell=c.type==='spell';
  if(mode==='aggro')return (unit?7:0)+(cost<=2?9:cost<=4?4:-3)+(txt.includes('investida')?6:0)+(c.atk||0)*.8;
  if(mode==='control')return (spell?5:0)+(txt.includes('guarda')?7:0)+(txt.includes('cause')?5:0)+(txt.includes('destrua')?8:0)+(txt.includes('cure')?5:0)+(cost>=4?3:0)+(c.hp||0)*.35;
  if(mode==='tempo')return (cost>=2&&cost<=4?8:0)+(txt.includes('compre')?7:0)+(txt.includes('escudo')?4:0)+(unit?2:0);
  const desired={1:6,2:9,3:8,4:6,5:3}[cost]||1;
  return desired+(unit?3:0)+(spell?2:0);
}
function applyDoctrineToGame(){
  const api=globalThis.__ARCANA;
  const g=api?.state?.();
  if(!g||!g.id||state.appliedMatchId===g.id||!g.p?.[0])return;
  const p=g.p[0], mode=state.doctrine||'balanced';
  const deck=[...(p.deck||[])];
  deck.sort((a,b)=>cardScore(a,mode)-cardScore(b,mode));
  p.deck=deck;
  p.rerolls=(p.rerolls||0)+1;
  if(mode==='control')p.maxHp=(p.maxHp||p.hp)+2,p.hp=Math.min(p.maxHp,p.hp+2);
  if(mode==='tempo')p.bonusNext=(p.bonusNext||0)+1;
  if(mode==='aggro'){
    for(const c of p.hand||[])if(c.type==='unit'&&Number(c.cost)<=2){c.age=1;break}
  }
  state.appliedMatchId=g.id;
  save();
  showDoctrineBadge();
  toast(`${DOCTRINES[mode].icon} Doutrina ${DOCTRINES[mode].name} preparada`);
}
function showDoctrineBadge(){
  let el=document.getElementById('strategyDoctrineBadge');
  if(!el){
    el=document.createElement('div');el.id='strategyDoctrineBadge';
    const bar=document.getElementById('eventBar');bar?.after(el);
  }
  const d=DOCTRINES[state.doctrine]||DOCTRINES.balanced;
  if(el)el.textContent=`${d.icon} ${d.name} · Reserva reordenada por plano tático`;
}

function toast(text){
  let e=document.getElementById('strategyToast');
  if(!e){e=document.createElement('div');e.id='strategyToast';document.body.appendChild(e)}
  e.textContent=text;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2200);
}

function ensureButton(){
  const actions=document.querySelector('.homeActions');
  if(!actions||document.getElementById('strategyHubBtn'))return;
  const b=document.createElement('button');b.id='strategyHubBtn';b.className='ghost';b.textContent='♟ ESTRATÉGIA & TEMPORADA';b.onclick=openHub;actions.prepend(b);
  const v=document.getElementById('appVersion');if(v)v.textContent='0.9.1';
}
function buildHub(){
  if(document.getElementById('strategyHub'))return;
  const root=document.createElement('section');root.id='strategyHub';root.className='strategyHub hidden';
  root.innerHTML=`<div class="strategyBackdrop"></div><div class="strategyPanel">
    <header><div><small>ARCANA CLASH · STRATEGY PACK</small><h2>Centro Estratégico</h2></div><button id="strategyClose">×</button></header>
    <nav class="strategyTabs">
      <button data-tab="plan" class="active">PLANO</button>
      <button data-tab="missions">MISSÕES</button>
      <button data-tab="season">TEMPORADA</button>
      <button data-tab="profile">PERFIL</button>
    </nav>
    <div id="strategyContent"></div>
  </div>`;
  document.body.appendChild(root);
  root.querySelector('.strategyBackdrop').onclick=closeHub;root.querySelector('#strategyClose').onclick=closeHub;
  root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{root.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));renderTab(b.dataset.tab)});
}
function openHub(){buildHub();document.getElementById('strategyHub').classList.remove('hidden');renderTab('plan')}
function closeHub(){document.getElementById('strategyHub')?.classList.add('hidden')}
function renderTab(tab){
  const c=document.getElementById('strategyContent');if(!c)return;
  if(tab==='plan')renderPlan(c);else if(tab==='missions')renderMissions(c);else if(tab==='season')renderSeason(c);else renderProfile(c);
}
function renderPlan(c){
  c.innerHTML=`<div class="strategyIntro"><span>♟</span><div><b>MENOS SORTE. MAIS PLANO.</b><p>A doutrina reorganiza sua Reserva no início da partida usando as cartas que você já recebeu. Ela não cria carta perfeita: reduz extremos e deixa seu plano importar mais.</p></div></div>
  <div class="doctrineGrid">${Object.values(DOCTRINES).map(d=>`<button class="doctrineCard ${state.doctrine===d.id?'selected':''}" data-doctrine="${d.id}">
    <span>${d.icon}</span><b>${d.name}</b><p>${d.desc}</p><small>${d.bonus}</small>
  </button>`).join('')}</div>
  <div class="strategyRules"><b>REGRAS TÁTICAS</b><div>✓ +1 reembaralhamento por partida</div><div>✓ Reserva ordenada pela sua doutrina</div><div>✓ Controle: +2 vida máxima</div><div>✓ Tempo: +1 mana no primeiro ciclo</div><div>✓ Pressão: primeira unidade barata preparada para atacar cedo</div></div>`;
  c.querySelectorAll('[data-doctrine]').forEach(b=>b.onclick=()=>{state.doctrine=b.dataset.doctrine;save();renderPlan(c);toast(`Doutrina: ${DOCTRINES[state.doctrine].name}`)});
}
function renderMissions(c){
  ensureMissions(state);
  const rows=(state.missions.items||[]).map(m=>{
    const done=m.progress>=m.goal, reward=[m.reward.xp?`${m.reward.xp} XP`:null,m.reward.coins?`${m.reward.coins} ouro`:null,m.reward.essence?`${m.reward.essence} essência`:null].filter(Boolean).join(' · ');
    return `<div class="missionRow ${done?'done':''}"><div><small>${m.scope==='daily'?'DIÁRIA':'SEMANAL'}</small><b>${m.label}</b><span>${Math.min(m.progress,m.goal)}/${m.goal} · ${reward}</span></div><button data-claim-mission="${m.id}" ${!done||m.claimed?'disabled':''}>${m.claimed?'COLETADO':'COLETAR'}</button></div>`;
  }).join('');
  c.innerHTML=`<div class="sectionHead"><div><small>RENOVAÇÃO AUTOMÁTICA</small><h3>Missões</h3></div><div class="wallet">🪙 ${state.coins} · ✦ ${state.essence}</div></div>${rows}`;
  c.querySelectorAll('[data-claim-mission]').forEach(b=>b.onclick=()=>missionClaim(b.dataset.claimMission));
}
function renderSeason(c){
  const s=seasonInfo(), pct=((state.seasonXp%180)/180)*100;
  c.innerHTML=`<div class="sectionHead"><div><small>${s.id} · ${s.daysLeft} DIAS RESTANTES</small><h3>Temporada ${s.number}: Ascensão</h3></div><div class="rankPill">${rank().icon} ${rank().name}</div></div>
  <div class="seasonProgress"><div><b>NÍVEL ${state.seasonLevel}</b><span>${state.seasonXp%180}/180 XP</span></div><i><em style="width:${pct}%"></em></i></div>
  <div class="seasonTrack">${Array.from({length:30},(_,i)=>i+1).map(l=>{const r=seasonReward(l),open=l<=state.seasonLevel,claimed=state.claimed.includes(l);return `<button class="seasonNode ${open?'open':''} ${claimed?'claimed':''}" data-season="${l}" ${!open||claimed?'disabled':''}><small>${l}</small><span>${l%10===0?'👑':l%5===0?'💎':l%3===0?'✦':'🪙'}</span><b>${r.label}</b></button>`}).join('')}</div>`;
  c.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>claimSeason(Number(b.dataset.season)));
}
function renderProfile(c){
  const r=rank(), profile=parse(localStorage.getItem(PROFILE_KEY),{});
  const wr=state.matches?Math.round(state.wins/state.matches*100):0;
  c.innerHTML=`<div class="profileHero"><div class="profileOrb">${r.icon}</div><div><small>${state.selectedTitle}</small><h3>${profile.displayName||'Arcano'}</h3><p>${r.name} · ${state.rankedPoints} RP</p></div></div>
  <div class="statGrid"><div><b>${state.matches}</b><span>PARTIDAS</span></div><div><b>${state.wins}</b><span>VITÓRIAS</span></div><div><b>${wr}%</b><span>WIN RATE</span></div><div><b>${state.bestStreak}</b><span>MELHOR SEQUÊNCIA</span></div><div><b>${state.cardsPlayed}</b><span>CARTAS</span></div><div><b>${state.seasonLevel}</b><span>NÍVEL DA TEMPORADA</span></div></div>
  <h4>TÍTULO EQUIPADO</h4><select id="strategyTitle">${state.titles.map(t=>`<option ${t===state.selectedTitle?'selected':''}>${t}</option>`).join('')}</select>
  <div class="achievementList">${Object.entries(state.achievements).map(([id])=>`<span>🏆 ${id.replaceAll('_',' ')}</span>`).join('')||'<span>Jogue para desbloquear conquistas.</span>'}</div>`;
  c.querySelector('#strategyTitle')?.addEventListener('change',e=>{state.selectedTitle=e.target.value;save()});
}
function renderHub(){
  if(!document.getElementById('strategyHub')?.classList.contains('hidden')){
    const active=document.querySelector('.strategyTabs .active')?.dataset.tab||'plan';renderTab(active);
  }
}
function onMatch(ev){
  const d=ev.detail||{};
  const api=globalThis.__ARCANA,g=api?.state?.(), matchId=g?.id||`${Date.now()}-${state.matches}`;
  if(state.lastMatchId===matchId)return;
  state.lastMatchId=matchId;state.matches++;progress('match');
  if(d.win){state.wins++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.rankedPoints+=65;progress('win');addReward({xp:60,coins:35})}
  else{state.losses++;state.streak=0;state.rankedPoints=Math.max(0,state.rankedPoints-28);addReward({xp:25,coins:12})}
  if(d.boss&&d.win)addReward({xp:120,coins:100,essence:25});
  checkAchievements();save();
}
function onCard(){state.cardsPlayed++;progress('card');if(state.cardsPlayed%10===0)addReward({xp:8});checkAchievements();save()}
function install(){
  const css=document.createElement('link');css.rel='stylesheet';css.href='./strategy-pack.css';document.head.appendChild(css);
  ensureButton();buildHub();ensureMissions(state);save();
  window.addEventListener('arcana:match',onMatch);
  window.addEventListener('arcana:card',onCard);
  setInterval(()=>{ensureButton();applyDoctrineToGame()},450);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
globalThis.ArcanaStrategy={open:openHub,state:()=>state,save,spend,grant,resetMissions,version:PACK_VERSION};
