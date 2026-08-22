(()=>{
const EVOLUTION_VERSION='0.9.0-classbound';
const PROFILE_KEY='arcana_profile_v2';
const DECK_SIZE=30;
const MAX_COPIES=3;

const CLASS_RULES={
  vanguard:{icon:'🛡️',name:'Guerreiro Arcano',school:'Ordem Solar',factions:['solar'],style:'defense',color:'#ffd36b',identity:'Guardas, Escudos e fortalecimento. Resiste, ocupa as rotas e vence por presença.'},
  pyromancer:{icon:'🔥',name:'Piromante',school:'Chama Solar',factions:['solar'],style:'aggro',color:'#ff7a61',identity:'Dano direto, Investida e pressão. Queima recursos para encerrar a batalha cedo.'},
  necromancer:{icon:'💀',name:'Necromante',school:'Pacto do Vazio',factions:['void'],style:'control',color:'#ae7cff',identity:'Mortes, drenagem e valor do descarte. Cada perda prepara o próximo retorno.'},
  druid:{icon:'🌿',name:'Druida',school:'Círculo Selvagem',factions:['wild'],style:'swarm',color:'#6ee69b',identity:'Cura, crescimento e enxame. Constrói um campo que fica mais forte a cada turno.'},
  cryomancer:{icon:'❄️',name:'Criomante',school:'Coroa de Geada',factions:['frost'],style:'control',color:'#74d8ff',identity:'Congelamento, controle de ritmo e punição. Decide quando o rival pode agir.'},
  assassin:{icon:'🗡️',name:'Assassino',school:'Lâmina do Vazio',factions:['void'],style:'aggro',color:'#ff6c9e',identity:'Execução, criaturas frágeis e dano preciso. Remove a peça certa no instante certo.'},
  summoner:{icon:'🌀',name:'Invocador',school:'Convergência',factions:['arcane','mech'],style:'swarm',color:'#7ea5ff',identity:'Familiares, cópias e construtos. Multiplica unidades pequenas e efeitos de entrada.'},
  chronomancer:{icon:'⏳',name:'Cronomante',school:'Ordem Temporal',factions:['arcane'],style:'tempo',color:'#b78cff',identity:'Compra, previsão e eficiência. Troca explosão por consistência e controle do futuro.'}
};

const FACTION_NAMES={solar:'Solar',void:'Vazio',wild:'Selvagem',frost:'Geada',mech:'Mecânico',arcane:'Arcano',neutral:'Neutra'};
const parse=(value,fallback={})=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
const profile=()=>parse(localStorage.getItem(PROFILE_KEY),{});
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const textOf=card=>`${card.name||''} ${card.text||''} ${(card.kw||[]).join(' ')} ${card.effect||''} ${card.onPlay||''} ${card.death||''}`.toLowerCase();
const uniqueId=()=>`evo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;

function saveProfile(next){
  localStorage.setItem(PROFILE_KEY,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('arcana:profile',{detail:next}));
  globalThis.ArcanaLobby?.refresh?.();
}

function cardClasses(card){
  if(card.fac==='neutral')return Object.keys(CLASS_RULES);
  const text=textOf(card);
  if(card.fac==='wild')return ['druid'];
  if(card.fac==='frost')return ['cryomancer'];
  if(card.fac==='mech')return ['summoner'];
  if(card.fac==='solar'){
    const fire=/brasa|falcão|raio|chama|fogo|incênd|explos|investida|meio-dia/.test(text);
    return [fire?'pyromancer':'vanguard'];
  }
  if(card.fac==='void'){
    const blade=/lâmina|assassin|execu|apagar|carrasco|embosc|ruptura|predador|ataque rápido/.test(text);
    return [blade?'assassin':'necromancer'];
  }
  if(card.fac==='arcane'){
    const time=/tempo|cron|previs|futuro|passado|relóg|ampulheta|compr|reserva|zero|oráculo/.test(text);
    return [time?'chronomancer':'summoner'];
  }
  return [];
}

function allowedForClass(card,classId){
  return card.fac==='neutral'||cardClasses(card).includes(classId);
}

function allowedCatalog(player,catalog){
  if(player?.classId&&CLASS_RULES[player.classId])return catalog.filter(card=>allowedForClass(card,player.classId));
  const faction=player?.hero?.fac;
  return catalog.filter(card=>card.fac==='neutral'||card.fac===faction);
}

function cardScore(card,style='tempo'){
  const cost=Number(card.cost||0),text=textOf(card),unit=card.type==='unit',spell=card.type==='spell';
  let score=6-Math.abs(cost-3)*.55+(unit?1.2:0);
  if(style==='aggro')score+=(cost<=2?4:cost<=4?1.6:-2)+(card.atk||0)*.45+(/investida|dano|cause/.test(text)?2:0);
  if(style==='defense')score+=(/guarda|escudo|cura|fortale/.test(text)?4:0)+(card.hp||0)*.35+(cost>=3?1:0);
  if(style==='control')score+=(spell?2:0)+(/congel|destr|apagar|dren|cause|todos/.test(text)?3.2:0)+(cost>=4?1:0);
  if(style==='swarm')score+=(unit&&cost<=3?3.2:0)+(/invo|crie|cópia|broto|familiar|compre/.test(text)?2.5:0);
  if(style==='tempo')score+=(cost>=2&&cost<=4?2.8:0)+(/compre|previs|mana|custa/.test(text)?3:0)+(spell?1:0);
  return score;
}

function autoDeckNames(classId,catalog,heroFaction=null){
  const rule=CLASS_RULES[classId];
  let pool=rule?catalog.filter(card=>allowedForClass(card,classId)):catalog.filter(card=>card.fac==='neutral'||card.fac===heroFaction);
  if(!pool.length)pool=[...catalog];
  const style=rule?.style||'tempo';
  const lows=pool.filter(card=>card.cost<=2).sort((a,b)=>cardScore(b,style)-cardScore(a,style));
  const mids=pool.filter(card=>card.cost>=3&&card.cost<=4).sort((a,b)=>cardScore(b,style)-cardScore(a,style));
  const highs=pool.filter(card=>card.cost>=5).sort((a,b)=>cardScore(b,style)-cardScore(a,style));
  const tactics=pool.filter(card=>card.type!=='unit').sort((a,b)=>cardScore(b,style)-cardScore(a,style));
  const ordered=[...lows,...mids,...tactics,...highs,...pool.sort((a,b)=>cardScore(b,style)-cardScore(a,style))];
  const targets=[10,10,6,4],groups=[lows,mids,tactics,highs],counts={},names=[];
  const addFrom=(cards,target)=>{
    let cursor=0,guard=0;
    while(target>0&&cards.length&&guard++<500){
      const card=cards[cursor++%cards.length],count=counts[card.name]||0;
      if(count<MAX_COPIES){names.push(card.name);counts[card.name]=count+1;target--}
      if(cards.every(item=>(counts[item.name]||0)>=MAX_COPIES))break;
    }
  };
  groups.forEach((group,index)=>addFrom(group,targets[index]));
  addFrom(ordered,DECK_SIZE-names.length);
  if(names.length<DECK_SIZE){
    const fallback=pool[0];
    while(fallback&&names.length<DECK_SIZE)names.push(fallback.name);
  }
  return names.slice(0,DECK_SIZE);
}

function validateDeckNames(names,classId,catalog,heroFaction=null){
  if(!Array.isArray(names)||names.length!==DECK_SIZE)return null;
  const rule=CLASS_RULES[classId],counts={},valid=[];
  for(const name of names){
    const card=catalog.find(item=>item.name===name);
    if(!card)return null;
    if(rule&&!allowedForClass(card,classId))return null;
    if(!rule&&card.fac!=='neutral'&&card.fac!==heroFaction)return null;
    counts[name]=(counts[name]||0)+1;
    if(counts[name]>MAX_COPIES)return null;
    valid.push(card);
  }
  return valid;
}

function instantiateCard(card,instantiate){
  if(typeof instantiate==='function')return instantiate(card);
  const copy=JSON.parse(JSON.stringify(card));copy.id=uniqueId();copy.age=(copy.kw||[]).includes('Investida')?1:0;copy.frozen=0;copy.shield=(copy.kw||[]).includes('Escudo');return copy;
}

function buildDeck(player,catalog,instantiate,shuffle){
  const p=profile(),classId=player.classId,stored=classId&&player.index===0?p.classDecks?.[classId]?.cards:null;
  const valid=validateDeckNames(stored,classId,catalog,player.hero?.fac);
  const cards=valid||autoDeckNames(classId,catalog,player.hero?.fac).map(name=>catalog.find(card=>card.name===name)).filter(Boolean);
  const deck=cards.map(card=>instantiateCard(card,instantiate));
  player.classDeckVersion=2;
  player.classSchool=CLASS_RULES[classId]?.school||FACTION_NAMES[player.hero?.fac]||'Livre';
  player.classDeckName=p.classDecks?.[classId]?.name||`${CLASS_RULES[classId]?.name||player.hero?.name} Essencial`;
  return typeof shuffle==='function'?shuffle(deck):deck.sort(()=>Math.random()-.5);
}

function takeFromDeck(player,predicate){
  let index=player.deck.findIndex(predicate);
  if(index<0)index=0;
  return player.deck.splice(index,1)[0];
}

function openingHand(player){
  const mode=globalThis.__ARCANA?.state?.()?.mode;
  if(mode==='draft'||!player?.deck?.length)return false;
  const picks=[];
  const take=predicate=>{const card=takeFromDeck(player,item=>!picks.includes(item)&&predicate(item));if(card)picks.push(card)};
  take(card=>card.type==='unit'&&card.cost<=2);
  take(card=>card.type==='unit'&&card.cost>=2&&card.cost<=4);
  take(card=>card.type==='spell'&&card.cost<=4);
  take(card=>card.cost<=4);
  player.hand=picks.filter(Boolean);
  player.openingHandCurated=true;
  return true;
}

function tacticalScore(card,player){
  const rule=CLASS_RULES[player.classId],style=rule?.style||'tempo',enemy=globalThis.__ARCANA?.state?.()?.p?.[1-player.index];
  let score=cardScore(card,style)+Math.random()*1.7;
  const text=textOf(card),ownUnits=player.lanes?.flat?.().length||0,enemyUnits=enemy?.lanes?.flat?.().length||0;
  if(!ownUnits&&card.type==='unit')score+=3;
  if(enemyUnits>=3&&/todos|dano|congel|destr/.test(text))score+=3;
  if(player.hp<(player.maxHp||30)*.55&&/cura|guarda|escudo|dren/.test(text))score+=2.5;
  if(card.cost<=Math.max(1,player.maxMana||1)+1)score+=1.5;
  return score;
}

function draftOptions(player,rarity,catalog,instantiate){
  let pool=allowedCatalog(player,catalog).filter(card=>{
    const mana=Math.max(1,player.maxMana||1);
    if(rarity==='common')return card.cost<=Math.min(3,mana+1);
    if(rarity==='rare')return card.cost<=Math.min(5,mana+2);
    return card.cost>=Math.max(3,mana-1);
  });
  if(pool.length<2)pool=allowedCatalog(player,catalog);
  const sorted=[...pool].sort((a,b)=>tacticalScore(b,player)-tacticalScore(a,player));
  const first=sorted[0],alternatives=sorted.filter(card=>card.name!==first?.name).sort((a,b)=>{
    const diversity=(a.type!==first?.type?2:0)+(a.cost!==first?.cost?1:0);
    return tacticalScore(b,player)-tacticalScore(a,player)-diversity;
  });
  const second=alternatives.slice(0,Math.min(5,alternatives.length))[Math.floor(Math.random()*Math.min(5,alternatives.length))]||sorted[1];
  return first&&second?[instantiateCard(first,instantiate),instantiateCard(second,instantiate)]:null;
}

function relicOptions(player,catalog,instantiate){
  const pool=allowedCatalog(player,catalog).filter(card=>card.type==='relic');
  const source=pool.length?pool:catalog.filter(card=>card.type==='relic'&&card.fac==='neutral');
  if(!source.length)return null;
  const choices=[...source].sort(()=>Math.random()-.5).slice(0,2);
  if(choices.length===1)choices.push(choices[0]);
  return choices.map(card=>instantiateCard(card,instantiate));
}

let forgeState=null;
function getCatalog(){return globalThis.__ARCANA?.cards||[]}
function currentClass(){return profile().classId||'vanguard'}
function savedDeck(classId){return profile().classDecks?.[classId]||null}

function openDeckBuilder(classId=currentClass()){
  const catalog=getCatalog();if(!catalog.length)return;
  const saved=savedDeck(classId),cards=validateDeckNames(saved?.cards,classId,catalog)||autoDeckNames(classId,catalog).map(name=>catalog.find(card=>card.name===name)).filter(Boolean);
  forgeState={classId,name:saved?.name||`${CLASS_RULES[classId].name} Essencial`,names:cards.map(card=>card.name),filter:'all',search:''};
  renderForge();
}

function deckCounts(){return forgeState.names.reduce((map,name)=>(map[name]=(map[name]||0)+1,map),{})}
function curve(){
  const catalog=getCatalog(),bins=[0,0,0,0,0,0];
  forgeState.names.forEach(name=>{const cost=catalog.find(card=>card.name===name)?.cost||0;bins[Math.min(5,cost)]++});return bins;
}

function forgeCard(card,counts,discovered){
  const count=counts[card.name]||0,owner=card.fac==='neutral'?'NEUTRA':'EXCLUSIVA',known=discovered.includes(card.name);
  return `<article class="arcForgeCard ${count?'selected':''} ${known?'discovered':''}" style="--card-tone:${CLASS_RULES[forgeState.classId].color}"><div class="arcForgeCost">${card.cost}</div><div class="arcForgeIcon">${card.icon||'✦'}</div><div class="arcForgeCardText"><small>${owner} · ${FACTION_NAMES[card.fac]||card.fac}</small><b>${escapeHtml(card.name)}</b><p>${escapeHtml(card.text||'')}</p></div><div class="arcForgeCount"><button data-deck-remove="${escapeHtml(card.name)}" ${!count?'disabled':''}>−</button><strong>${count}</strong><button data-deck-add="${escapeHtml(card.name)}" ${count>=MAX_COPIES||forgeState.names.length>=DECK_SIZE?'disabled':''}>+</button></div></article>`;
}

function renderForge(){
  const catalog=getCatalog(),rule=CLASS_RULES[forgeState.classId],p=profile(),counts=deckCounts(),allowed=catalog.filter(card=>allowedForClass(card,forgeState.classId));
  const filtered=allowed.filter(card=>(forgeState.filter==='all'||card.type===forgeState.filter)&&(!forgeState.search||textOf(card).includes(forgeState.search)));
  const bins=curve(),complete=forgeState.names.length===DECK_SIZE;
  let root=document.getElementById('arcDeckForge');if(!root){root=document.createElement('section');root.id='arcDeckForge';root.className='arcDeckForge';document.body.appendChild(root)}
  root.innerHTML=`<div class="arcForgeShell" style="--class-tone:${rule.color}"><header class="arcForgeHead"><div><small>FORJA DE DECK · v${EVOLUTION_VERSION.split('-')[0]}</small><h2>${rule.icon} ${rule.name}</h2><p>${escapeHtml(rule.identity)}</p></div><button id="arcForgeClose">×</button></header><div class="arcForgeToolbar"><label>CLASSE<select id="arcForgeClass">${Object.entries(CLASS_RULES).map(([id,item])=>`<option value="${id}" ${id===forgeState.classId?'selected':''}>${item.icon} ${item.name}</option>`).join('')}</select></label><label>NOME DO DECK<input id="arcForgeName" maxlength="28" value="${escapeHtml(forgeState.name)}"></label><div class="arcForgeRules"><b>${forgeState.names.length}/${DECK_SIZE}</b><span>Máx. ${MAX_COPIES} cópias · somente ${rule.school} + Neutras</span></div></div><div class="arcForgeMain"><aside class="arcDeckSummary"><div class="arcDeckSeal">${rule.icon}</div><small>IDENTIDADE</small><h3>${rule.school}</h3><p>${rule.identity}</p><div class="arcCurve"><small>CURVA DE MANA</small>${bins.map((value,index)=>`<div><span>${index===5?'5+':index}</span><i><em style="height:${Math.max(5,value/Math.max(...bins,1)*100)}%"></em></i><b>${value}</b></div>`).join('')}</div><div class="arcDeckActions"><button id="arcAutoDeck">AUTO-MONTAR</button><button id="arcClearDeck">LIMPAR</button><button id="arcSaveDeck" class="primary" ${!complete?'disabled':''}>${complete?'SALVAR E EQUIPAR':`FALTAM ${DECK_SIZE-forgeState.names.length}`}</button></div></aside><main class="arcForgeCollection"><div class="arcForgeFilters"><button data-forge-filter="all" class="${forgeState.filter==='all'?'active':''}">TODAS</button><button data-forge-filter="unit" class="${forgeState.filter==='unit'?'active':''}">CRIATURAS</button><button data-forge-filter="spell" class="${forgeState.filter==='spell'?'active':''}">FEITIÇOS</button><button data-forge-filter="relic" class="${forgeState.filter==='relic'?'active':''}">RELÍQUIAS</button><input id="arcForgeSearch" placeholder="Buscar carta" value="${escapeHtml(forgeState.search)}"></div><div class="arcForgeCards">${filtered.map(card=>forgeCard(card,counts,p.discovered||[])).join('')}</div></main></div></div>`;
  root.classList.remove('hidden');
  document.getElementById('arcForgeClose').onclick=()=>root.classList.add('hidden');
  document.getElementById('arcForgeClass').onchange=event=>openDeckBuilder(event.target.value);
  document.getElementById('arcForgeName').onchange=event=>forgeState.name=event.target.value.trim()||`${rule.name} Essencial`;
  document.getElementById('arcForgeSearch').oninput=event=>{forgeState.search=event.target.value.trim().toLowerCase();renderForge()};
  root.querySelectorAll('[data-forge-filter]').forEach(button=>button.onclick=()=>{forgeState.filter=button.dataset.forgeFilter;renderForge()});
  root.querySelectorAll('[data-deck-add]').forEach(button=>button.onclick=()=>{const name=button.dataset.deckAdd;if((deckCounts()[name]||0)<MAX_COPIES&&forgeState.names.length<DECK_SIZE)forgeState.names.push(name);renderForge()});
  root.querySelectorAll('[data-deck-remove]').forEach(button=>button.onclick=()=>{const index=forgeState.names.indexOf(button.dataset.deckRemove);if(index>=0)forgeState.names.splice(index,1);renderForge()});
  document.getElementById('arcAutoDeck').onclick=()=>{forgeState.names=autoDeckNames(forgeState.classId,catalog);renderForge()};
  document.getElementById('arcClearDeck').onclick=()=>{forgeState.names=[];renderForge()};
  document.getElementById('arcSaveDeck').onclick=()=>{
    if(forgeState.names.length!==DECK_SIZE)return;
    const next=profile();next.classId=forgeState.classId;next.classDecks={...(next.classDecks||{}),[forgeState.classId]:{name:forgeState.name,cards:[...forgeState.names],updatedAt:Date.now(),version:2}};saveProfile(next);root.classList.add('hidden');notify(`${rule.icon} ${forgeState.name} equipado: ${DECK_SIZE} cartas exclusivas da classe.`);
  };
}

function notify(text){
  let toast=document.getElementById('arcEvolutionToast');if(!toast){toast=document.createElement('div');toast.id='arcEvolutionToast';document.body.appendChild(toast)}
  toast.textContent=text;toast.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('show'),2600);
}

const mulliganUsed=new Set();
function openMulligan(){
  const game=globalThis.__ARCANA?.state?.(),player=game?.p?.[0];if(!player||mulliganUsed.has(game.id))return;
  let root=document.getElementById('arcMulligan');if(!root){root=document.createElement('section');root.id='arcMulligan';root.className='arcMulligan';document.body.appendChild(root)}
  root.innerHTML=`<div class="arcMulliganPanel"><small>PREPARAÇÃO INICIAL</small><h2>Escolha até 2 cartas para trocar</h2><p>A nova mão vem da Reserva que você construiu. As cartas devolvidas são embaralhadas depois.</p><div class="arcMulliganCards">${player.hand.map(card=>`<button data-mulligan-card="${card.id}" style="--card-tone:${CLASS_RULES[player.classId]?.color||'#63e7ff'}"><span>${card.cost}</span><i>${card.icon||'✦'}</i><b>${escapeHtml(card.name)}</b><small>${escapeHtml(card.text||'')}</small></button>`).join('')}</div><div class="arcMulliganActions"><button id="arcMulliganCancel">MANTER MÃO</button><button id="arcMulliganConfirm" class="primary" disabled>TROCAR SELECIONADAS</button></div></div>`;
  root.classList.remove('hidden');const selected=new Set(),confirm=document.getElementById('arcMulliganConfirm');
  root.querySelectorAll('[data-mulligan-card]').forEach(button=>button.onclick=()=>{const id=button.dataset.mulliganCard;if(selected.has(id))selected.delete(id);else if(selected.size<2)selected.add(id);button.classList.toggle('selected',selected.has(id));confirm.disabled=!selected.size;confirm.textContent=selected.size?`TROCAR ${selected.size} CARTA${selected.size>1?'S':''}`:'TROCAR SELECIONADAS'});
  document.getElementById('arcMulliganCancel').onclick=()=>{mulliganUsed.add(game.id);root.classList.add('hidden');syncBattleUi()};
  confirm.onclick=()=>{
    const returned=player.hand.filter(card=>selected.has(card.id));player.hand=player.hand.filter(card=>!selected.has(card.id));
    for(let i=0;i<returned.length&&player.deck.length;i++)player.hand.push(player.deck.pop());
    player.deck.push(...returned);player.deck.sort(()=>Math.random()-.5);mulliganUsed.add(game.id);root.classList.add('hidden');globalThis.__ARCANA?.refresh?.();notify('Mão inicial renovada a partir do seu deck.');
  };
}

function syncBattleUi(){
  const api=globalThis.__ARCANA,game=api?.state?.(),player=game?.p?.[0],home=document.getElementById('home');
  let bar=document.getElementById('arcClassBattleBar');
  if(!game||game.over||!player||!home?.classList.contains('hidden')){bar?.classList.add('hidden');return}
  if(!bar){bar=document.createElement('section');bar.id='arcClassBattleBar';bar.className='arcClassBattleBar';document.getElementById('eventBar')?.after(bar)}
  const rule=CLASS_RULES[player.classId],canMulligan=game.round===1&&player.cardsTurn===0&&!mulliganUsed.has(game.id)&&player.hand.length>0;
  bar.classList.remove('hidden');bar.style.setProperty('--class-tone',rule?.color||'#63e7ff');bar.innerHTML=`<div><b>${rule?.icon||'✦'} ${rule?.name||'Deck do Campeão'}</b><span>${player.classDeckName||rule?.school||FACTION_NAMES[player.hero?.fac]} · ${player.deck.length} na Reserva · apenas cartas permitidas</span></div>${canMulligan?'<button id="arcBattleMulligan">MULLIGAN</button>':'<small>DECK VALIDADO</small>'}`;
  document.getElementById('arcBattleMulligan')?.addEventListener('click',openMulligan);
  const chest=document.getElementById('chestPanel');
  let chestButton=document.getElementById('arcChestMulligan');
  if(canMulligan&&chest){if(!chestButton){chestButton=document.createElement('button');chestButton.id='arcChestMulligan';chestButton.className='ghost';chestButton.textContent='♻ MULLIGAN DA MÃO INICIAL';chestButton.onclick=openMulligan;chest.appendChild(chestButton)}chestButton.classList.remove('hidden')}else chestButton?.classList.add('hidden');
}

function install(){
  setInterval(syncBattleUi,350);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.getElementById('arcDeckForge')?.classList.add('hidden');document.getElementById('arcMulligan')?.classList.add('hidden')}});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();

globalThis.ArcanaEvolution={version:EVOLUTION_VERSION,rules:CLASS_RULES,cardClasses,allowedForClass,autoDeckNames,buildDeck,openingHand,draftOptions,relicOptions,openDeckBuilder,syncBattleUi};
})();
