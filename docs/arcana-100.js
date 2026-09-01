(()=>{
'use strict';

const VERSION='1.3.0';
const PROFILE_KEY='arcana_profile_v2';
const STRATEGY_KEY='arcana_strategy_pack_v1';
const META_KEY='arcana_release_100_v1';
const REPLAY_KEY='arcana_replays_v1';
const MAX_REPLAYS=12;
const RARITY={
  comum:{name:'Comum',cost:40,refund:12,tone:'#9eb0c7'},
  rara:{name:'Rara',cost:100,refund:30,tone:'#57d8ff'},
  'épica':{name:'Épica',cost:250,refund:75,tone:'#b67cff'},
  'lendária':{name:'Lendária',cost:600,refund:180,tone:'#ffd05f'},
  secreta:{name:'Secreta',cost:0,refund:0,tone:'#ff65c7'}
};
const MASTERIES={
  vanguard:[['bastion','Bastião','Comece o PvE com +1 de vida máxima.'],['arsenal','Arsenal','Comece o PvE com +1 reembaralhamento.'],['oath','Juramento','Dominar as 3 rotas exige só 2 marcas.']],
  pyromancer:[['ember','Brasa Viva','Comece o PvE com +1 mana temporária.'],['furnace','Fornalha','A primeira rota dominada concede +1 mana.'],['inferno','Inferno Arcano','Vitórias rendem +25% de Maestria.']],
  necromancer:[['echo','Eco Persistente','Comece o PvE com +1 reembaralhamento.'],['pact','Pacto Profundo','Comece o PvE com +1 de vida máxima.'],['king','Rei sem Túmulo','Vitórias rendem +25% de Maestria.']],
  druid:[['seed','Semente Ancestral','Comece o PvE com +2 de vida máxima.'],['grove','Bosque Vivo','Domínio de rota também cura 1.'],['worldroot','Raiz do Mundo','Vitórias rendem +25% de Maestria.']],
  cryomancer:[['crystal','Cristalização','Comece o PvE com +1 reembaralhamento.'],['winter','Inverno Longo','Domínio de rota fortalece a unidade líder.'],['absolute','Zero Absoluto','Dominar as 3 rotas exige só 2 marcas.']],
  assassin:[['mark','Marca Sombria','Comece o PvE com +1 mana temporária.'],['edge','Fio Perfeito','Domínio de rota concede +1 mana.'],['nocturne','Nocturne','Vitórias rendem +25% de Maestria.']],
  summoner:[['spark','Faísca Familiar','Comece o PvE com +1 reembaralhamento.'],['convergence','Convergência','Comece o PvE com +1 de vida máxima.'],['portal','Portal Supremo','Dominar as 3 rotas exige só 2 marcas.']],
  chronomancer:[['glimpse','Vislumbre','Veja 4 cartas da Reserva em vez de 3.'],['loop','Ciclo Estável','Comece o PvE com +1 reembaralhamento.'],['aeon','Éon','Vitórias rendem +25% de Maestria.']]
};

let modalTab='collection';
let collectionFilter='all';
let collectionSearch='';
let lastState=null;
let lastRevision=-1;
let lastMatchId=null;
let matchStartedAt=0;
let replayFrames=[];
let undoStack=[];
let pendingSnapshot=null;
let pendingLabel='Jogada';
let dangerousBypass=false;
let lastAppliedRound='';
let lastProcessedMatch='';
let lastProcessedAt=0;
let installed=false;

const parse=(value,fallback={})=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
const clone=value=>{try{return structuredClone(value)}catch{return JSON.parse(JSON.stringify(value))}};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const profile=()=>parse(localStorage.getItem(PROFILE_KEY),{});
const strategy=()=>globalThis.ArcanaStrategy?.state?.()||parse(localStorage.getItem(STRATEGY_KEY),{});
const api=()=>globalThis.__ARCANA;
const game=()=>api()?.state?.()||null;
const activeClass=()=>profile().classId||'vanguard';
const rule=id=>globalThis.ArcanaEvolution?.rules?.[id]||{name:'Classe Arcana',icon:'✦',color:'#63e7ff'};

function saveProfile(next){
  localStorage.setItem(PROFILE_KEY,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('arcana:profile',{detail:next}));
}

function meta(){
  const base={schema:1,migrated:false,dangerousConfirm:true,masteryTree:{},favorites:[],collectionFilter:'all'};
  const value={...base,...parse(localStorage.getItem(META_KEY),{}),masteryTree:{...base.masteryTree,...parse(localStorage.getItem(META_KEY),{}).masteryTree}};
  return value;
}

function saveMeta(value){localStorage.setItem(META_KEY,JSON.stringify(value))}

function cardRarity(card){
  const key=String(card?.rarity||'comum').toLowerCase();
  return RARITY[key]?key:key==='epica'?'épica':key==='lendaria'?'lendária':'comum';
}

function migrateProfile(){
  const p=profile(),m=meta(),catalog=api()?.cards||[];
  if(!catalog.length||m.migrated)return false;
  p.cardCopies={...(p.cardCopies||{})};
  p.favorites=Array.isArray(p.favorites)?p.favorites:[];
  p.masteryTree={...(p.masteryTree||{})};
  p.collectionSchema=1;
  for(const classId of Object.keys(MASTERIES)){
    const names=globalThis.ArcanaEvolution?.autoDeckNames?.(classId,catalog)||[];
    const counts=names.reduce((out,name)=>(out[name]=(out[name]||0)+1,out),{});
    for(const [name,count] of Object.entries(counts))p.cardCopies[name]=Math.max(Number(p.cardCopies[name]||0),count);
    p.masteryTree[classId]=Array.isArray(p.masteryTree[classId])?p.masteryTree[classId]:[];
  }
  for(const name of p.discovered||[])p.cardCopies[name]=Math.max(1,Number(p.cardCopies[name]||0));
  m.migrated=true;m.migratedAt=Date.now();saveMeta(m);saveProfile(p);
  return true;
}

function owned(card,p=profile()){return Math.max(0,Number(p.cardCopies?.[card.name]||0))}
function usedCopies(name,p=profile()){
  return Math.max(0,...Object.values(p.classDecks||{}).map(deck=>(deck?.cards||[]).filter(cardName=>cardName===name).length));
}

function eventOfWeek(){
  const number=Math.floor(Date.now()/604800000),items=[
    {id:'echoes',icon:'🌌',name:'Ecos da Ascensão',desc:'Maestria em dobro nas vitórias e recompensa de coleção ao terminar partidas.',tone:'#8f7cff'},
    {id:'frontier',icon:'🗺️',name:'Fronteira Instável',desc:'Controle as três rotas para buscar uma vitória por Domínio.',tone:'#62dfc8'},
    {id:'vault',icon:'💎',name:'Semana da Forja',desc:'Criar cartas custa 20% menos Essência durante este evento.',tone:'#62cfff'},
    {id:'boss',icon:'👹',name:'Cerco ao Abismo',desc:'Raids concedem uma carta adicional e Maestria acelerada.',tone:'#ff6f91'}
  ];
  return items[number%items.length];
}

function craftCost(card){
  const base=RARITY[cardRarity(card)]?.cost||40;
  return eventOfWeek().id==='vault'?Math.ceil(base*.8):base;
}

function notify(message,state=''){
  let node=document.getElementById('arc100Toast');
  if(!node){node=document.createElement('div');node.id='arc100Toast';document.body.appendChild(node)}
  node.textContent=message;node.dataset.state=state;node.classList.add('show');
  clearTimeout(notify.timer);notify.timer=setTimeout(()=>node.classList.remove('show'),2800);
}

function spendEssence(amount){
  if(globalThis.ArcanaStrategy?.spend)return globalThis.ArcanaStrategy.spend('essence',amount);
  const s=strategy();if(Number(s.essence||0)<amount)return false;s.essence-=amount;localStorage.setItem(STRATEGY_KEY,JSON.stringify(s));return true;
}

function grantEssence(amount){
  if(globalThis.ArcanaStrategy?.grant)return globalThis.ArcanaStrategy.grant({essence:amount});
  const s=strategy();s.essence=Number(s.essence||0)+amount;localStorage.setItem(STRATEGY_KEY,JSON.stringify(s));
}

function collectionCard(card,p){
  const count=owned(card,p),rarity=cardRarity(card),info=RARITY[rarity],favorite=(p.favorites||[]).includes(card.name),secret=!!card.secret;
  return `<article class="arc100Card ${count?'owned':'locked'}" style="--rarity:${info.tone}">
    <button class="arc100Favorite" data-favorite="${esc(card.name)}" aria-label="Favoritar">${favorite?'★':'☆'}</button>
    <div class="arc100CardTop"><span>${Number(card.cost||0)}</span><em>${secret?'?':esc(card.icon||'✦')}</em><small>${esc(info.name)}</small></div>
    <h3>${secret&&!count?'Carta secreta não descoberta':esc(card.name)}</h3>
    <p>${secret&&!count?'Existe uma chance extremamente baixa de esta carta surgir em uma recompensa da sua classe.':esc(card.text||'')}</p>
    <footer><b>${count} CÓPIA${count===1?'':'S'}</b><div>${!secret?`<button data-craft="${esc(card.name)}" ${count>=3?'disabled':''}>CRIAR · ${craftCost(card)} ✦</button>`:''}<button data-dismantle="${esc(card.name)}" ${count<=Math.max(usedCopies(card.name,p),1)?'disabled':''}>DESMONTAR</button></div></footer>
  </article>`;
}

function renderCollection(container){
  const p=profile(),catalog=api()?.cards||[],classId=activeClass(),allowed=catalog.filter(card=>globalThis.ArcanaEvolution?.allowedForClass?.(card,classId));
  const visible=allowed.filter(card=>{
    if(card.secret&&!owned(card,p))return collectionFilter==='secret';
    if(collectionFilter==='owned'&&!owned(card,p))return false;
    if(collectionFilter==='missing'&&owned(card,p))return false;
    if(collectionFilter==='favorite'&&!(p.favorites||[]).includes(card.name))return false;
    if(collectionFilter==='secret'&&!card.secret)return false;
    return !collectionSearch||`${card.name} ${card.text}`.toLowerCase().includes(collectionSearch);
  });
  const uniqueOwned=allowed.filter(card=>owned(card,p)>0).length,totalCopies=allowed.reduce((sum,card)=>sum+owned(card,p),0);
  container.innerHTML=`<div class="arc100SectionHead"><div><small>ARSENAL DA CLASSE</small><h2>${rule(classId).icon} Coleção & Crafting</h2><p>${uniqueOwned}/${allowed.length} cartas · ${totalCopies} cópias · até 3 iguais por deck</p></div><div class="arc100Wallet">✦ ${Number(strategy().essence||0)} ESSÊNCIA</div></div>
    <div class="arc100Filters"><button data-filter="all">TODAS</button><button data-filter="owned">OBTIDAS</button><button data-filter="missing">FALTANDO</button><button data-filter="favorite">★ FAVORITAS</button><button data-filter="secret">SECRETAS</button><input id="arc100Search" placeholder="Buscar carta" value="${esc(collectionSearch)}"></div>
    <div class="arc100Explain"><b>Por que ter cópias iguais?</b><span>Uma cópia é situacional; duas aparecem com frequência; três deixam a carta consistente. O deck começa com exatamente 30 cartas, mas Baús e Espólios podem adicionar outras durante a batalha.</span></div>
    <div class="arc100Collection">${visible.map(card=>collectionCard(card,p)).join('')||'<p class="arc100Empty">Nenhuma carta neste filtro.</p>'}</div>`;
  container.querySelectorAll('[data-filter]').forEach(button=>{button.classList.toggle('active',button.dataset.filter===collectionFilter);button.onclick=()=>{collectionFilter=button.dataset.filter;renderCollection(container)}});
  container.querySelector('#arc100Search').oninput=event=>{collectionSearch=event.target.value.trim().toLowerCase();renderCollection(container)};
  container.querySelectorAll('[data-favorite]').forEach(button=>button.onclick=()=>{const next=profile(),name=button.dataset.favorite,list=new Set(next.favorites||[]);list.has(name)?list.delete(name):list.add(name);next.favorites=[...list];saveProfile(next);renderCollection(container)});
  container.querySelectorAll('[data-craft]').forEach(button=>button.onclick=()=>{
    const card=catalog.find(item=>item.name===button.dataset.craft);if(!card)return;
    const cost=craftCost(card);if(!spendEssence(cost))return notify(`Faltam ${cost} Essências para criar esta carta.`,'error');
    const next=profile();next.cardCopies={...(next.cardCopies||{})};next.cardCopies[card.name]=Number(next.cardCopies[card.name]||0)+1;if(!next.discovered?.includes(card.name))next.discovered=[...(next.discovered||[]),card.name];saveProfile(next);notify(`${card.name} criada na Forja.`,'ok');renderCollection(container);
  });
  container.querySelectorAll('[data-dismantle]').forEach(button=>button.onclick=()=>{
    const card=catalog.find(item=>item.name===button.dataset.dismantle),next=profile();if(!card||owned(card,next)<=Math.max(usedCopies(card.name,next),1))return;
    next.cardCopies[card.name]--;const refund=RARITY[cardRarity(card)]?.refund||12;saveProfile(next);grantEssence(refund);notify(`${card.name} desmontada: +${refund} Essências.`,'ok');renderCollection(container);
  });
}

function masterySpent(classId,p=profile()){return (p.masteryTree?.[classId]||[]).length}
function masteryPoints(classId,p=profile()){
  const level=Number(p.mastery?.[classId]?.level||1);return Math.max(0,Math.floor((level-1)/2)-masterySpent(classId,p));
}

function renderMastery(container){
  const p=profile(),classId=activeClass(),data=p.mastery?.[classId]||{level:1,xp:0,wins:0},unlocked=new Set(p.masteryTree?.[classId]||[]),points=masteryPoints(classId,p);
  container.innerHTML=`<div class="arc100SectionHead"><div><small>PROGRESSÃO PERMANENTE</small><h2>${rule(classId).icon} Maestria · ${rule(classId).name}</h2><p>Nível ${Number(data.level||1)} · ${Number(data.xp||0)} XP · ${Number(data.wins||0)} vitórias</p></div><div class="arc100Points">${points} PONTO${points===1?'':'S'} LIVRE${points===1?'':'S'}</div></div>
    <div class="arc100MasteryLead">Os bônus de combate funcionam apenas em PvE. Duelo ranqueado continua justo: coleção e Maestria não compram vantagem competitiva.</div>
    <div class="arc100MasteryTree">${MASTERIES[classId].map(([id,name,desc],index)=>`<article class="${unlocked.has(id)?'unlocked':''}"><span>${index+1}</span><div><small>${index===0?'FUNDAMENTO':index===1?'ESPECIALIZAÇÃO':'LENDÁRIO'}</small><h3>${esc(name)}</h3><p>${esc(desc)}</p></div><button data-mastery="${id}" ${unlocked.has(id)||!points||(index&& !unlocked.has(MASTERIES[classId][index-1][0]))?'disabled':''}>${unlocked.has(id)?'ATIVO':'DESBLOQUEAR'}</button></article>`).join('')}</div>`;
  container.querySelectorAll('[data-mastery]').forEach(button=>button.onclick=()=>{const next=profile(),list=new Set(next.masteryTree?.[classId]||[]);if(!masteryPoints(classId,next)||list.has(button.dataset.mastery))return;list.add(button.dataset.mastery);next.masteryTree={...(next.masteryTree||{}),[classId]:[...list]};saveProfile(next);notify('Novo talento de Maestria ativado.','ok');renderMastery(container)});
}

function loadReplays(){return parse(localStorage.getItem(REPLAY_KEY),[])}
function saveReplays(items){localStorage.setItem(REPLAY_KEY,JSON.stringify(items.slice(0,MAX_REPLAYS)))}

function renderReplays(container){
  const items=loadReplays();
  container.innerHTML=`<div class="arc100SectionHead"><div><small>CRÔNICA DE BATALHA</small><h2>⏳ Histórico & Replays</h2><p>As ${MAX_REPLAYS} partidas mais recentes ficam neste aparelho, sem expor cartas privadas a outros jogadores.</p></div></div><div class="arc100ReplayList">${items.map((item,index)=>`<article><span>${item.win?'🏆':'⚔️'}</span><div><small>${esc(new Date(item.endedAt).toLocaleString('pt-BR'))}</small><h3>${esc(item.modeName||item.mode||'Partida')} · ${item.win?'Vitória':'Derrota'}</h3><p>${item.rounds} rodadas · ${Math.max(1,Math.round(item.duration/60000))} min · ${item.actions.length} ações registradas</p></div><button data-replay="${index}">REVER</button></article>`).join('')||'<p class="arc100Empty">Termine uma partida para criar o primeiro replay.</p>'}</div>`;
  container.querySelectorAll('[data-replay]').forEach(button=>button.onclick=()=>openReplay(items[Number(button.dataset.replay)]));
}

function openReplay(item){
  if(!item)return;let index=0;
  const root=document.createElement('section');root.className='arc100ReplayViewer';root.innerHTML='<div class="arc100ReplayStage"></div>';document.body.appendChild(root);
  const draw=()=>{const action=item.actions[index]||{};root.querySelector('.arc100ReplayStage').innerHTML=`<header><div><small>REPLAY LOCAL · ${index+1}/${item.actions.length}</small><h2>${esc(item.modeName||item.mode||'Partida')}</h2></div><button id="arcReplayClose">×</button></header><div class="arcReplayScore"><b>${esc(action.meName||'Arcano')} · ${Number(action.meHp||0)}♥</b><span>RODADA ${Number(action.round||1)}</span><b>${Number(action.opHp||0)}♥ · ${esc(action.opName||'Rival')}</b></div><div class="arcReplayLanes">${(action.lanes||[[],[],[]]).map((lane,laneIndex)=>`<article><small>ROTA ${laneIndex+1}</small><div>${(lane.op||[]).map(unit=>`<span>${esc(unit.icon||'✦')} ${esc(unit.name)} · ${unit.atk}/${unit.hp}</span>`).join('')||'<i>—</i>'}</div><div>${(lane.me||[]).map(unit=>`<span>${esc(unit.icon||'✦')} ${esc(unit.name)} · ${unit.atk}/${unit.hp}</span>`).join('')||'<i>—</i>'}</div></article>`).join('')}</div><p>${esc(action.label||'Estado da partida')}</p><footer><button id="arcReplayPrev" ${index<=0?'disabled':''}>‹ ANTERIOR</button><input id="arcReplayRange" type="range" min="0" max="${Math.max(0,item.actions.length-1)}" value="${index}"><button id="arcReplayNext" ${index>=item.actions.length-1?'disabled':''}>PRÓXIMA ›</button></footer>`;root.querySelector('#arcReplayClose').onclick=()=>root.remove();root.querySelector('#arcReplayPrev').onclick=()=>{index=Math.max(0,index-1);draw()};root.querySelector('#arcReplayNext').onclick=()=>{index=Math.min(item.actions.length-1,index+1);draw()};root.querySelector('#arcReplayRange').oninput=event=>{index=Number(event.target.value);draw()}};
  draw();
}

function renderEvents(container){
  const event=globalThis.ArcanaLiveEvent||eventOfWeek();
  container.innerHTML=`<div class="arc100SectionHead"><div><small>ROTAÇÃO SEMANAL</small><h2>${event.icon} Eventos & Destinos</h2><p>O evento atual muda automaticamente e pode ser substituído por uma temporada oficial administrada.</p></div></div><article class="arc100EventHero" style="--event-tone:${event.tone}"><span>${event.icon}</span><div><small>EVENTO ATIVO</small><h2>${esc(event.name)}</h2><p>${esc(event.desc)}</p></div></article><div class="arc100EventModes"><article><b>👹 Chefe especial</b><span>Raid Solo e Raid Coop mantêm fases próprias e recompensas ampliadas.</span></article><article><b>🎲 Regras temporárias</b><span>Caos altera mana, escudos, dano, Baús e rotas a cada rodada.</span></article><article><b>🏆 Temporada Ascensão</b><span>30 níveis, missões, divisões, títulos e recompensas colecionáveis.</span></article></div>`;
}

function renderAchievements(container){
  const p=profile(),s=strategy(),achievements=[
    ['first_blood','🩸','Primeiro Sangue',Number(p.stats?.kills||0)>=1],['veteran','🏆','Veterano',Number(p.stats?.wins||0)>=10],['collector','📚','Colecionador',(p.discovered||[]).length>=30],['mastery10','✨','Mestre Arcano',Object.values(p.mastery||{}).some(value=>Number(value.level||0)>=10)],['flawless','🛡️','Vitória Imaculada',!!p.achievementsV2?.flawless],['last_breath','❤️','Último Suspiro',!!p.achievementsV2?.lastBreath],['all_classes','🌈','Oito Caminhos',Object.values(p.mastery||{}).filter(value=>Number(value.wins||0)>=10).length===8],['legend','👑','Lenda',Number(s.rankedPoints||0)>=2600]
  ];
  container.innerHTML=`<div class="arc100SectionHead"><div><small>FEITOS DO PERFIL</small><h2>🏆 Conquistas avançadas</h2><p>Objetivos de combate, coleção, classes e temporada.</p></div></div><div class="arc100Achievements">${achievements.map(([,icon,name,done])=>`<article class="${done?'done':''}"><span>${done?icon:'◈'}</span><b>${esc(name)}</b><small>${done?'CONCLUÍDA':'EM PROGRESSO'}</small></article>`).join('')}</div>`;
}

function open(tab='collection'){
  modalTab=tab;let root=document.getElementById('arcanaOneHub');
  if(!root){root=document.createElement('section');root.id='arcanaOneHub';root.className='arcanaOneHub';document.body.appendChild(root)}
  root.innerHTML=`<div class="arc100Panel"><header><div><small>ARCANACLASH · VERSÃO DEFINITIVA</small><h1>Conclave 1.0</h1></div><button id="arc100Close">×</button></header><nav>${[['collection','COLEÇÃO & FORJA'],['mastery','MAESTRIA'],['replays','REPLAYS'],['events','EVENTOS'],['achievements','CONQUISTAS']].map(([id,label])=>`<button data-tab="${id}" class="${modalTab===id?'active':''}">${label}</button>`).join('')}</nav><main id="arc100Content"></main></div>`;
  root.classList.remove('hidden');root.querySelector('#arc100Close').onclick=()=>root.classList.add('hidden');root.onclick=event=>{if(event.target===root)root.classList.add('hidden')};root.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>open(button.dataset.tab));
  const container=root.querySelector('#arc100Content');if(tab==='collection')renderCollection(container);else if(tab==='mastery')renderMastery(container);else if(tab==='replays')renderReplays(container);else if(tab==='events')renderEvents(container);else renderAchievements(container);
}

function battleActive(){return document.body.classList.contains('arcBattleActive')&&!!game()&&!game().over}
function isOfflineGame(value=game()){
  if(!value)return false;return !api()?.modes?.[value.mode]?.online||['solo','survival','raid'].includes(value.mode);
}
function playerIndex(value){return value?.p?.[0]?.index??0}
function currentPlayer(value){return value?.p?.[playerIndex(value)]||value?.p?.[0]}

function compactFrame(value,label='Estado atualizado'){
  const me=currentPlayer(value)||value?.p?.[0],op=value?.p?.[1];if(!me||!op)return null;
  return {label,round:value.round,meName:me.hero?.name,opName:op.hero?.name,meHp:me.hp,opHp:op.hp,mana:me.mana,hand:me.hand?.length||0,reserve:me.deck?.length||0,lanes:[0,1,2].map(index=>({me:(me.lanes?.[index]||[]).map(unit=>({name:unit.name,icon:unit.icon,atk:unit.atk,hp:unit.hp})),op:(op.lanes?.[index]||[]).map(unit=>({name:unit.name,icon:unit.icon,atk:unit.atk,hp:unit.hp}))}))};
}

function inferAction(before,after){
  if(!before)return 'Partida iniciada';
  if(after.round!==before.round)return `Rodada ${after.round} iniciada`;
  const a=currentPlayer(after),b=currentPlayer(before),opA=after.p?.[1],opB=before.p?.[1];
  if(a?.hand?.length<b?.hand?.length)return 'Carta jogada';
  if(a?.hand?.length>b?.hand?.length)return 'Carta adicionada à mão';
  if(a?.hp!==b?.hp)return `${a.hp<b.hp?'Dano':'Cura'} no seu Arcano: ${b.hp} → ${a.hp}`;
  if(opA?.hp!==opB?.hp)return `${opA.hp<opB.hp?'Dano':'Cura'} no rival: ${opB.hp} → ${opA.hp}`;
  return 'Campo atualizado';
}

function installBattleUi(){
  if(document.getElementById('arc100BattleTools'))return;
  const tools=document.createElement('aside');tools.id='arc100BattleTools';tools.setAttribute('aria-label','Controles da mão');tools.innerHTML='<div class="arc100ToolActions"><button id="arc100Undo" disabled>↶ <span>DESFAZER</span></button><button id="arc100History">☷ <span>AÇÕES</span></button><button id="arc100Reserve">⌛ <span>RESERVA</span></button></div><div class="arc100HandNav"><button id="arc100HandPrev" aria-label="Ver cartas anteriores" title="Cartas anteriores">‹</button><span id="arc100HandStatus">MÃO</span><button id="arc100HandNext" aria-label="Ver próximas cartas" title="Próximas cartas">›</button></div>';
  const footer=document.querySelector('.gameFooter'),hand=document.getElementById('hand');
  if(footer&&hand)footer.insertBefore(tools,hand);else document.body.appendChild(tools);
  const panel=document.createElement('section');panel.id='arc100BattlePanel';panel.className='hidden';document.body.appendChild(panel);
  tools.querySelector('#arc100Undo').onclick=undo;
  tools.querySelector('#arc100History').onclick=()=>showBattlePanel('history');
  tools.querySelector('#arc100Reserve').onclick=()=>showBattlePanel('reserve');
  tools.querySelector('#arc100HandPrev').onclick=()=>scrollHand(-1);
  tools.querySelector('#arc100HandNext').onclick=()=>scrollHand(1);
  hand?.addEventListener('scroll',updateHandNavigation,{passive:true});
  hand?.addEventListener('wheel',event=>{
    if(hand.scrollWidth<=hand.clientWidth+4||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
    event.preventDefault();hand.scrollLeft+=event.deltaY;
  },{passive:false});
}

function scrollHand(direction){
  const hand=document.getElementById('hand');if(!hand)return;
  hand.scrollBy({left:direction*Math.max(240,hand.clientWidth*.72),behavior:'smooth'});
  setTimeout(updateHandNavigation,260);
}

function updateHandNavigation(){
  const hand=document.getElementById('hand'),status=document.getElementById('arc100HandStatus'),previous=document.getElementById('arc100HandPrev'),next=document.getElementById('arc100HandNext');
  if(!hand||!status||!previous||!next)return;
  const cards=[...hand.children].filter(card=>card.classList?.contains('card')),total=cards.length,max=Math.max(0,hand.scrollWidth-hand.clientWidth),left=hand.scrollLeft+2,right=hand.scrollLeft+hand.clientWidth-2;
  const first=Math.max(0,cards.findIndex(card=>card.offsetLeft+card.offsetWidth>left));let last=-1;cards.forEach((card,index)=>{if(card.offsetLeft<right)last=index});if(last<0)last=Math.max(0,total-1);
  status.textContent=total?max>4?`${first+1}–${last+1} DE ${total}`:`${total} CARTA${total===1?'':'S'} NA MÃO`:'MÃO VAZIA';
  previous.disabled=max<=4||hand.scrollLeft<=4;next.disabled=max<=4||hand.scrollLeft>=max-4;
  hand.classList.toggle('hasOverflow',max>4);
}

function showBattlePanel(type){
  const root=document.getElementById('arc100BattlePanel'),value=game(),me=currentPlayer(value);if(!root||!me)return;
  const body=type==='reserve'?`<div class="arc100ReserveList">${(me.deck||[]).slice(-((profile().masteryTree?.chronomancer||[]).includes('glimpse')?4:3)).reverse().map((card,index)=>`<article><span>${index+1}</span><b>${esc(card.icon||'✦')} ${esc(card.name)}</b><small>${Number(card.cost||0)} mana · ${esc(card.type||'carta')}</small></article>`).join('')||'<p>Reserva vazia.</p>'}</div><p class="arc100PanelHint">A ordem conhecida transforma sorte em planejamento. Baús e Espólios ainda podem acrescentar novas opções.</p>`:`<div class="arc100ActionList">${replayFrames.slice(-16).reverse().map((frame,index)=>`<article><span>${replayFrames.length-index}</span><div><b>${esc(frame.label)}</b><small>Rodada ${frame.round} · ${frame.meHp}♥ × ${frame.opHp}♥</small></div></article>`).join('')||'<p>Nenhuma ação registrada ainda.</p>'}</div>`;
  root.innerHTML=`<div><header><small>${type==='reserve'?'PRÓXIMAS COMPRAS':'ÚLTIMAS AÇÕES'}</small><h2>${type==='reserve'?'Reserva conhecida':'Histórico da partida'}</h2><button id="arc100BattleClose">×</button></header>${body}</div>`;root.classList.remove('hidden');root.querySelector('#arc100BattleClose').onclick=()=>root.classList.add('hidden');root.onclick=event=>{if(event.target===root)root.classList.add('hidden')};
}

function mutateRestore(snapshot){
  if(api()?.restoreState?.(snapshot))return true;
  const target=game();if(!target||!snapshot)return false;
  for(const key of Object.keys(target))delete target[key];Object.assign(target,clone(snapshot));api()?.refresh?.();return true;
}

function undo(){
  const value=game(),entry=undoStack.pop();if(!entry||!isOfflineGame(value)||value.cur!==0)return notify('Não há uma jogada segura para desfazer.','error');
  if(mutateRestore(entry.snapshot)){replayFrames.push(compactFrame(game(),`Desfeito: ${entry.label}`));notify('Jogada desfeita antes de encerrar o turno.','ok')}
  updateBattleTools();
}

function captureBefore(label){
  const value=game();if(!battleActive()||!isOfflineGame(value)||value.cur!==0)return;
  pendingSnapshot={snapshot:clone(value),revision:value.rev,round:value.round};pendingLabel=label;
  setTimeout(()=>{const after=game();if(pendingSnapshot&&after&&after.rev!==pendingSnapshot.revision&&after.round===pendingSnapshot.round&&after.cur===0){undoStack.push({snapshot:pendingSnapshot.snapshot,label:pendingLabel});undoStack=undoStack.slice(-8)}pendingSnapshot=null;updateBattleTools()},40);
}

function actionLabel(target){
  if(target.closest('.chestChoice'))return 'Escolha do Baú';if(target.closest('#reroll'))return 'Reembaralhar';if(target.closest('#classAbility'))return 'Habilidade de classe';
  const card=target.closest('.card');if(card)return `Carta: ${card.querySelector('.cn')?.textContent||'jogada'}`;
  if(target.closest('.lane,.unit'))return `Posicionamento ou alvo`;
  return 'Jogada';
}

function installActionCapture(){
  document.addEventListener('click',event=>{
    const target=event.target;if(!(target instanceof Element))return;
    if(target.closest('#endTurn'))return dangerousEndTurn(event);
    if(target.closest('.card,.lane,.unit,.chestChoice,#reroll,#classAbility'))captureBefore(actionLabel(target));
  },true);
}

function dangerousEndTurn(event){
  const value=game(),me=currentPlayer(value);if(dangerousBypass||!battleActive()||!meta().dangerousConfirm||!me)return;
  const playable=(me.hand||[]).filter(card=>Number(card.cost||0)<=Number(me.mana||0));
  if(!playable.length&&Number(me.mana||0)<3)return;
  const detail=playable.length?`Você ainda pode jogar ${playable.length} carta${playable.length>1?'s':''}.`:`Você ainda tem ${me.mana} de mana.`;
  if(window.confirm(`${detail}\n\nTem certeza que deseja encerrar o turno?`))return;
  event.preventDefault();event.stopImmediatePropagation();
}

function applyMasteryAndRoutes(value){
  if(!value||!isOfflineGame(value)||value.over)return;
  const me=value.p?.[0],classId=me?.classId||activeClass(),nodes=new Set(profile().masteryTree?.[classId]||[]);
  if(value.arcanaMasteryApplied!==VERSION){
    value.arcanaMasteryApplied=VERSION;
    const hpBonus=(nodes.has('bastion')||nodes.has('pact')||nodes.has('convergence'))?1:(nodes.has('seed')?2:0);
    if(hpBonus){me.maxHp+=hpBonus;me.hp+=hpBonus}
    if([...nodes].some(id=>['arsenal','echo','crystal','spark','loop'].includes(id)))me.rerolls++;
    if([...nodes].some(id=>['ember','mark'].includes(id)))me.mana++;
    api()?.refresh?.();
  }
  const roundKey=`${value.id}:${value.round}`;if(lastAppliedRound===roundKey||value.round<2||value.cur!==0)return;lastAppliedRound=roundKey;
  if(globalThis.ArcanaReforged?.processRound?.(value,nodes)){api()?.refresh?.();return}
  value.arcanaDomination=value.arcanaDomination||[0,0];const lane=(value.round-1)%3;
  const strength=side=>(value.p?.[side]?.lanes?.[lane]||[]).reduce((sum,unit)=>sum+Number(unit.atk||0),0);
  const a=strength(0),b=strength(1);
  if(a!==b){const winner=a>b?0:1,leader=value.p[winner].lanes[lane][0];value.p[winner].mana=Math.min(value.p[winner].maxMana,value.p[winner].mana+1);if(leader){leader.maxHp=Number(leader.maxHp||leader.hp)+1;leader.hp++}if(winner===0&&nodes.has('grove'))me.hp=Math.min(me.maxHp,me.hp+1)}
  for(let side=0;side<2;side++){
    const controls=[0,1,2].every(index=>(value.p[side].lanes[index]||[]).length>0&&(value.p[1-side].lanes[index]||[]).length===0);
    value.arcanaDomination[side]=controls?Number(value.arcanaDomination[side]||0)+1:0;
    const needed=side===0&&[...nodes].some(id=>['oath','absolute','portal'].includes(id))?2:3;
    if(value.arcanaDomination[side]>=needed){value.over=true;value.winner=side;notify(`Vitória por Domínio: ${needed} rodadas controlando as três rotas!`,'ok')}
  }
  api()?.refresh?.();
}

function updateBattleTools(){
  installBattleUi();const tools=document.getElementById('arc100BattleTools'),value=game(),active=battleActive();if(!tools)return;
  tools.classList.toggle('active',active);document.querySelector('.gameFooter')?.classList.toggle('arc100HandReady',active);const canUndo=active&&isOfflineGame(value)&&value.cur===0&&undoStack.length>0;tools.querySelector('#arc100Undo').disabled=!canUndo;updateHandNavigation();
}

function pollGame(){
  const value=game();updateBattleTools();
  if(!value||!value.id){lastState=null;lastRevision=-1;return}
  if(value.id!==lastMatchId){lastMatchId=value.id;matchStartedAt=Date.now();replayFrames=[];undoStack=[];lastState=clone(value);lastRevision=value.rev;const first=compactFrame(value,'Partida iniciada');if(first)replayFrames.push(first)}
  applyMasteryAndRoutes(value);
  if(value.rev===lastRevision)return;
  const label=inferAction(lastState,value),frame=compactFrame(value,label);if(frame)replayFrames.push(frame);replayFrames=replayFrames.slice(-80);effects(lastState,value);lastState=clone(value);lastRevision=value.rev;
}

function effects(before,after){
  if(!before||!after)return;
  const oldMe=before.p?.[0]?.hp,newMe=after.p?.[0]?.hp,oldOp=before.p?.[1]?.hp,newOp=after.p?.[1]?.hp;
  if(oldMe!==newMe)floatNumber(document.getElementById('meAvatar'),newMe-oldMe);
  if(oldOp!==newOp)floatNumber(document.getElementById('enemyAvatar'),newOp-oldOp);
}

function floatNumber(anchor,amount){
  if(!anchor||!amount)return;const box=anchor.getBoundingClientRect(),node=document.createElement('span');node.className=`arc100Float ${amount>0?'heal':'damage'}`;node.textContent=amount>0?`+${amount}`:String(amount);node.style.left=`${box.left+box.width/2}px`;node.style.top=`${box.top}px`;document.body.appendChild(node);setTimeout(()=>node.remove(),950);
}

function rewardCard(detail){
  const catalog=(api()?.cards||[]).filter(card=>globalThis.ArcanaEvolution?.allowedForClass?.(card,detail.classId||activeClass()));if(!catalog.length)return;
  const secretChance=Math.random()<.0025,eligible=catalog.filter(card=>secretChance?card.secret:!card.secret);if(!eligible.length)return;
  const card=eligible[Math.floor(Math.random()*eligible.length)],next=profile();next.cardCopies={...(next.cardCopies||{})};next.cardCopies[card.name]=Number(next.cardCopies[card.name]||0)+1;if(!next.discovered?.includes(card.name))next.discovered=[...(next.discovered||[]),card.name];saveProfile(next);notify(secretChance?`✦ SEGREDO REVELADO: ${card.name}`:`Recompensa da partida: ${card.name}`,'ok');
}

function onMatch(event){
  const detail=event.detail||{},value=game(),now=Date.now(),fingerprint=value?.id||`${detail.mode||'solo'}:${!!detail.win}:${!!detail.surrendered}`;
  if(fingerprint===lastProcessedMatch&&now-lastProcessedAt<4000)return;lastProcessedMatch=fingerprint;lastProcessedAt=now;
  const frame=compactFrame(value,detail.surrendered?'Desistência':'Partida encerrada');if(frame)replayFrames.push(frame);
  const item={id:value?.id||`${Date.now()}`,mode:value?.mode||detail.mode||'solo',modeName:api()?.modes?.[value?.mode||detail.mode]?.name||'Batalha',win:!!detail.win,rounds:Number(value?.round||1),duration:Date.now()-matchStartedAt,endedAt:Date.now(),actions:replayFrames};
  const items=loadReplays().filter(replay=>replay.id!==item.id);items.unshift(item);saveReplays(items);rewardCard(detail);
  const next=profile();next.achievementsV2={...(next.achievementsV2||{})};if(detail.win&&value?.p?.[0]?.hp===value?.p?.[0]?.maxHp)next.achievementsV2.flawless=Date.now();if(detail.win&&value?.p?.[0]?.hp===1)next.achievementsV2.lastBreath=Date.now();saveProfile(next);
}

function install(){
  if(installed)return;installed=true;migrateProfile();installBattleUi();installActionCapture();window.addEventListener('arcana:match',onMatch);window.addEventListener('arcana:profile',migrateProfile);setInterval(pollGame,220);document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.getElementById('arcanaOneHub')?.classList.add('hidden');document.getElementById('arc100BattlePanel')?.classList.add('hidden')}});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
globalThis.ArcanaOne={version:VERSION,open,migrate:migrateProfile,replays:loadReplays,event:eventOfWeek,owned};
})();
