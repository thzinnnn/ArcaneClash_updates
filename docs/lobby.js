const LOBBY_VERSION='0.9.4';
const PROFILE_KEY='arcana_profile_v2';
const STRATEGY_KEY='arcana_strategy_pack_v1';
const SETTINGS_KEY='arcana_lobby_settings_v1';
const MODE_KEY='arcana_lobby_mode_v1';

const MODE_COLORS={cyan:'#63e7ff',gold:'#ffd36b',blue:'#7fa8ff',red:'#ff738d',magenta:'#ff75c5',violet:'#a783ff',green:'#78e69b',amber:'#ffc465'};
const MAP_DESTINATIONS={
  solo:{region:'Bastião Celeste',lore:'A estrada dos iniciados atravessa ruínas que mudam a cada jornada.',x:12,y:63,mx:24,my:8},
  duel:{region:'Arena do Sol',lore:'Duas vontades entram. Apenas uma deixa sua marca na areia dourada.',x:27,y:27,mx:74,my:18},
  duo:{region:'Pontes Gêmeas',lore:'Rotas entrelaçadas onde parceria e posicionamento decidem o confronto.',x:43,y:60,mx:24,my:31},
  raidcoop:{region:'Covil do Arquiteto',lore:'Uma fortaleza viva no limite do Vazio aguarda seu grupo.',x:58,y:20,mx:74,my:41},
  blitz:{region:'Fenda Rubra',lore:'Mana instável acelera cada decisão e não perdoa hesitação.',x:74,y:50,mx:24,my:54},
  chaos:{region:'Ilhas Impossíveis',lore:'As regras se partem e o campo nunca permanece o mesmo.',x:88,y:18,mx:74,my:64},
  survival:{region:'Bosque dos Ecos',lore:'Ondas de inimigos guardam trilhas cada vez mais profundas.',x:24,y:83,mx:24,my:77},
  raid:{region:'Abismo Coroado',lore:'Enfrente sozinho a criatura que governa as rotas perdidas.',x:62,y:80,mx:74,my:87},
  draft:{region:'Mercado Flutuante',lore:'Construa seu arsenal enquanto viaja por escolhas inesperadas.',x:88,y:77,mx:50,my:96}
};
const CLASSES={
  vanguard:{icon:'🛡️',name:'Guerreiro Arcano'},
  pyromancer:{icon:'🔥',name:'Piromante'},
  necromancer:{icon:'💀',name:'Necromante'},
  druid:{icon:'🌿',name:'Druida'},
  cryomancer:{icon:'❄️',name:'Criomante'},
  assassin:{icon:'🗡️',name:'Assassino'},
  summoner:{icon:'🌀',name:'Invocador'},
  chronomancer:{icon:'⏳',name:'Cronomante'}
};
const DOCTRINES={
  balanced:{icon:'⚖️',name:'Equilíbrio'},
  aggro:{icon:'🔥',name:'Pressão'},
  control:{icon:'🛡️',name:'Controle'},
  tempo:{icon:'⚡',name:'Tempo'}
};
const DEFAULT_SETTINGS={sound:true,volume:32,vibration:true,reducedMotion:false,performance:false,largeUi:false,highContrast:false,compactCards:false,confirmTurn:false};
const UPDATE_HISTORY=[
  {version:'0.9.4',date:'22 AGO 2026',title:'Combate Renascido',tag:'ATUAL',tone:'#8fd8ff',notes:['As três rotas deixaram de ser painéis iguais e agora formam campos de batalha integrados ao cenário.','Cada um dos nove destinos possui atmosfera, terreno, iluminação, marcos e nomes de rota próprios.','Posições vazias, rotas disponíveis e alvos válidos receberam sinalização mais clara.','Criaturas ganharam entrada, impacto, profundidade e presença visual no terreno.','Os campos foram reconstruídos para manter leitura e desempenho no PC e no celular.','A partida agora possui botão Sair com confirmação; desistir conta como derrota e devolve o jogador ao lobby.']},
  {version:'0.9.3',date:'22 AGO 2026',title:'Mapa da Ascensão',tag:'MAPA',tone:'#76e4d4',notes:['O lobby ganhou um mapa navegável com nove destinos ligados aos modos de jogo.','Cada região possui atmosfera, história curta, cor e posição próprias.','A paleta visual recebeu azul oceânico, violeta, dourado, verde e coral sem perder a legibilidade.','Cartões, perfil, temporada e missões agora usam materiais e iluminação distintos.','O mapa se reorganiza como uma jornada vertical no celular.']},
  {version:'0.9.2',date:'22 AGO 2026',title:'Identidades Reforjadas',tag:'CARTAS',tone:'#63e7ff',notes:['As habilidades das 172 cartas foram refeitas sem quebrar nomes ou decks salvos.','Cada classe agora possui um vocabulário mecânico próprio: formação, combustão, sacrifício, crescimento, congelamento, execução, convergência ou tempo.','Mercado Arcano dá utilidade real a Ouro e Essência com temas, molduras e sigilos permanentes.','Cosméticos não aumentam dano, vida ou mana; a disputa continua justa.','O painel ADM ganhou ferramentas de economia, missões, cosméticos e diagnóstico, sempre protegido pela Conta Arcana.']},
  {version:'0.9.1',date:'22 AGO 2026',title:'Expansão do Arsenal',tag:'ARSENAL',tone:'#ffbd66',notes:['98 cartas novas elevaram o catálogo de 74 para 172.','Cada classe agora possui 20 exclusivas e compartilha 12 Neutras: 32 opções legais por classe.','Uma carta secreta ultrarrara foi escondida em cada uma das 8 classes.','Cartas secretas não aparecem no catálogo, na busca, na Forja nem em decks iniciais.','Raridade agora aparece com moldura, cor, símbolo e nome em cada carta.','Sinalização integrada à Forja, mão, mulligan, Baús, campo, Inspector e modos online.','Novas cartas funcionam em decks, Baús, Espólios, Relíquias e modos online.']},
  {version:'0.9.0',date:'22 AGO 2026',title:'Ascensão das Classes',tag:'CLASSES',tone:'#63e7ff',notes:['Classes passaram a controlar decks, Baús, Espólios e Relíquias.','Forja de Deck com 30 cartas, limite de 3 cópias e cloud save.','Mulligan, mão inicial rebalanceada e identidade de classe online.','Micro-updates: Histórico de Updates e guia interativo da Forja adicionados ao lobby.']},
  {version:'0.8.0',date:'22 AGO 2026',title:'Lobby Arcano',tag:'LOBBY',tone:'#9f80ff',notes:['A antiga home foi substituída por um lobby completo.','Modos, perfil, amigos, missões, temporada, ranking e configurações foram integrados.','Conta Arcana, cloud save e acesso ADM foram preservados.']},
  {version:'0.7.2',date:'21 AGO 2026',title:'Strategy + Conta Arcana',tag:'ONLINE',tone:'#72e79f',notes:['Login, cadastro, sincronização e resolução de conflitos de save.','Doutrinas, missões, temporada, recompensas, ranking e títulos.','Primeira versão Web pública com sistemas persistentes.']},
  {version:'0.7.0',date:'20 AGO 2026',title:'Ascensão dos Arcanos',tag:'FUNDAÇÃO',tone:'#ffd36b',notes:['Oito Classes Arcanas, perfil, coleção e conquistas.','Espólio por eliminações, Relíquias e proteção contra azar nos Baús.','Jornada, dificuldades, chefe em fases e Inspector de cartas.']}
];

let selectedMode=localStorage.getItem(MODE_KEY)||'solo';
let identity=null;
let isAdmin=false;
let securityState=null;
let modalType='';
let lastRenderSignature='';

const byId=id=>document.getElementById(id);
const parse=(value,fallback={})=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const profile=()=>parse(localStorage.getItem(PROFILE_KEY),{});
const strategy=()=>globalThis.ArcanaStrategy?.state?.()||parse(localStorage.getItem(STRATEGY_KEY),{});
const settings=()=>({...DEFAULT_SETTINGS,...parse(localStorage.getItem(SETTINGS_KEY),{})});

function saveProfile(next){
  localStorage.setItem(PROFILE_KEY,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('arcana:profile',{detail:next}));
  refreshLobby(true);
}

function saveStrategy(next){
  localStorage.setItem(STRATEGY_KEY,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('arcana:profile',{detail:profile()}));
  refreshLobby(true);
}

function saveSettings(next){
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(next));
  applySettings(next);
}

function rankFor(points=0){
  const ranks=[['🥉','Bronze',0],['🥈','Prata',300],['🥇','Ouro',700],['💠','Platina',1200],['🔮','Arcano',1800],['👑','Lenda',2600]];
  return ranks.reduce((current,item)=>points>=item[2]?item:current,ranks[0]);
}

function modeApi(){return globalThis.__ARCANA?.modes||{}}
function activeMode(){const modes=modeApi();return modes[selectedMode]||modes.solo||Object.values(modes)[0]||{id:'solo',name:'Jornada',icon:'✦',subtitle:'Solo PvE',players:'1 jogador',tone:'cyan',description:'Prepare seu Arcano e comece uma nova partida.'}}

function coreProfileButton(tab='profile'){
  byId('openArcano')?.click();
  requestAnimationFrame(()=>document.querySelector(`#arcMetaOverlay [data-tab="${tab}"]`)?.click());
}

function strategyTab(tab){
  globalThis.ArcanaStrategy?.open?.();
  requestAnimationFrame(()=>document.querySelector(`#strategyHub [data-tab="${tab}"]`)?.click());
}

function legacyModeButton(id){return [...document.querySelectorAll('.modeTile[data-mode]')].find(button=>button.dataset.mode===id)||null}

function openMode(id=selectedMode,createRoom=false){
  selectedMode=id;
  localStorage.setItem(MODE_KEY,id);
  const button=legacyModeButton(id);
  if(button){
    button.click();
    if(createRoom)setTimeout(()=>byId('setupCreate')?.click(),50);
    return;
  }
  if(globalThis.__ARCANA?.startSolo)globalThis.__ARCANA.startSolo(id);
}

function toast(text){
  let node=byId('arcLobbyToast');
  if(!node){node=document.createElement('div');node.id='arcLobbyToast';node.style.cssText='position:fixed;left:50%;bottom:26px;z-index:100090;transform:translate(-50%,18px);opacity:0;padding:11px 16px;border:1px solid #7aa8d855;border-radius:13px;background:#0c132adf;color:#edf4ff;font:700 12px system-ui;transition:.2s;pointer-events:none;box-shadow:0 16px 45px #0008';document.body.appendChild(node)}
  node.textContent=text;node.style.opacity='1';node.style.transform='translate(-50%,0)';clearTimeout(toast.timer);toast.timer=setTimeout(()=>{node.style.opacity='0';node.style.transform='translate(-50%,18px)'},2300);
}

function currentUserName(){
  const p=profile();
  return identity?.user_metadata?.display_name||p.name||identity?.email?.split('@')[0]||'Arcano';
}

function renderModeChoices(){
  const modes=Object.values(modeApi());
  return modes.map(mode=>`<button class="arcModeChoice ${mode.id===selectedMode?'active':''}" data-mode-choice="${escapeHtml(mode.id)}" style="--choice-tone:${MODE_COLORS[mode.tone]||MODE_COLORS.cyan}"><span class="arcModeIcon">${mode.icon||'✦'}</span><b>${escapeHtml(mode.name)}</b><small>${escapeHtml(mode.subtitle||mode.players||'')}</small></button>`).join('');
}

function renderWorldMap(){
  const modes=Object.values(modeApi()),active=activeMode(),destination=MAP_DESTINATIONS[active.id]||MAP_DESTINATIONS.solo;
  const nodes=modes.map(mode=>{
    const point=MAP_DESTINATIONS[mode.id]||{region:mode.name,lore:mode.description,x:50,y:50,mx:50,my:50};
    return `<button class="arcMapNode ${mode.id===selectedMode?'active':''}" data-mode-choice="${escapeHtml(mode.id)}" aria-label="${escapeHtml(`${mode.name} · ${point.region}`)}" style="--map-x:${point.x}%;--map-y:${point.y}%;--map-mobile-x:${point.mx}%;--map-mobile-y:${point.my}%;--node-tone:${MODE_COLORS[mode.tone]||MODE_COLORS.cyan}"><i>${mode.icon||'✦'}</i><span><b>${escapeHtml(mode.name)}</b><small>${escapeHtml(point.region)}</small></span></button>`;
  }).join('');
  return `<section class="arcLobbyCard arcWorldMapCard" style="--map-active-tone:${MODE_COLORS[active.tone]||MODE_COLORS.cyan}">
    <header class="arcMapHead"><div><small>EXPLORE O REINO</small><h2>Mapa da Ascensão</h2><p>Escolha um destino para preparar sua próxima batalha.</p></div><span>${modes.length} DESTINOS</span></header>
    <div class="arcWorldMapCanvas">
      <div class="arcMapSea"></div><div class="arcMapLand arcMapLandWest"></div><div class="arcMapLand arcMapLandNorth"></div><div class="arcMapLand arcMapLandEast"></div><div class="arcMapLand arcMapLandSouth"></div>
      <svg class="arcMapRoutes" viewBox="0 0 1000 470" preserveAspectRatio="none" aria-hidden="true"><path d="M120 296 C170 230 215 166 270 127 S370 228 430 282 S520 142 580 94 S680 188 740 235 S830 128 880 85"/><path d="M120 296 C170 350 190 390 240 390 S350 330 430 282 S525 365 620 376 S790 350 880 362"/><path d="M740 235 C800 280 830 320 880 362"/></svg>
      <div class="arcMapCompass"><i>✦</i><span>N</span></div><div class="arcMapMist mistOne"></div><div class="arcMapMist mistTwo"></div>${nodes}
    </div>
    <footer class="arcMapSelected"><div class="arcMapSelectedIcon">${active.icon||'✦'}</div><div><small>DESTINO SELECIONADO · ${escapeHtml(active.players||'')}</small><b>${escapeHtml(destination.region)}</b><p>${escapeHtml(destination.lore)}</p></div><button data-action="play">VIAJAR E JOGAR</button></footer>
  </section>`;
}

function missionPreview(state){
  const missions=state?.missions?.items||[];
  if(!missions.length)return '<div class="arcEmpty"><b>Missões preparando...</b><span>Abra a área de missões para atualizar.</span></div>';
  return missions.slice(0,3).map(mission=>{
    const progress=Math.min(Number(mission.progress||0),Number(mission.goal||1));
    const pct=Math.round(progress/Math.max(1,mission.goal)*100);
    return `<div class="arcMissionMini"><div><b>${escapeHtml(mission.label)}</b><span>${progress}/${mission.goal}</span></div><i><em style="width:${pct}%"></em></i></div>`;
  }).join('');
}

function lobbyMarkup(){
  const p=profile(),s=strategy(),mode=activeMode(),rank=rankFor(Number(s.rankedPoints||0));
  const activeClassId=p.classId||'vanguard';
  const stats=p.stats||{},seasonXp=Number(s.seasonXp||0),seasonLevel=Number(s.seasonLevel||Math.max(1,1+Math.floor(seasonXp/180))),seasonPct=Math.round((seasonXp%180)/180*100);
  const friends=p.social?.friends?.length||0,collection=p.discovered?.length||0;
  const activeDeck=p.classDecks?.[activeClassId],deckCount=activeDeck?.cards?.length||30;
  const catalog=globalThis.__ARCANA?.cards||[],classPool=catalog.filter(card=>globalThis.ArcanaEvolution?.allowedForClass?.(card,activeClassId)).length;
  const accountState=identity?'online':'local';
  const adminFeature=isAdmin?`<button class="arcFeature" data-action="admin" style="--feature-tone:#ff728b"><span class="arcFeatureIcon">🛡️</span><b>Administração</b><small>${securityState?.adminReady?'MFA ativo · operações auditadas':'MFA necessário para operar'}</small><span class="arcFeatureBadge">ADM</span></button>`:'';
  return `<div class="arcLobby">
    <header class="arcLobbyTop">
      <div class="arcIdentity">
        <button class="arcIdentityButton" data-action="profile"><span class="arcIdentityAvatar">${escapeHtml(currentUserName().slice(0,1).toUpperCase())}</span><span class="arcIdentityText"><small>PERFIL ARCANO</small><strong>${escapeHtml(currentUserName())}</strong></span></button>
        <button class="arcCloudButton" data-action="account" data-state="${accountState}">${identity?'☁ ONLINE':'☁ SAVE LOCAL'}</button>
      </div>
      <div class="arcLobbyBrand"><b>ARCANA<em>CLASH</em></b><small>LOBBY ARCANO</small></div>
      <div class="arcTopActions"><button class="arcIconButton" data-action="news" aria-label="Novidades">◈</button><button class="arcIconButton" data-action="settings" aria-label="Configurações">⚙</button></div>
    </header>
    <div class="arcLobbyGrid">
      <main class="arcLobbyMain">
        <section class="arcLobbyCard arcPlayCard" style="--mode-tone:${MODE_COLORS[mode.tone]||MODE_COLORS.cyan}">
          <p class="arcPlayEyebrow">${escapeHtml(mode.subtitle||'MODO SELECIONADO')} · ${escapeHtml(mode.players||'')}</p>
          <h1>${mode.icon||'✦'} ${escapeHtml(mode.name||'Jornada')}</h1>
          <p class="arcPlayDescription">${escapeHtml(mode.description||'Prepare seu Arcano e comece uma nova partida.')}</p>
          <div class="arcPlayMeta"><span>${CLASSES[activeClassId]?.icon||'✦'} ${escapeHtml(CLASSES[activeClassId]?.name||'Classe Arcana')}</span><span>${DOCTRINES[s.doctrine]?.icon||'⚖️'} ${escapeHtml(DOCTRINES[s.doctrine]?.name||'Equilíbrio')}</span><span>${mode.online?'CROSSPLAY ONLINE':`${deckCount}/30 · DECK DE CLASSE`}</span></div>
          <div class="arcPlayActions"><button class="arcPlayPrimary" data-action="play">JOGAR AGORA</button><button class="arcPlaySecondary" data-action="rules">COMO JOGAR</button></div>
        </section>
        ${renderWorldMap()}
        <section class="arcFeatureGrid">
          <button class="arcFeature" data-action="decks" style="--feature-tone:#63e7ff"><span class="arcFeatureIcon">▤</span><b>Forja de Deck</b><small>${deckCount}/30 no deck · ${classPool||32} opções da classe</small><span class="arcFeatureBadge">172</span></button>
          <button class="arcFeature" data-action="market" style="--feature-tone:#ffd36b"><span class="arcFeatureIcon">✦</span><b>Mercado Arcano</b><small>Use ${Number(s.coins||0)} Ouro e ${Number(s.essence||0)} Essências</small><span class="arcFeatureBadge">NOVO</span></button>
          <button class="arcFeature" data-action="missions" style="--feature-tone:#9f80ff"><span class="arcFeatureIcon">📜</span><b>Missões</b><small>Diárias e semanais</small></button>
          <button class="arcFeature" data-action="season" style="--feature-tone:#ffd36b"><span class="arcFeatureIcon">🏆</span><b>Temporada</b><small>Nível ${seasonLevel} · recompensas</small></button>
          <button class="arcFeature" data-action="friends" style="--feature-tone:#72e79f"><span class="arcFeatureIcon">♟</span><b>Amigos</b><small>${friends} ${friends===1?'amigo salvo':'amigos salvos'}</small></button>
          <button class="arcFeature" data-action="ranking" style="--feature-tone:#ff76bd"><span class="arcFeatureIcon">${rank[0]}</span><b>Ranking</b><small>${rank[1]} · ${Number(s.rankedPoints||0)} RP</small></button>
          <button class="arcFeature" data-action="account" style="--feature-tone:#75a7ff"><span class="arcFeatureIcon">☁</span><b>Conta Arcana</b><small>${identity?'Conectada e sincronizável':'Entre para usar cloud save'}</small></button>
          <button class="arcFeature" data-action="history" style="--feature-tone:#ffbd66"><span class="arcFeatureIcon">↺</span><b>Histórico de Updates</b><small>Da v0.7.0 à versão atual</small><span class="arcFeatureBadge">NOVO</span></button>
          <button class="arcFeature" data-action="settings" style="--feature-tone:#a8b7d4"><span class="arcFeatureIcon">⚙</span><b>Configurações</b><small>Som, visual e jogabilidade</small></button>
          ${adminFeature}
        </section>
      </main>
      <aside class="arcLobbySide">
        <section class="arcLobbyCard arcProfileCard">
          <div class="arcProfileSummary"><div class="arcProfileOrb">${rank[0]}</div><div><small>${escapeHtml(s.selectedTitle||'INICIADO')}</small><b>${escapeHtml(currentUserName())}</b><span>${rank[1]} · ${Number(s.rankedPoints||0)} RP</span></div></div>
          <div class="arcStats"><div class="arcStat"><b>${Number(stats.matches||s.matches||0)}</b><small>PARTIDAS</small></div><div class="arcStat"><b>${Number(stats.wins||s.wins||0)}</b><small>VITÓRIAS</small></div><div class="arcStat"><b>${Number(p.level||1)}</b><small>NÍVEL</small></div></div>
          <button class="arcSideLink" data-action="profile">ABRIR PERFIL COMPLETO</button>
        </section>
        <section class="arcLobbyCard arcProgressCard">
          <div class="arcProgressHead"><div><small>TEMPORADA ATUAL</small><b>Ascensão</b></div><span>NÍVEL ${seasonLevel}</span></div>
          <div class="arcProgressTrack"><i style="width:${seasonPct}%"></i></div>
          <div class="arcRewardPreview"><span><b>🪙 ${Number(s.coins||0)}</b>OURO</span><span><b>✦ ${Number(s.essence||0)}</b>ESSÊNCIA</span></div>
          <button class="arcSideLink" data-action="market">ABRIR MERCADO ARCANO</button>
        </section>
        <section class="arcLobbyCard arcMissionCard">
          <div class="arcProgressHead"><div><small>OBJETIVOS ATIVOS</small><b>Missões</b></div><span>${(s.missions?.items||[]).filter(x=>x.progress>=x.goal&&!x.claimed).length} prontas</span></div>
          <div class="arcMissionList">${missionPreview(s)}</div>
          <button class="arcSideLink" data-action="missions">ABRIR TODAS</button>
        </section>
      </aside>
    </div>
    <footer class="arcLobbyFooter"><span>ARCANACLASH WEB v${LOBBY_VERSION} · CLOUD SAVE OPCIONAL</span><nav><button data-action="rules">Regras</button><button data-action="news">Notas da versão</button><button data-action="history">Histórico</button><button data-action="settings">Acessibilidade</button></nav></footer>
  </div>`;
}

function installLobby(){
  const home=byId('home');
  if(!home||byId('arcLobbyRoot'))return;
  const legacy=document.createElement('div');legacy.id='arcLegacyBridge';legacy.className='arcLegacyBridge';
  while(home.firstChild)legacy.appendChild(home.firstChild);
  home.appendChild(legacy);
  const root=document.createElement('div');root.id='arcLobbyRoot';root.innerHTML=lobbyMarkup();home.appendChild(root);
  home.classList.add('arcLobbyHome');
  const version=byId('appVersion');if(version)version.textContent=LOBBY_VERSION;
  bindLobby();
}

function syncLobbyVisibility(){
  const home=byId('home');
  document.body.classList.toggle('arcLobbyActive',!!home&&!home.classList.contains('hidden'));
}

function forceCoreScreen(id){
  const screens=['home','modeSetup','roomScreen','joinScreen','heroScreen','chestScreen','updateScreen','rulesScreen','aboutScreen','gameover'];
  screens.forEach(screen=>byId(screen)?.classList.toggle('hidden',screen!==id));
}

function installNavigationFallbacks(){
  const routes={backModes:'home',closeRules:'home',closeAbout:'home',skipUpdate:'home',returnHome:'home',backJoin:'modeSetup',leaveRoom:'modeSetup'};
  Object.entries(routes).forEach(([buttonId,target])=>{
    const button=byId(buttonId);if(!button)return;
    const original=button.onclick;
    button.onclick=event=>{
      try{original?.call(button,event)}finally{forceCoreScreen(target)}
    };
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button');
    if(!button||!['backModes','closeRules','closeAbout','skipUpdate'].includes(button.id))return;
    event.preventDefault();event.stopImmediatePropagation();forceCoreScreen('home');
  },true);
  const panel=document.querySelector('#modeSetup .modeSetupPanel');
  if(panel&&!byId('arcReturnLobby')){
    const back=document.createElement('button');back.id='arcReturnLobby';back.className='arcReturnLobby';back.textContent='‹ LOBBY';back.onclick=()=>forceCoreScreen('home');panel.prepend(back);
  }
}

function bindLobby(){
  const root=byId('arcLobbyRoot');if(!root)return;
  root.querySelectorAll('[data-mode-choice]').forEach(button=>button.addEventListener('click',()=>{
    selectedMode=button.dataset.modeChoice;localStorage.setItem(MODE_KEY,selectedMode);refreshLobby(true);
  }));
  root.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>runAction(button.dataset.action)));
}

function runAction(action){
  if(action==='play')openMode();
  else if(action==='profile')coreProfileButton('profile');
  else if(action==='account')globalThis.ArcanaOnline?.open?.();
  else if(action==='missions')strategyTab('missions');
  else if(action==='season')strategyTab('season');
  else if(action==='ranking')strategyTab('profile');
  else if(action==='decks'){
    if(globalThis.ArcanaEvolution?.openDeckBuilder)globalThis.ArcanaEvolution.openDeckBuilder();
    else openModal('decks');
  }
  else if(action==='market')globalThis.ArcanaMarket?.open?.();
  else if(action==='friends')openModal('friends');
  else if(action==='settings')openModal('settings');
  else if(action==='admin')openModal('admin');
  else if(action==='rules')byId('openRules')?.click();
  else if(action==='news')showNews();
  else if(action==='history')renderUpdateHistory();
}

function refreshLobby(force=false){
  const root=byId('arcLobbyRoot');if(!root)return;
  const p=profile(),s=strategy();
  const signature=JSON.stringify([selectedMode,p.name,p.level,p.classId,p.discovered?.length,p.social?.friends?.length,p.stats?.matches,p.stats?.wins,s.doctrine,s.rankedPoints,s.seasonXp,s.seasonLevel,s.coins,s.essence,s.market?.owned?.length,s.market?.equipped,s.missions?.items?.map(x=>[x.id,x.progress,x.claimed]),identity?.id,isAdmin,securityState?.adminReady]);
  if(!force&&signature===lastRenderSignature)return;
  lastRenderSignature=signature;
  root.innerHTML=lobbyMarkup();bindLobby();
  const version=byId('appVersion');if(version)version.textContent=LOBBY_VERSION;
}

function modalShell(title,subtitle,content){
  let modal=byId('arcLobbyModal');
  if(!modal){modal=document.createElement('section');modal.id='arcLobbyModal';modal.className='arcLobbyModal hidden';document.body.appendChild(modal)}
  modal.innerHTML=`<div class="arcLobbyModalPanel" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header class="arcLobbyModalHead"><div><small>${escapeHtml(subtitle)}</small><h2>${escapeHtml(title)}</h2></div><button class="arcModalClose" aria-label="Fechar">×</button></header><div class="arcLobbyModalBody">${content}</div></div>`;
  modal.classList.remove('hidden');modal.querySelector('.arcModalClose').onclick=closeModal;modal.onclick=event=>{if(event.target===modal)closeModal()};
  modalType=title;
  return modal;
}

function closeModal(){byId('arcLobbyModal')?.classList.add('hidden');modalType=''}

function openModal(type){
  if(type==='friends')renderFriends();
  else if(type==='decks')renderDecks();
  else if(type==='settings')renderSettings();
  else if(type==='admin')renderAdmin();
}

function renderFriends(){
  const p=profile(),friends=p.social?.friends||[];
  const rows=friends.length?friends.map((friend,index)=>`<div class="arcFriendRow"><div class="arcFriendAvatar">${escapeHtml(friend.name.slice(0,1).toUpperCase())}</div><div class="arcFriendName"><b>${escapeHtml(friend.name)}</b><small>Salvo na sua Conta Arcana</small></div><div class="arcFriendActions"><button data-challenge="${index}">DESAFIAR</button><button class="danger" data-remove-friend="${index}">REMOVER</button></div></div>`).join(''):'<div class="arcEmpty"><b>Sua lista está vazia</b><span>Adicione um nome para organizar seus desafios.</span></div>';
  const modal=modalShell('Amigos','SOCIAL & DESAFIOS',`<p class="arcModalLead">A lista de amigos fica no seu perfil e acompanha o cloud save. Ao desafiar, o ArcanaClash cria uma sala PvP para você compartilhar o código.</p><div class="arcFriendForm"><input id="arcFriendInput" maxlength="24" placeholder="Nome do amigo"><button id="arcAddFriend" class="arcModalButton primary">ADICIONAR</button></div><div class="arcFriendList">${rows}</div>`);
  const add=()=>{const input=byId('arcFriendInput'),name=input?.value.trim();if(!name)return toast('Digite o nome do amigo.');const next=profile(),social={...(next.social||{})},list=[...(social.friends||[])];if(list.some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast('Esse amigo já está na lista.');list.push({name,addedAt:Date.now()});social.friends=list;next.social=social;saveProfile(next);renderFriends();toast('Amigo adicionado ao perfil.')};
  byId('arcAddFriend').onclick=add;byId('arcFriendInput').onkeydown=event=>{if(event.key==='Enter')add()};
  modal.querySelectorAll('[data-remove-friend]').forEach(button=>button.onclick=()=>{const next=profile(),list=[...(next.social?.friends||[])];list.splice(Number(button.dataset.removeFriend),1);next.social={...(next.social||{}),friends:list};saveProfile(next);renderFriends()});
  modal.querySelectorAll('[data-challenge]').forEach(button=>button.onclick=()=>{const friend=friends[Number(button.dataset.challenge)];closeModal();toast(`Criando sala para desafiar ${friend?.name||'seu amigo'}...`);openMode('duel',true)});
}

function normalizeLoadouts(p){
  const current={name:'Loadout atual',classId:p.classId||'vanguard',doctrine:strategy().doctrine||'balanced'};
  const saved=Array.isArray(p.loadouts)?p.loadouts.slice(0,3):[];
  while(saved.length<3)saved.push(null);
  return {current,saved};
}

function classOptions(selected){return Object.entries(CLASSES).map(([id,item])=>`<option value="${id}" ${id===selected?'selected':''}>${item.icon} ${item.name}</option>`).join('')}
function doctrineOptions(selected){return Object.entries(DOCTRINES).map(([id,item])=>`<option value="${id}" ${id===selected?'selected':''}>${item.icon} ${item.name}</option>`).join('')}

function renderDecks(){
  const p=profile(),{current,saved}=normalizeLoadouts(p);
  const catalog=globalThis.__ARCANA?.cards||[],legal=catalog.filter(card=>globalThis.ArcanaEvolution?.allowedForClass?.(card,current.classId)).length;
  const rows=saved.map((loadout,index)=>loadout?`<div class="arcLoadoutRow"><input class="arcLoadoutName" data-loadout-name="${index}" maxlength="24" value="${escapeHtml(loadout.name||`Loadout ${index+1}`)}"><div class="arcLoadoutInfo"><b>${CLASSES[loadout.classId]?.icon||'✦'} ${escapeHtml(CLASSES[loadout.classId]?.name||'Classe Arcana')}</b><small>${DOCTRINES[loadout.doctrine]?.icon||'⚖️'} Doutrina ${escapeHtml(DOCTRINES[loadout.doctrine]?.name||'Equilíbrio')}</small></div><div class="arcFriendActions"><button data-equip-loadout="${index}">EQUIPAR</button><button class="danger" data-delete-loadout="${index}">APAGAR</button></div></div>`:`<div class="arcLoadoutRow"><div class="arcLoadoutInfo"><b>Espaço ${index+1}</b><small>Nenhum loadout salvo.</small></div><span></span><div class="arcFriendActions"><button data-save-loadout="${index}">SALVAR ATUAL</button></div></div>`).join('');
  const modal=modalShell('Coleção & Decks','LOADOUTS QUE ALTERAM A PARTIDA',`<p class="arcModalLead">Cada loadout combina uma Classe Arcana com uma Doutrina. A classe define passiva e habilidade; a doutrina reorganiza a Reserva e aplica o bônus tático no começo da partida.</p><div class="arcLoadoutCurrent"><label>CLASSE<select id="arcCurrentClass">${classOptions(current.classId)}</select></label><label>DOUTRINA<select id="arcCurrentDoctrine">${doctrineOptions(current.doctrine)}</select></label><button id="arcApplyCurrent" class="arcModalButton primary">EQUIPAR</button></div><div class="arcLoadoutList">${rows}</div><div class="arcCollectionSummary"><div><b>${catalog.length} cartas no Arsenal · ${legal} válidas para esta classe</b><small>${Number(p.discovered?.length||0)} descobertas no Perfil Arcano. Cada classe possui 20 exclusivas e 12 Neutras.</small></div><button id="arcOpenCollection" class="arcModalButton">ABRIR COLEÇÃO</button></div>`);
  const equip=(classId,doctrine)=>{const next=profile();next.classId=classId;saveProfile(next);const state=strategy();state.doctrine=doctrine;saveStrategy(state);toast('Loadout equipado para a próxima partida.')};
  byId('arcApplyCurrent').onclick=()=>{equip(byId('arcCurrentClass').value,byId('arcCurrentDoctrine').value);renderDecks()};
  byId('arcOpenCollection').onclick=()=>{closeModal();coreProfileButton('collection')};
  modal.querySelectorAll('[data-save-loadout]').forEach(button=>button.onclick=()=>{const next=profile(),data=normalizeLoadouts(next).saved,index=Number(button.dataset.saveLoadout);data[index]={name:`Loadout ${index+1}`,classId:next.classId||'vanguard',doctrine:strategy().doctrine||'balanced'};next.loadouts=data;saveProfile(next);renderDecks()});
  modal.querySelectorAll('[data-equip-loadout]').forEach(button=>button.onclick=()=>{const item=saved[Number(button.dataset.equipLoadout)];if(item)equip(item.classId,item.doctrine);renderDecks()});
  modal.querySelectorAll('[data-delete-loadout]').forEach(button=>button.onclick=()=>{const next=profile(),data=normalizeLoadouts(next).saved;data[Number(button.dataset.deleteLoadout)]=null;next.loadouts=data;saveProfile(next);renderDecks()});
  modal.querySelectorAll('[data-loadout-name]').forEach(input=>input.onchange=()=>{const next=profile(),data=normalizeLoadouts(next).saved,index=Number(input.dataset.loadoutName);if(data[index])data[index].name=input.value.trim()||`Loadout ${index+1}`;next.loadouts=data;saveProfile(next)});
}

function renderSettings(){
  const value=settings();
  const toggle=(key,label,help)=>`<label class="arcSetting"><div><b>${label}</b><small>${help}</small></div><input type="checkbox" data-setting="${key}" ${value[key]?'checked':''}></label>`;
  const modal=modalShell('Configurações','INTERFACE, SOM & ACESSIBILIDADE',`<div class="arcSettingList"><label class="arcSetting"><div><b>Volume da interface</b><small>Feedback sonoro dos botões do lobby.</small></div><input type="range" min="0" max="100" value="${value.volume}" data-setting-range="volume"></label>${toggle('sound','Efeitos sonoros','Ativa o som de confirmação dos controles.')}${toggle('vibration','Vibração','Feedback tátil em aparelhos compatíveis.')}${toggle('confirmTurn','Confirmar fim do turno','Evita encerrar o turno por toque acidental.')}${toggle('compactCards','Cartas compactas','Mostra mais cartas na mão durante a batalha.')}${toggle('largeUi','Interface ampliada','Aumenta textos e áreas de interação.')}${toggle('highContrast','Alto contraste','Reforça bordas e legibilidade.')}${toggle('reducedMotion','Reduzir movimento','Remove transições e animações não essenciais.')}${toggle('performance','Modo desempenho','Simplifica brilhos, sombras e desfoques.')}</div><div class="arcSettingsActions"><button id="arcFullscreen" class="arcModalButton primary">TELA CHEIA</button><button id="arcResetSettings" class="arcModalButton">RESTAURAR PADRÕES</button></div>`);
  modal.querySelectorAll('[data-setting]').forEach(input=>input.onchange=()=>{const next=settings();next[input.dataset.setting]=input.checked;saveSettings(next)});
  modal.querySelectorAll('[data-setting-range]').forEach(input=>input.oninput=()=>{const next=settings();next[input.dataset.settingRange]=Number(input.value);saveSettings(next)});
  byId('arcFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('Tela cheia não está disponível neste navegador.')}};
  byId('arcResetSettings').onclick=()=>{saveSettings(DEFAULT_SETTINGS);renderSettings();toast('Configurações restauradas.')};
}

function renderAdmin(){
  if(!isAdmin)return toast('Esta conta não possui permissão administrativa.');
  if(!securityState?.adminReady){
    modalShell('Administração bloqueada','MFA OBRIGATÓRIO',`<div class="arcAdminLock"><span>🔐</span><h3>Confirme sua identidade para continuar</h3><p>O papel ADM foi localizado no banco, mas nenhuma operação administrativa será aceita sem um código do seu aplicativo autenticador. Isso protege todas as contas mesmo se uma sessão comum for roubada.</p><button id="arcAdminOpenMfa" class="arcModalButton primary">ABRIR CONTA ARCANA E VERIFICAR</button></div>`);
    byId('arcAdminOpenMfa').onclick=()=>{closeModal();globalThis.ArcanaOnline?.open?.()};
    return;
  }
  const trusted=securityState?.trusted||{};
  modalShell('Administração segura','BANCO PRIVADO · MFA · AUDITORIA',`<p class="arcModalLead">As alterações abaixo acontecem no servidor, exigem MFA e registram administrador, alvo, motivo e valores anteriores. O painel não altera mais dinheiro pelo navegador.</p><div class="arcAdminIdentity"><span>🛡️</span><div><small>CONTA ADMINISTRADORA VERIFICADA</small><b>${escapeHtml(identity?.email||'Conta Arcana')}</b><code>${escapeHtml(identity?.id||'ID indisponível')}</code></div><button id="arcAdminCopyId">COPIAR MEU ID</button></div><div class="arcAdminTrusted"><span><small>OURO CONFIÁVEL</small><b>${Number(trusted.coins||0)}</b></span><span><small>ESSÊNCIA CONFIÁVEL</small><b>${Number(trusted.essence||0)}</b></span><span><small>SESSÃO</small><b>${escapeHtml(String(securityState?.aal||'aal2').toUpperCase())}</b></span></div><div class="arcAdminForm"><label class="wide">ID DA CONTA ALVO<input id="arcAdminTarget" maxlength="36" spellcheck="false" value="${escapeHtml(identity?.id||'')}"></label><label>AJUSTE DE OURO<input id="arcAdminCoins" type="number" min="-100000" max="100000" step="1" value="0"></label><label>AJUSTE DE ESSÊNCIA<input id="arcAdminEssence" type="number" min="-100000" max="100000" step="1" value="0"></label><label class="wide">MOTIVO OBRIGATÓRIO<input id="arcAdminReason" maxlength="200" placeholder="Ex.: correção de recompensa não recebida"></label><button id="arcAdminGrant" class="arcModalButton primary wide">APLICAR NO SERVIDOR</button><p id="arcAdminStatus" class="arcAdminStatus wide">Limite por operação: ±100.000. Valores nunca ficam negativos.</p></div><section class="arcAdminAudit"><header><div><small>REGISTRO IMUTÁVEL PARA JOGADORES</small><h3>Últimas operações</h3></div><button id="arcAdminReloadAudit" class="arcModalButton">ATUALIZAR</button></header><div id="arcAdminAuditRows"><p class="arcAdminStatus">Carregando auditoria...</p></div></section>`);
  byId('arcAdminCopyId').onclick=async()=>{try{await navigator.clipboard.writeText(identity?.id||'');toast('ID da Conta Arcana copiado.')}catch{toast('Não foi possível copiar o ID.')}};
  const errorText=code=>({mfa_required:'O MFA desta sessão expirou. Verifique novamente na Conta Arcana.',forbidden:'O servidor recusou a permissão ADM.',invalid_request:'Confira o ID, os valores e informe um motivo com pelo menos 8 caracteres.',user_not_found:'Nenhuma conta foi encontrada com esse ID.'}[code]||'A operação foi recusada pelo servidor.');
  const loadAudit=async()=>{
    const rows=byId('arcAdminAuditRows');if(!rows)return;
    rows.innerHTML='<p class="arcAdminStatus">Carregando auditoria...</p>';
    try{
      const entries=await globalThis.ArcanaOnline.adminAudit(25);
      rows.innerHTML=entries.length?entries.map(entry=>`<article class="arcAuditRow"><div><b>${escapeHtml(entry.action||'operação')}</b><time>${escapeHtml(new Date(entry.createdAt).toLocaleString('pt-BR'))}</time></div><code>${escapeHtml(entry.targetUserId||'alvo removido')}</code><p>${escapeHtml(entry.reason||'Sem motivo')}</p><small>Ouro: ${Number(entry.before?.coins||0)} → ${Number(entry.after?.coins||0)} · Essência: ${Number(entry.before?.essence||0)} → ${Number(entry.after?.essence||0)}</small></article>`).join(''):'<p class="arcAdminStatus">Nenhuma operação administrativa registrada.</p>';
    }catch(error){rows.innerHTML=`<p class="arcAdminStatus error">${escapeHtml(errorText(error.code))}</p>`}
  };
  byId('arcAdminReloadAudit').onclick=loadAudit;
  byId('arcAdminGrant').onclick=async()=>{
    const button=byId('arcAdminGrant'),message=byId('arcAdminStatus');
    const targetUserId=byId('arcAdminTarget').value.trim(),coinsDelta=Math.trunc(Number(byId('arcAdminCoins').value)||0),essenceDelta=Math.trunc(Number(byId('arcAdminEssence').value)||0),reason=byId('arcAdminReason').value.trim();
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)||Math.abs(coinsDelta)>100000||Math.abs(essenceDelta)>100000||(!coinsDelta&&!essenceDelta)||reason.length<8){message.className='arcAdminStatus wide error';message.textContent=errorText('invalid_request');return}
    button.disabled=true;message.className='arcAdminStatus wide';message.textContent='Aplicando e registrando auditoria...';
    try{
      const result=await globalThis.ArcanaOnline.adminAdjust({targetUserId,coinsDelta,essenceDelta,reason});
      securityState=await globalThis.ArcanaOnline.context();
      message.className='arcAdminStatus wide ok';message.textContent=`Operação concluída. Saldo confiável: ${Number(result.trusted?.coins||0)} Ouro e ${Number(result.trusted?.essence||0)} Essências.`;
      byId('arcAdminCoins').value='0';byId('arcAdminEssence').value='0';byId('arcAdminReason').value='';
      await loadAudit();
    }catch(error){message.className='arcAdminStatus wide error';message.textContent=errorText(error.code)}finally{button.disabled=false}
  };
  loadAudit();
}

function showNews(){
  byId('openAbout')?.click();
  requestAnimationFrame(()=>{
    const eyebrow=document.querySelector('#aboutScreen .eyebrow'),title=document.querySelector('#aboutScreen h2'),rules=document.querySelector('#aboutScreen .rules');
    if(eyebrow)eyebrow.textContent=`ARCANACLASH ${LOBBY_VERSION} WEB`;
    if(title)title.textContent='Combate Renascido';
    if(rules)rules.innerHTML='<p><b>🏰 Campos próprios:</b> os nove destinos agora possuem arenas realmente diferentes durante a partida.</p><p><b>🛤️ Rotas vivas:</b> as três caixas iguais foram substituídas por caminhos com nomes, terreno e marcos únicos.</p><p><b>🌫️ Mais atmosfera:</b> profundidade, névoa, iluminação e paisagens integram as criaturas ao cenário.</p><p><b>🎯 Leitura melhor:</b> posições vazias, rotas disponíveis e alvos válidos ficam claros sem confirmações extras.</p><p><b>✨ Presença no campo:</b> criaturas recebem entrada, impacto, sombra e resposta visual.</p><p><b>📱 PC e celular:</b> o campo adapta detalhes e espaçamento para preservar desempenho e legibilidade.</p>';
  });
}

function renderUpdateHistory(){
  const entries=UPDATE_HISTORY.map((release,index)=>`<article class="arcUpdateEntry ${index===0?'current':''}" style="--update-tone:${release.tone}"><div class="arcUpdateRail"><i></i></div><div class="arcUpdateCard"><header><div><small>${escapeHtml(release.date)}</small><h3>v${escapeHtml(release.version)} · ${escapeHtml(release.title)}</h3></div><span>${escapeHtml(release.tag)}</span></header><ul>${release.notes.map(note=>`<li>${escapeHtml(note)}</li>`).join('')}</ul></div></article>`).join('');
  modalShell('Histórico de Updates','A JORNADA ATÉ A VERSÃO 1.0',`<p class="arcModalLead">Aqui ficam registradas as mudanças reais de cada versão pública. As próximas atualizações 0.9.x serão adicionadas nesta linha do tempo até o grande lançamento 1.0.</p><div class="arcUpdateTimeline">${entries}</div><div class="arcUpdateFuture"><span>PRÓXIMO MARCO</span><b>0.9.5 · Doutrinas de Classe</b><small>Identidade, limitações de deck e domínio próprio para cada classe.</small></div>`);
}

function applySettings(value=settings()){
  const classes={arcReducedMotion:value.reducedMotion,arcPerformance:value.performance,arcLargeUi:value.largeUi,arcHighContrast:value.highContrast,arcCompactCards:value.compactCards};
  Object.entries(classes).forEach(([name,on])=>document.body.classList.toggle(name,!!on));
}

function clickFeedback(event){
  if(!event.target.closest('button'))return;
  const value=settings();
  if(value.vibration)try{navigator.vibrate?.(12)}catch{}
  if(!value.sound||value.volume<=0)return;
  try{
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    clickFeedback.ctx=clickFeedback.ctx||new Context();
    const oscillator=clickFeedback.ctx.createOscillator(),gain=clickFeedback.ctx.createGain(),now=clickFeedback.ctx.currentTime;
    oscillator.type='sine';oscillator.frequency.setValueAtTime(410,now);oscillator.frequency.exponentialRampToValueAtTime(620,now+.045);gain.gain.setValueAtTime(Math.max(.001,value.volume/1000),now);gain.gain.exponentialRampToValueAtTime(.001,now+.055);oscillator.connect(gain).connect(clickFeedback.ctx.destination);oscillator.start(now);oscillator.stop(now+.06);
  }catch{}
}

function installConfirmTurn(){
  byId('endTurn')?.addEventListener('click',event=>{
    if(!settings().confirmTurn)return;
    if(!window.confirm('Encerrar seu turno agora?')){event.preventDefault();event.stopImmediatePropagation()}
  },true);
}

async function refreshIdentity(){
  const previousId=identity?.id||null,previousAdmin=isAdmin,previousReady=securityState?.adminReady;
  try{
    identity=await globalThis.ArcanaOnline?.user?.()||null;
    securityState=identity?await globalThis.ArcanaOnline?.context?.()||null:null;
    isAdmin=securityState?.role==='admin';
  }catch{identity=null;securityState=null;isAdmin=false}
  if(previousId!==(identity?.id||null)||previousAdmin!==isAdmin||previousReady!==securityState?.adminReady)refreshLobby(true);
}

function install(){
  applySettings();
  installLobby();
  installNavigationFallbacks();
  syncLobbyVisibility();
  const home=byId('home');
  if(home)new MutationObserver(syncLobbyVisibility).observe(home,{attributes:true,attributeFilter:['class']});
  installConfirmTurn();
  document.addEventListener('click',clickFeedback,{passive:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modalType)closeModal()});
  window.addEventListener('arcana:profile',()=>refreshLobby(true));
  window.addEventListener('arcana:economy',()=>refreshLobby(true));
  window.addEventListener('arcana:identity',refreshIdentity);
  window.addEventListener('arcana:security',refreshIdentity);
  window.addEventListener('arcana:match',()=>refreshLobby(true));
  window.addEventListener('storage',()=>refreshLobby(true));
  setTimeout(refreshIdentity,250);
  setInterval(()=>{refreshLobby();const cloud=byId('arcCloudMini')?.textContent||'';if(!identity||/LOCAL/.test(cloud))refreshIdentity()},2200);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();

globalThis.ArcanaLobby={version:LOBBY_VERSION,refresh:()=>refreshLobby(true),openSettings:()=>openModal('settings'),openFriends:()=>openModal('friends')};
