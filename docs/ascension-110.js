(()=>{
'use strict';

const VERSION='1.1.0';
const PROFILE_KEY='arcana_profile_v2';
const STRATEGY_KEY='arcana_strategy_pack_v1';
const SETTINGS_KEY='arcana_lobby_settings_v1';
const CAMPAIGN_KEY='arcana_campaign_v2';
const REWARD_KEY='arcana_rewards_v2';
const ACADEMY_KEY='arcana_academy_v2';
const DECK_HISTORY_KEY='arcana_deck_history_v2';
const SET_NAME='Crônicas da Ascensão';
const CLASS_IDS=['vanguard','pyromancer','necromancer','druid','cryomancer','assassin','summoner','chronomancer'];

const CLASS_INFO={
  vanguard:{icon:'🛡️',name:'Guerreiro Arcano',fac:'solar',tone:'#ffd36b'},
  pyromancer:{icon:'🔥',name:'Piromante',fac:'solar',tone:'#ff7962'},
  necromancer:{icon:'💀',name:'Necromante',fac:'void',tone:'#ad7cff'},
  druid:{icon:'🌿',name:'Druida',fac:'wild',tone:'#70df8d'},
  cryomancer:{icon:'❄️',name:'Criomante',fac:'frost',tone:'#70dfff'},
  assassin:{icon:'🗡️',name:'Assassino',fac:'void',tone:'#ff6f9d'},
  summoner:{icon:'🌀',name:'Invocador',fac:'arcane',tone:'#779eff'},
  chronomancer:{icon:'⏳',name:'Cronomante',fac:'arcane',tone:'#bc8cff'}
};

const parse=(value,fallback={})=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const clone=value=>JSON.parse(JSON.stringify(value));
const profile=()=>parse(localStorage.getItem(PROFILE_KEY),{});
const strategy=()=>globalThis.ArcanaStrategy?.state?.()||parse(localStorage.getItem(STRATEGY_KEY),{});
const saveProfile=value=>{localStorage.setItem(PROFILE_KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent('arcana:profile',{detail:value}));globalThis.ArcanaLobby?.refresh?.()};
const saveStrategy=value=>{localStorage.setItem(STRATEGY_KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent('arcana:economy',{detail:value}));globalThis.ArcanaLobby?.refresh?.()};

function toast(message,state=''){
  let node=document.getElementById('arcAscToast');
  if(!node){node=document.createElement('div');node.id='arcAscToast';document.body.appendChild(node)}
  node.textContent=message;node.dataset.state=state;node.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2800);
}

function unit(name,classId,cost,atk,hp,icon,text,rarity='comum',archetype='Tática',extra={}){
  const info=CLASS_INFO[classId];return {name,fac:info.fac,cost,atk,hp,maxHp:hp,icon,text,type:'unit',kw:extra.kw||[],classes:[classId],rarity,archetype,set:SET_NAME,...extra};
}
function spell(name,classId,cost,icon,text,effect,target='none',rarity='comum',archetype='Tática'){
  const info=CLASS_INFO[classId];return {name,fac:info.fac,cost,icon,text,effect,target,type:'spell',classes:[classId],rarity,archetype,set:SET_NAME};
}
function relic(name,classId,cost,icon,text,effect,rarity='épica',archetype='Motor'){
  const info=CLASS_INFO[classId];return {name,fac:info.fac,cost,icon,text,effect,type:'relic',classes:[classId],rarity,archetype,set:SET_NAME};
}

const NEW_CARDS=[
  unit('Escudeira da Primeira Luz','vanguard',1,1,4,'🌅','Guarda. Ao morrer, compre 1.', 'comum','Defesa',{kw:['Guarda'],death:'draw'}),
  unit('Mestre de Formação','vanguard',2,2,4,'🧱','Recebe +1 ATQ com um aliado na rota.','rara','Formação',{pack:true}),
  unit('Arauto do Juramento','vanguard',3,3,5,'📯','Ao entrar, um aliado recebe +1 ATQ.','rara','Suporte',{onPlay:'buffAlly'}),
  unit('Protetora do Estandarte','vanguard',3,2,6,'🚩','Guarda e Escudo.','épica','Defesa',{kw:['Guarda','Escudo']}),
  unit('Muralha Caminhante','vanguard',5,4,9,'🏰','Guarda. No início do turno, cura um aliado.','épica','Sustentação',{kw:['Guarda'],turnHeal:true}),
  unit('General do Horizonte','vanguard',6,6,8,'⚜️','Escudo. Ao entrar, recebe uma bênção.','lendária','Finalizador',{kw:['Escudo'],onPlay:'bless'}),
  spell('Ordem de Avanço','vanguard',1,'📜','Dê +2/+2 a um aliado.','buff22','ally','comum','Suporte'),
  spell('Cúpula Solar','vanguard',2,'🔆','Dê Escudo a um aliado.','shield','ally','rara','Defesa'),
  spell('Retomada do Bastião','vanguard',3,'🏯','Cure 4 do herói e 2 dos aliados.','wildHeal','none','épica','Sustentação'),
  relic('Código da Guarda','vanguard',4,'📘','Sua mão comporta 14 cartas e ganha compra periódica.','library','lendária','Motor'),

  unit('Acendedor de Ruínas','pyromancer',1,2,1,'🕯️','Ao entrar, cause 1 ao herói rival.','comum','Queimadura',{onPlay:'ping'}),
  unit('Corredora de Lava','pyromancer',2,4,1,'🏃','Investida.','rara','Agressão',{kw:['Investida']}),
  unit('Cultista da Caldeira','pyromancer',2,2,3,'♨️','Ao morrer, ganhe mana no próximo turno.','rara','Combustão',{death:'battery'}),
  unit('Hidra Incandescente','pyromancer',4,5,4,'🐲','Ao eliminar uma criatura, recebe +1/+1.','épica','Queimadura',{devour:true}),
  unit('Coração do Vulcão','pyromancer',5,6,5,'🌋','No fim do turno, cause 1 ao herói rival.','épica','Pressão',{endPing:1}),
  unit('Imperatriz das Cinzas','pyromancer',6,8,5,'👑','Investida. Causa +2 em rota vazia.','lendária','Finalizador',{kw:['Investida'],heroBonus:2}),
  spell('Faísca em Cadeia','pyromancer',1,'⚡','Cause 2 a qualquer criatura.','arcane2','any','comum','Queimadura'),
  spell('Coluna de Magma','pyromancer',3,'🌋','Cause 2 a todos os inimigos.','aoe2','none','rara','Controle'),
  spell('Chama Vampírica','pyromancer',3,'🩸','Cause 3 ao herói rival e cure 3.','drain','none','épica','Sustentação'),
  relic('Forja do Sol Negro','pyromancer',4,'⚒️','Pode aumentar sua mana máxima.','hourglass','lendária','Motor'),

  unit('Mensageiro do Ossário','necromancer',1,1,3,'🦴','Ao morrer, compre 1.','comum','Sacrifício',{death:'draw'}),
  unit('Costureira de Almas','necromancer',2,2,4,'🪡','Ao entrar, cure todas as criaturas aliadas.','rara','Sustentação',{onPlay:'healTeam'}),
  unit('Cobrador do Além','necromancer',3,4,3,'📜','Ao eliminar uma criatura, recebe +1/+1.','rara','Sacrifício',{devour:true}),
  unit('Rei sem Túmulo','necromancer',4,4,6,'👑','Vampirismo.','épica','Sustentação',{kw:['Vampirismo']}),
  unit('Catedral Ambulante','necromancer',5,4,9,'⛪','Guarda. Ao morrer, ganhe mana.','épica','Defesa',{kw:['Guarda'],death:'battery'}),
  unit('Soberano das Mil Mortes','necromancer',7,8,8,'☠️','Ao entrar, fere o inimigo mais fraco.','lendária','Finalizador',{onPlay:'weak2'}),
  spell('Contrato de Sangue','necromancer',1,'🩸','Compre 2 e perca 2 de vida.','draw2hurt','none','comum','Sacrifício'),
  spell('Memória do Cadáver','necromancer',2,'🪦','Crie uma cópia 1/1 de um aliado.','duplicate','ally','rara','Combo'),
  spell('Decreto do Vazio','necromancer',4,'📕','Destrua inimigo com até 4 ATQ.','erase','enemy','épica','Controle'),
  relic('Livro dos Nomes Mortos','necromancer',3,'📓','Chance de compra extra no turno.','voidEye','lendária','Motor'),

  unit('Cogumelo Peregrino','druid',1,1,4,'🍄','Guarda.','comum','Defesa',{kw:['Guarda']}),
  unit('Cervo da Lua Verde','druid',2,2,4,'🦌','Ao entrar, fortalece um aliado.','rara','Crescimento',{onPlay:'buffAlly'}),
  unit('Pastora de Brotos','druid',3,2,6,'🧝','Ao entrar, cure os aliados.','rara','Sustentação',{onPlay:'healTeam'}),
  unit('Urso das Raízes','druid',4,5,6,'🐻','Recebe +1 ATQ com aliado na rota.','épica','Matilha',{pack:true}),
  unit('Árvore de Mil Invernos','druid',5,3,10,'🌳','Guarda. Cura um aliado no início do turno.','épica','Defesa',{kw:['Guarda'],turnHeal:true}),
  unit('Espírito da Floresta-Mãe','druid',7,7,10,'🦋','Vampirismo e Escudo.','lendária','Finalizador',{kw:['Vampirismo','Escudo']}),
  spell('Chuva de Pólen','druid',1,'🌼','Cure 6 do seu herói.','heal6','none','comum','Sustentação'),
  spell('Crescer além do Céu','druid',2,'🌱','Dê +1 ATQ e +3 de vida.','buff13','ally','rara','Crescimento'),
  spell('Floresta Instantânea','druid',3,'🌲','Invoque dois Brotos com Guarda.','sprouts','none','épica','Enxame'),
  relic('Círculo das Quatro Estações','druid',4,'⭕','Com 3 criaturas, cure no fim do turno.','forestHeart','lendária','Motor'),

  unit('Lebre da Geada','cryomancer',1,2,2,'🐇','Ao entrar, pode congelar o defensor.','comum','Controle',{onPlay:'laneFreeze'}),
  unit('Escultora de Cristal','cryomancer',2,2,4,'💎','Escudo.','rara','Defesa',{kw:['Escudo']}),
  unit('Duelista Boreal','cryomancer',3,4,3,'🤺','Pode congelar ao ferir.','rara','Controle',{freezeHit:.25}),
  unit('Mamute da Nevasca','cryomancer',4,4,7,'🐘','Guarda.','épica','Defesa',{kw:['Guarda']}),
  unit('Rainha do Lago Congelado','cryomancer',5,5,6,'👸','Ao entrar, congela um inimigo.','épica','Controle',{onPlay:'freezeRandom'}),
  unit('Dragão do Zero Eterno','cryomancer',7,7,9,'🐉','Ao entrar, congela todos os inimigos.','lendária','Finalizador',{onPlay:'freezeAll'}),
  spell('Sopro Branco','cryomancer',1,'💨','Cause 2 e pode congelar.','ice2','enemy','comum','Controle'),
  spell('Prisão de Diamante','cryomancer',2,'🔷','Congele uma criatura inimiga.','freeze','enemy','rara','Controle'),
  spell('Horizonte Branco','cryomancer',5,'🌨️','Congele todas as criaturas e compre 1.','zero','none','lendária','Controle'),
  relic('Coroa da Aurora Fria','cryomancer',3,'👑','Ao descongelar, a criatura recebe vida.','frostRelic','épica','Motor'),

  unit('Batedora sem Rosto','assassin',1,3,1,'🥷','Investida.','comum','Agressão',{kw:['Investida']}),
  unit('Colecionadora de Recompensas','assassin',2,2,3,'🪙','Ao eliminar, recebe +1/+1.','rara','Execução',{devour:true}),
  unit('Sabotador do Crepúsculo','assassin',3,4,2,'🧨','Ao entrar, fere o inimigo mais fraco.','rara','Execução',{onPlay:'weak2'}),
  unit('Dama da Máscara Rubra','assassin',3,4,3,'🎭','Escudo.','épica','Proteção',{kw:['Escudo']}),
  unit('Predadora do Último Sopro','assassin',5,6,4,'🐆','Vampirismo e Investida.','épica','Agressão',{kw:['Vampirismo','Investida']}),
  unit('Mestre do Eclipse Total','assassin',6,8,5,'🌑','Investida. Causa +2 em rota vazia.','lendária','Finalizador',{kw:['Investida'],heroBonus:2}),
  spell('Agulha Envenenada','assassin',1,'🪡','Cause 2 a qualquer criatura.','arcane2','any','comum','Execução'),
  spell('Contrato de Silêncio','assassin',2,'🤫','Cause 2; se eliminar, compre 1.','rift','enemy','rara','Valor'),
  spell('Fim sem Testemunhas','assassin',4,'❌','Destrua inimigo com até 4 ATQ.','erase','enemy','épica','Execução'),
  relic('Mapa das Rotas Secretas','assassin',3,'🗺️','Chance de compra extra no turno.','voidEye','lendária','Motor'),

  unit('Faísca Familiar','summoner',1,1,3,'✨','Ao entrar com mão pequena, compre 1.','comum','Invocação',{onPlay:'smallDraw'}),
  unit('Mímico de Bronze','summoner',2,2,3,'🧰','Copia parte de um aliado.','rara','Combo',{onPlay:'copy'}),
  unit('Condutora de Portais','summoner',3,3,4,'🚪','Seu próximo feitiço custa 2 a menos.','rara','Combo',{onPlay:'discount'}),
  unit('Enxame de Prisma','summoner',3,3,5,'🔶','Recebe +1 ATQ com aliado na rota.','épica','Enxame',{pack:true}),
  unit('Arquiteto de Mundos','summoner',5,5,7,'🏗️','Ao entrar, recebe uma bênção.','épica','Valor',{onPlay:'bless'}),
  unit('Colosso da Convergência','summoner',7,7,9,'🗿','Escudo. Copia parte de um aliado.','lendária','Finalizador',{kw:['Escudo'],onPlay:'copy'}),
  spell('Portal de Bolso','summoner',1,'🌀','Crie uma cópia 1/1 de um aliado.','duplicate','ally','comum','Combo'),
  spell('Chamada dos Pequenos','summoner',3,'📣','Invoque dois Brotos com Guarda.','sprouts','none','rara','Enxame'),
  spell('Convergência Perfeita','summoner',3,'♾️','Cada jogador compra 2.','bothDraw','none','épica','Valor'),
  relic('Máquina de Possibilidades','summoner',4,'⚙️','Sua mão comporta 14 cartas e ganha compra periódica.','library','lendária','Motor'),

  unit('Carteiro de Ontem','chronomancer',1,1,3,'✉️','Com mão pequena, compre 1.','comum','Previsão',{onPlay:'smallDraw'}),
  unit('Guarda do Segundo Perdido','chronomancer',2,2,4,'⏱️','Guarda.','rara','Defesa',{kw:['Guarda']}),
  unit('Editora do Destino','chronomancer',3,3,4,'✒️','Seu próximo feitiço custa 2 a menos.','rara','Tempo',{onPlay:'discount'}),
  unit('Navegador do Paradoxo','chronomancer',4,4,5,'🧭','Copia parte de um aliado.','épica','Combo',{onPlay:'copy'}),
  unit('Testemunha do Fim','chronomancer',5,5,7,'👁️','Ao entrar, recebe uma bênção.','épica','Valor',{onPlay:'bless'}),
  unit('Titã Depois do Amanhã','chronomancer',7,7,9,'⌛','Escudo. Congela todos os inimigos.','lendária','Finalizador',{kw:['Escudo'],onPlay:'freezeAll'}),
  spell('Reescrever Instante','chronomancer',1,'↩️','Compre 2 e devolva 1 à Reserva.','forecast','none','comum','Previsão'),
  spell('Suspensão Causal','chronomancer',2,'⏸️','Congele uma criatura inimiga.','freeze','enemy','rara','Controle'),
  spell('Paradoxo Estável','chronomancer',4,'♾️','Crie uma cópia 1/1 de um aliado.','duplicate','ally','épica','Combo'),
  relic('Observatório do Infinito','chronomancer',4,'🔭','Pode aumentar sua mana máxima.','hourglass','lendária','Motor')
];

function installCards(){
  const api=globalThis.__ARCANA;if(!api?.cards)return false;
  const names=new Set(api.cards.map(card=>card.name));const added=NEW_CARDS.filter(card=>!names.has(card.name));
  api.cards.push(...added);api.version=VERSION;
  if(added.length){
    const p=profile();p.cardCopies={...(p.cardCopies||{})};p.discovered=[...(p.discovered||[])];
    for(const card of added){if(!p.cardCopies[card.name])p.cardCopies[card.name]=3;if(!p.discovered.includes(card.name))p.discovered.push(card.name)}
    saveProfile(p);window.dispatchEvent(new CustomEvent('arcana:arsenal',{detail:{total:api.cards.length,added:added.length}}));
  }
  return true;
}

const CAMPAIGN_NODES=[
  {id:'gate',chapter:1,type:'battle',icon:'⚔️',name:'Portões da Aurora',text:'Recupere a entrada do reino.',reward:{gold:80}},
  {id:'traveler',chapter:1,type:'event',icon:'🧭',name:'Viajante sem Mapa',text:'Ajude o viajante ou aceite sua bússola.',choices:[['AJUDAR','heal'],['PEGAR A BÚSSOLA','relic']]},
  {id:'market',chapter:1,type:'shop',icon:'🏪',name:'Mercado das Nuvens',text:'Troque provisões por uma relíquia de campanha.'},
  {id:'bridge',chapter:1,type:'battle',icon:'🌉',name:'Ponte dos Juramentos',text:'Um exército bloqueia a passagem.',reward:{gold:110}},
  {id:'sunBoss',chapter:1,type:'boss',icon:'🦁',name:'Leão do Meio-Dia',text:'Chefe da região Solar.',reward:{gold:180,essence:35}},
  {id:'grove',chapter:2,type:'battle',icon:'🌿',name:'Bosque que Escuta',text:'As raízes reagem a cada carta.',reward:{gold:110}},
  {id:'shrine',chapter:2,type:'shrine',icon:'⛩️',name:'Santuário da Seiva',text:'Restaure o Fôlego da expedição.'},
  {id:'whisper',chapter:2,type:'event',icon:'🦋',name:'Sussurro Verde',text:'Escolha entre conhecimento e poder.',choices:[['OUVIR','lore'],['ABSORVER','power']]},
  {id:'roots',chapter:2,type:'battle',icon:'🌳',name:'Raízes do Mundo',text:'Defenda três rotas vivas.',reward:{gold:140}},
  {id:'forestBoss',chapter:2,type:'boss',icon:'🦌',name:'Coração Selvagem',text:'Chefe da região Selvagem.',reward:{gold:220,essence:55}},
  {id:'rift',chapter:3,type:'battle',icon:'🌌',name:'Fenda do Vazio',text:'O mapa termina; a queda começa.',reward:{gold:160}},
  {id:'archive',chapter:3,type:'event',icon:'📚',name:'Arquivo Impossível',text:'Salve uma memória para mudar o final.',choices:[['SALVAR O PASSADO','past'],['VER O FUTURO','future']]},
  {id:'voidShop',chapter:3,type:'shop',icon:'🕯️',name:'Mercador sem Sombra',text:'Última preparação antes do Abismo.'},
  {id:'crown',chapter:3,type:'battle',icon:'👑',name:'Coroa Partida',text:'Os oito caminhos convergem.',reward:{gold:200}},
  {id:'finalBoss',chapter:3,type:'boss',icon:'🐉',name:'Arquiteto do Vazio',text:'Batalha final da campanha.',reward:{gold:400,essence:100}}
];

function campaign(){return {schema:2,current:'gate',completed:[],choices:{},gold:0,breath:3,relics:[],awaitingBattle:null,ending:null,...parse(localStorage.getItem(CAMPAIGN_KEY),{}),...(profile().campaign110||{})}}
function saveCampaign(value){localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(value));const p=profile();p.campaign110=clone(value);saveProfile(p)}
function campaignIndex(value=campaign()){return Math.max(0,CAMPAIGN_NODES.findIndex(node=>node.id===value.current))}
function campaignUnlocked(index,value=campaign()){return index<=campaignIndex(value)||value.completed.includes(CAMPAIGN_NODES[index]?.id)}

function overlay(id,title,subtitle,content){
  let root=document.getElementById(id);if(!root){root=document.createElement('section');root.id=id;root.className='arcAscOverlay';document.body.appendChild(root)}
  root.innerHTML=`<div class="arcAscShell"><header><div><small>${esc(subtitle)}</small><h2>${esc(title)}</h2></div><button class="arcAscClose" aria-label="Fechar">×</button></header><main>${content}</main></div>`;
  root.classList.remove('hidden');root.querySelector('.arcAscClose').onclick=()=>root.classList.add('hidden');root.onclick=event=>{if(event.target===root)root.classList.add('hidden')};return root;
}

function renderCampaign(){
  const value=campaign(),index=campaignIndex(value),active=CAMPAIGN_NODES[index]||CAMPAIGN_NODES[0];
  const nodes=CAMPAIGN_NODES.map((node,nodeIndex)=>`<button class="arcCampaignNode ${node.id===active.id?'active':''} ${value.completed.includes(node.id)?'done':''}" data-campaign-node="${node.id}" ${!campaignUnlocked(nodeIndex,value)?'disabled':''}><span>${node.icon}</span><small>CAPÍTULO ${node.chapter}</small><b>${esc(node.name)}</b><em>${value.completed.includes(node.id)?'CONCLUÍDO':node.id===active.id?'DESTINO ATUAL':node.type.toUpperCase()}</em></button>`).join('');
  const action=active.type==='battle'||active.type==='boss'?'<button id="arcCampaignBattle" class="primary">INICIAR BATALHA</button>':active.type==='event'?`<div class="arcCampaignChoices">${active.choices.map(([label,effect])=>`<button data-campaign-choice="${effect}">${label}</button>`).join('')}</div>`:active.type==='shop'?'<button id="arcCampaignShop">COMPRAR RELÍQUIA · 100 OURO</button>':'<button id="arcCampaignShrine">RESTAURAR FÔLEGO</button>';
  const root=overlay('arcCampaign','Jornada pelo Reino','CAMPANHA PERSISTENTE',`<div class="arcCampaignStatus"><span>🪙 ${value.gold} OURO DA JORNADA</span><span>💚 ${value.breath}/3 FÔLEGO</span><span>✦ ${value.relics.length} RELÍQUIAS</span><span>${value.completed.length}/${CAMPAIGN_NODES.length} DESTINOS</span></div><div class="arcCampaignMap">${nodes}</div><section class="arcCampaignDetail"><div><small>${active.type.toUpperCase()} · CAPÍTULO ${active.chapter}</small><h3>${active.icon} ${esc(active.name)}</h3><p>${esc(active.text)}</p></div>${action}</section><p class="arcAscHint">O progresso é salvo automaticamente. Batalhas usam o seu deck e classe equipados.</p>`);
  root.querySelectorAll('[data-campaign-node]').forEach(button=>button.onclick=()=>{const next=campaign(),target=button.dataset.campaignNode,targetIndex=CAMPAIGN_NODES.findIndex(node=>node.id===target);if(campaignUnlocked(targetIndex,next)){next.current=target;saveCampaign(next);renderCampaign()}});
  root.querySelector('#arcCampaignBattle')?.addEventListener('click',()=>{const next=campaign();next.awaitingBattle=active.id;saveCampaign(next);root.classList.add('hidden');localStorage.setItem('arcana_lobby_mode_v1','solo');document.querySelector('[data-mode-choice="solo"]')?.click();setTimeout(()=>document.querySelector('[data-action="play"]')?.click(),100);toast(`Jornada preparada: ${active.name}`,'ok')});
  root.querySelectorAll('[data-campaign-choice]').forEach(button=>button.onclick=()=>resolveCampaignChoice(active,button.dataset.campaignChoice));
  root.querySelector('#arcCampaignShop')?.addEventListener('click',()=>{const next=campaign();if(next.gold<100)return toast('Faltam 100 de Ouro da Jornada.','error');next.gold-=100;next.relics=[...new Set([...next.relics,'Relíquia do Caminhante'])];completeCampaignNode(next,active);toast('Relíquia adquirida para a campanha.','ok')});
  root.querySelector('#arcCampaignShrine')?.addEventListener('click',()=>{const next=campaign();next.breath=3;completeCampaignNode(next,active);toast('Fôlego restaurado.','ok')});
}

function completeCampaignNode(value,node){
  if(!value.completed.includes(node.id))value.completed.push(node.id);const index=CAMPAIGN_NODES.findIndex(item=>item.id===node.id);value.current=CAMPAIGN_NODES[index+1]?.id||node.id;if(node.id==='finalBoss')value.ending=Object.keys(value.choices).sort().join('-')||'guardião';saveCampaign(value);renderCampaign();
}
function resolveCampaignChoice(node,effect){
  const value=campaign();value.choices[node.id]=effect;if(effect==='heal')value.breath=Math.min(3,value.breath+1);if(['relic','power','past','future'].includes(effect))value.relics=[...new Set([...value.relics,`${node.name}: ${effect}`])];completeCampaignNode(value,node);toast('Sua escolha alterou a Jornada.','ok');
}
function onCampaignMatch(detail){
  const value=campaign();if(!value.awaitingBattle)return;const node=CAMPAIGN_NODES.find(item=>item.id===value.awaitingBattle);value.awaitingBattle=null;
  if(detail.win){value.gold+=Number(node?.reward?.gold||60);const s=strategy();s.essence=Number(s.essence||0)+Number(node?.reward?.essence||0);saveStrategy(s);if(node)completeCampaignNode(value,node);toast(`Destino concluído: ${node?.name||'Batalha'}!`,'ok')}
  else{value.breath=Math.max(0,value.breath-1);saveCampaign(value);toast(value.breath?'A Jornada continua, mas você perdeu Fôlego.':'Sem Fôlego. Visite um Santuário.','error')}
}

const LESSONS=[
  ['mana','💎','Mana e curva','Aprenda quando gastar ou guardar mana.'],
  ['lanes','⚔️','Rotas e Domínio','Controle espaços e vença por presença.'],
  ['targets','🎯','Alvos e palavras-chave','Guarda, Escudo, Investida e Congelamento.'],
  ['deck','▤','Deck de 30 cartas','Cópias, consistência e curva de mana.'],
  ['classes','✥','Oito classes','Identidades, vantagens e fraquezas.'],
  ['forge','⚒️','Forja e crafting','Crie, desmonte e proteja favoritas.'],
  ['economy','🪙','Economia justa','Ouro, Essência e cosméticos sem poder pago.'],
  ['online','☁','Conta e multiplayer','Cloud save, salas, amigos e segurança.']
];
const PUZZLES=[
  {q:'Você tem 3 mana, uma carta de custo 2 e outra de custo 3. O rival está sem criaturas. Qual plano preserva mais opções?',a:['Jogar sempre a de custo 3','Avaliar a rota e guardar 1 mana se a carta de custo 2 já cria pressão','Encerrar sem olhar a mão'],correct:1},
  {q:'Uma criatura com Guarda protege qual alvo?',a:['A rota onde está posicionada','Todas as cartas da Reserva','A loja do lobby'],correct:0},
  {q:'Por que usar mais de uma cópia da mesma carta?',a:['Para aumentar a chance de comprá-la','Para aumentar secretamente o dano','Para ultrapassar 30 cartas'],correct:0},
  {q:'Qual carta pode entrar em qualquer classe?',a:['Exclusiva de Piromante','Neutra','Secreta de outra classe'],correct:1}
];
function academy(){return {completed:[],puzzles:[],...parse(localStorage.getItem(ACADEMY_KEY),{}),...(profile().academy110||{})}}
function saveAcademy(value){localStorage.setItem(ACADEMY_KEY,JSON.stringify(value));const p=profile();p.academy110=clone(value);saveProfile(p)}

function renderAcademy(){
  const value=academy();const lessons=LESSONS.map(([id,icon,name,text])=>`<article class="arcLesson ${value.completed.includes(id)?'done':''}"><span>${icon}</span><div><small>${value.completed.includes(id)?'CONCLUÍDO':'LIÇÃO'}</small><b>${name}</b><p>${text}</p></div><button data-lesson="${id}">${value.completed.includes(id)?'REVER':'COMEÇAR'}</button></article>`).join('');
  const puzzles=PUZZLES.map((puzzle,index)=>`<article class="arcPuzzle"><small>DESAFIO ${index+1}</small><b>${esc(puzzle.q)}</b><div>${puzzle.a.map((answer,answerIndex)=>`<button data-puzzle="${index}" data-answer="${answerIndex}" class="${value.puzzles.includes(index)&&answerIndex===puzzle.correct?'correct':''}">${esc(answer)}</button>`).join('')}</div></article>`).join('');
  const root=overlay('arcAcademy','Academia Arcana','TUTORIAL · GLOSSÁRIO · DESAFIOS',`<div class="arcAcademyProgress"><b>${value.completed.length}/${LESSONS.length} LIÇÕES</b><span>${value.puzzles.length}/${PUZZLES.length} DESAFIOS</span><i style="--progress:${Math.round(value.completed.length/LESSONS.length*100)}%"></i></div><div class="arcLessonGrid">${lessons}</div><h3 class="arcSectionTitle">Quebra-cabeças de combate</h3><div class="arcPuzzleGrid">${puzzles}</div><details class="arcGlossary"><summary>GLOSSÁRIO COMPLETO</summary><p><b>Guarda:</b> deve ser atacada antes de outros alvos na rota. <b>Escudo:</b> anula a próxima fonte de dano. <b>Investida:</b> pode agir imediatamente. <b>Vampirismo:</b> cura ao causar dano. <b>Congelamento:</b> impede a próxima ação. <b>Domínio:</b> condição alternativa ao controlar as três rotas.</p></details>`);
  root.querySelectorAll('[data-lesson]').forEach(button=>button.onclick=()=>openLesson(button.dataset.lesson));
  root.querySelectorAll('[data-puzzle]').forEach(button=>button.onclick=()=>answerPuzzle(Number(button.dataset.puzzle),Number(button.dataset.answer)));
}
function openLesson(id){
  const lesson=LESSONS.find(item=>item[0]===id);if(!lesson)return;const value=academy();
  const explanations={mana:'A mana aumenta a cada rodada. Cartas baratas criam presença cedo; cartas caras mudam o fim da partida. Uma boa curva evita mãos impossíveis.',lanes:'Cada rota comporta posições. Distribuir força impede que o rival conquiste Domínio e cria ataques diretos.',targets:'Observe os realces antes de jogar. Guarda protege a rota, Escudo absorve dano e Congelamento compra tempo.',deck:'O deck começa com 30 cartas. Uma cópia é situacional; duas ou três tornam a estratégia mais consistente.',classes:'Cada classe possui cartas exclusivas, uma habilidade ativa, passiva e árvore de Maestria. Neutras complementam qualquer plano.',forge:'Crafting usa Essência. Desmontar excedentes devolve parte do custo; favoritas ficam protegidas.',economy:'Ouro compra cosméticos e ofertas. Essência cria cartas. Nenhuma compra cosmética aumenta atributos.',online:'A Conta Arcana sincroniza progresso. Nunca compartilhe senha, QR de MFA ou código de seis dígitos.'};
  const root=overlay('arcLessonDetail',lesson[2],`ACADEMIA · ${lesson[1]}`,`<div class="arcLessonBody"><span>${lesson[1]}</span><p>${explanations[id]}</p><div class="arcLessonExample"><b>EXEMPLO PRÁTICO</b><p>${lesson[3]}</p></div><button id="arcCompleteLesson" class="primary">CONCLUIR LIÇÃO · +20 OURO</button></div>`);
  root.querySelector('#arcCompleteLesson').onclick=()=>{if(!value.completed.includes(id)){value.completed.push(id);const s=strategy();s.coins=Number(s.coins||0)+20;saveStrategy(s);saveAcademy(value)}root.classList.add('hidden');renderAcademy();toast('Lição concluída. +20 Ouro','ok')};
}
function answerPuzzle(index,answer){
  const puzzle=PUZZLES[index],value=academy();if(answer!==puzzle.correct)return toast('Ainda não. Leia as opções e tente novamente.','error');if(!value.puzzles.includes(index)){value.puzzles.push(index);const s=strategy();s.essence=Number(s.essence||0)+10;saveStrategy(s);saveAcademy(value);toast('Resposta correta. +10 Essências','ok')}renderAcademy();
}

function rewardState(){return {lastClaim:'',streak:0,inbox:[],lastSeen:Date.now(),...parse(localStorage.getItem(REWARD_KEY),{}),...(profile().rewards110||{})}}
function saveRewards(value){localStorage.setItem(REWARD_KEY,JSON.stringify(value));const p=profile();p.rewards110=clone(value);saveProfile(p)}
function dateKey(date=new Date()){return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`}
const DAILY=[['🪙',80,'coins'],['✦',25,'essence'],['🪙',120,'coins'],['✦',40,'essence'],['🪙',180,'coins'],['✦',60,'essence'],['🎁',1,'chest']];
function renderRewards(){
  const value=rewardState(),today=dateKey(),claimed=value.lastClaim===today;const days=DAILY.map(([icon,amount,type],index)=>`<article class="${index<value.streak?'claimed':''} ${index===value.streak&&!claimed?'today':''}"><span>${icon}</span><small>DIA ${index+1}</small><b>${type==='chest'?'BAÚ RARO':amount}</b></article>`).join('');
  const inbox=value.inbox.length?value.inbox.map((item,index)=>`<article><span>${item.icon||'✉️'}</span><div><b>${esc(item.title)}</b><small>${esc(item.text)}</small></div><button data-inbox="${index}" ${item.claimed?'disabled':''}>${item.claimed?'RESGATADO':'RESGATAR'}</button></article>`).join(''):'<p class="arcAscEmpty">Nenhuma mensagem pendente.</p>';
  const root=overlay('arcRewards','Recompensas','CALENDÁRIO · RETORNO · CAIXA DE ENTRADA',`<section class="arcDaily"><header><div><small>SEQUÊNCIA ATUAL</small><h3>${value.streak} DIAS</h3></div><button id="arcDailyClaim" class="primary" ${claimed?'disabled':''}>${claimed?'RESGATADO HOJE':'RESGATAR HOJE'}</button></header><div>${days}</div></section><h3 class="arcSectionTitle">Caixa de entrada</h3><div class="arcInbox">${inbox}</div>`);
  root.querySelector('#arcDailyClaim').onclick=claimDaily;root.querySelectorAll('[data-inbox]').forEach(button=>button.onclick=()=>claimInbox(Number(button.dataset.inbox)));
}
function claimDaily(){
  const value=rewardState(),today=dateKey();if(value.lastClaim===today)return;const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);value.streak=value.lastClaim===dateKey(yesterday)?Math.min(6,value.streak+1):0;const reward=DAILY[value.streak];const s=strategy();if(reward[2]==='coins')s.coins=Number(s.coins||0)+reward[1];else if(reward[2]==='essence')s.essence=Number(s.essence||0)+reward[1];else{s.coins=Number(s.coins||0)+200;s.essence=Number(s.essence||0)+75}saveStrategy(s);value.lastClaim=today;value.streak=value.streak===6?0:value.streak+1;saveRewards(value);renderRewards();toast('Recompensa diária resgatada.','ok');
}
function claimInbox(index){const value=rewardState(),item=value.inbox[index];if(!item||item.claimed)return;const s=strategy();s.coins=Number(s.coins||0)+Number(item.coins||0);s.essence=Number(s.essence||0)+Number(item.essence||0);saveStrategy(s);item.claimed=true;saveRewards(value);renderRewards();toast('Recompensa recebida.','ok')}
function prepareReturnReward(){const value=rewardState(),away=Date.now()-Number(value.lastSeen||Date.now());if(away>1000*60*60*24*3&&!value.inbox.some(item=>item.id===`return-${dateKey()}`))value.inbox.unshift({id:`return-${dateKey()}`,icon:'🌟',title:'Bem-vindo de volta',text:'Recompensa por retornar ao Reino.',coins:250,essence:50,claimed:false});value.lastSeen=Date.now();saveRewards(value)}

function combination(n,k){if(k<0||k>n)return 0;k=Math.min(k,n-k);let result=1;for(let i=1;i<=k;i++)result=result*(n-k+i)/i;return result}
function drawChance(copies,draws=4,size=30){return Math.round((1-combination(size-copies,draws)/combination(size,draws))*100)}
function activeDeck(){const p=profile(),classId=p.classId||'vanguard',catalog=globalThis.__ARCANA?.cards||[];let deck=p.classDecks?.[classId];if(!deck){const names=globalThis.ArcanaEvolution?.autoDeckNames?.(classId,catalog)||[];deck={name:`${CLASS_INFO[classId].name} Essencial`,cards:names}}return {classId,deck,catalog}}
function encodeDeck(data){return btoa(unescape(encodeURIComponent(JSON.stringify(data))))}
function decodeDeck(code){return JSON.parse(decodeURIComponent(escape(atob(code.trim()))))}
function deckMetrics(names,catalog){const cards=names.map(name=>catalog.find(card=>card.name===name)).filter(Boolean),curve=[0,0,0,0,0,0],types={unit:0,spell:0,relic:0},rarities={};for(const card of cards){curve[Math.min(5,Number(card.cost||0))]++;types[card.type]=(types[card.type]||0)+1;rarities[card.rarity]=(rarities[card.rarity]||0)+1}return {cards,curve,types,rarities,average:cards.length?(cards.reduce((sum,card)=>sum+Number(card.cost||0),0)/cards.length).toFixed(1):0}}
function renderDeckLab(){
  const {classId,deck,catalog}=activeDeck(),metrics=deckMetrics(deck.cards||[],catalog),counts=(deck.cards||[]).reduce((out,name)=>(out[name]=(out[name]||0)+1,out),{}),legal=(deck.cards||[]).length===30&&Object.entries(counts).every(([name,count])=>count<=3&&globalThis.ArcanaEvolution?.allowedForClass?.(catalog.find(card=>card.name===name),classId));const max=Math.max(...metrics.curve,1);
  const odds=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count])=>`<tr><td>${esc(name)}</td><td>${count}×</td><td>${drawChance(count)}%</td></tr>`).join('');
  const root=overlay('arcDeckLab','Laboratório de Deck','ANÁLISE · PROBABILIDADE · CÓDIGO',`<div class="arcDeckLabHead"><div><small>${CLASS_INFO[classId].icon} ${CLASS_INFO[classId].name}</small><h3>${esc(deck.name||'Deck atual')}</h3><p class="${legal?'valid':'invalid'}">${legal?'✓ DECK VÁLIDO':'⚠ DECK PRECISA DE CORREÇÃO'} · ${(deck.cards||[]).length}/30</p></div><div><b>MANA MÉDIA ${metrics.average}</b><span>${metrics.types.unit} criaturas · ${metrics.types.spell} feitiços · ${metrics.types.relic} relíquias</span></div></div><div class="arcDeckCurve">${metrics.curve.map((value,index)=>`<div><i><em style="height:${value/max*100}%"></em></i><b>${value}</b><span>${index===5?'5+':index}</span></div>`).join('')}</div><div class="arcDeckLabGrid"><section><h3>Chance na mão inicial</h3><table><thead><tr><th>CARTA</th><th>CÓPIAS</th><th>EM 4 CARTAS</th></tr></thead><tbody>${odds}</tbody></table></section><section><h3>Compartilhar deck</h3><p>Exporte um código ou cole um código recebido. A importação valida classe, quantidade e cartas existentes.</p><textarea id="arcDeckCode" spellcheck="false" placeholder="Código do deck"></textarea><div><button id="arcDeckExport">GERAR CÓDIGO</button><button id="arcDeckImport" class="primary">IMPORTAR</button></div></section></div><div class="arcDeckAdvice"><b>ANÁLISE TÁTICA</b><p>${Number(metrics.average)>3.8?'A curva está pesada; adicione opções de custo 1–2.':metrics.types.unit<12?'Poucas criaturas podem dificultar o controle das rotas.':'Curva e presença estão equilibradas para partidas normais.'}</p></div>`);
  root.querySelector('#arcDeckExport').onclick=async()=>{const code=encodeDeck({version:1,classId,name:deck.name,cards:deck.cards});root.querySelector('#arcDeckCode').value=code;try{await navigator.clipboard.writeText(code);toast('Código copiado.','ok')}catch{toast('Código gerado. Copie o texto.','ok')}};
  root.querySelector('#arcDeckImport').onclick=()=>importDeck(root.querySelector('#arcDeckCode').value);
}
function importDeck(code){
  try{const data=decodeDeck(code),catalog=globalThis.__ARCANA?.cards||[],counts=(data.cards||[]).reduce((out,name)=>(out[name]=(out[name]||0)+1,out),{});if(!CLASS_INFO[data.classId]||data.cards?.length!==30||Object.values(counts).some(count=>count>3)||data.cards.some(name=>{const card=catalog.find(item=>item.name===name);return !card||!globalThis.ArcanaEvolution?.allowedForClass?.(card,data.classId)}))throw new Error('invalid');const p=profile();p.classId=data.classId;p.classDecks={...(p.classDecks||{}),[data.classId]:{name:String(data.name||'Deck importado').slice(0,28),cards:[...data.cards],updatedAt:Date.now(),version:4}};saveProfile(p);recordDeckHistory(p.classDecks);renderDeckLab();toast('Deck importado e equipado.','ok')}catch{toast('Código inválido ou incompatível.','error')}
}
function recordDeckHistory(classDecks){const items=parse(localStorage.getItem(DECK_HISTORY_KEY),[]),signature=JSON.stringify(classDecks||{});if(items[0]?.signature===signature)return;items.unshift({id:Date.now(),at:Date.now(),signature,decks:clone(classDecks||{})});localStorage.setItem(DECK_HISTORY_KEY,JSON.stringify(items.slice(0,12)))}

let battleStats=null,lastGame=null;
function pollStats(){
  const game=globalThis.__ARCANA?.state?.();if(!game?.id||game.over){lastGame=game?clone(game):null;return}if(!battleStats||battleStats.id!==game.id){battleStats={id:game.id,startedAt:Date.now(),cards:0,damage:0,healing:0,defeated:0,maxMana:0};lastGame=clone(game);return}const me=game.p?.[0],old=lastGame?.p?.[0],op=game.p?.[1],oldOp=lastGame?.p?.[1];if(me&&old){if(game.round===lastGame.round)battleStats.cards+=Math.max(0,Number(me.cardsTurn||0)-Number(old.cardsTurn||0));battleStats.healing+=Math.max(0,Number(me.hp||0)-Number(old.hp||0));battleStats.maxMana=Math.max(battleStats.maxMana,Number(me.maxMana||0))}if(op&&oldOp)battleStats.damage+=Math.max(0,Number(oldOp.hp||0)-Number(op.hp||0));const count=player=>(player?.lanes||[]).flat().length;if(op&&oldOp)battleStats.defeated+=Math.max(0,count(oldOp)-count(op));lastGame=clone(game)}
function renderPostGame(detail){setTimeout(()=>{const panel=document.getElementById('runStats'),stats=battleStats;if(!panel||!stats)return;const seconds=Math.max(1,Math.round((Date.now()-stats.startedAt)/1000));panel.innerHTML=`<div class="arcPostStats"><article><b>${stats.damage}</b><span>DANO</span></article><article><b>${stats.healing}</b><span>CURA</span></article><article><b>${stats.cards}</b><span>CARTAS</span></article><article><b>${stats.defeated}</b><span>ELIMINAÇÕES</span></article><article><b>${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}</b><span>DURAÇÃO</span></article></div><button id="arcShareResult">COPIAR RESULTADO</button>`;panel.querySelector('#arcShareResult').onclick=async()=>{const text=`ArcanaClash ${VERSION} · ${detail.win?'Vitória':'Derrota'} · ${stats.damage} dano · ${stats.cards} cartas · ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;try{await navigator.clipboard.writeText(text);toast('Resultado copiado.','ok')}catch{toast(text)}}},350)}

function injectLobbyFeatures(){
  const grid=document.querySelector('#arcLobbyRoot .arcFeatureGrid');if(!grid||grid.querySelector('[data-asc-action]'))return;
  const features=[['campaign','🗺️','Campanha','15 destinos · escolhas e chefes','NOVO'],['academy','🎓','Academia Arcana','Tutoriais, glossário e desafios','NOVO'],['rewards','🎁','Recompensas','Calendário e caixa de entrada',''],['decklab','📊','Laboratório de Deck','Curva, chances e códigos','']];
  for(const [action,icon,name,text,badge] of features){const button=document.createElement('button');button.className='arcFeature arcAscFeature';button.dataset.ascAction=action;button.innerHTML=`<span class="arcFeatureIcon">${icon}</span><b>${name}</b><small>${text}</small>${badge?`<span class="arcFeatureBadge">${badge}</span>`:''}`;grid.appendChild(button)}
}
function handleActions(event){const action=event.target.closest?.('[data-asc-action]')?.dataset.ascAction;if(!action)return;if(action==='campaign')renderCampaign();if(action==='academy')renderAcademy();if(action==='rewards')renderRewards();if(action==='decklab')renderDeckLab()}

function applyExtraSettings(){const value=parse(localStorage.getItem(SETTINGS_KEY),{});document.documentElement.style.fontSize=`${Number(value.textScale||100)}%`;document.body.classList.toggle('arcNoShake',!!value.noShake);document.body.classList.toggle('arcReadableFont',!!value.readableFont);document.body.dataset.colorVision=value.colorVision||'normal'}
function injectSettings(){
  const modal=document.getElementById('arcLobbyModal');if(!modal||modal.classList.contains('hidden')||modal.querySelector('#arcExtraSettings')||!modal.textContent.includes('ACESSIBILIDADE'))return;const list=modal.querySelector('.arcSettingList');if(!list)return;const value=parse(localStorage.getItem(SETTINGS_KEY),{}),box=document.createElement('section');box.id='arcExtraSettings';box.innerHTML=`<h3>ACESSIBILIDADE AVANÇADA</h3><label class="arcSetting"><div><b>Tamanho do texto</b><small>Ampliação independente do restante da interface.</small></div><input type="range" min="90" max="130" step="5" value="${Number(value.textScale||100)}" data-asc-setting="textScale"></label><label class="arcSetting"><div><b>Visão de cores</b><small>Filtros para protanopia, deuteranopia e tritanopia.</small></div><select data-asc-setting="colorVision"><option value="normal">Padrão</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option></select></label><label class="arcSetting"><div><b>Desativar tremores</b><small>Remove impactos que movimentam a tela.</small></div><input type="checkbox" data-asc-setting="noShake" ${value.noShake?'checked':''}></label><label class="arcSetting"><div><b>Fonte de alta leitura</b><small>Substitui fontes decorativas nos textos funcionais.</small></div><input type="checkbox" data-asc-setting="readableFont" ${value.readableFont?'checked':''}></label>`;list.appendChild(box);box.querySelector('[data-asc-setting="colorVision"]').value=value.colorVision||'normal';box.querySelectorAll('[data-asc-setting]').forEach(input=>input.oninput=()=>{const next=parse(localStorage.getItem(SETTINGS_KEY),{}),key=input.dataset.ascSetting;next[key]=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;localStorage.setItem(SETTINGS_KEY,JSON.stringify(next));applyExtraSettings()})
}

function migrate(){
  const p=profile();p.schemaVersion=Math.max(6,Number(p.schemaVersion||0));p.release110={version:VERSION,migratedAt:p.release110?.migratedAt||Date.now(),cardsTarget:252};recordDeckHistory(p.classDecks);saveProfile(p);
  const rewards=rewardState();if(!rewards.inbox.some(item=>item.id==='release-110'))rewards.inbox.unshift({id:'release-110',icon:'👑',title:'Crônicas da Ascensão',text:'Presente de atualização: 500 Ouro e 100 Essências.',coins:500,essence:100,claimed:false});saveRewards(rewards);
}

function install(){
  migrate();prepareReturnReward();applyExtraSettings();let cardAttempts=0;const cardTimer=setInterval(()=>{if(installCards()||cardAttempts++>40)clearInterval(cardTimer)},100);
  document.addEventListener('click',handleActions);window.addEventListener('arcana:match',event=>{onCampaignMatch(event.detail||{});renderPostGame(event.detail||{})});window.addEventListener('arcana:profile',()=>recordDeckHistory(profile().classDecks));setInterval(()=>{injectLobbyFeatures();injectSettings();pollStats()},300);document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.arcAscOverlay:not(.hidden)').forEach(node=>node.classList.add('hidden'))});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
globalThis.ArcanaAscension={version:VERSION,cards:NEW_CARDS,campaign,openCampaign:renderCampaign,openAcademy:renderAcademy,openRewards:renderRewards,openDeckLab:renderDeckLab};
})();
