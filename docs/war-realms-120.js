(()=>{
'use strict';

const VERSION='1.2.0';
const PROFILE_KEY='arcana_profile_v2';
const WAR_KEY='arcana_war_realms_v1';
const SETTINGS_KEY='arcana_lobby_settings_v1';
const CLASS_IDS=['vanguard','pyromancer','necromancer','druid','cryomancer','assassin','summoner','chronomancer'];
const CLASS_INFO={vanguard:['🛡️','Guerreiro Arcano'],pyromancer:['🔥','Piromante'],necromancer:['💀','Necromante'],druid:['🌿','Druida'],cryomancer:['❄️','Criomante'],assassin:['🗡️','Assassino'],summoner:['🌀','Invocador'],chronomancer:['⏳','Cronomante']};
const parse=(text,fallback={})=>{try{return JSON.parse(text)||fallback}catch{return fallback}};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const clone=value=>JSON.parse(JSON.stringify(value));
const profile=()=>parse(localStorage.getItem(PROFILE_KEY),{});
const saveProfile=value=>{localStorage.setItem(PROFILE_KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent('arcana:profile',{detail:value}));globalThis.ArcanaLobby?.refresh?.()};
const today=()=>{const date=new Date();return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`};

const REALMS={
  aurora:{name:'Domínio da Aurora',icon:'☀️',tone:'#ffd46b',sky:'#713b42',lore:'O juramento solar se partiu e as fortalezas escolheram lados.'},
  verdant:{name:'Coroa Verde',icon:'🌿',tone:'#68e49a',sky:'#153f42',lore:'O bosque aprendeu a caçar quem atravessa suas raízes.'},
  frost:{name:'Trono Boreal',icon:'❄️',tone:'#72ddff',sky:'#263b68',lore:'O tempo parou entre geleiras que guardam memórias vivas.'},
  void:{name:'Império do Vazio',icon:'🌌',tone:'#bd82ff',sky:'#341d55',lore:'Todas as rotas terminam diante do arquiteto da guerra.'}
};

const NODES=[
  {id:'auroraGate',realm:'aurora',type:'battle',icon:'⚔️',name:'Cerco do Alvorecer',text:'Rompa a linha dos sentinelas antes que a muralha desperte.',enemy:['Capitã Aurelia','🦅','aggro'],modifier:'firstBlood',reward:[90,20]},
  {id:'emberChoice',realm:'aurora',type:'event',icon:'🔥',name:'Brasas na Estrada',text:'Uma aldeia pede ajuda enquanto o exército inimigo se aproxima.',choices:[['DEFENDER A ALDEIA','mercy','sunForge'],['PERSEGUIR O EXÉRCITO','pursuit','mirrorHall']]},
  {id:'sunForge',realm:'aurora',type:'shop',icon:'⚒️',name:'Forja Solar',text:'Armas juramentadas aguardam um novo portador.',next:'mirrorHall'},
  {id:'mirrorHall',realm:'aurora',type:'battle',icon:'🪞',name:'Galeria dos Espelhos',text:'Cada criatura forte alimenta seu reflexo.',enemy:['Duelista Prismático','🪞','tempo'],modifier:'mirror',reward:[120,25]},
  {id:'oathShrine',realm:'aurora',type:'shrine',icon:'⛩️',name:'Santuário do Juramento',text:'Cure as cicatrizes ou fortaleça a próxima batalha.',next:'lionKing'},
  {id:'lionKing',realm:'aurora',type:'boss',icon:'🦁',name:'Rei Leão do Meio-Dia',text:'Três rugidos transformam o campo e a própria luz.',enemy:['Aurelion, Rei Solar','🦁','fortress'],modifier:'solarFlare',reward:[260,70]},

  {id:'verdantEdge',realm:'verdant',type:'battle',icon:'🍃',name:'Fronteira que Respira',text:'O terreno cria raízes sob as rotas desprotegidas.',enemy:['Caçadora Silvestre','🏹','swarm'],modifier:'livingRoots',reward:[130,30]},
  {id:'beastChoice',realm:'verdant',type:'event',icon:'🐾',name:'Rastro da Fera',text:'Uma fera ferida conhece um atalho até o coração do bosque.',choices:[['CURAR A FERA','bond','sporeMarket'],['SEGUIR O RASTRO','hunt','ancientRoots']]},
  {id:'sporeMarket',realm:'verdant',type:'shop',icon:'🍄',name:'Mercado de Esporos',text:'Relíquias vivas são vendidas em troca de Ouro da Guerra.',next:'ancientRoots'},
  {id:'ancientRoots',realm:'verdant',type:'battle',icon:'🌳',name:'Raízes Ancestrais',text:'Criaturas derrotadas retornam mais resistentes.',enemy:['Druida Sem Face','🌲','growth'],modifier:'rebirth',reward:[160,35]},
  {id:'sapShrine',realm:'verdant',type:'shrine',icon:'💚',name:'Fonte da Seiva',text:'A floresta oferece cura, mas cobra uma lembrança.',next:'wildHeart'},
  {id:'wildHeart',realm:'verdant',type:'boss',icon:'🦌',name:'Coração Selvagem',text:'O chefe cresce, cura e convoca a floresta em três fases.',enemy:['Eldervan, Coração Verde','🦌','growth'],modifier:'wildPulse',reward:[320,90]},

  {id:'frozenPass',realm:'frost',type:'battle',icon:'🏔️',name:'Passagem Congelada',text:'A cada terceira rodada, a rota mais cheia congela.',enemy:['Sentinela Boreal','🧊','control'],modifier:'whiteout',reward:[170,40]},
  {id:'memoryChoice',realm:'frost',type:'event',icon:'🕰️',name:'Memória no Gelo',text:'Uma lembrança sua está presa dentro de um cristal temporal.',choices:[['LIBERTAR A MEMÓRIA','memory','clockworkCamp'],['ABSORVER O CRISTAL','crystal','frozenLibrary']]},
  {id:'clockworkCamp',realm:'frost',type:'shop',icon:'⚙️',name:'Acampamento Cronista',text:'Compre uma ampulheta capaz de alterar o próximo encontro.',next:'frozenLibrary'},
  {id:'frozenLibrary',realm:'frost',type:'battle',icon:'📚',name:'Biblioteca Congelada',text:'Feitiços ficam mais perigosos conforme a luta se prolonga.',enemy:['Arquivista do Inverno','📘','control'],modifier:'spellStorm',reward:[200,45]},
  {id:'timeShrine',realm:'frost',type:'shrine',icon:'⌛',name:'Relógio Imóvel',text:'Reordene seu destino antes de enfrentar a rainha.',next:'iceQueen'},
  {id:'iceQueen',realm:'frost',type:'boss',icon:'👑',name:'Rainha do Último Inverno',text:'Ela congela rotas inteiras e apaga o calor do campo.',enemy:['Nivara, Rainha Boreal','👑','control'],modifier:'absoluteZero',reward:[390,110]},

  {id:'voidBreach',realm:'void',type:'battle',icon:'🕳️',name:'Brecha do Vazio',text:'O campo perde vida enquanto a fenda permanecer aberta.',enemy:['Arauto da Fenda','👁️','sacrifice'],modifier:'voidDrain',reward:[220,55]},
  {id:'crownChoice',realm:'void',type:'event',icon:'👑',name:'Coroa Partida',text:'Escolha qual juramento carregará até o final da guerra.',choices:[['UNIR OS REINOS','unity','lastMerchant'],['REIVINDICAR O PODER','dominion','impossibleCity']]},
  {id:'lastMerchant',realm:'void',type:'shop',icon:'🕯️',name:'Último Mercador',text:'A última loja vende relíquias que não deveriam existir.',next:'impossibleCity'},
  {id:'impossibleCity',realm:'void',type:'battle',icon:'🏰',name:'Cidade Impossível',text:'As rotas trocam de natureza durante a batalha.',enemy:['General do Paradoxo','♾️','tempo'],modifier:'shiftingLanes',reward:[260,65]},
  {id:'starShrine',realm:'void',type:'shrine',icon:'🌠',name:'Santuário das Estrelas',text:'Converta escolhas antigas em força para a batalha final.',next:'architect'},
  {id:'architect',realm:'void',type:'boss',icon:'🐉',name:'Arquiteto da Guerra',text:'O inimigo definitivo usa as identidades dos quatro reinos.',enemy:['Vharos, Arquiteto do Fim','🐉','adaptive'],modifier:'convergence',reward:[600,180]}
];

const NODE_MAP=Object.fromEntries(NODES.map((node,index)=>[node.id,{...node,index}]));
const DEFAULT_WAR={schema:1,current:'auroraGate',completed:[],unlocked:['auroraGate'],choices:{},gold:0,breath:3,relics:[],scars:[],awaiting:null,xp:0,level:1,claimed:[],bestiary:{},battleLog:[],ending:null,daily:{date:'',wins:0,cards:0,claimed:[]}};
function state(){const p=profile();return {...clone(DEFAULT_WAR),...parse(localStorage.getItem(WAR_KEY),{}),...(p.war120||{})}}
function save(value){value.level=Math.max(1,1+Math.floor(Number(value.xp||0)/180));localStorage.setItem(WAR_KEY,JSON.stringify(value));const p=profile();p.war120=clone(value);saveProfile(p)}
function unlock(value,id){if(id&&!value.unlocked.includes(id))value.unlocked.push(id)}
function nextFor(node,value){if(node.next)return node.next;const choice=node.choices?.find(item=>item[1]===value.choices[node.id]);if(choice)return choice[2];return NODES[node.index+1]?.id}

function toast(message,stateName=''){
  let root=document.getElementById('arcWarToast');if(!root){root=document.createElement('div');root.id='arcWarToast';document.body.appendChild(root)}
  root.textContent=message;root.dataset.state=stateName;root.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>root.classList.remove('show'),2800);
}
function overlay(id,title,subtitle,html){let root=document.getElementById(id);if(!root){root=document.createElement('section');root.id=id;root.className='arcWarOverlay';document.body.appendChild(root)}root.innerHTML=`<div class="arcWarShell"><header><div><small>${esc(subtitle)}</small><h2>${esc(title)}</h2></div><button class="arcWarClose" aria-label="Fechar">×</button></header><main>${html}</main></div>`;root.classList.remove('hidden');root.querySelector('.arcWarClose').onclick=()=>root.classList.add('hidden');root.onclick=event=>{if(event.target===root)root.classList.add('hidden')};return root}

function renderWar(){
  const value=state(),active=NODE_MAP[value.current]||NODE_MAP.auroraGate;
  const realms=Object.entries(REALMS).map(([id,realm])=>{const nodes=NODES.filter(node=>node.realm===id),done=nodes.filter(node=>value.completed.includes(node.id)).length;return `<section class="arcRealm" style="--realm:${realm.tone};--realm-sky:${realm.sky}"><header><span>${realm.icon}</span><div><small>${done}/${nodes.length} CONCLUÍDOS</small><h3>${realm.name}</h3><p>${realm.lore}</p></div></header><div class="arcRealmPath">${nodes.map(node=>`<button data-war-node="${node.id}" class="arcWarNode ${node.id===active.id?'active':''} ${value.completed.includes(node.id)?'done':''}" ${!value.unlocked.includes(node.id)?'disabled':''}><span>${node.icon}</span><b>${node.name}</b><small>${value.completed.includes(node.id)?'CONCLUÍDO':node.type.toUpperCase()}</small></button>`).join('')}</div></section>`}).join('');
  const enemy=active.enemy,buttons=active.type==='battle'||active.type==='boss'?`<button id="arcWarBattle" class="primary">${active.type==='boss'?'ENFRENTAR CHEFE':'INICIAR ENCONTRO'}</button>`:active.type==='event'?`<div class="arcWarChoices">${active.choices.map(([label,effect])=>`<button data-war-choice="${effect}">${label}</button>`).join('')}</div>`:active.type==='shop'?'<button id="arcWarShop">COMPRAR RELÍQUIA · 120 OURO</button>':'<div class="arcWarChoices"><button data-war-shrine="heal">RECUPERAR FÔLEGO</button><button data-war-shrine="power">PREPARAR BÊNÇÃO</button></div>';
  const root=overlay('arcWarCampaign','Guerra dos Reinos','CAMPANHA 1.2 · ESCOLHAS · CHEFES EM FASES',`<div class="arcWarStatus"><span>🪙 <b>${value.gold}</b><small>OURO DA GUERRA</small></span><span>💚 <b>${value.breath}/3</b><small>FÔLEGO</small></span><span>✦ <b>${value.relics.length}</b><small>RELÍQUIAS</small></span><span>⚔️ <b>${value.level}</b><small>NÍVEL DE GUERRA</small></span></div><div class="arcWarRealms">${realms}</div><section class="arcWarBrief" style="--realm:${REALMS[active.realm].tone}"><span>${active.icon}</span><div><small>${REALMS[active.realm].name} · ${active.type.toUpperCase()}</small><h3>${active.name}</h3><p>${active.text}</p>${enemy?`<div class="arcEnemyPreview"><b>${enemy[1]} ${enemy[0]}</b><span>IA ${styleName(enemy[2])} · ${modifierName(active.modifier)}</span></div>`:''}</div>${buttons}</section>`);
  root.querySelectorAll('[data-war-node]').forEach(button=>button.onclick=()=>{const next=state();next.current=button.dataset.warNode;save(next);renderWar()});
  root.querySelector('#arcWarBattle')?.addEventListener('click',()=>startEncounter(active));
  root.querySelectorAll('[data-war-choice]').forEach(button=>button.onclick=()=>resolveChoice(active,button.dataset.warChoice));
  root.querySelector('#arcWarShop')?.addEventListener('click',()=>buyRelic(active));
  root.querySelectorAll('[data-war-shrine]').forEach(button=>button.onclick=()=>useShrine(active,button.dataset.warShrine));
}

function styleName(id){return ({aggro:'AGRESSIVA',tempo:'TEMPO',fortress:'FORTALEZA',swarm:'ENXAME',growth:'CRESCIMENTO',control:'CONTROLE',sacrifice:'SACRIFÍCIO',adaptive:'ADAPTATIVA'}[id]||'TÁTICA')}
function modifierName(id){return ({firstBlood:'Primeiro Sangue',mirror:'Reflexo Prismático',solarFlare:'Clarão Solar',livingRoots:'Raízes Vivas',rebirth:'Renascimento',wildPulse:'Pulso Selvagem',whiteout:'Nevasca',spellStorm:'Tempestade Arcana',absoluteZero:'Zero Absoluto',voidDrain:'Dreno do Vazio',shiftingLanes:'Rotas Instáveis',convergence:'Convergência'}[id]||'Campo normal')}
function complete(value,node){if(!value.completed.includes(node.id))value.completed.push(node.id);const next=nextFor(node,value);unlock(value,next);value.current=next||node.id;if(node.id==='architect')value.ending=value.choices.crownChoice==='unity'?'Aliança dos Oito':'Imperador Arcano';save(value)}
function resolveChoice(node,effect){const value=state();value.choices[node.id]=effect;if(['mercy','bond','memory','unity'].includes(effect))value.breath=Math.min(3,value.breath+1);else value.relics=[...new Set([...value.relics,`${node.name}: ${effect}`])];complete(value,node);toast('Sua decisão alterou as próximas rotas.','ok');renderWar()}
function buyRelic(node){const value=state();if(value.gold<120)return toast('Você precisa de 120 Ouro da Guerra.','error');value.gold-=120;value.relics=[...new Set([...value.relics,`${node.name} · ${['Lâmina Juramentada','Bússola Viva','Ampulheta Boreal','Coroa Oca'][Math.floor(node.index/6)]}`])];complete(value,node);toast('Relíquia equipada para os encontros da campanha.','ok');renderWar()}
function useShrine(node,choice){const value=state();if(choice==='heal')value.breath=3;else value.relics=[...new Set([...value.relics,`${node.name} · Bênção Preparada`])];complete(value,node);toast(choice==='heal'?'Fôlego restaurado.':'Bênção preparada para a próxima batalha.','ok');renderWar()}
function startEncounter(node){const value=state();value.awaiting=node.id;save(value);document.getElementById('arcWarCampaign')?.classList.add('hidden');localStorage.setItem('arcana_lobby_mode_v1','solo');document.querySelector('[data-mode-choice="solo"]')?.click();setTimeout(()=>document.querySelector('[data-action="play"]')?.click(),120);toast(`${node.enemy?.[1]||'⚔️'} ${node.name} preparado.`,'ok')}

const ENEMY_BLUEPRINTS={
  aggro:[['unit','Batedor Escarlate',1,3,1,'🏇',['Investida']],['unit','Lâmina da Aurora',2,4,2,'⚔️',['Investida']],['unit','Carrasco Solar',4,6,4,'☀️',[]],['spell','Ordem de Ataque',2,'🔥','damage3','enemy']],
  tempo:[['unit','Eco de Guerra',2,3,3,'🪞',['Escudo']],['unit','Duelista Impossível',3,5,3,'♾️',['Investida']],['spell','Pausa Tática',2,'⏸️','freeze','enemy'],['spell','Refazer Destino',2,'🔮','forecast','none']],
  fortress:[['unit','Muralha Juramentada',2,2,6,'🛡️',['Guarda']],['unit','Guardião Coroado',4,4,8,'🏰',['Guarda','Escudo']],['unit','Colosso Solar',6,7,10,'🦁',['Guarda']],['spell','Bênção Régia',2,'✨','shield','ally']],
  swarm:[['unit','Esporo Saltador',1,2,2,'🍄',[]],['unit','Lobo de Raiz',2,3,3,'🐺',[]],['unit','Enxame de Folhas',2,4,2,'🍃',['Investida']],['spell','Germinação Hostil',4,'🌱','sprouts','none']],
  growth:[['unit','Protetor de Casca',2,2,6,'🪵',['Guarda']],['unit','Predador Esmeralda',3,5,4,'🦌',[]],['unit','Ancião das Raízes',5,6,9,'🌳',['Guarda']],['spell','Crescimento Selvagem',1,'🌿','buff13','ally']],
  control:[['unit','Vigia de Gelo',2,2,5,'🧊',['Guarda']],['unit','Oráculo Boreal',3,3,5,'🔷',['Escudo']],['unit','Dragão de Neve',6,7,8,'🐉',[]],['spell','Prisão Boreal',2,'❄️','freeze','enemy']],
  sacrifice:[['unit','Servo Sem Nome',1,2,2,'💀',[]],['unit','Devorador da Fenda',3,5,4,'👁️',[]],['unit','Horror Coroado',6,8,7,'🐙',['Vampirismo']],['spell','Contrato Final',2,'🩸','draw2hurt','none']],
  adaptive:[['unit','Fragmento Solar',2,4,3,'☀️',['Investida']],['unit','Fragmento Verde',3,3,6,'🌿',['Guarda']],['unit','Fragmento Boreal',4,5,6,'❄️',['Escudo']],['spell','Convergência',4,'🌌','zero','none']]
};
function enemyCard(raw,fac){if(raw[0]==='unit')return {type:'unit',name:raw[1],fac,cost:raw[2],atk:raw[3],hp:raw[4],maxHp:raw[4],icon:raw[5],kw:raw[6],text:(raw[6]||[]).join(' · ')||'Criatura da campanha.',rarity:'épica'};return {type:'spell',name:raw[1],fac,cost:raw[2],icon:raw[3],effect:raw[4],target:raw[5],text:'Técnica exclusiva deste adversário.',rarity:'épica'} }
function buildEnemyDeck(style,realm,api){const fac={aurora:'solar',verdant:'wild',frost:'frost',void:'void'}[realm],set=ENEMY_BLUEPRINTS[style]||ENEMY_BLUEPRINTS.adaptive,cards=[];for(let i=0;i<30;i++)cards.push(api.instantiate(enemyCard(set[i%set.length],fac)));return cards.sort(()=>Math.random()-.5)}

let directedMatch=null,lastRound=0,lastPhase=0;
function configureBattle(game,node){
  const api=globalThis.__ARCANA,enemy=game.p?.[1],me=game.p?.[0];if(!api||!enemy||!me)return;
  const boss=node.type==='boss',realmIndex=Math.floor(node.index/6),style=node.enemy[2];directedMatch=game.matchId||game.id||`${Date.now()}`;lastRound=0;lastPhase=1;
  enemy.hero={...(enemy.hero||{}),name:node.enemy[0],icon:node.enemy[1]};enemy.classDeckName=`Exército · ${styleName(style)}`;enemy.maxHp=enemy.hp=boss?52+realmIndex*10:32+realmIndex*4;enemy.maxMana=Math.max(1,enemy.maxMana||1);enemy.deck=buildEnemyDeck(style,node.realm,api);enemy.hand=[];for(let i=0;i<4&&enemy.deck.length;i++)enemy.hand.push(enemy.deck.pop());enemy.handCount=enemy.hand.length;
  if(style==='aggro')enemy.manaBonus=1;if(style==='fortress')enemy.maxHp=enemy.hp+=8;if(style==='swarm')enemy.hand.push(enemy.deck.pop());
  if(state().relics.some(item=>item.includes('Bênção Preparada'))){me.hp=Math.min(me.maxHp||30,me.hp+5);me.mana=Math.min(me.maxMana||1,me.mana+1)}
  renderBattleDirector(node,1);api.refresh();phaseBanner(`${node.enemy[1]} ${node.enemy[0]}`,`${styleName(style)} · ${modifierName(node.modifier)}`);
}
function allUnits(player){return (player?.lanes||[]).flat().filter(Boolean)}
function hurt(unit,amount){if(!unit)return;if(unit.shield){unit.shield=false;return}unit.hp-=amount}
function applyModifier(game,node){
  const api=globalThis.__ARCANA,me=game.p?.[0],enemy=game.p?.[1],round=Number(game.round||1);if(!me||!enemy||round===lastRound)return;lastRound=round;
  const mine=allUnits(me),theirs=allUnits(enemy),weakest=list=>[...list].sort((a,b)=>a.hp-b.hp)[0],strongest=list=>[...list].sort((a,b)=>b.atk-a.atk)[0];
  if(node.modifier==='firstBlood'&&round===2&&theirs[0])theirs[0].atk+=2;
  if(node.modifier==='mirror'&&strongest(mine)&&theirs[0])theirs[0].atk=Math.max(theirs[0].atk,strongest(mine).atk);
  if(node.modifier==='solarFlare'&&round%3===0){hurt(weakest(mine),2);enemy.hp=Math.min(enemy.maxHp,enemy.hp+2)}
  if(node.modifier==='livingRoots'&&round%2===0)mine.forEach(unit=>{if(!unit.frozen&&Math.random()<.34)unit.frozen=1});
  if(node.modifier==='rebirth'&&theirs.length)weakest(theirs).hp=Math.min(weakest(theirs).maxHp||9,weakest(theirs).hp+2);
  if(node.modifier==='wildPulse'&&round%2===0){theirs.forEach(unit=>unit.hp=Math.min((unit.maxHp||unit.hp)+1,unit.hp+1));enemy.hp=Math.min(enemy.maxHp,enemy.hp+2)}
  if(node.modifier==='whiteout'&&round%3===0){const lane=[...(me.lanes||[])].sort((a,b)=>b.filter(Boolean).length-a.filter(Boolean).length)[0]||[];lane.filter(Boolean).forEach(unit=>unit.frozen=1)}
  if(node.modifier==='spellStorm'&&round>=4)theirs.forEach(unit=>unit.atk+=round%2===0?1:0);
  if(node.modifier==='absoluteZero'&&round%3===0)mine.forEach(unit=>unit.frozen=1);
  if(node.modifier==='voidDrain'&&round%2===0){me.hp=Math.max(1,me.hp-2);enemy.hp=Math.min(enemy.maxHp,enemy.hp+2)}
  if(node.modifier==='shiftingLanes'&&round%2===0){[me,enemy].forEach(player=>{const lanes=player.lanes||[];if(lanes.length===3)[lanes[0],lanes[2]]=[lanes[2],lanes[0]]})}
  if(node.modifier==='convergence'){if(round%4===0)mine.forEach(unit=>unit.frozen=1);else if(round%3===0)hurt(weakest(mine),2)}
  const phase=node.type==='boss'?(enemy.hp<=enemy.maxHp*.33?3:enemy.hp<=enemy.maxHp*.66?2:1):1;if(phase>lastPhase){lastPhase=phase;enemy.manaBonus=Number(enemy.manaBonus||0)+1;theirs.forEach(unit=>{unit.atk+=phase-1;unit.hp+=phase;unit.maxHp=Math.max(unit.maxHp||unit.hp,unit.hp)});phaseBanner(`FASE ${phase}`,phase===2?'O chefe rompeu seu primeiro limite.':'Forma definitiva: o campo está em colapso.');renderBattleDirector(node,phase)}
  api?.refresh?.();
}
function renderBattleDirector(node,phase){let root=document.getElementById('arcWarBattleDirector');if(!root){root=document.createElement('section');root.id='arcWarBattleDirector';document.body.appendChild(root)}root.innerHTML=`<div style="--realm:${REALMS[node.realm].tone}"><span>${node.enemy[1]}</span><p><small>${node.type==='boss'?`CHEFE · FASE ${phase}/3`:'COMANDANTE INIMIGO'}</small><b>${node.enemy[0]}</b></p><em>${styleName(node.enemy[2])}</em></div><div><small>EFEITO DO CAMPO</small><b>${modifierName(node.modifier)}</b><p>${modifierDescription(node.modifier)}</p></div>`;root.classList.remove('hidden')}
function modifierDescription(id){return ({firstBlood:'O primeiro avanço inimigo recebe força extra.',mirror:'O inimigo copia o maior ataque no campo.',solarFlare:'A cada 3 rodadas, luz causa dano e cura o comandante.',livingRoots:'Raízes podem congelar suas criaturas.',rebirth:'A criatura inimiga mais fraca recupera vida.',wildPulse:'A floresta cura o exército inimigo.',whiteout:'A rota mais ocupada congela.',spellStorm:'A ameaça cresce depois da quarta rodada.',absoluteZero:'Todas as suas criaturas congelam a cada 3 rodadas.',voidDrain:'A fenda drena sua vida para o adversário.',shiftingLanes:'As rotas externas trocam de posição.',convergence:'Efeitos dos quatro reinos alternam durante a batalha.'}[id]||'Nenhum efeito especial.')}
function phaseBanner(title,text){let root=document.getElementById('arcWarPhase');if(!root){root=document.createElement('div');root.id='arcWarPhase';document.body.appendChild(root)}root.innerHTML=`<b>${esc(title)}</b><span>${esc(text)}</span>`;root.classList.add('show');clearTimeout(phaseBanner.timer);phaseBanner.timer=setTimeout(()=>root.classList.remove('show'),2600)}

function pollBattle(){const game=globalThis.__ARCANA?.state?.(),value=state(),node=NODE_MAP[value.awaiting];if(!game||game.over||!node){document.getElementById('arcWarBattleDirector')?.classList.add('hidden');return}const id=game.matchId||game.id;if(id&&directedMatch!==id)configureBattle(game,node);if(directedMatch)applyModifier(game,node)}
function finishEncounter(detail){const value=state(),node=NODE_MAP[value.awaiting];if(!node)return;value.awaiting=null;const bestiary=value.bestiary[node.id]||{seen:0,wins:0};bestiary.seen++;if(detail.win){bestiary.wins++;value.gold+=node.reward?.[0]||80;value.xp+=node.type==='boss'?240:100;complete(value,node);toast(`Vitória em ${node.name}! Recompensas adicionadas.`,'ok')}else{value.breath=Math.max(0,value.breath-1);value.scars=[...value.scars.slice(-4),node.id];save(value);toast(value.breath?'O exército recuou. Você pode tentar novamente.':'Seu Fôlego acabou. Use um Santuário liberado.','error')}value.bestiary[node.id]=bestiary;value.battleLog.unshift({at:Date.now(),node:node.id,win:!!detail.win,classId:detail.classId||profile().classId});value.battleLog=value.battleLog.slice(0,30);save(value);recordDeckResult(!!detail.win)}

function deckSignature(deck){return (deck?.cards||[]).join('|')}
function vault(){const p=profile();return {slots:p.deckVault120||{},stats:p.deckStats120||{}}}
function saveVault(slots,stats){const p=profile();p.deckVault120=slots;p.deckStats120=stats;saveProfile(p)}
function activeDeck(){const p=profile(),classId=p.classId||'vanguard';return {classId,deck:p.classDecks?.[classId]||null}}
function recordDeckResult(win){const p=profile(),{classId,deck}=activeDeck();if(!deck)return;const key=deckSignature(deck),stats=p.deckStats120||{};stats[key]={matches:Number(stats[key]?.matches||0)+1,wins:Number(stats[key]?.wins||0)+(win?1:0),lastPlayed:Date.now(),classId,name:deck.name};p.deckStats120=stats;saveProfile(p)}
function renderVault(){
  const p=profile(),{classId,deck}=activeDeck(),data=vault(),slots=data.slots[classId]||[],stats=data.stats,key=deckSignature(deck),current=stats[key]||{};while(slots.length<5)slots.push(null);
  const rows=slots.map((item,index)=>item?`<article><span>${CLASS_INFO[classId][0]}</span><div><input data-vault-name="${index}" maxlength="28" value="${esc(item.name)}"><small>${item.cards.length}/30 · salvo ${new Date(item.savedAt).toLocaleDateString('pt-BR')}</small></div><p><b>${Number(stats[deckSignature(item)]?.matches||0)}</b> partidas<br><b>${winrate(stats[deckSignature(item)])}%</b> vitórias</p><button data-vault-equip="${index}">EQUIPAR</button><button data-vault-delete="${index}" class="danger">APAGAR</button></article>`:`<article class="empty"><span>＋</span><div><b>Espaço ${index+1}</b><small>Salve o deck equipado neste espaço.</small></div><button data-vault-save="${index}" ${!deck?'disabled':''}>SALVAR ATUAL</button></article>`).join('');
  const root=overlay('arcDeckVault','Cofre de Decks','5 DECKS POR CLASSE · HISTÓRICO · TAXA DE VITÓRIA',`<div class="arcVaultHead"><div><small>${CLASS_INFO[classId][0]} ${CLASS_INFO[classId][1]}</small><h3>${esc(deck?.name||'Nenhum deck equipado')}</h3><p>${deck?.cards?.length||0}/30 cartas</p></div><span><b>${Number(current.matches||0)}</b> partidas<em>${winrate(current)}% vitórias</em></span></div><div class="arcVaultRows">${rows}</div>`);
  root.querySelectorAll('[data-vault-save]').forEach(button=>button.onclick=()=>{const next=vault(),list=next.slots[classId]||Array(5).fill(null);list[Number(button.dataset.vaultSave)]={...clone(deck),savedAt:Date.now()};next.slots[classId]=list;saveVault(next.slots,next.stats);renderVault();toast('Deck salvo no Cofre.','ok')});
  root.querySelectorAll('[data-vault-equip]').forEach(button=>button.onclick=()=>{const item=slots[Number(button.dataset.vaultEquip)];const next=profile();next.classDecks={...(next.classDecks||{}),[classId]:{...clone(item),updatedAt:Date.now()}};saveProfile(next);renderVault();toast(`${item.name} equipado.`,'ok')});
  root.querySelectorAll('[data-vault-delete]').forEach(button=>button.onclick=()=>{const next=vault(),list=next.slots[classId]||[];list[Number(button.dataset.vaultDelete)]=null;next.slots[classId]=list;saveVault(next.slots,next.stats);renderVault()});
  root.querySelectorAll('[data-vault-name]').forEach(input=>input.onchange=()=>{const next=vault(),list=next.slots[classId]||[];if(list[Number(input.dataset.vaultName)])list[Number(input.dataset.vaultName)].name=input.value.trim()||'Deck sem nome';next.slots[classId]=list;saveVault(next.slots,next.stats)});
}
function winrate(item){return item?.matches?Math.round(Number(item.wins||0)/item.matches*100):0}

const TRACK=Array.from({length:30},(_,index)=>({level:index+1,type:(index+1)%5===0?'chest':(index+1)%2?'coins':'essence',amount:(index+1)%5===0?1:(index+1)%2?80+index*10:25+index*4}));
function renderCodex(){const value=state(),level=value.level,progress=Math.round((value.xp%180)/180*100),rewards=TRACK.map(item=>`<article class="${item.level<=level?'unlocked':''} ${value.claimed.includes(item.level)?'claimed':''}"><small>NÍVEL ${item.level}</small><span>${item.type==='coins'?'🪙':item.type==='essence'?'✦':'🎁'}</span><b>${item.type==='chest'?'BAÚ DE GUERRA':item.amount}</b>${item.level<=level&&!value.claimed.includes(item.level)?`<button data-track-claim="${item.level}">RESGATAR</button>`:''}</article>`).join('');const achievements=achievementList(value).map(item=>`<article class="${item.done?'done':''}"><span>${item.icon}</span><div><b>${item.name}</b><small>${item.text}</small></div><em>${item.done?'CONCLUÍDA':item.progress}</em></article>`).join('');const root=overlay('arcWarCodex','Códice da Guerra','PROGRESSÃO · CONQUISTAS · RECOMPENSAS',`<div class="arcCodexLevel"><span>⚔️</span><div><small>NÍVEL DE GUERRA ${level}</small><h3>${warTitle(level)}</h3><i><em style="width:${progress}%"></em></i><p>${value.xp%180}/180 XP até o próximo nível</p></div></div><h3 class="arcWarSection">Trilha de recompensas</h3><div class="arcRewardTrack">${rewards}</div><h3 class="arcWarSection">Conquistas da expansão</h3><div class="arcAchievements">${achievements}</div>`);root.querySelectorAll('[data-track-claim]').forEach(button=>button.onclick=()=>claimTrack(Number(button.dataset.trackClaim)))}
function warTitle(level){return level>=30?'Lenda dos Oito Reinos':level>=20?'General da Convergência':level>=10?'Guardião das Fronteiras':'Recruta da Aurora'}
function achievementList(value){const bosses=NODES.filter(node=>node.type==='boss'&&value.completed.includes(node.id)).length;return [
  {icon:'⚔️',name:'Primeiro Comando',text:'Vença seu primeiro encontro.',done:value.battleLog.some(item=>item.win),progress:`${value.battleLog.filter(item=>item.win).length}/1`},
  {icon:'👑',name:'Quebra-Coroas',text:'Derrote os quatro chefes.',done:bosses>=4,progress:`${bosses}/4`},
  {icon:'🧭',name:'Todas as Rotas',text:'Conclua 20 destinos.',done:value.completed.length>=20,progress:`${value.completed.length}/20`},
  {icon:'💚',name:'Sem Recuar',text:'Derrote um chefe com três de Fôlego.',done:value.battleLog.some(item=>item.win&&NODE_MAP[item.node]?.type==='boss')&&value.breath===3,progress:`${value.breath}/3 Fôlego`},
  {icon:'📚',name:'Estrategista',text:'Jogue com quatro classes diferentes.',done:new Set(value.battleLog.map(item=>item.classId)).size>=4,progress:`${new Set(value.battleLog.map(item=>item.classId)).size}/4`},
  {icon:'🌌',name:'Fim da Guerra',text:'Defina o destino dos reinos.',done:!!value.ending,progress:value.ending||'Incompleta'}
]}
function claimTrack(level){const value=state(),item=TRACK[level-1];if(!item||level>value.level||value.claimed.includes(level))return;const p=profile(),strategy=parse(localStorage.getItem('arcana_strategy_pack_v1'),{});if(item.type==='coins')strategy.coins=Number(strategy.coins||0)+item.amount;else if(item.type==='essence')strategy.essence=Number(strategy.essence||0)+item.amount;else{strategy.coins=Number(strategy.coins||0)+300;strategy.essence=Number(strategy.essence||0)+100}localStorage.setItem('arcana_strategy_pack_v1',JSON.stringify(strategy));value.claimed.push(level);save(value);window.dispatchEvent(new CustomEvent('arcana:economy',{detail:strategy}));renderCodex();toast('Recompensa do Códice recebida.','ok')}

function renderBestiary(){const value=state(),cards=NODES.filter(node=>node.enemy).map(node=>{const record=value.bestiary[node.id]||{},known=record.seen>0||value.unlocked.includes(node.id);return `<article class="${known?'known':'unknown'}" style="--realm:${REALMS[node.realm].tone}"><span>${known?node.enemy[1]:'?'}</span><div><small>${REALMS[node.realm].name}</small><h3>${known?node.enemy[0]:'Adversário desconhecido'}</h3><p>${known?`${styleName(node.enemy[2])} · ${modifierName(node.modifier)}`:'Encontre este comandante na campanha.'}</p></div><em>${record.wins||0} VITÓRIAS</em></article>`}).join('');overlay('arcWarBestiary','Bestiário dos Reinos','COMANDANTES · CHEFES · MECÂNICAS',`<div class="arcBestiary">${cards}</div>`)}

function injectLobby(){const grid=document.querySelector('#arcLobbyRoot .arcFeatureGrid');if(!grid)return;const campaign=grid.querySelector('[data-asc-action="campaign"]');if(campaign){campaign.querySelector('b').textContent='Guerra dos Reinos';campaign.querySelector('small').textContent='24 encontros · chefes em fases';campaign.querySelector('.arcFeatureBadge').textContent='1.2'}if(grid.querySelector('[data-war-action]'))return;for(const feature of [['vault','🗄️','Cofre de Decks','5 espaços por classe · estatísticas'],['codex','⚔️','Códice da Guerra','30 níveis · conquistas e recompensas'],['bestiary','🐉','Bestiário','Comandantes, chefes e mecânicas']]){const button=document.createElement('button');button.className='arcFeature arcWarFeature';button.dataset.warAction=feature[0];button.innerHTML=`<span class="arcFeatureIcon">${feature[1]}</span><b>${feature[2]}</b><small>${feature[3]}</small><span class="arcFeatureBadge">NOVO</span>`;grid.appendChild(button)}}
function actions(event){const campaign=event.target.closest?.('[data-asc-action="campaign"]');if(campaign){event.preventDefault();event.stopImmediatePropagation();renderWar();return}const action=event.target.closest?.('[data-war-action]')?.dataset.warAction;if(action==='vault')renderVault();if(action==='codex')renderCodex();if(action==='bestiary')renderBestiary()}
function migrate(){const p=profile(),old=p.campaign110||{};if(!p.war120){const value=clone(DEFAULT_WAR);if((old.completed||[]).length){value.gold=Number(old.gold||0);value.breath=Number(old.breath??3);value.relics=[...(old.relics||[])];value.xp=(old.completed||[]).length*70;value.unlocked=['auroraGate'];}p.war120=value}p.schemaVersion=Math.max(7,Number(p.schemaVersion||0));p.release120={version:VERSION,migratedAt:p.release120?.migratedAt||Date.now()};saveProfile(p)}
function install(){migrate();if(globalThis.__ARCANA)globalThis.__ARCANA.version=VERSION;document.addEventListener('click',actions,true);window.addEventListener('arcana:match',event=>finishEncounter(event.detail||{}));setInterval(()=>{injectLobby();pollBattle()},280);document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.arcWarOverlay:not(.hidden)').forEach(root=>root.classList.add('hidden'))})}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
globalThis.ArcanaWar={version:VERSION,state,open:renderWar,openVault:renderVault,openCodex:renderCodex,openBestiary:renderBestiary,nodes:NODES};
})();
