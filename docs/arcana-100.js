(()=>{
'use strict';

const VERSION='1.0.1';
const PROFILE_KEY='arcana_profile_v2';
const STRATEGY_KEY='arcana_strategy_pack_v1';
const META_KEY='arcana_release_100_v1';
const REPLAY_KEY='arcana_replays_v1';
const MAX_REPLAYS=12;
const RARITY={
  comum:{name:'Comum',cost:40,refund:12,tone:'#9eb0c7'},
  rara:{name:'Rara',cost:100,refund:30,tone:'#57d8ff'},
  'Ã©pica':{name:'Ã‰pica',cost:250,refund:75,tone:'#b67cff'},
  'lendÃ¡ria':{name:'LendÃ¡ria',cost:600,refund:180,tone:'#ffd05f'},
  secreta:{name:'Secreta',cost:0,refund:0,tone:'#ff65c7'}
};
const MASTERIES={
  vanguard:[['bastion','BastiÃ£o','Comece o PvE com +1 de vida mÃ¡xima.'],['arsenal','Arsenal','Comece o PvE com +1 reembaralhamento.'],['oath','Juramento','Dominar as 3 rotas exige sÃ³ 2 marcas.']],
  pyromancer:[['ember','Brasa Viva','Comece o PvE com +1 mana temporÃ¡ria.'],['furnace','Fornalha','A primeira rota dominada concede +1 mana.'],['inferno','Inferno Arcano','VitÃ³rias rendem +25% de Maestria.']],
  necromancer:[['echo','Eco Persistente','Comece o PvE com +1 reembaralhamento.'],['pact','Pacto Profundo','Comece o PvE com +1 de vida mÃ¡xima.'],['king','Rei sem TÃºmulo','VitÃ³rias rendem +25% de Maestria.']],
  druid:[['seed','Semente Ancestral','Comece o PvE com +2 de vida mÃ¡xima.'],['grove','Bosque Vivo','DomÃ­nio de rota tambÃ©m cura 1.'],['worldroot','Raiz do Mundo','VitÃ³rias rendem +25% de Maestria.']],
  cryomancer:[['crystal','CristalizaÃ§Ã£o','Comece o PvE com +1 reembaralhamento.'],['winter','Inverno Longo','DomÃ­nio de rota fortalece a unidade lÃ­der.'],['absolute','Zero Absoluto','Dominar as 3 rotas exige sÃ³ 2 marcas.']],
  assassin:[['mark','Marca Sombria','Comece o PvE com +1 mana temporÃ¡ria.'],['edge','Fio Perfeito','DomÃ­nio de rota concede +1 mana.'],['nocturne','Nocturne','VitÃ³rias rendem +25% de Maestria.']],
  summoner:[['spark','FaÃ­sca Familiar','Comece o PvE com +1 reembaralhamento.'],['convergence','ConvergÃªncia','Comece o PvE com +1 de vida mÃ¡xima.'],['portal','Portal Supremo','Dominar as 3 rotas exige sÃ³ 2 marcas.']],
  chronomancer:[['glimpse','Vislumbre','Veja 4 cartas da Reserva em vez de 3.'],['loop','Ciclo EstÃ¡vel','Comece o PvE com +1 reembaralhamento.'],['aeon','Ã‰on','VitÃ³rias rendem +25% de Maestria.']]
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
const rule=id=>globalThis.ArcanaEvolution?.rules?.[id]||{name:'Classe Arcana',icon:'âœ¦',color:'#63e7ff'};

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
  return RARITY[key]?key:key==='epica'?'Ã©pica':key==='lendaria'?'lendÃ¡ria':'comum';
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
    {id:'echoes',icon:'ğŸŒŒ',name:'Ecos da AscensÃ£o',desc:'Maestria em dobro nas vitÃ³rias e recompensa de coleÃ§Ã£o ao terminar partidas.',tone:'#8f7cff'},
    {id:'frontier',icon:'ğŸ—ºï¸',name:'Fronteira InstÃ¡vel',desc:'Controle as trÃªs rotas para buscar uma vitÃ³ria por DomÃ­nio.',tone:'#62dfc8'},
    {id:'vault',icon:'ğŸ’',name:'Semana da Forja',desc:'Criar cartas custa 20% menos EssÃªncia durante este evento.',tone:'#62cfff'},
    {id:'boss',icon:'ğŸ‘¹',name:'Cerco ao Abismo',desc:'Raids concedem uma carta adicional e Maestria acelerada.',tone:'#ff6f91'}
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
    <button class="arc100Favorite" data-favorite="${esc(card.name)}" aria-label="Favoritar">${favorite?'â˜…':'â˜†'}</button>
    <div class="arc100CardTop"><span>${Number(card.cost||0)}</span><em>${secret?'?':esc(card.icon||'âœ¦')}</em><small>${esc(info.name)}</small></div>
    <h3>${secret&&!count?'Carta secreta nÃ£o descoberta':esc(card.name)}</h3>
    <p>${secret&&!count?'Existe uma chance extremamente baixa de esta carta surgir em uma recompensa da sua classe.':esc(card.text||'')}</p>
    <footer><b>${count} CÃ“PIA${count===1?'':'S'}</b><div>${!secret?`<button data-craft="${esc(card.name)}" ${count>=3?'disabled':''}>CRIAR Â· ${craftCost(card)} âœ¦</button>`:''}<button data-dismantle="${esc(card.name)}" ${count<=Math.max(usedCopies(card.name,p),1)?'disabled':''}>DESMONTAR</button></div></footer>
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
  container.innerHTML=`<div class="arc100SectionHead"><div><small>ARSENAL DA CLASSE</small><h2>${rule(classId).icon} ColeÃ§Ã£o & Crafting</h2><p>${uniqueOwned}/${allowed.length} cartas Â· ${totalCopies} cÃ³pias Â· atÃ© 3 iguais por deck</p></div><div class="arc100Wallet">âœ¦ ${Number(strategy().essence||0)} ESSÃŠNCIA</div></div>
    <div class="arc100Filters"><button data-filter="all">TODAS</button><button data-filter="owned">OBTIDAS</button><button data-filter="missing">FALTANDO</button><button data-filter="favorite">â˜… FAVORITAS</button><button data-filter="secret">SECRETAS</button><input id="arc100Search" placeholder="Buscar carta" value="${esc(collectionSearch)}"></div>
    <div class="arc100Explain"><b>Por que ter cÃ³pias iguais?</b><span>Uma cÃ³pia Ã© situacional; duas aparecem com frequÃªncia; trÃªs deixam a carta consistente. O deck comeÃ§a com exatamente 30 cartas, mas BaÃºs e EspÃ³lios podem adicionar outras durante a batalha.</span></div>
    <div class="arc100Collection">${visible.map(card=>collectionCard(card,p)).join('')||'<p class="arc100Empty">Nenhuma carta neste filtro.</p>'}</div>`;
  container.querySelectorAll('[data-filter]').forEach(button=>{button.classList.toggle('active',button.dataset.filter===collectionFilter);button.onclick=()=>{collectionFilter=button.dataset.filter;renderCollection(container)}});
  container.querySelector('#arc100Search').oninput=event=>{collectionSearch=event.target.value.trim().toLowerCase();renderCollection(container)};
  container.querySelectorAll('[data-favorite]').forEach(button=>button.onclick=()=>{const next=profile(),name=button.dataset.favorite,list=new Set(next.favorites||[]);list.has(name)?list.delete(name):list.add(name);next.favorites=[...list];saveProfile(next);renderCollection(container)});
  container.querySelectorAll('[data-craft]').forEach(button=>button.onclick=()=>{
    const card=catalog.find(item=>item.name===button.dataset.craft);if(!card)return;
    const cost=craftCost(card);if(!spendEssence(cost))return notify(`Faltam ${cost} EssÃªncias para criar esta carta.`,'error');
    const next=profile();next.cardCopies={...(next.cardCopies||{})};next.cardCopies[card.name]=Number(next.cardCopies[card.name]||0)+1;if(!next.discovered?.includes(card.name))next.discovered=[...(next.discovered||[]),card.name];saveProfile(next);notify(`${card.name} criada na Forja.`,'ok');renderCollection(container);
  });
  container.querySelectorAll('[data-dismantle]').forEach(button=>button.onclick=()=>{
    const card=catalog.find(item=>item.name===button.dataset.dismantle),next=profile();if(!card||owned(card,next)<=Math.max(usedCopies(card.name,next),1))return;
    next.cardCopies[card.name]--;const refund=RARITY[cardRarity(card)]?.refund||12;saveProfile(next);grantEssence(refund);notify(`${card.name} desmontada: +${refund} EssÃªncias.`,'ok');renderCollection(container);
  });
}

function masterySpent(classId,p=profile()){return (p.masteryTree?.[classId]||[]).length}
function masteryPoints(classId,p=profile()){
  const level=Number(p.mastery?.[classId]?.level||1);return Math.max(0,Math.floor((level-1)/2)-masterySpent(classId,p));
}

function renderMastery(container){
  const p=profile(),classId=activeClass(),data=p.mastery?.[classId]||{level:1,xp:0,wins:0},unlocked=new Set(p.masteryTree?.[classId]||[]),points=masteryPoints(classId,p);
  container.innerHTML=`<div class="arc100SectionHead"><div><small>PROGRESSÃƒO PERMANENTE</small><h2>${rule(classId).icon} Maestria Â· ${rule(classId).name}</h2><p>NÃ­vel ${Number(data.level||1)} Â· ${Number(data.xp||0)} XP Â· ${Number(data.wins||0)} vitÃ³rias</p></div><div class="arc100Points">${points} PONTO${points===1?'':'S'} LIVRE${points===1?'':'S'}</div></div>
    <div class="arc100MasteryLead">Os bÃ´nus de combate funcionam apenas em PvE. Duelo ranqueado continua justo: coleÃ§Ã£o e Maestria nÃ£o compram vantagem competitiva.</div>
    <div class="arc100MasteryTree">${MASTERIES[classId].map(([id,name,desc],index)=>`<article class="${unlocked.has(id)?'unlocked':''}"><span>${index+1}</span><div><small>${index===0?'FUNDAMENTO':index===1?'ESPECIALIZAÃ‡ÃƒO':'LENDÃRIO'}</small><h3>${esc(name)}</h3><p>${esc(desc)}</p></div><button data-mastery="${id}" ${unlocked.has(id)||!points||(index&& !unlocked.has(MASTERIES[classId][index-1][0]))?'disabled':''}>${unlocked.has(id)?'ATIVO':'DESBLOQUEAR'}</button></article>`).join('')}</div>`;
  container.querySelectorAll('[data-mastery]').forEach(button=>button.onclick=()=>{const next=profile(),list=new Set(next.masteryTree?.[classId]||[]);if(!masteryPoints(classId,next)||list.has(button.dataset.mastery))return;list.add(button.dataset.mastery);next.masteryTree={...(next.masteryTree||{}),[classId]:[...list]};saveProfile(next);notify('Novo talento de Maestria ativado.','ok');renderMastery(container)});
}

function loadReplays(){return parse(localStorage.getItem(REPLAY_KEY),[])}
function saveReplays(items){localStorage.setItem(REPLAY_KEY,JSON.stringify(items.slice(0,MAX_REPLAYS)))}

function renderReplays(container){
  const items=loadReplays();
  container.innerHTML=`<div class="arc100SectionHead"><div><small>CRÃ”NICA DE BATALHA</small><h2>â³ HistÃ³rico & Replays</h2><p>As ${MAX_REPLAYS} partidas mais recentes ficam neste aparelho, sem expor cartas privadas a outros jogadores.</p></div></div><div class="arc100ReplayList">${items.map((item,index)=>`<article><span>${item.win?'ğŸ†':'âš”ï¸'}</span><div><small>${esc(new Date(item.endedAt).toLocaleString('pt-BR'))}</small><h3>${esc(item.modeName||item.mode||'Partida')} Â· ${item.win?'VitÃ³ria':'Derrota'}</h3><p>${item.rounds} rodadas Â· ${Math.max(1,Math.round(item.duration/60000))} min Â· ${item.actions.length} aÃ§Ãµes registradas</p></div><button data-replay="${index}">REVER</button></article>`).join('')||'<p class="arc100Empty">Termine uma partida para criar o primeiro replay.</p>'}</div>`;
  container.querySelectorAll('[data-replay]').forEach(button=>button.onclick=()=>openReplay(items[Number(button.dataset.replay)]));
}

function openReplay(item){
  if(!item)return;let index=0;
  const root=document.createElement('section');ro×õ¶‰Ëkºwµçe‘‘•¸œ¤íÉ½½Ğ¹½¹±¥¬õ•Ù•¹Ğôùí¥˜¡•Ù•¹Ğ¹Ñ…É•ĞôôõÉ½½Ğ¥É½½Ğ¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¥ôíÉ½½Ğ¹ÅÕ•ÉåM•±•Ñ½É±° m‘…Ñ„µÑ…‰tœ¤¹™½É… ¡‰ÕÑÑ½¸ôù‰ÕÑÑ½¸¹½¹±¥¬ô ¤ôù½Á•¸¡‰ÕÑÑ½¸¹‘…Ñ…Í•Ğ¹Ñ…ˆ¤¤ì(€½¹ÍĞ½¹Ñ…¥¹•ÈõÉ½½Ğ¹ÅÕ•ÉåM•±•Ñ½È œ…ÉŒÄÀÁ½¹Ñ•¹Ğœ¤í¥˜¡Ñ…ˆôôô½±±•Ñ¥½¸œ¥É•¹‘•É½±±•Ñ¥½¸¡½¹Ñ…¥¹•È¤í•±Í”¥˜¡Ñ…ˆôôôµ…ÍÑ•Éäœ¥É•¹‘•É5…ÍÑ•Éä¡½¹Ñ…¥¹•È¤í•±Í”¥˜¡Ñ…ˆôôôÉ•Á±…åÌœ¥É•¹‘•ÉI•Á±…åÌ¡½¹Ñ…¥¹•È¤í•±Í”¥˜¡Ñ…ˆôôô•Ù•¹ÑÌœ¥É•¹‘•ÉÙ•¹ÑÌ¡½¹Ñ…¥¹•È¤í•±Í”É•¹‘•É¡¥•Ù•µ•¹ÑÌ¡½¹Ñ…¥¹•È¤ì)ô()™Õ¹Ñ¥½¸‰…ÑÑ±•Ñ¥Ù” ¥íÉ•ÑÕÉ¸‘½Õµ•¹Ğ¹‰½‘ä¹±…ÍÍ1¥ÍĞ¹½¹Ñ…¥¹Ì …É	…ÑÑ±•Ñ¥Ù”œ¤˜˜„……µ” ¤˜˜……µ” ¤¹½Ù•Éô)™Õ¹Ñ¥½¸¥Í=™™±¥¹•…µ”¡Ù…±Õ”õ…µ” ¤¥ì(€¥˜ …Ù…±Õ”¥É•ÑÕÉ¸™…±Í”íÉ•ÑÕÉ¸€……Á¤ ¤ü¹µ½‘•Ìü¹mÙ…±Õ”¹µ½‘•tü¹½¹±¥¹•ññlÍ½±¼œ°ÍÕÉÙ¥Ù…°œ°É…¥t¹¥¹±Õ‘•Ì¡Ù…±Õ”¹µ½‘”¤ì)ô)™Õ¹Ñ¥½¸Á±…å•É%¹‘•à¡Ù…±Õ”¥íÉ•ÑÕÉ¸Ù…±Õ”ü¹Àü¹lÁtü¹¥¹‘•àüüÁô)™Õ¹Ñ¥½¸ÕÉÉ•¹ÑA±…å•È¡Ù…±Õ”¥íÉ•ÑÕÉ¸Ù…±Õ”ü¹Àü¹mÁ±…å•É%¹‘•à¡Ù…±Õ”¥uññÙ…±Õ”ü¹Àü¹lÁuô()™Õ¹Ñ¥½¸½µÁ…ÑÉ…µ”¡Ù…±Õ”±±…‰•°ôÍÑ…‘¼…ÑÕ…±¥é…‘¼œ¥ì(€½¹ÍĞµ”õÕÉÉ•¹ÑA±…å•È¡Ù…±Õ”¥ññÙ…±Õ”ü¹Àü¹lÁt±½ÀõÙ…±Õ”ü¹Àü¹lÅtí¥˜ …µ•ñğ…½À¥É•ÑÕÉ¸¹Õ±°ì(€É•ÑÕÉ¸í±…‰•°±É½Õ¹éÙ…±Õ”¹É½Õ¹±µ•9…µ”éµ”¹¡•É¼ü¹¹…µ”±½Á9…µ”é½À¹¡•É¼ü¹¹…µ”±µ•!Àéµ”¹¡À±½Á!Àé½À¹¡À±µ…¹„éµ”¹µ…¹„±¡…¹éµ”¹¡…¹ü¹±•¹Ñ¡ñğÀ±É•Í•ÉÙ”éµ”¹‘•¬ü¹±•¹Ñ¡ñğÀ±±…¹•ÌélÀ°Ä°Ét¹µ…À¡¥¹‘•àôø¡íµ”è¡µ”¹±…¹•Ìü¹m¥¹‘•áuññmt¤¹µ…À¡Õ¹¥Ğôø¡í¹…µ”éÕ¹¥Ğ¹¹…µ”±¥½¸éÕ¹¥Ğ¹¥½¸±…Ñ¬éÕ¹¥Ğ¹…Ñ¬±¡ÀéÕ¹¥Ğ¹¡Áô¤¤±½Àè¡½À¹±…¹•Ìü¹m¥¹‘•áuññmt¤¹µ…À¡Õ¹¥Ğôø¡í¹…µ”éÕ¹¥Ğ¹¹…µ”±¥½¸éÕ¹¥Ğ¹¥½¸±…Ñ¬éÕ¹¥Ğ¹…Ñ¬±¡ÀéÕ¹¥Ğ¹¡Áô¤¥ô¤¥ôì)ô()™Õ¹Ñ¥½¸¥¹™•ÉÑ¥½¸¡‰•™½É”±…™Ñ•È¥ì(€¥˜ …‰•™½É”¥É•ÑÕÉ¸€A…ÉÑ¥‘„¥¹¥¥…‘„œì(€¥˜¡…™Ñ•È¹É½Õ¹„ôõ‰•™½É”¹É½Õ¹¥É•ÑÕÉ¸I½‘…‘„€‘í…™Ñ•È¹É½Õ¹‘ô¥¹¥¥…‘…€ì(€½¹ÍĞ„õÕÉÉ•¹ÑA±…å•È¡…™Ñ•È¤±ˆõÕÉÉ•¹ÑA±…å•È¡‰•™½É”¤±½Áõ…™Ñ•È¹Àü¹lÅt±½Áõ‰•™½É”¹Àü¹lÅtì(€¥˜¡„ü¹¡…¹ü¹±•¹Ñ ñˆü¹¡…¹ü¹±•¹Ñ ¥É•ÑÕÉ¸€…ÉÑ„©½…‘„œì(€¥˜¡„ü¹¡…¹ü¹±•¹Ñ ùˆü¹¡…¹ü¹±•¹Ñ ¥É•ÑÕÉ¸€…ÉÑ„…‘¥¥½¹…‘„ƒ€·¼œì(€¥˜¡„ü¹¡À„ôõˆü¹¡À¥É•ÑÕÉ¸€‘í„¹¡Àñˆ¹¡Àü…¹¼œèÕÉ„ô¹¼Í•ÔÉ…¹¼è€‘íˆ¹¡ÁôƒŠH€‘í„¹¡Áõ€ì(€¥˜¡½Áü¹¡À„ôõ½Áü¹¡À¥É•ÑÕÉ¸€‘í½Á¹¡Àñ½Á¹¡Àü…¹¼œèÕÉ„ô¹¼É¥Ù…°è€‘í½Á¹¡ÁôƒŠH€‘í½Á¹¡Áõ€ì(€É•ÑÕÉ¸€…µÁ¼…ÑÕ…±¥é…‘¼œì)ô()™Õ¹Ñ¥½¸¥¹ÍÑ…±±	…ÑÑ±•U¤ ¥ì(€¥˜¡‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …ÉŒÄÀÁ	…ÑÑ±•Q½½±Ìœ¤¥É•ÑÕÉ¸ì(€½¹ÍĞÑ½½±Ìõ‘½Õµ•¹Ğ¹É•…Ñ•±•µ•¹Ğ …Í¥‘”œ¤íÑ½½±Ì¹¥ô…ÉŒÄÀÁ	…ÑÑ±•Q½½±ÌœíÑ½½±Ì¹Í•ÑÑÑÉ¥‰ÕÑ” …É¥„µ±…‰•°œ°½¹ÑÉ½±•Ì‘„·¼œ¤íÑ½½±Ì¹¥¹¹•É!Q50ôœñ‘¥Ø±…ÍÌô‰…ÉŒÄÀÁQ½½±Ñ¥½¹Ìˆøñ‰ÕÑÑ½¸¥ô‰…ÉŒÄÀÁU¹‘¼ˆ‘¥Í…‰±•ûŠØ€ñÍÁ…¸ùMiHğ½ÍÁ…¸øğ½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸¥ô‰…ÉŒÄÀÁ!¥ÍÑ½ÉäˆûŠbÜ€ñÍÁ…¸ùULğ½ÍÁ…¸øğ½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸¥ô‰…ÉŒÄÀÁI•Í•ÉÙ”ˆûŠ2l€ñÍÁ…¸ùIMIYğ½ÍÁ…¸øğ½‰ÕÑÑ½¸øğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…ÉŒÄÀÁ!…¹‘9…Øˆøñ‰ÕÑÑ½¸¥ô‰…ÉŒÄÀÁ!…¹‘AÉ•Øˆ…É¥„µ±…‰•°ô‰Y•È…ÉÑ…Ì…¹Ñ•É¥½É•ÌˆÑ¥Ñ±”ô‰…ÉÑ…Ì…¹Ñ•É¥½É•ÌˆûŠäğ½‰ÕÑÑ½¸øñÍÁ…¸¥ô‰…ÉŒÄÀÁ!…¹‘MÑ…ÑÕÌˆù7<ğ½ÍÁ…¸øñ‰ÕÑÑ½¸¥ô‰…ÉŒÄÀÁ!…¹‘9•áĞˆ…É¥„µ±…‰•°ô‰Y•ÈÁËÍá¥µ…Ì…ÉÑ…ÌˆÑ¥Ñ±”ô‰AËÍá¥µ…Ì…ÉÑ…ÌˆûŠèğ½‰ÕÑÑ½¸øğ½‘¥Øøœì(€½¹ÍĞ™½½Ñ•Èõ‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È œ¹…µ•½½Ñ•Èœ¤±¡…¹õ‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ¡…¹œ¤ì(€¥˜¡™½½Ñ•È˜™¡…¹¥™½½Ñ•È¹¥¹Í•ÉÑ	•™½É”¡Ñ½½±Ì±¡…¹¤í•±Í”‘½Õµ•¹Ğ¹‰½‘ä¹…ÁÁ•¹‘¡¥±¡Ñ½½±Ì¤ì(€½¹ÍĞÁ…¹•°õ‘½Õµ•¹Ğ¹É•…Ñ•±•µ•¹Ğ Í•Ñ¥½¸œ¤íÁ…¹•°¹¥ô…ÉŒÄÀÁ	…ÑÑ±•A…¹•°œíÁ…¹•°¹±…ÍÍ9…µ”ô¡¥‘‘•¸œí‘½Õµ•¹Ğ¹‰½‘ä¹…ÁÁ•¹‘¡¥±¡Á…¹•°¤ì(€Ñ½½±Ì¹ÅÕ•ÉåM•±•Ñ½È œ…ÉŒÄÀÁU¹‘¼œ¤¹½¹±¥¬õÕ¹‘¼ì(€Ñ½½±Ì¹ÅÕ•ÉåM•±•Ñ½È œ…ÉŒÄÀÁ!¥ÍÑ½Éäœ¤¹½¹±¥¬ô ¤ôùÍ¡½İ	…ÑÑ±•A…¹•° ¡¥ÍÑ½Éäœ¤ì(€Ñ½½±Ì¹ÅÕ•ÉåM•±•Ñ½È œ…ÉŒÄÀÁI•Í•ÉÙ”œ¤¹½¹±¥¬ô ¤ôùÍ¡½İ	…ÑÑ±•A…¹•° É•Í•ÉÙ”œ¤ì(€Ñ½½±Ì¹ÅÕ•ÉåM•±•Ñ½È œ…ÉŒÄÀÁ!…¹‘AÉ•Øœ¤¹½¹±¥¬ô ¤ôùÍÉ½±±!…¹ ´Ä¤ì(€Ñ½½±Ì¹ÅÕ•ÉåM•±•Ñ½È œ…ÉŒÄÀÁ!…¹‘9•áĞœ¤¹½¹±¥¬ô ¤ôùÍÉ½±±!…¹ Ä¤ì(€¡…¹ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ÍÉ½±°œ±ÕÁ‘…Ñ•!…¹‘9…Ù¥…Ñ¥½¸±íÁ…ÍÍ¥Ù”éÑÉÕ•ô¤ì(€¡…¹ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È İ¡••°œ±•Ù•¹Ğôùì(€€€¥˜¡¡…¹¹ÍÉ½±±]¥‘Ñ ğõ¡…¹¹±¥•¹Ñ]¥‘Ñ ¬Ñññ5…Ñ ¹…‰Ì¡•Ù•¹Ğ¹‘•±Ñ…`¤øõ5…Ñ ¹…‰Ì¡•Ù•¹Ğ¹‘•±Ñ…d¤¥É•ÑÕÉ¸ì(€€€•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤í¡…¹¹ÍÉ½±±1•™Ğ¬õ•Ù•¹Ğ¹‘•±Ñ…dì(€ô±íÁ…ÍÍ¥Ù”é™…±Í•ô¤ì)ô()™Õ¹Ñ¥½¸ÍÉ½±±!…¹¡‘¥É•Ñ¥½¸¥ì(€½¹ÍĞ¡…¹õ‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ¡…¹œ¤í¥˜ …¡…¹¥É•ÑÕÉ¸ì(€¡…¹¹ÍÉ½±±	ä¡í±•™Ğé‘¥É•Ñ¥½¸©5…Ñ ¹µ…à ÈĞÀ±¡…¹¹±¥•¹Ñ]¥‘Ñ ¨¸ÜÈ¤±‰•¡…Ù¥½ÈèÍµ½½Ñ ô¤ì(€Í•ÑQ¥µ•½ÕĞ¡ÕÁ‘…Ñ•!…¹‘9…Ù¥…Ñ¥½¸°ÈØÀ¤ì)ô()™Õ¹Ñ¥½¸ÕÁ‘…Ñ•!…¹‘9…Ù¥…Ñ¥½¸ ¥ì(€½¹ÍĞ¡…¹õ‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% ¡…¹œ¤±ÍÑ…ÑÕÌõ‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …ÉŒÄÀÁ!…¹‘MÑ…ÑÕÌœ¤±ÁÉ•Ù¥½ÕÌõ‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …ÉŒÄÀÁ!…¹‘AÉ•Øœ¤±¹•áĞõ‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …ÉŒÄÀÁ!…¹‘9•áĞœ¤ì(€¥˜ …¡…¹‘ñğ…ÍÑ…ÑÕÍñğ…ÁÉ•Ù¥½ÕÍñğ…¹•áĞ¥É•ÑÕÉ¸ì(€½¹ÍĞ…É‘Ìõl¸¸¹¡…¹¹¡¥±‘É•¹t¹™¥±Ñ•È¡…Éôù…É¹±…ÍÍ1¥ÍĞü¹½¹Ñ…¥¹Ì …Éœ¤¤±Ñ½Ñ…°õ…É‘Ì¹±•¹Ñ ±µ…àõ5…Ñ ¹µ…à À±¡…¹¹ÍÉ½±±]¥‘Ñ µ¡…¹¹±¥•¹Ñ]¥‘Ñ ¤±±•™Ğõ¡…¹¹ÍÉ½±±1•™Ğ¬È±É¥¡Ğõ¡…¹¹ÍÉ½±±1•™Ğ­¡…¹¹±¥•¹Ñ]¥‘Ñ ´Èì(€½¹ÍĞ™¥ÉÍĞõ5…Ñ ¹µ…à À±…É‘Ì¹™¥¹‘%¹‘•à¡…Éôù…É¹½™™Í•Ñ1•™Ğ­…É¹½™™Í•Ñ]¥‘Ñ ù±•™Ğ¤¤í±•Ğ±…ÍĞô´Äí…É‘Ì¹™½É…  ¡…É±¥¹‘•à¤ôùí¥˜¡…É¹½™™Í•Ñ1•™ĞñÉ¥¡Ğ¥±…ÍĞõ¥¹‘•áô¤í¥˜¡±…ÍĞğÀ¥±…ÍĞõ5…Ñ ¹µ…à À±Ñ½Ñ…°´Ä¤ì(€ÍÑ…ÑÕÌ¹Ñ•áÑ½¹Ñ•¹ĞõÑ½Ñ…°ıµ…àøĞı€‘í™¥ÉÍĞ¬Å÷ŠL‘í±…ÍĞ¬Åô€‘íÑ½Ñ…±õ€é€‘íÑ½Ñ…±ôIQ‘íÑ½Ñ…°ôôôÄüœœèLô97=€è7<Yi%œì(€ÁÉ•Ù¥½ÕÌ¹‘¥Í…‰±•õµ…àğôÑññ¡…¹¹ÍÉ½±±1•™ĞğôĞí¹•áĞ¹‘¥Í…‰±•õµ…àğôÑññ¡…¹¹ÍÉ½±±1•™Ğøõµ…à´Ğì(€¡…¹¹±…ÍÍ1¥ÍĞ¹Ñ½±” ¡…Í=Ù•É™±½Üœ±µ…àøĞ¤ì)ô()™Õ¹Ñ¥½¸Í¡½İ	…ÑÑ±•A…¹•°¡ÑåÁ”¥ì(€½¹ÍĞÉ½½Ğõ‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …ÉŒÄÀÁ	…ÑÑ±•A…¹•°œ¤±Ù…±Õ”õ…µ” ¤±µ”õÕÉÉ•¹ÑA±…å•È¡Ù…±Õ”¤í¥˜ …É½½Ññğ…µ”¥É•ÑÕÉ¸ì(€½¹ÍĞ‰½‘äõÑåÁ”ôôôÉ•Í•ÉÙ”œı€ñ‘¥Ø±…ÍÌô‰…ÉŒÄÀÁI•Í•ÉÙ•1¥ÍĞˆø‘ì¡µ”¹‘•­ññmt¤¹Í±¥” ´ ¡ÁÉ½™¥±” ¤¹µ…ÍÑ•ÉåQÉ•”ü¹¡É½¹½µ…¹•Éññmt¤¹¥¹±Õ‘•Ì ±¥µÁÍ”œ¤üĞèÌ¤¤¹É•Ù•ÉÍ” ¤¹µ…À ¡…É±¥¹‘•à¤ôù€ñ…ÉÑ¥±”øñÍÁ…¸ø‘í¥¹‘•à¬Åôğ½ÍÁ…¸øñˆø‘í•ÍŒ¡…É¹¥½¹ñğŸŠr˜œ¥ô€‘í•ÍŒ¡…É¹¹…µ”¥ôğ½ˆøñÍµ…±°ø‘í9Õµ‰•È¡…É¹½ÍÑñğÀ¥ôµ…¹„ƒ
Ü€‘í•ÍŒ¡…É¹ÑåÁ•ñğ…ÉÑ„œ¥ôğ½Íµ…±°øğ½…ÉÑ¥±”ù€¤¹©½¥¸ œœ¥ñğœñÀùI•Í•ÉÙ„Ù…é¥„¸ğ½Àøôğ½‘¥ØøñÀ±…ÍÌô‰…ÉŒÄÀÁA…¹•±!¥¹Ğˆù½É‘•´½¹¡•¥‘„ÑÉ…¹Í™½Éµ„Í½ÉÑ”•´Á±…¹•©…µ•¹Ñ¼¸	‡éÌ”ÍÃÍ±¥½Ì…¥¹‘„Á½‘•´…É•Í•¹Ñ…È¹½Ù…Ì½ÃŸÕ•Ì¸ğ½Àù€é€ñ‘¥Ø±…ÍÌô‰…ÉŒÄÀÁÑ¥½¹1¥ÍĞˆø‘íÉ•Á±…åÉ…µ•Ì¹Í±¥” ´ÄØ¤¹É•Ù•ÉÍ” ¤¹µ…À ¡™É…µ”±¥¹‘•à¤ôù€ñ…ÉÑ¥±”øñÍÁ…¸ø‘íÉ•Á±…åÉ…µ•Ì¹±•¹Ñ µ¥¹‘•áôğ½ÍÁ…¸øñ‘¥Øøñˆø‘í•ÍŒ¡™É…µ”¹±…‰•°¥ôğ½ˆøñÍµ…±°ùI½‘…‘„€‘í™É…µ”¹É½Õ¹‘ôƒ
Ü€‘í™É…µ”¹µ•!Á÷Šf”ƒ\€‘í™É…µ”¹½Á!Á÷Šf”ğ½Íµ…±°øğ½‘¥Øøğ½…ÉÑ¥±”ù€¤¹©½¥¸ œœ¥ñğœñÀù9•¹¡Õµ„‡Ÿ¼É•¥ÍÑÉ…‘„…¥¹‘„¸ğ½Àøôğ½‘¥Øù€ì(€É½½Ğ¹¥¹¹•É!Q50õ€ñ‘¥Øøñ¡•…‘•ÈøñÍµ…±°ø‘íÑåÁ”ôôôÉ•Í•ÉÙ”œüAKMa%5L=5AILœèŸi1Q%5LULôğ½Íµ…±°øñ Èø‘íÑåÁ”ôôôÉ•Í•ÉÙ”œüI•Í•ÉÙ„½¹¡•¥‘„œè!¥ÍÓÍÉ¥¼‘„Á…ÉÑ¥‘„ôğ½ Èøñ‰ÕÑÑ½¸¥ô‰…ÉŒÄÀÁ	…ÑÑ±•±½Í”ˆû\ğ½‰ÕÑÑ½¸øğ½¡•…‘•Èø‘í‰½‘åôğ½‘¥Øù€íÉ½½Ğ¹±…ÍÍ1¥ÍĞ¹É•µ½Ù” ¡¥‘‘•¸œ¤íÉ½½Ğ¹ÅÕ•ÉåM•±•Ñ½È œ…ÉŒÄÀÁ	…ÑÑ±•±½Í”œ¤¹½¹±¥¬ô ¤ôùÉ½½Ğ¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¤íÉ½½Ğ¹½¹±¥¬õ•Ù•¹Ğôùí¥˜¡•Ù•¹Ğ¹Ñ…É•ĞôôõÉ½½Ğ¥É½½Ğ¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¥ôì)ô()™Õ¹Ñ¥½¸µÕÑ…Ñ•I•ÍÑ½É”¡Í¹…ÁÍ¡½Ğ¥ì(€¥˜¡…Á¤ ¤ü¹É•ÍÑ½É•MÑ…Ñ”ü¸¡Í¹…ÁÍ¡½Ğ¤¥É•ÑÕÉ¸ÑÉÕ”ì(€½¹ÍĞÑ…É•Ğõ…µ” ¤í¥˜ …Ñ…É•Ññğ…Í¹…ÁÍ¡½Ğ¥É•ÑÕÉ¸™…±Í”ì(€™½È¡½¹ÍĞ­•ä½˜=‰©•Ğ¹­•åÌ¡Ñ…É•Ğ¤¥‘•±•Ñ”Ñ…É•Ñm­•åtí=‰©•Ğ¹…ÍÍ¥¸¡Ñ…É•Ğ±±½¹”¡Í¹…ÁÍ¡½Ğ¤¤í…Á¤ ¤ü¹É•™É•Í ü¸ ¤íÉ•ÑÕÉ¸ÑÉÕ”ì)ô()™Õ¹Ñ¥½¸Õ¹‘¼ ¥ì(€½¹ÍĞÙ…±Õ”õ…µ” ¤±•¹ÑÉäõÕ¹‘½MÑ…¬¹Á½À ¤í¥˜ …•¹ÑÉåñğ…¥Í=™™±¥¹•…µ”¡Ù…±Õ”¥ññÙ…±Õ”¹ÕÈ„ôôÀ¥É•ÑÕÉ¸¹½Ñ¥™ä ;¼£„Õµ„©½…‘„Í•ÕÉ„Á…É„‘•Í™…é•È¸œ°•ÉÉ½Èœ¤ì(€¥˜¡µÕÑ…Ñ•I•ÍÑ½É”¡•¹ÑÉä¹Í¹…ÁÍ¡½Ğ¤¥íÉ•Á±…åÉ…µ•Ì¹ÁÕÍ ¡½µÁ…ÑÉ…µ”¡…µ” ¤±•Í™•¥Ñ¼è€‘í•¹ÑÉä¹±…‰•±õ€¤¤í¹½Ñ¥™ä )½…‘„‘•Í™•¥Ñ„…¹Ñ•Ì‘”•¹•ÉÉ…È¼ÑÕÉ¹¼¸œ°½¬œ¥ô(€ÕÁ‘…Ñ•	…ÑÑ±•Q½½±Ì ¤ì)ô()™Õ¹Ñ¥½¸…ÁÑÕÉ•	•™½É”¡±…‰•°¥ì(€½¹ÍĞÙ…±Õ”õ…µ” ¤í¥˜ …‰…ÑÑ±•Ñ¥Ù” ¥ñğ…¥Í=™™±¥¹•…µ”¡Ù…±Õ”¥ññÙ…±Õ”¹ÕÈ„ôôÀ¥É•ÑÕÉ¸ì(€Á•¹‘¥¹M¹…ÁÍ¡½ĞõíÍ¹…ÁÍ¡½Ğé±½¹”¡Ù…±Õ”¤±É•Ù¥Í¥½¸éÙ…±Õ”¹É•Ø±É½Õ¹éÙ…±Õ”¹É½Õ¹‘ôíÁ•¹‘¥¹1…‰•°õ±…‰•°ì(€Í•ÑQ¥µ•½ÕĞ  ¤ôùí½¹ÍĞ…™Ñ•Èõ…µ” ¤í¥˜¡Á•¹‘¥¹M¹…ÁÍ¡½Ğ˜™…™Ñ•È˜™…™Ñ•È¹É•Ø„ôõÁ•¹‘¥¹M¹…ÁÍ¡½Ğ¹É•Ù¥Í¥½¸˜™…™Ñ•È¹É½Õ¹ôôõÁ•¹‘¥¹M¹…ÁÍ¡½Ğ¹É½Õ¹˜™…™Ñ•È¹ÕÈôôôÀ¥íÕ¹‘½MÑ…¬¹ÁÕÍ ¡íÍ¹…ÁÍ¡½ĞéÁ•¹‘¥¹M¹…ÁÍ¡½Ğ¹Í¹…ÁÍ¡½Ğ±±…‰•°éÁ•¹‘¥¹1…‰•±ô¤íÕ¹‘½MÑ…¬õÕ¹‘½MÑ…¬¹Í±¥” ´à¥õÁ•¹‘¥¹M¹…ÁÍ¡½Ğõ¹Õ±°íÕÁ‘…Ñ•	…ÑÑ±•Q½½±Ì ¥ô°ĞÀ¤ì)ô()™Õ¹Ñ¥½¸…Ñ¥½¹1…‰•°¡Ñ…É•Ğ¥ì(€¥˜¡Ñ…É•Ğ¹±½Í•ÍĞ œ¹¡•ÍÑ¡½¥”œ¤¥É•ÑÕÉ¸€Í½±¡„‘¼	‡èœí¥˜¡Ñ…É•Ğ¹±½Í•ÍĞ œÉ•É½±°œ¤¥É•ÑÕÉ¸€I••µ‰…É…±¡…Èœí¥˜¡Ñ…É•Ğ¹±½Í•ÍĞ œ±…ÍÍ‰¥±¥Ñäœ¤¥É•ÑÕÉ¸€!…‰¥±¥‘…‘”‘”±…ÍÍ”œì(€½¹ÍĞ…ÉõÑ…É•Ğ¹±½Í•ÍĞ œ¹…Éœ¤í¥˜¡…É¥É•ÑÕÉ¸…ÉÑ„è€‘í…É¹ÅÕ•ÉåM•±•Ñ½È œ¹¸œ¤ü¹Ñ•áÑ½¹Ñ•¹Ññğ©½…‘„õ€ì(€¥˜¡Ñ…É•Ğ¹±½Í•ÍĞ œ¹±…¹”°¹Õ¹¥Ğœ¤¥É•ÑÕÉ¸A½Í¥¥½¹…µ•¹Ñ¼½Ô…±Ù½€ì(€É•ÑÕÉ¸€)½…‘„œì)ô()™Õ¹Ñ¥½¸¥¹ÍÑ…±±Ñ¥½¹…ÁÑÕÉ” ¥ì(€‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±•Ù•¹Ğôùì(€€€½¹ÍĞÑ…É•Ğõ•Ù•¹Ğ¹Ñ…É•Ğí¥˜ „¡Ñ…É•Ğ¥¹ÍÑ…¹•½˜±•µ•¹Ğ¤¥É•ÑÕÉ¸ì(€€€¥˜¡Ñ…É•Ğ¹±½Í•ÍĞ œ•¹‘QÕÉ¸œ¤¥É•ÑÕÉ¸‘…¹•É½ÕÍ¹‘QÕÉ¸¡•Ù•¹Ğ¤ì(€€€¥˜¡Ñ…É•Ğ¹±½Í•ÍĞ œ¹…É°¹±…¹”°¹Õ¹¥Ğ°¹¡•ÍÑ¡½¥”°É•É½±°°±…ÍÍ‰¥±¥Ñäœ¤¥…ÁÑÕÉ•	•™½É”¡…Ñ¥½¹1…‰•°¡Ñ…É•Ğ¤¤ì(€ô±ÑÉÕ”¤ì)ô()™Õ¹Ñ¥½¸‘…¹•É½ÕÍ¹‘QÕÉ¸¡•Ù•¹Ğ¥ì(€½¹ÍĞÙ…±Õ”õ…µ” ¤±µ”õÕÉÉ•¹ÑA±…å•È¡Ù…±Õ”¤í¥˜¡‘…¹•É½ÕÍ	åÁ…ÍÍñğ…‰…ÑÑ±•Ñ¥Ù” ¥ñğ…µ•Ñ„ ¤¹‘…¹•É½ÕÍ½¹™¥Éµñğ…µ”¥É•ÑÕÉ¸ì(€½¹ÍĞÁ±…å…‰±”ô¡µ”¹¡…¹‘ññmt¤¹™¥±Ñ•È¡…Éôù9Õµ‰•È¡…É¹½ÍÑñğÀ¤ğõ9Õµ‰•È¡µ”¹µ…¹…ñğÀ¤¤ì(€¥˜ …Á±…å…‰±”¹±•¹Ñ ˜™9Õµ‰•È¡µ”¹µ…¹…ñğÀ¤ğÌ¥É•ÑÕÉ¸ì(€½¹ÍĞ‘•Ñ…¥°õÁ±…å…‰±”¹±•¹Ñ ıY½¨…¥¹‘„Á½‘”©½…È€‘íÁ±…å…‰±”¹±•¹Ñ¡ô…ÉÑ„‘íÁ±…å…‰±”¹±•¹Ñ øÄüÌœèœô¹€éY½¨…¥¹‘„Ñ•´€‘íµ”¹µ…¹…ô‘”µ…¹„¹€ì(€¥˜¡İ¥¹‘½Ü¹½¹™¥É´¡€‘í‘•Ñ…¥±õq¹q¹Q•´•ÉÑ•é„ÅÕ”‘•Í•©„•¹•ÉÉ…È¼ÑÕÉ¹¼ı€¤¥É•ÑÕÉ¸ì(€•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤í•Ù•¹Ğ¹ÍÑ½Á%µµ•‘¥…Ñ•AÉ½Á……Ñ¥½¸ ¤ì)ô()™Õ¹Ñ¥½¸…ÁÁ±å5…ÍÑ•Éå¹‘I½ÕÑ•Ì¡Ù…±Õ”¥ì(€¥˜ …Ù…±Õ•ñğ…¥Í=™™±¥¹•…µ”¡Ù…±Õ”¥ññÙ…±Õ”¹½Ù•È¥É•ÑÕÉ¸ì(€½¹ÍĞµ”õÙ…±Õ”¹Àü¹lÁt±±…ÍÍ%õµ”ü¹±…ÍÍ%‘ññ…Ñ¥Ù•±…ÍÌ ¤±¹½‘•Ìõ¹•ÜM•Ğ¡ÁÉ½™¥±” ¤¹µ…ÍÑ•ÉåQÉ•”ü¹m±…ÍÍ%‘uññmt¤ì(€¥˜¡Ù…±Õ”¹…É…¹…5…ÍÑ•ÉåÁÁ±¥•„ôõYIM%=8¥ì(€€€Ù…±Õ”¹…É…¹…5…ÍÑ•ÉåÁÁ±¥•õYIM%=8ì(€€€½¹ÍĞ¡Á	½¹ÕÌô¡¹½‘•Ì¹¡…Ì ‰…ÍÑ¥½¸œ¥ññ¹½‘•Ì¹¡…Ì Á…Ğœ¥ññ¹½‘•Ì¹¡…Ì ½¹Ù•É•¹”œ¤¤üÄè¡¹½‘•Ì¹¡…Ì Í••œ¤üÈèÀ¤ì(€€€¥˜¡¡Á	½¹ÕÌ¥íµ”¹µ…á!À¬õ¡Á	½¹ÕÌíµ”¹¡À¬õ¡Á	½¹ÕÍô(€€€¥˜¡l¸¸¹¹½‘•Ít¹Í½µ”¡¥ôùl…ÉÍ•¹…°œ°•¡¼œ°ÉåÍÑ…°œ°ÍÁ…É¬œ°±½½Àt¹¥¹±Õ‘•Ì¡¥¤¤¥µ”¹É•É½±±Ì¬¬ì(€€€¥˜¡l¸¸¹¹½‘•Ít¹Í½µ”¡¥ôùl•µ‰•Èœ°µ…É¬t¹¥¹±Õ‘•Ì¡¥¤¤¥µ”¹µ…¹„¬¬ì(€€€…Á¤ ¤ü¹É•™É•Í ü¸ ¤ì(€ô(€½¹ÍĞÉ½Õ¹‘-•äõ€‘íÙ…±Õ”¹¥‘ôè‘íÙ…±Õ”¹É½Õ¹‘õ€í¥˜¡±…ÍÑÁÁ±¥•‘I½Õ¹ôôõÉ½Õ¹‘-•åññÙ…±Õ”¹É½Õ¹ğÉññÙ…±Õ”¹ÕÈ„ôôÀ¥É•ÑÕÉ¸í±…ÍÑÁÁ±¥•‘I½Õ¹õÉ½Õ¹‘-•äì(€Ù…±Õ”¹…É…¹…½µ¥¹…Ñ¥½¸õÙ…±Õ”¹…É…¹…½µ¥¹…Ñ¥½¹ññlÀ°Átí½¹ÍĞ±…¹”ô¡Ù…±Õ”¹É½Õ¹´Ä¤”Ìì(€½¹ÍĞÍÑÉ•¹Ñ õÍ¥‘”ôø¡Ù…±Õ”¹Àü¹mÍ¥‘•tü¹±…¹•Ìü¹m±…¹•uññmt¤¹É•‘Õ” ¡ÍÕ´±Õ¹¥Ğ¤ôùÍÕ´­9Õµ‰•È¡Õ¹¥Ğ¹…Ñ­ñğÀ¤°À¤ì(€½¹ÍĞ„õÍÑÉ•¹Ñ  À¤±ˆõÍÑÉ•¹Ñ  Ä¤ì(€¥˜¡„„ôõˆ¥í½¹ÍĞİ¥¹¹•Èõ„ùˆüÀèÄ±±•…‘•ÈõÙ…±Õ”¹Ámİ¥¹¹•Ét¹±…¹•Ím±…¹•ulÁtíÙ…±Õ”¹Ámİ¥¹¹•Ét¹µ…¹„õ5…Ñ ¹µ¥¸¡Ù…±Õ”¹Ámİ¥¹¹•Ét¹µ…á5…¹„±Ù…±Õ”¹Ámİ¥¹¹•Ét¹µ…¹„¬Ä¤í¥˜¡±•…‘•È¥í±•…‘•È¹µ…á!Àõ9Õµ‰•È¡±•…‘•È¹µ…á!Áññ±•…‘•È¹¡À¤¬Äí±•…‘•È¹¡À¬­õ¥˜¡İ¥¹¹•ÈôôôÀ˜™¹½‘•Ì¹¡…Ì É½Ù”œ¤¥µ”¹¡Àõ5…Ñ ¹µ¥¸¡µ”¹µ…á!À±µ”¹¡À¬Ä¥ô(€™½È¡±•ĞÍ¥‘”ôÀíÍ¥‘”ğÈíÍ¥‘”¬¬¥ì(€€€½¹ÍĞ½¹ÑÉ½±ÌõlÀ°Ä°Ét¹•Ù•Éä¡¥¹‘•àôø¡Ù…±Õ”¹ÁmÍ¥‘•t¹±…¹•Ím¥¹‘•áuññmt¤¹±•¹Ñ øÀ˜˜¡Ù…±Õ”¹ÁlÄµÍ¥‘•t¹±…¹•Ím¥¹‘•áuññmt¤¹±•¹Ñ ôôôÀ¤ì(€€€Ù…±Õ”¹…É…¹…½µ¥¹…Ñ¥½¹mÍ¥‘•tõ½¹ÑÉ½±Ìı9Õµ‰•È¡Ù…±Õ”¹…É…¹…½µ¥¹…Ñ¥½¹mÍ¥‘•uñğÀ¤¬ÄèÀì(€€€½¹ÍĞ¹••‘•õÍ¥‘”ôôôÀ˜™l¸¸¹¹½‘•Ít¹Í½µ”¡¥ôùl½…Ñ œ°…‰Í½±ÕÑ”œ°Á½ÉÑ…°t¹¥¹±Õ‘•Ì¡¥¤¤üÈèÌì(€€€¥˜¡Ù…±Õ”¹…É…¹…½µ¥¹…Ñ¥½¹mÍ¥‘•tøõ¹••‘•¥íÙ…±Õ”¹½Ù•ÈõÑÉÕ”íÙ…±Õ”¹İ¥¹¹•ÈõÍ¥‘”í¹½Ñ¥™ä¡Y¥ÓÍÉ¥„Á½È½·µ¹¥¼è€‘í¹••‘•‘ôÉ½‘…‘…Ì½¹ÑÉ½±…¹‘¼…ÌÑË©ÌÉ½Ñ…Ì…€°½¬œ¥ô(€ô(€…Á¤ ¤ü¹É•™É•Í ü¸ ¤ì)ô()™Õ¹Ñ¥½¸ÕÁ‘…Ñ•	…ÑÑ±•Q½½±Ì ¥ì(€¥¹ÍÑ…±±	…ÑÑ±•U¤ ¤í½¹ÍĞÑ½½±Ìõ‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …ÉŒÄÀÁ	…ÑÑ±•Q½½±Ìœ¤±Ù…±Õ”õ…µ” ¤±…Ñ¥Ù”õ‰…ÑÑ±•Ñ¥Ù” ¤í¥˜ …Ñ½½±Ì¥É•ÑÕÉ¸ì(€Ñ½½±Ì¹±…ÍÍ1¥ÍĞ¹Ñ½±” …Ñ¥Ù”œ±…Ñ¥Ù”¤í‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È œ¹…µ•½½Ñ•Èœ¤ü¹±…ÍÍ1¥ÍĞ¹Ñ½±” …ÉŒÄÀÁ!…¹‘I•…‘äœ±…Ñ¥Ù”¤í½¹ÍĞ…¹U¹‘¼õ…Ñ¥Ù”˜™¥Í=™™±¥¹•…µ”¡Ù…±Õ”¤˜™Ù…±Õ”¹ÕÈôôôÀ˜™Õ¹‘½MÑ…¬¹±•¹Ñ øÀíÑ½½±Ì¹ÅÕ•ÉåM•±•Ñ½È œ…ÉŒÄÀÁU¹‘¼œ¤¹‘¥Í…‰±•ô……¹U¹‘¼íÕÁ‘…Ñ•!…¹‘9…Ù¥…Ñ¥½¸ ¤ì)ô()™Õ¹Ñ¥½¸Á½±±…µ” ¥ì(€½¹ÍĞÙ…±Õ”õ…µ” ¤íÕÁ‘…Ñ•	…ÑÑ±•Q½½±Ì ¤ì(€¥˜ …Ù…±Õ•ñğ…Ù…±Õ”¹¥¥í±…ÍÑMÑ…Ñ”õ¹Õ±°í±…ÍÑI•Ù¥Í¥½¸ô´ÄíÉ•ÑÕÉ¹ô(€¥˜¡Ù…±Õ”¹¥„ôõ±…ÍÑ5…Ñ¡%¥í±…ÍÑ5…Ñ¡%õÙ…±Õ”¹¥íµ…Ñ¡MÑ…ÉÑ•‘Ğõ…Ñ”¹¹½Ü ¤íÉ•Á±…åÉ…µ•ÌõmtíÕ¹‘½MÑ…¬õmtí±…ÍÑMÑ…Ñ”õ±½¹”¡Ù…±Õ”¤í±…ÍÑI•Ù¥Í¥½¸õÙ…±Õ”¹É•Øí½¹ÍĞ™¥ÉÍĞõ½µÁ…ÑÉ…µ”¡Ù…±Õ”°A…ÉÑ¥‘„¥¹¥¥…‘„œ¤í¥˜¡™¥ÉÍĞ¥É•Á±…åÉ…µ•Ì¹ÁÕÍ ¡™¥ÉÍĞ¥ô(€…ÁÁ±å5…ÍÑ•Éå¹‘I½ÕÑ•Ì¡Ù…±Õ”¤ì(€¥˜¡Ù…±Õ”¹É•Øôôõ±…ÍÑI•Ù¥Í¥½¸¥É•ÑÕÉ¸ì(€½¹ÍĞ±…‰•°õ¥¹™•ÉÑ¥½¸¡±…ÍÑMÑ…Ñ”±Ù…±Õ”¤±™É…µ”õ½µÁ…ÑÉ…µ”¡Ù…±Õ”±±…‰•°¤í¥˜¡™É…µ”¥É•Á±…åÉ…µ•Ì¹ÁÕÍ ¡™É…µ”¤íÉ•Á±…åÉ…µ•ÌõÉ•Á±…åÉ…µ•Ì¹Í±¥” ´àÀ¤í•™™•ÑÌ¡±…ÍÑMÑ…Ñ”±Ù…±Õ”¤í±…ÍÑMÑ…Ñ”õ±½¹”¡Ù…±Õ”¤í±…ÍÑI•Ù¥Í¥½¸õÙ…±Õ”¹É•Øì)ô()™Õ¹Ñ¥½¸•™™•ÑÌ¡‰•™½É”±…™Ñ•È¥ì(€¥˜ …‰•™½É•ñğ……™Ñ•È¥É•ÑÕÉ¸ì(€½¹ÍĞ½±‘5”õ‰•™½É”¹Àü¹lÁtü¹¡À±¹•İ5”õ…™Ñ•È¹Àü¹lÁtü¹¡À±½±‘=Àõ‰•™½É”¹Àü¹lÅtü¹¡À±¹•İ=Àõ…™Ñ•È¹Àü¹lÅtü¹¡Àì(€¥˜¡½±‘5”„ôõ¹•İ5”¥™±½…Ñ9Õµ‰•È¡‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% µ•Ù…Ñ…Èœ¤±¹•İ5”µ½±‘5”¤ì(€¥˜¡½±‘=À„ôõ¹•İ=À¥™±½…Ñ9Õµ‰•È¡‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% •¹•µåÙ…Ñ…Èœ¤±¹•İ=Àµ½±‘=À¤ì)ô()™Õ¹Ñ¥½¸™±½…Ñ9Õµ‰•È¡…¹¡½È±…µ½Õ¹Ğ¥ì(€¥˜ ……¹¡½Éñğ……µ½Õ¹Ğ¥É•ÑÕÉ¸í½¹ÍĞ‰½àõ…¹¡½È¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ğ ¤±¹½‘”õ‘½Õµ•¹Ğ¹É•…Ñ•±•µ•¹Ğ ÍÁ…¸œ¤í¹½‘”¹±…ÍÍ9…µ”õ…ÉŒÄÀÁ±½…Ğ€‘í…µ½Õ¹ĞøÀü¡•…°œè‘…µ…”õ€í¹½‘”¹Ñ•áÑ½¹Ñ•¹Ğõ…µ½Õ¹ĞøÀı€¬‘í…µ½Õ¹Ñõ€éMÑÉ¥¹œ¡…µ½Õ¹Ğ¤í¹½‘”¹ÍÑå±”¹±•™Ğõ€‘í‰½à¹±•™Ğ­‰½à¹İ¥‘Ñ ¼ÉõÁá€í¹½‘”¹ÍÑå±”¹Ñ½Àõ€‘í‰½à¹Ñ½ÁõÁá€í‘½Õµ•¹Ğ¹‰½‘ä¹…ÁÁ•¹‘¡¥±¡¹½‘”¤íÍ•ÑQ¥µ•½ÕĞ  ¤ôù¹½‘”¹É•µ½Ù” ¤°äÔÀ¤ì)ô()™Õ¹Ñ¥½¸É•İ…É‘…É¡‘•Ñ…¥°¥ì(€½¹ÍĞ…Ñ…±½œô¡…Á¤ ¤ü¹…É‘Íññmt¤¹™¥±Ñ•È¡…Éôù±½‰…±Q¡¥Ì¹É…¹…Ù½±ÕÑ¥½¸ü¹…±±½İ•‘½É±…ÍÌü¸¡…É±‘•Ñ…¥°¹±…ÍÍ%‘ññ…Ñ¥Ù•±…ÍÌ ¤¤¤í¥˜ ……Ñ…±½œ¹±•¹Ñ ¥É•ÑÕÉ¸ì(€½¹ÍĞÍ•É•Ñ¡…¹”õ5…Ñ ¹É…¹‘½´ ¤ğ¸ÀÀÈÔ±•±¥¥‰±”õ…Ñ…±½œ¹™¥±Ñ•È¡…ÉôùÍ•É•Ñ¡…¹”ı…É¹Í•É•Ğè……É¹Í•É•Ğ¤í¥˜ …•±¥¥‰±”¹±•¹Ñ ¥É•ÑÕÉ¸ì(€½¹ÍĞ…Éõ•±¥¥‰±•m5…Ñ ¹™±½½È¡5…Ñ ¹É…¹‘½´ ¤©•±¥¥‰±”¹±•¹Ñ ¥t±¹•áĞõÁÉ½™¥±” ¤í¹•áĞ¹…É‘½Á¥•Ìõì¸¸¸¡¹•áĞ¹…É‘½Á¥•Íññíô¥ôí¹•áĞ¹…É‘½Á¥•Ím…É¹¹…µ•tõ9Õµ‰•È¡¹•áĞ¹…É‘½Á¥•Ím…É¹¹…µ•uñğÀ¤¬Äí¥˜ …¹•áĞ¹‘¥Í½Ù•É•ü¹¥¹±Õ‘•Ì¡…É¹¹…µ”¤¥¹•áĞ¹‘¥Í½Ù•É•õl¸¸¸¡¹•áĞ¹‘¥Í½Ù•É•‘ññmt¤±…É¹¹…µ•tíÍ…Ù•AÉ½™¥±”¡¹•áĞ¤í¹½Ñ¥™ä¡Í•É•Ñ¡…¹”ıƒŠr˜MI<IY1<è€‘í…É¹¹…µ•õ€éI•½µÁ•¹Í„‘„Á…ÉÑ¥‘„è€‘í…É¹¹…µ•õ€°½¬œ¤ì)ô()™Õ¹Ñ¥½¸½¹5…Ñ ¡•Ù•¹Ğ¥ì(€½¹ÍĞ‘•Ñ…¥°õ•Ù•¹Ğ¹‘•Ñ…¥±ññíô±Ù…±Õ”õ…µ” ¤±¹½Üõ…Ñ”¹¹½Ü ¤±™¥¹•ÉÁÉ¥¹ĞõÙ…±Õ”ü¹¥‘ññ€‘í‘•Ñ…¥°¹µ½‘•ñğÍ½±¼ôè‘ì„…‘•Ñ…¥°¹İ¥¹ôè‘ì„…‘•Ñ…¥°¹ÍÕÉÉ•¹‘•É•‘õ€ì(€¥˜¡™¥¹•ÉÁÉ¥¹Ğôôõ±…ÍÑAÉ½•ÍÍ•‘5…Ñ ˜™¹½Üµ±…ÍÑAÉ½•ÍÍ•‘ĞğĞÀÀÀ¥É•ÑÕÉ¸í±…ÍÑAÉ½•ÍÍ•‘5…Ñ õ™¥¹•ÉÁÉ¥¹Ğí±…ÍÑAÉ½•ÍÍ•‘Ğõ¹½Üì(€½¹ÍĞ™É…µ”õ½µÁ…ÑÉ…µ”¡Ù…±Õ”±‘•Ñ…¥°¹ÍÕÉÉ•¹‘•É•ü•Í¥ÍÓ©¹¥„œèA…ÉÑ¥‘„•¹•ÉÉ…‘„œ¤í¥˜¡™É…µ”¥É•Á±…åÉ…µ•Ì¹ÁÕÍ ¡™É…µ”¤ì(€½¹ÍĞ¥Ñ•´õí¥éÙ…±Õ”ü¹¥‘ññ€‘í…Ñ”¹¹½Ü ¥õ€±µ½‘”éÙ…±Õ”ü¹µ½‘•ññ‘•Ñ…¥°¹µ½‘•ñğÍ½±¼œ±µ½‘•9…µ”é…Á¤ ¤ü¹µ½‘•Ìü¹mÙ…±Õ”ü¹µ½‘•ññ‘•Ñ…¥°¹µ½‘•tü¹¹…µ•ñğ	…Ñ…±¡„œ±İ¥¸è„…‘•Ñ…¥°¹İ¥¸±É½Õ¹‘Ìé9Õµ‰•È¡Ù…±Õ”ü¹É½Õ¹‘ñğÄ¤±‘ÕÉ…Ñ¥½¸é…Ñ”¹¹½Ü ¤µµ…Ñ¡MÑ…ÉÑ•‘Ğ±•¹‘•‘Ğé…Ñ”¹¹½Ü ¤±…Ñ¥½¹ÌéÉ•Á±…åÉ…µ•Íôì(€½¹ÍĞ¥Ñ•µÌõ±½…‘I•Á±…åÌ ¤¹™¥±Ñ•È¡É•Á±…äôùÉ•Á±…ä¹¥„ôõ¥Ñ•´¹¥¤í¥Ñ•µÌ¹Õ¹Í¡¥™Ğ¡¥Ñ•´¤íÍ…Ù•I•Á±…åÌ¡¥Ñ•µÌ¤íÉ•İ…É‘…É¡‘•Ñ…¥°¤ì(€½¹ÍĞ¹•áĞõÁÉ½™¥±” ¤í¹•áĞ¹…¡¥•Ù•µ•¹ÑÍXÈõì¸¸¸¡¹•áĞ¹…¡¥•Ù•µ•¹ÑÍXÉññíô¥ôí¥˜¡‘•Ñ…¥°¹İ¥¸˜™Ù…±Õ”ü¹Àü¹lÁtü¹¡ÀôôõÙ…±Õ”ü¹Àü¹lÁtü¹µ…á!À¥¹•áĞ¹…¡¥•Ù•µ•¹ÑÍXÈ¹™±…İ±•ÍÌõ…Ñ”¹¹½Ü ¤í¥˜¡‘•Ñ…¥°¹İ¥¸˜™Ù…±Õ”ü¹Àü¹lÁtü¹¡ÀôôôÄ¥¹•áĞ¹…¡¥•Ù•µ•¹ÑÍXÈ¹±…ÍÑ	É•…Ñ õ…Ñ”¹¹½Ü ¤íÍ…Ù•AÉ½™¥±”¡¹•áĞ¤ì)ô()™Õ¹Ñ¥½¸¥¹ÍÑ…±° ¥ì(€¥˜¡¥¹ÍÑ…±±•¥É•ÑÕÉ¸í¥¹ÍÑ…±±•õÑÉÕ”íµ¥É…Ñ•AÉ½™¥±” ¤í¥¹ÍÑ…±±	…ÑÑ±•U¤ ¤í¥¹ÍÑ…±±Ñ¥½¹…ÁÑÕÉ” ¤íİ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È …É…¹„éµ…Ñ œ±½¹5…Ñ ¤íİ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È …É…¹„éÁÉ½™¥±”œ±µ¥É…Ñ•AÉ½™¥±”¤íÍ•Ñ%¹Ñ•ÉÙ…°¡Á½±±…µ”°ÈÈÀ¤í‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ­•å‘½İ¸œ±•Ù•¹Ğôùí¥˜¡•Ù•¹Ğ¹­•äôôôÍ…Á”œ¥í‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …É…¹…=¹•!Õˆœ¤ü¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¤í‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …ÉŒÄÀÁ	…ÑÑ±•A…¹•°œ¤ü¹±…ÍÍ1¥ÍĞ¹…‘ ¡¥‘‘•¸œ¥õô¤ì)ô()‘½Õµ•¹Ğ¹É•…‘åMÑ…Ñ”ôôô±½…‘¥¹œœı‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È =5½¹Ñ•¹Ñ1½…‘•œ±¥¹ÍÑ…±°±í½¹”éÑÉÕ•ô¤é¥¹ÍÑ…±° ¤ì)±½‰…±Q¡¥Ì¹É…¹…=¹”õíÙ•ÉÍ¥½¸éYIM%=8±½Á•¸±µ¥É…Ñ”éµ¥É…Ñ•AÉ½™¥±”±É•Á±…åÌé±½…‘I•Á±…åÌ±•Ù•¹Ğé•Ù•¹Ñ=™]••¬±½İ¹•‘ôì)ô¤ ¤ì(