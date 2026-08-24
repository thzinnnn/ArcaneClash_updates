const LOBBY_VERSION='1.0.1';
const PROFILE_KEY='arcana_profile_v2';
const STRATEGY_KEY='arcana_strategy_pack_v1';
const SETTINGS_KEY='arcana_lobby_settings_v1';
const MODE_KEY='arcana_lobby_mode_v1';

const MODE_COLORS={cyan:'#63e7ff',gold:'#ffd36b',blue:'#7fa8ff',red:'#ff738d',magenta:'#ff75c5',violet:'#a783ff',green:'#78e69b',amber:'#ffc465'};
const MAP_DESTINATIONS={
  solo:{region:'BastiÃ£o Celeste',lore:'A estrada dos iniciados atravessa ruÃ­nas que mudam a cada jornada.',x:12,y:63,mx:24,my:8},
  duel:{region:'Arena do Sol',lore:'Duas vontades entram. Apenas uma deixa sua marca na areia dourada.',x:27,y:27,mx:74,my:18},
  duo:{region:'Pontes GÃªmeas',lore:'Rotas entrelaÃ§adas onde parceria e posicionamento decidem o confronto.',x:43,y:60,mx:24,my:31},
  raidcoop:{region:'Covil do Arquiteto',lore:'Uma fortaleza viva no limite do Vazio aguarda seu grupo.',x:58,y:20,mx:74,my:41},
  blitz:{region:'Fenda Rubra',lore:'Mana instÃ¡vel acelera cada decisÃ£o e nÃ£o perdoa hesitaÃ§Ã£o.',x:74,y:50,mx:24,my:54},
  chaos:{region:'Ilhas ImpossÃ­veis',lore:'As regras se partem e o campo nunca permanece o mesmo.',x:88,y:18,mx:74,my:64},
  survival:{region:'Bosque dos Ecos',lore:'Ondas de inimigos guardam trilhas cada vez mais profundas.',x:24,y:83,mx:24,my:77},
  raid:{region:'Abismo Coroado',lore:'Enfrente sozinho a criatura que governa as rotas perdidas.',x:62,y:80,mx:74,my:87},
  draft:{region:'Mercado Flutuante',lore:'Construa seu arsenal enquanto viaja por escolhas inesperadas.',x:88,y:77,mx:50,my:96}
};
const CLASSES={
  vanguard:{icon:'ğŸ›¡ï¸',name:'Guerreiro Arcano'},
  pyromancer:{icon:'ğŸ”¥',name:'Piromante'},
  necromancer:{icon:'ğŸ’€',name:'Necromante'},
  druid:{icon:'ğŸŒ¿',name:'Druida'},
  cryomancer:{icon:'â„ï¸',name:'Criomante'},
  assassin:{icon:'ğŸ—¡ï¸',name:'Assassino'},
  summoner:{icon:'ğŸŒ€',name:'Invocador'},
  chronomancer:{icon:'â³',name:'Cronomante'}
};
const DOCTRINES={
  balanced:{icon:'âš–ï¸',name:'EquilÃ­brio'},
  aggro:{icon:'ğŸ”¥',name:'PressÃ£o'},
  control:{icon:'ğŸ›¡ï¸',name:'Controle'},
  tempo:{icon:'âš¡',name:'Tempo'}
};
const DEFAULT_SETTINGS={sound:true,volume:32,vibration:true,reducedMotion:false,performance:false,largeUi:false,highContrast:false,compactCards:false,confirmTurn:false};
const UPDATE_HISTORY=[
  {version:'1.0.1',date:'24 AGO 2026',title:'MÃ£o NavegÃ¡vel',tag:'CORREÃ‡ÃƒO',tone:'#78e69b',notes:['Desfazer, AÃ§Ãµes e Reserva ganharam uma faixa prÃ³pria e nÃ£o cobrem mais nomes, habilidades ou atributos das cartas.','A mÃ£o agora ocupa toda a largura disponÃ­vel e mantÃ©m qualquer quantidade de cartas dentro de uma Ã¡rea navegÃ¡vel.','Setas Anterior e PrÃ³xima percorrem a mÃ£o em blocos, com contador das cartas atualmente visÃ­veis.','Rolagem pelo mouse, touchpad e gesto horizontal no celular permitem alcanÃ§ar e jogar todas as cartas.','A barra de rolagem recebeu sinalizaÃ§Ã£o discreta e os controles continuam legÃ­veis em telas pequenas e no modo paisagem.']},
  {version:'1.0.0',date:'24 AGO 2026',title:'ConvergÃªncia',tag:'MARCO',tone:'#63e7ff',notes:['As atualizaÃ§Ãµes planejadas desde o Mapa da AscensÃ£o foram consolidadas em um Ãºnico lanÃ§amento real.','ColeÃ§Ã£o por cÃ³pias, crafting, desmontagem, favoritos e Forja de Deck agora formam o mesmo sistema.','Ãrvore de Maestria para as oito classes, eventos rotativos, conquistas avanÃ§adas e recompensas de partida.','Reserva conhecida, objetivos de rota, vitÃ³ria por DomÃ­nio, desfazer antes de encerrar, confirmaÃ§Ãµes perigosas e histÃ³rico de aÃ§Ãµes.','HistÃ³rico de partidas e replays locais turno a turno, sem revelar a mÃ£o privada para espectadores.','Painel ADM com presenÃ§a online, IDs, espectador seguro, banimentos, economia e auditoria protegidos por MFA.','MigraÃ§Ã£o automÃ¡tica preserva Conta Arcana, cloud save, decks, progresso, cosmÃ©ticos e configuraÃ§Ãµes antigas.']},
  {version:'0.9.4',date:'22 AGO 2026',title:'Combate Renascido',tag:'MARCO',tone:'#8fd8ff',notes:['As trÃªs rotas deixaram de ser painÃ©is iguais e agora formam campos de batalha integrados ao cenÃ¡rio.','Cada um dos nove destinos possui atmosfera, terreno, iluminaÃ§Ã£o, marcos e nomes de rota prÃ³prios.','PosiÃ§Ãµes vazias, rotas disponÃ­veis e alvos vÃ¡lidos receberam sinalizaÃ§Ã£o mais clara.','Criaturas ganharam entrada, impacto, profundidade e presenÃ§a visual no terreno.','Os campos foram reconstruÃ­dos para manter leitura e desempenho no PC e no celular.','A partida agora possui botÃ£o Sair com confirmaÃ§Ã£o; desistir conta como derrota e devolve o jogador ao lobby.']},
  {version:'0.9.3',date:'22 AGO 2026',title:'Mapa da AscensÃ£o',tag:'MAPA',tone:'#76e4d4',notes:['O lobby ganhou um mapa navegÃ¡vel com nove destinos ligados aos modos de jogo.','Cada regiÃ£o possui atmosfera, histÃ³ria curta, cor e posiÃ§Ã£o prÃ³prias.','A paleta visual recebeu azul oceÃ¢nico, violeta, dourado, verde e coral sem perder a legibilidade.','CartÃµes, perfil, temporada e missÃµes agora usam materiais e iluminaÃ§Ã£o distintos.','O mapa se reorganiza como uma jornada vertical no celular.']},
  {version:'0.9.2',date:'22 AGO 2026',title:'Identidades Reforjadas',tag:'CARTAS',tone:'#63e7ff',notes:['As habilidades das 172 cartas foram refeitas sem quebrar nomes ou decks salvos.','Cada classe agora possui um vocabulÃ¡rio mecÃ¢nico prÃ³prio: formaÃ§Ã£o, combustÃ£o, sacrifÃ­cio, crescimento, congelamento, execuÃ§Ã£o, convergÃªncia ou tempo.','Mercado Arcano dÃ¡ utilidade real a Ouro e EssÃªncia com temas, molduras e sigilos permanentes.','CosmÃ©ticos nÃ£o aumentam dano, vida ou mana; a disputa continua justa.','A base segura do painel ADM ganhou economia confiÃ¡vel, MFA e auditoria no servidor.']},
  {version:'0.9.1',date:'22 AGO 2026',title:'ExpansÃ£o do Arsenal',tag:'ARSENAL',tone:'#ffbd66',notes:['98 cartas novas elevaram o catÃ¡logo de 74 para 172.','Cada classe agora possui 20 exclusivas e compartilha 12 Neutras: 32 opÃ§Ãµes legais por classe.','Uma carta secreta ultrarrara foi escondida em cada uma das 8 classes.','Cartas secretas nÃ£o aparecem no catÃ¡logo, na busca, na Forja nem em decks iniciais.','Raridade agora aparece com moldura, cor, sÃ­mbolo e nome em cada carta.','SinalizaÃ§Ã£o integrada Ã  Forja, mÃ£o, mulligan, BaÃºs, campo, Inspector e modos online.','Novas cartas funcionam em decks, BaÃºs, EspÃ³lios, RelÃ­quias e modos online.']},
  {version:'0.9.0',date:'22 AGO 2026',title:'AscensÃ£o das Classes',tag:'CLASSES',tone:'#63e7ff',notes:['Classes passaram a controlar decks, BaÃºs, EspÃ³lios e RelÃ­quias.','Forja de Deck com 30 cartas, limite de 3 cÃ³pias e cloud save.','Mulligan, mÃ£o inicial rebalanceada e identidade de classe online.','Micro-updates: HistÃ³rico de Updates e guia interativo da Forja adicionados ao lobby.']},
  {version:'0.8.0',date:'22 AGO 2026',title:'Lobby Arcano',tag:'LOBBY',tone:'#9f80ff',notes:['A antiga home foi substituÃ­da por um lobby completo.','Modos, perfil, amigos, missÃµes, temporada, ranking e configuraÃ§Ãµes foram integrados.','Conta Arcana, cloud save e acesso ADM foram preservados.']},
  {version:'0.7.2',date:'21 AGO 2026',title:'Strategy + Conta Arcana',tag:'ONLINE',tone:'#72e79f',notes:['Login, cadastro, sincronizaÃ§Ã£o e resoluÃ§Ã£o de conflitos de save.','Doutrinas, missÃµes, temporada, recompensas, ranking e tÃ­tulos.','Primeira versÃ£o Web pÃºblica com sistemas persistentes.']},
  {version:'0.7.0',date:'20 AGO 2026',title:'AscensÃ£o dos Arcanos',tag:'FUNDAÃ‡ÃƒO',tone:'#ffd36b',notes:['Oito Classes Arcanas, perfil, coleÃ§Ã£o e conquistas.','EspÃ³lio por eliminaÃ§Ãµes, RelÃ­quias e proteÃ§Ã£o contra azar nos BaÃºs.','Jornada, dificuldades, chefe em fases e Inspector de cartas.']}
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
  const ranks=[['ğŸ¥‰','Bronze',0],['ğŸ¥ˆ','Prata',300],['ğŸ¥‡','Ouro',700],['ğŸ’ ','Platina',1200],['ğŸ”®','Arcano',1800],['ğŸ‘‘','Lenda',2600]];
  return ranks.reduce((current,item)=>points>=item[2]?item:current,ranks[0]);
}

function modeApi(){return globalThis.__ARCANA?.modes||{}}
function activeMode(){const modes=modeApi();return modes[selectedMode]||modes.solo||Object.values(modes)[0]||{id:'solo',name:'Jornada',icon:'âœ¦',subtitle:'Solo PvE',players:'1 jogador',tone:'cyan',description:'Prepare seu Arcano e comece uma nova partida.'}}

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
  return modes.map(mode=>`<button class="arcModeChoice ${mode.id===selectedMode?'active':''}" data-mode-choice="${escapeHtml(mode.id)}" style="--choice-tone:${MODE_COLORS[mode.tone]||MODE_COLORS.cyan}"><span class="arcModeIcon">${mode.icon||'âœ¦'}</span><b>${escapeHtml(mode.name)}</b><small>${escapeHtml(mode.subtitle||mode.players||'')}</small></button>`).join('');
}

function renderWorldMap(){
  const modes=Object.values(modeApi()),active=activeMode(),destination=MAP_DESTINATIONS[active.id]||MAP_DESTINATIONS.solo;
  const nodes=modes.map(mode=>{
    const point=MAP_DESTINATIONS[mode.id]||{region:mode.name,lore:mode.description,x:50,y:50,mx:50,my:50};
    return `<button class="arcMapNode ${mode.id===selectedMode?'active':''}" data-mode-choice="${escapeHtml(mode.id)}" aria-label="${escapeHtml(`${mode.name} Â· ${point.region}`)}" style="--map-x:${point.x}%;--map-y:${point.y}%;--map-mobile-x:${point.mx}%;--map-mobile-y:${point.my}%;--node-tone:${MODE_COLORS[mode.tone]||MODE_COLORS.cyan}"><i>${mode.icon||'âœ¦'}</i><span><b>${escapeHtml(mode.name)}</b><small>${escapeHtml(point.region)}</small></span></button>`;
  }).join('');
  return `<section class="arcLobbyCard arcWorldMapCard" style="--map-active-tone:${MODE_COLORS[active.tone]||MODE_COLORS.cyan}">
    <header class="arcMapHead"><div><small>EXPLORE O REINO</small><h2>Mapa da AscensÃ£o</h2><p>Escolha um destino para preparar sua prÃ³xima batalha.</p></div><span>${modes.length} DESTINOS</span></header>
    <div class="arcWorldMapCanvas">
      <div class="arcMapSea"></div><div class="arcMapLand arcMapLandWest"></div><div class="arcMapLand arcMapLandNorth"></div><div class="arcMapLand arcMapLandEast"></div><div class="arcMapLand arcMapLandSouth"></div>
      <svg class="arcMapRoutes" viewBox="0 0 1000 470" preserveAspectRatio="none" aria-hidden="true"><path d="M120 296 C170 230 215 166 270 127 S370 228 430 282 S520 142 580 94 S680 188 740 235 S830 128 880 85"/><path d="M120 296 C170 350 190 390 240 390 S350 330 430 282 S525 365 620 376 S790 350 880 362"/><path d="M740 235 C800 280 830 320 880 362"/></svg>
      <div class="arcMapCompass"><i>âœ¦</i><span>N</span></div><div class="arcMapMist mistOne"></div><div class="arcMapMist mistTwo"></div>${nodes}
    </div>
    <footer class="arcMapSelected"><div class="arcMapSelectedIcon">${active.icon||'âœ¦'}</div><div><small>DESTINO SELECIONADO Â· ${escapeHtml(active.players||'')}</small><b>${escapeHtml(destination.region)}</b><p>${escapeHtml(destination.lore)}</p></div><button data-action="play">VIAJAR E JOGAR</button></footer>
  </section>`;
}

function missionPreview(state){
  const missions=state?.missions?.items||[];
  if(!missions.length)return '<div class="arcEmpty"><b>MissÃµes preparando...</b><span>Abra a Ã¡rea de missÃµes para atualizar.</span></div>';
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
  const accountState=identityçİµ¶‰ËkºwµçUÑÑ½¸ˆù	I%H=1<ğ½‰ÕÑÑ½¸øğ½‘¥Øù€¤ì(€½¹ÍĞ•ÅÕ¥Àô¡±…ÍÍ%±‘½ÑÉ¥¹”¤ôùí½¹ÍĞ¹•áĞõÁÉ½™¥±” ¤í¹•áĞ¹±…ÍÍ%õ±…ÍÍ%íÍ…Ù•AÉ½™¥±”¡¹•áĞ¤í½¹ÍĞÍÑ…Ñ”õÍÑÉ…Ñ•ä ¤íÍÑ…Ñ”¹‘½ÑÉ¥¹”õ‘½ÑÉ¥¹”íÍ…Ù•MÑÉ…Ñ•ä¡ÍÑ…Ñ”¤íÑ½…ÍĞ 1½…‘½ÕĞ•ÅÕ¥Á…‘¼Á…É„„ÁËÍá¥µ„Á…ÉÑ¥‘„¸œ¥ôì(€‰å% …ÉÁÁ±åÕÉÉ•¹Ğœ¤¹½¹±¥¬ô ¤ôùí•ÅÕ¥À¡‰å% …ÉÕÉÉ•¹Ñ±…ÍÌœ¤¹Ù…±Õ”±‰å% …ÉÕÉÉ•¹Ñ½ÑÉ¥¹”œ¤¹Ù…±Õ”¤íÉ•¹‘•É•­Ì ¥ôì(€‰å% …É=Á•¹½±±•Ñ¥½¸œ¤¹½¹±¥¬ô ¤ôùí±½Í•5½‘…° ¤í½É•AÉ½™¥±•	ÕÑÑ½¸ ½±±•Ñ¥½¸œ¥ôì(€µ½‘…°¹ÅÕ•ÉåM•±•Ñ½É±° m‘…Ñ„µÍ…Ù”µ±½…‘½ÕÑtœ¤¹™½É… ¡‰ÕÑÑ½¸ôù‰ÕÑÑ½¸¹½¹±¥¬ô ¤ôùí½¹ÍĞ¹•áĞõÁÉ½™¥±” ¤±‘…Ñ„õ¹½Éµ…±¥é•1½…‘½ÕÑÌ¡¹•áĞ¤¹Í…Ù•±¥¹‘•àõ9Õµ‰•È¡‰ÕÑÑ½¸¹‘…Ñ…Í•Ğ¹Í…Ù•1½…‘½ÕĞ¤í‘…Ñ…m¥¹‘•átõí¹…µ”é1½…‘½ÕĞ€‘í¥¹‘•à¬Åõ€±±…ÍÍ%é¹•áĞ¹±…ÍÍ%‘ñğÙ…¹Õ…Éœ±‘½ÑÉ¥¹”éÍÑÉ…Ñ•ä ¤¹‘½ÑÉ¥¹•ñğ‰…±…¹•ôí¹•áĞ¹±½…‘½ÕÑÌõ‘…Ñ„íÍ…Ù•AÉ½™¥±”¡¹•áĞ¤íÉ•¹‘•É•­Ì ¥ô¤ì(€µ½‘…°¹ÅÕ•ÉåM•±•Ñ½É±° m‘…Ñ„µ•ÅÕ¥Àµ±½…‘½ÕÑtœ¤¹™½É… ¡‰ÕÑÑ½¸ôù‰ÕÑÑ½¸¹½¹±¥¬ô ¤ôùí½¹ÍĞ¥Ñ•´õÍ…Ù•‘m9Õµ‰•È¡‰ÕÑÑ½¸¹‘…Ñ…Í•Ğ¹•ÅÕ¥Á1½…‘½ÕĞ¥tí¥˜¡¥Ñ•´¥•ÅÕ¥À¡¥Ñ•´¹±…ÍÍ%±¥Ñ•´¹‘½ÑÉ¥¹”¤íÉ•¹‘•É•­Ì ¥ô¤ì(€µ½‘…°¹ÅÕ•ÉåM•±•Ñ½É±° m‘…Ñ„µ‘•±•Ñ”µ±½…‘½ÕÑtœ¤¹™½É… ¡‰ÕÑÑ½¸ôù‰ÕÑÑ½¸¹½¹±¥¬ô ¤ôùí½¹ÍĞ¹•áĞõÁÉ½™¥±” ¤±‘…Ñ„õ¹½Éµ…±¥é•1½…‘½ÕÑÌ¡¹•áĞ¤¹Í…Ù•í‘…Ñ…m9Õµ‰•È¡‰ÕÑÑ½¸¹‘…Ñ…Í•Ğ¹‘•±•Ñ•1½…‘½ÕĞ¥tõ¹Õ±°í¹•áĞ¹±½…‘½ÕÑÌõ‘…Ñ„íÍ…Ù•AÉ½™¥±”¡¹•áĞ¤íÉ•¹‘•É•­Ì ¥ô¤ì(€µ½‘…°¹ÅÕ•ÉåM•±•Ñ½É±° m‘…Ñ„µ±½…‘½ÕĞµ¹…µ•tœ¤¹™½É… ¡¥¹ÁÕĞôù¥¹ÁÕĞ¹½¹¡…¹”ô ¤ôùí½¹ÍĞ¹•áĞõÁÉ½™¥±” ¤±‘…Ñ„õ¹½Éµ…±¥é•1½…‘½ÕÑÌ¡¹•áĞ¤¹Í…Ù•±¥¹‘•àõ9Õµ‰•È¡¥¹ÁÕĞ¹‘…Ñ…Í•Ğ¹±½…‘½ÕÑ9…µ”¤í¥˜¡‘…Ñ…m¥¹‘•át¥‘…Ñ…m¥¹‘•át¹¹…µ”õ¥¹ÁÕĞ¹Ù…±Õ”¹ÑÉ¥´ ¥ññ1½…‘½ÕĞ€‘í¥¹‘•à¬Åõ€í¹•áĞ¹±½…‘½ÕÑÌõ‘…Ñ„íÍ…Ù•AÉ½™¥±”¡¹•áĞ¥ô¤ì)ô()™Õ¹Ñ¥½¸É•¹‘•ÉM•ÑÑ¥¹Ì ¥ì(€½¹ÍĞÙ…±Õ”õÍ•ÑÑ¥¹Ì ¤ì(€½¹ÍĞÑ½±”ô¡­•ä±±…‰•°±¡•±À¤ôù€ñ±…‰•°±…ÍÌô‰…ÉM•ÑÑ¥¹œˆøñ‘¥Øøñˆø‘í±…‰•±ôğ½ˆøñÍµ…±°ø‘í¡•±Áôğ½Íµ…±°øğ½‘¥Øøñ¥¹ÁÕĞÑåÁ”ô‰¡•­‰½àˆ‘…Ñ„µÍ•ÑÑ¥¹œôˆ‘í­•åôˆ€‘íÙ…±Õ•m­•åtü¡•­•œèœôøğ½±…‰•°ù€ì(€½¹ÍĞµ½‘…°õµ½‘…±M¡•±° ½¹™¥ÕÉ‡ŸÕ•Ìœ°%9QI°M=4€˜MM%	%1%œ±€ñ‘¥Ø±…ÍÌô‰…ÉM•ÑÑ¥¹1¥ÍĞˆøñ±…‰•°±…ÍÌô‰…ÉM•ÑÑ¥¹œˆøñ‘¥ØøñˆùY½±Õµ”‘„¥¹Ñ•É™…”ğ½ˆøñÍµ…±°ù••‘‰…¬Í½¹½É¼‘½Ì‰½ÓÕ•Ì‘¼±½‰‰ä¸ğ½Íµ…±°øğ½‘¥Øøñ¥¹ÁÕĞÑåÁ”ô‰É…¹”ˆµ¥¸ôˆÀˆµ…àôˆÄÀÀˆÙ…±Õ”ôˆ‘íÙ…±Õ”¹Ù½±Õµ•ôˆ‘…Ñ„µÍ•ÑÑ¥¹œµÉ…¹”ô‰Ù½±Õµ”ˆøğ½±…‰•°ø‘íÑ½±” Í½Õ¹œ°™•¥Ñ½ÌÍ½¹½É½Ìœ°Ñ¥Ù„¼Í½´‘”½¹™¥Éµ‡Ÿ¼‘½Ì½¹ÑÉ½±•Ì¸œ¥ô‘íÑ½±” Ù¥‰É…Ñ¥½¸œ°Y¥‰É‡Ÿ¼œ°••‘‰…¬Ó…Ñ¥°•´…Á…É•±¡½Ì½µÁ…ÓµÙ•¥Ì¸œ¥ô‘íÑ½±” ½¹™¥ÉµQÕÉ¸œ°½¹™¥Éµ…È™¥´‘¼ÑÕÉ¹¼œ°Ù¥Ñ„•¹•ÉÉ…È¼ÑÕÉ¹¼Á½ÈÑ½ÅÕ”…¥‘•¹Ñ…°¸œ¥ô‘íÑ½±” ½µÁ…Ñ…É‘Ìœ°…ÉÑ…Ì½µÁ…Ñ…Ìœ°5½ÍÑÉ„µ…¥Ì…ÉÑ…Ì¹„·¼‘ÕÉ…¹Ñ”„‰…Ñ…±¡„¸œ¥ô‘íÑ½±” ±…É•U¤œ°%¹Ñ•É™…”…µÁ±¥…‘„œ°Õµ•¹Ñ„Ñ•áÑ½Ì”ƒ…É•…Ì‘”¥¹Ñ•É‡Ÿ¼¸œ¥ô‘íÑ½±” ¡¥¡½¹ÑÉ…ÍĞœ°±Ñ¼½¹ÑÉ…ÍÑ”œ°I•™½Ë„‰½É‘…Ì”±•¥‰¥±¥‘…‘”¸œ¥ô‘íÑ½±” É•‘Õ•‘5½Ñ¥½¸œ°I•‘Õé¥Èµ½Ù¥µ•¹Ñ¼œ°I•µ½Ù”ÑÉ…¹Í§ŸÕ•Ì”…¹¥µ‡ŸÕ•Ì»¼•ÍÍ•¹¥…¥Ì¸œ¥ô‘íÑ½±” Á•É™½Éµ…¹”œ°5½‘¼‘•Í•µÁ•¹¡¼œ°M¥µÁ±¥™¥„‰É¥±¡½Ì°Í½µ‰É…Ì”‘•Í™½ÅÕ•Ì¸œ¥ôğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…ÉM•ÑÑ¥¹ÍÑ¥½¹Ìˆøñ‰ÕÑÑ½¸¥ô‰…ÉÕ±±ÍÉ••¸ˆ±…ÍÌô‰…É5½‘…±	ÕÑÑ½¸ÁÉ¥µ…ÉäˆùQ1!%ğ½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸¥ô‰…ÉI•Í•ÑM•ÑÑ¥¹Ìˆ±…ÍÌô‰…É5½‘…±	ÕÑÑ½¸ˆùIMQUIHAKULğ½‰ÕÑÑ½¸øğ½‘¥Øù€¤ì(€µ½‘…°¹ÅÕ•ÉåM•±•Ñ½É±° m‘…Ñ„µÍ•ÑÑ¥¹tœ¤¹™½É… ¡¥¹ÁÕĞôù¥¹ÁÕĞ¹½¹¡…¹”ô ¤ôùí½¹ÍĞ¹•áĞõÍ•ÑÑ¥¹Ì ¤í¹•áÑm¥¹ÁÕĞ¹‘…Ñ…Í•Ğ¹Í•ÑÑ¥¹tõ¥¹ÁÕĞ¹¡•­•íÍ…Ù•M•ÑÑ¥¹Ì¡¹•áĞ¥ô¤ì(€µ½‘…°¹ÅÕ•ÉåM•±•Ñ½É±° m‘…Ñ„µÍ•ÑÑ¥¹œµÉ…¹•tœ¤¹™½É… ¡¥¹ÁÕĞôù¥¹ÁÕĞ¹½¹¥¹ÁÕĞô ¤ôùí½¹ÍĞ¹•áĞõÍ•ÑÑ¥¹Ì ¤í¹•áÑm¥¹ÁÕĞ¹‘…Ñ…Í•Ğ¹Í•ÑÑ¥¹I…¹•tõ9Õµ‰•È¡¥¹ÁÕĞ¹Ù…±Õ”¤íÍ…Ù•M•ÑÑ¥¹Ì¡¹•áĞ¥ô¤ì(€‰å% …ÉÕ±±ÍÉ••¸œ¤¹½¹±¥¬õ…Íå¹Œ ¤ôùíÑÉåí¥˜¡‘½Õµ•¹Ğ¹™Õ±±ÍÉ••¹±•µ•¹Ğ¥…İ…¥Ğ‘½Õµ•¹Ğ¹•á¥ÑÕ±±ÍÉ••¸ ¤í•±Í”…İ…¥Ğ‘½Õµ•¹Ğ¹‘½Õµ•¹Ñ±•µ•¹Ğ¹É•ÅÕ•ÍÑÕ±±ÍÉ••¸ ¥õ…Ñ¡íÑ½…ÍĞ Q•±„¡•¥„»¼•ÍÓ„‘¥ÍÁ½»µÙ•°¹•ÍÑ”¹…Ù•…‘½È¸œ¥õôì(€‰å% …ÉI•Í•ÑM•ÑÑ¥¹Ìœ¤¹½¹±¥¬ô ¤ôùíÍ…Ù•M•ÑÑ¥¹Ì¡U1Q}MQQ%9L¤íÉ•¹‘•ÉM•ÑÑ¥¹Ì ¤íÑ½…ÍĞ ½¹™¥ÕÉ‡ŸÕ•ÌÉ•ÍÑ…ÕÉ…‘…Ì¸œ¥ôì)ô()™Õ¹Ñ¥½¸É•¹‘•É‘µ¥¸ ¥ì(€¥˜ …¥Í‘µ¥¸¥É•ÑÕÉ¸Ñ½…ÍĞ ÍÑ„½¹Ñ„»¼Á½ÍÍÕ¤Á•Éµ¥ÍÏ¼…‘µ¥¹¥ÍÑÉ…Ñ¥Ù„¸œ¤ì(€¥˜ …Í•ÕÉ¥ÑåMÑ…Ñ”ü¹…‘µ¥¹I•…‘ä¥ì(€€€µ½‘…±M¡•±° ‘µ¥¹¥ÍÑÉ‡Ÿ¼‰±½ÅÕ•…‘„œ°5=	I%SMI%<œ±€ñ‘¥Ø±…ÍÌô‰…É‘µ¥¹1½¬ˆøñÍÁ…¸ûÂ~R@ğ½ÍÁ…¸øñ Ìù½¹™¥Éµ”ÍÕ„¥‘•¹Ñ¥‘…‘”Á…É„½¹Ñ¥¹Õ…Èğ½ ÌøñÀù<Á…Á•°4™½¤±½…±¥é…‘¼¹¼‰…¹¼°µ…Ì¹•¹¡Õµ„½Á•É‡Ÿ¼…‘µ¥¹¥ÍÑÉ…Ñ¥Ù„Í•Ë„…•¥Ñ„Í•´Õ´Í‘¥¼‘¼Í•Ô…Á±¥…Ñ¥Ù¼…ÕÑ•¹Ñ¥…‘½È¸%ÍÍ¼ÁÉ½Ñ•”Ñ½‘…Ì…Ì½¹Ñ…Ìµ•Íµ¼Í”Õµ„Í•ÍÏ¼½µÕ´™½ÈÉ½Õ‰…‘„¸ğ½Àøñ‰ÕÑÑ½¸¥ô‰…É‘µ¥¹=Á•¹5™„ˆ±…ÍÌô‰…É5½‘…±	ÕÑÑ½¸ÁÉ¥µ…Éäˆù	I%H=9QI9YI%%Hğ½‰ÕÑÑ½¸øğ½‘¥Øù€¤ì(€€€‰å% …É‘µ¥¹=Á•¹5™„œ¤¹½¹±¥¬ô ¤ôùí±½Í•5½‘…° ¤í±½‰…±Q¡¥Ì¹É…¹…=¹±¥¹”ü¹½Á•¸ü¸ ¥ôì(€€€É•ÑÕÉ¸ì(€ô(€½¹ÍĞÑÉÕÍÑ•õÍ•ÕÉ¥ÑåMÑ…Ñ”ü¹ÑÉÕÍÑ•‘ññíôì(€µ½‘…±M¡•±° ‘µ¥¹¥ÍÑÉ‡Ÿ¼Í•ÕÉ„œ°	9<AI%Y<ƒ
Ü5ƒ
ÜU%Q=I%œ±€ñÀ±…ÍÌô‰…É5½‘…±1•…ˆùÌ…±Ñ•É‡ŸÕ•Ì…‰…¥á¼…½¹Ñ••´¹¼Í•ÉÙ¥‘½È°•á¥•´5”É•¥ÍÑÉ…´…‘µ¥¹¥ÍÑÉ…‘½È°…±Ù¼°µ½Ñ¥Ù¼”Ù…±½É•Ì…¹Ñ•É¥½É•Ì¸<Á…¥¹•°»¼…±Ñ•É„µ…¥Ì‘¥¹¡•¥É¼Á•±¼¹…Ù•…‘½È¸ğ½Àøñ‘¥Ø±…ÍÌô‰…É‘µ¥¹%‘•¹Ñ¥ÑäˆøñÍÁ…¸ûÂ~n‡¾â<ğ½ÍÁ…¸øñ‘¥ØøñÍµ…±°ù=9Q5%9%MQI=IYI%%ğ½Íµ…±°øñˆø‘í•Í…Á•!Ñµ°¡¥‘•¹Ñ¥Ñäü¹•µ…¥±ñğ½¹Ñ„É…¹„œ¥ôğ½ˆøñ½‘”ø‘í•Í…Á•!Ñµ°¡¥‘•¹Ñ¥Ñäü¹¥‘ñğ%¥¹‘¥ÍÁ½»µÙ•°œ¥ôğ½½‘”øğ½‘¥Øøñ‰ÕÑÑ½¸¥ô‰…É‘µ¥¹½Áå%ˆù=A%H5T%ğ½‰ÕÑÑ½¸øğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…É‘µ¥¹QÉÕÍÑ•ˆøñÍÁ…¸øñÍµ…±°ù=UI<=9'Y0ğ½Íµ…±°øñˆø‘í9Õµ‰•È¡ÑÉÕÍÑ•¹½¥¹ÍñğÀ¥ôğ½ˆøğ½ÍÁ…¸øñÍÁ…¸øñÍµ…±°ùMO)9%=9'Y0ğ½Íµ…±°øñˆø‘í9Õµ‰•È¡ÑÉÕÍÑ•¹•ÍÍ•¹•ñğÀ¥ôğ½ˆøğ½ÍÁ…¸øñÍÁ…¸øñÍµ…±°ùMMO<ğ½Íµ…±°øñˆø‘í•Í…Á•!Ñµ°¡MÑÉ¥¹œ¡Í•ÕÉ¥ÑåMÑ…Ñ”ü¹……±ñğ……°Èœ¤¹Ñ½UÁÁ•É…Í” ¤¥ôğ½ˆøğ½ÍÁ…¸øğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…É‘µ¥¹½É´ˆøñ±…‰•°±…ÍÌô‰İ¥‘”ˆù%=9Q1Y<ñ¥¹ÁÕĞ¥ô‰…É‘µ¥¹Q…É•Ğˆµ…á±•¹Ñ ôˆÌØˆÍÁ•±±¡•¬ô‰™…±Í”ˆÙ…±Õ”ôˆ‘í•Í…Á•!Ñµ°¡¥‘•¹Ñ¥Ñäü¹¥‘ñğœœ¥ôˆøğ½±…‰•°øñ±…‰•°ù)UMQ=UI<ñ¥¹ÁÕĞ¥ô‰…É‘µ¥¹½¥¹ÌˆÑåÁ”ô‰¹Õµ‰•Èˆµ¥¸ôˆ´ÄÀÀÀÀÀˆµ…àôˆÄÀÀÀÀÀˆÍÑ•ÀôˆÄˆÙ…±Õ”ôˆÀˆøğ½±…‰•°øñ±…‰•°ù)UMQMO)9%ñ¥¹ÁÕĞ¥ô‰…É‘µ¥¹ÍÍ•¹”ˆÑåÁ”ô‰¹Õµ‰•Èˆµ¥¸ôˆ´ÄÀÀÀÀÀˆµ…àôˆÄÀÀÀÀÀˆÍÑ•ÀôˆÄˆÙ…±Õ”ôˆÀˆøğ½±…‰•°øñ±…‰•°±…ÍÌô‰İ¥‘”ˆù5=Q%Y<=	I%SMI%<ñ¥¹ÁÕĞ¥ô‰…É‘µ¥¹I•…Í½¸ˆµ…á±•¹Ñ ôˆÈÀÀˆÁ±…•¡½±‘•Èô‰à¸è½ÉÉ—Ÿ¼‘”É•½µÁ•¹Í„»¼É••‰¥‘„ˆøğ½±…‰•°øñ‰ÕÑÑ½¸¥ô‰…É‘µ¥¹É…¹Ğˆ±…ÍÌô‰…É5½‘…±	ÕÑÑ½¸ÁÉ¥µ…Éäİ¥‘”ˆùA1%H9<MIY%=Hğ½‰ÕÑÑ½¸øñÀ¥ô‰…É‘µ¥¹MÑ…ÑÕÌˆ±…ÍÌô‰…É‘µ¥¹MÑ…ÑÕÌİ¥‘”ˆù1¥µ¥Ñ”Á½È½Á•É‡Ÿ¼èƒ
ÄÄÀÀ¸ÀÀÀ¸Y…±½É•Ì¹Õ¹„™¥…´¹•…Ñ¥Ù½Ì¸ğ½Àøğ½‘¥ØøñÍ•Ñ¥½¸±…ÍÌô‰…É‘µ¥¹Õ‘¥Ğˆøñ¡•…‘•Èøñ‘¥ØøñÍµ…±°ùI%MQI<%5USY0AI)==ILğ½Íµ…±°øñ Ìûi±Ñ¥µ…Ì½Á•É‡ŸÕ•Ìğ½ Ìøğ½‘¥Øøñ‰ÕÑÑ½¸¥ô‰…É‘µ¥¹I•±½…‘Õ‘¥Ğˆ±…ÍÌô‰…É5½‘…±	ÕÑÑ½¸ˆùQU1%iHğ½‰ÕÑÑ½¸øğ½¡•…‘•Èøñ‘¥Ø¥ô‰…É‘µ¥¹Õ‘¥ÑI½İÌˆøñÀ±…ÍÌô‰…É‘µ¥¹MÑ…ÑÕÌˆù…ÉÉ•…¹‘¼…Õ‘¥Ñ½É¥„¸¸¸ğ½Àøğ½‘¥Øøğ½Í•Ñ¥½¸ù€¤ì(€‰å% …É‘µ¥¹½Áå%œ¤¹½¹±¥¬õ…Íå¹Œ ¤ôùíÑÉåí…İ…¥Ğ¹…Ù¥…Ñ½È¹±¥Á‰½…É¹İÉ¥Ñ•Q•áĞ¡¥‘•¹Ñ¥Ñäü¹¥‘ñğœœ¤íÑ½…ÍĞ %‘„½¹Ñ„É…¹„½Á¥…‘¼¸œ¥õ…Ñ¡íÑ½…ÍĞ ;¼™½¤Á½ÍÏµÙ•°½Á¥…È¼%¸œ¥õôì(€½¹ÍĞ•ÉÉ½ÉQ•áĞõ½‘”ôø¡íµ™…}É•ÅÕ¥É•è<5‘•ÍÑ„Í•ÍÏ¼•áÁ¥É½Ô¸Y•É¥™¥ÅÕ”¹½Ù…µ•¹Ñ”¹„½¹Ñ„É…¹„¸œ±™½É‰¥‘‘•¸è<Í•ÉÙ¥‘½ÈÉ•ÕÍ½Ô„Á•Éµ¥ÍÏ¼4¸œ±¥¹Ù…±¥‘}É•ÅÕ•ÍĞè½¹™¥É„¼%°½ÌÙ…±½É•Ì”¥¹™½Éµ”Õ´µ½Ñ¥Ù¼½´Á•±¼µ•¹½Ì€à…É…Ñ•É•Ì¸œ±ÕÍ•É}¹½Ñ}™½Õ¹è9•¹¡Õµ„½¹Ñ„™½¤•¹½¹ÑÉ…‘„½´•ÍÍ”%¸õm½‘•uñğ½Á•É‡Ÿ¼™½¤É•ÕÍ…‘„Á•±¼Í•ÉÙ¥‘½È¸œ¤ì(€½¹ÍĞ±½…‘Õ‘¥Ğõ…Íå¹Œ ¤ôùì(€€€½¹ÍĞÉ½İÌõ‰å% …É‘µ¥¹Õ‘¥ÑI½İÌœ¤í¥˜ …É½İÌ¥É•ÑÕÉ¸ì(€€€É½İÌ¹¥¹¹•É!Q50ôœñÀ±…ÍÌô‰…É‘µ¥¹MÑ…ÑÕÌˆù…ÉÉ•…¹‘¼…Õ‘¥Ñ½É¥„¸¸¸ğ½Àøœì(€€€ÑÉåì(€€€€€½¹ÍĞ•¹ÑÉ¥•Ìõ…İ…¥Ğ±½‰…±Q¡¥Ì¹É…¹…=¹±¥¹”¹…‘µ¥¹Õ‘¥Ğ ÈÔ¤ì(€€€€€É½İÌ¹¥¹¹•É!Q50õ•¹ÑÉ¥•Ì¹±•¹Ñ ı•¹ÑÉ¥•Ì¹µ…À¡•¹ÑÉäôù€ñ…ÉÑ¥±”±…ÍÌô‰…ÉÕ‘¥ÑI½Üˆøñ‘¥Øøñˆø‘í•Í…Á•!Ñµ°¡•¹ÑÉä¹…Ñ¥½¹ñğ½Á•É‡Ÿ¼œ¥ôğ½ˆøñÑ¥µ”ø‘í•Í…Á•!Ñµ°¡¹•Ü…Ñ”¡•¹ÑÉä¹É•…Ñ•‘Ğ¤¹Ñ½1½…±•MÑÉ¥¹œ ÁĞµ	Hœ¤¥ôğ½Ñ¥µ”øğ½‘¥Øøñ½‘”ø‘í•Í…Á•!Ñµ°¡•¹ÑÉä¹Ñ…É•ÑUÍ•É%‘ñğ…±Ù¼É•µ½Ù¥‘¼œ¥ôğ½½‘”øñÀø‘í•Í…Á•!Ñµ°¡•¹ÑÉä¹É•…Í½¹ñğM•´µ½Ñ¥Ù¼œ¥ôğ½ÀøñÍµ…±°ù=ÕÉ¼è€‘í9Õµ‰•È¡•¹ÑÉä¹‰•™½É”ü¹½¥¹ÍñğÀ¥ôƒŠH€‘í9Õµ‰•È¡•¹ÑÉä¹…™Ñ•Èü¹½¥¹ÍñğÀ¥ôƒ
ÜÍÏ©¹¥„è€‘í9Õµ‰•È¡•¹ÑÉä¹‰•™½É”ü¹•ÍÍ•¹•ñğÀ¥ôƒŠH€‘í9Õµ‰•È¡•¹ÑÉä¹…™Ñ•Èü¹•ÍÍ•¹•ñğÀ¥ôğ½Íµ…±°øğ½…ÉÑ¥±”ù€¤¹©½¥¸ œœ¤èœñÀ±…ÍÌô‰…É‘µ¥¹MÑ…ÑÕÌˆù9•¹¡Õµ„½Á•É‡Ÿ¼…‘µ¥¹¥ÍÑÉ…Ñ¥Ù„É•¥ÍÑÉ…‘„¸ğ½Àøœì(€€€õ…Ñ ¡•ÉÉ½È¥íÉ½İÌ¹¥¹¹•É!Q50õ€ñÀ±…ÍÌô‰…É‘µ¥¹MÑ…ÑÕÌ•ÉÉ½Èˆø‘í•Í…Á•!Ñµ°¡•ÉÉ½ÉQ•áĞ¡•ÉÉ½È¹½‘”¤¥ôğ½Àùô(€ôì(€‰å% …É‘µ¥¹I•±½…‘Õ‘¥Ğœ¤¹½¹±¥¬õ±½…‘Õ‘¥Ğì(€‰å% …É‘µ¥¹É…¹Ğœ¤¹½¹±¥¬õ…Íå¹Œ ¤ôùì(€€€½¹ÍĞ‰ÕÑÑ½¸õ‰å% …É‘µ¥¹É…¹Ğœ¤±µ•ÍÍ…”õ‰å% …É‘µ¥¹MÑ…ÑÕÌœ¤ì(€€€½¹ÍĞÑ…É•ÑUÍ•É%õ‰å% …É‘µ¥¹Q…É•Ğœ¤¹Ù…±Õ”¹ÑÉ¥´ ¤±½¥¹Í•±Ñ„õ5…Ñ ¹ÑÉÕ¹Œ¡9Õµ‰•È¡‰å% …É‘µ¥¹½¥¹Ìœ¤¹Ù…±Õ”¥ñğÀ¤±•ÍÍ•¹••±Ñ„õ5…Ñ ¹ÑÉÕ¹Œ¡9Õµ‰•È¡‰å% …É‘µ¥¹ÍÍ•¹”œ¤¹Ù…±Õ”¥ñğÀ¤±É•…Í½¸õ‰å% …É‘µ¥¹I•…Í½¸œ¤¹Ù…±Õ”¹ÑÉ¥´ ¤ì(€€€¥˜ „½ylÀ´å„µ™uìáôµlÀ´å„µ™uìÑôµlÄ´ÕulÀ´å„µ™uìÍôµlàå…‰ulÀ´å„µ™uìÍôµlÀ´å„µ™uìÄÉô½¤¹Ñ•ÍĞ¡Ñ…É•ÑUÍ•É%¥ññ5…Ñ ¹…‰Ì¡½¥¹Í•±Ñ„¤øÄÀÀÀÀÁññ5…Ñ ¹…‰Ì¡•ÍÍ•¹••±Ñ„¤øÄÀÀÀÀÁñğ …½¥¹Í•±Ñ„˜˜…•ÍÍ•¹••±Ñ„¥ññÉ•…Í½¸¹±•¹Ñ ğà¥íµ•ÍÍ…”¹±…ÍÍ9…µ”ô…É‘µ¥¹MÑ…ÑÕÌİ¥‘”•ÉÉ½Èœíµ•ÍÍ…”¹Ñ•áÑ½¹Ñ•¹Ğõ•ÉÉ½ÉQ•áĞ ¥¹Ù…±¥‘}É•ÅÕ•ÍĞœ¤íÉ•ÑÕÉ¹ô(€€€‰ÕÑÑ½¸¹‘¥Í…‰±•õÑÉÕ”íµ•ÍÍ…”¹±…ÍÍ9…µ”ô…É‘µ¥¹MÑ…ÑÕÌİ¥‘”œíµ•ÍÍ…”¹Ñ•áÑ½¹Ñ•¹ĞôÁ±¥…¹‘¼”É•¥ÍÑÉ…¹‘¼…Õ‘¥Ñ½É¥„¸¸¸œì(€€€ÑÉåì(€€€€€½¹ÍĞÉ•ÍÕ±Ğõ…İ…¥Ğ±½‰…±Q¡¥Ì¹É…¹…=¹±¥¹”¹…‘µ¥¹‘©ÕÍĞ¡íÑ…É•ÑUÍ•É%±½¥¹Í•±Ñ„±•ÍÍ•¹••±Ñ„±É•…Í½¹ô¤ì(€€€€€Í•ÕÉ¥ÑåMÑ…Ñ”õ…İ…¥Ğ±½‰…±Q¡¥Ì¹É…¹…=¹±¥¹”¹½¹Ñ•áĞ ¤ì(€€€€€µ•ÍÍ…”¹±…ÍÍ9…µ”ô…É‘µ¥¹MÑ…ÑÕÌİ¥‘”½¬œíµ•ÍÍ…”¹Ñ•áÑ½¹Ñ•¹Ğõ=Á•É‡Ÿ¼½¹±×µ‘„¸M…±‘¼½¹™§…Ù•°è€‘í9Õµ‰•È¡É•ÍÕ±Ğ¹ÑÉÕÍÑ•ü¹½¥¹ÍñğÀ¥ô=ÕÉ¼”€‘í9Õµ‰•È¡É•ÍÕ±Ğ¹ÑÉÕÍÑ•ü¹•ÍÍ•¹•ñğÀ¥ôÍÏ©¹¥…Ì¹€ì(€€€€€‰å% …É‘µ¥¹½¥¹Ìœ¤¹Ù…±Õ”ôœÀœí‰å% …É‘µ¥¹ÍÍ•¹”œ¤¹Ù…±Õ”ôœÀœí‰å% …É‘µ¥¹I•…Í½¸œ¤¹Ù…±Õ”ôœœì(€€€€€…İ…¥Ğ±½…‘Õ‘¥Ğ ¤ì(€€€õ…Ñ ¡•ÉÉ½È¥íµ•ÍÍ…”¹±…ÍÍ9…µ”ô…É‘µ¥¹MÑ…ÑÕÌİ¥‘”•ÉÉ½Èœíµ•ÍÍ…”¹Ñ•áÑ½¹Ñ•¹Ğõ•ÉÉ½ÉQ•áĞ¡•ÉÉ½È¹½‘”¥õ™¥¹…±±åí‰ÕÑÑ½¸¹‘¥Í…‰±•õ™…±Í•ô(€ôì(€±½…‘Õ‘¥Ğ ¤ì)ô()™Õ¹Ñ¥½¸Í¡½İ9•İÌ ¥ì(€‰å% ½Á•¹‰½ÕĞœ¤ü¹±¥¬ ¤ì(€É•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”  ¤ôùì(€€€½¹ÍĞ•å•‰É½Üõ‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È œ…‰½ÕÑMÉ••¸€¹•å•‰É½Üœ¤±Ñ¥Ñ±”õ‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È œ…‰½ÕÑMÉ••¸ Èœ¤±ÉÕ±•Ìõ‘½Õµ•¹Ğ¹ÅÕ•ÉåM•±•Ñ½È œ…‰½ÕÑMÉ••¸€¹ÉÕ±•Ìœ¤ì(€€€¥˜¡•å•‰É½Ü¥•å•‰É½Ü¹Ñ•áÑ½¹Ñ•¹ĞõI91M €‘í1=		e}YIM%=9ô]	€ì(€€€¥˜¡Ñ¥Ñ±”¥Ñ¥Ñ±”¹Ñ•áÑ½¹Ñ•¹Ğô½¹Ù•ÉŸ©¹¥„€Ä¸Àœì(€€€¥˜¡ÉÕ±•Ì¥ÉÕ±•Ì¹¥¹¹•É!Q50ôœñÀøñˆûŠf|ÍÑÉ…Ó¥¥„½µÁ±•Ñ„èğ½ˆø‘•¬½¹ÍÑÉ×µ‘¼°µÕ±±¥…¸°I•Í•ÉÙ„½¹¡•¥‘„°½‰©•Ñ¥Ù½Ì‘”É½Ñ„”Ù¥ÓÍÉ¥„…±Ñ•É¹…Ñ¥Ù„Á½È½·µ¹¥¼¸ğ½ÀøñÀøñˆûÂ~J8½±—Ÿ¼€˜É…™Ñ¥¹œèğ½ˆøÍÁ¥…Ì…½É„Ó©´™Õ»Ÿ¼É•…°ìÉ¥”°‘•Íµ½¹Ñ”°™…Ù½É¥Ñ””ÕÍ”…Ó¤ÑË©Ì¥Õ…¥ÌÁ…É„…Õµ•¹Ñ…È„½¹Í¥ÍÓ©¹¥„¸ğ½ÀøñÀøñˆûŠr”5…•ÍÑÉ¥„èğ½ˆø…Ì½¥Ñ¼±…ÍÍ•Ì…¹¡…É…´ƒ…ÉÙ½É•ÌÁËÍÁÉ¥…Ì½´ÁÉ½É•ÍÏ¼Á•Éµ…¹•¹Ñ”Á…É„AÙ¸ğ½ÀøñÀøñˆûŠ>Ì½¹ÑÉ½±”‘„Á…ÉÑ¥‘„èğ½ˆø‘•Í™…é•È…¹Ñ•Ì‘”•¹•ÉÉ…È°½¹™¥Éµ‡Ÿ¼‘”™¥´Á•É¥½Í¼°ƒé±Ñ¥µ…Ì‡ŸÕ•Ì”É•Á±…åÌ±½…¥Ì¸ğ½ÀøñÀøñˆûÂ~205Õ¹‘¼Ù¥Ù¼èğ½ˆø•Ù•¹Ñ½ÌÍ•µ…¹…¥Ì°Ñ•µÁ½É…‘„°µ¥ÍÏÕ•Ì°½¹ÅÕ¥ÍÑ…Ì”É•½µÁ•¹Í…Ì‘”½±—Ÿ¼¸ğ½ÀøñÀøñˆûÂ~n‡¾â<‘µ¥¹¥ÍÑÉ‡Ÿ¼É•…°èğ½ˆø©½…‘½É•Ì½¹±¥¹”°%Ì°•ÍÁ•Ñ…‘½È°‰…¹¥µ•¹Ñ½Ì°•½¹½µ¥„”…Õ‘¥Ñ½É¥„ÁÉ½Ñ•¥‘½ÌÁ½È5¸ğ½ÀøñÀøñˆûÂ~NÄ•™¥¹¥Ñ¥Ù„¹„]•ˆèğ½ˆøµ¥É‡Ÿ¼…ÕÑ½·…Ñ¥„°±½ÕÍ…Ù”°…¡”½™™±¥¹””¥¹Ñ•É™…”É•ÍÁ½¹Í¥Ù„Á…É„A”•±Õ±…È¸ğ½Àøœì(€ô¤ì)ô()™Õ¹Ñ¥½¸É•¹‘•ÉUÁ‘…Ñ•!¥ÍÑ½Éä ¥ì(€½¹ÍĞ•¹ÑÉ¥•ÌõUAQ}!%MQ=Id¹µ…À ¡É•±•…Í”±¥¹‘•à¤ôù€ñ…ÉÑ¥±”±…ÍÌô‰…ÉUÁ‘…Ñ•¹ÑÉä€‘í¥¹‘•àôôôÀüÕÉÉ•¹ĞœèœôˆÍÑå±”ôˆ´µÕÁ‘…Ñ”µÑ½¹”è‘íÉ•±•…Í”¹Ñ½¹•ôˆøñ‘¥Ø±…ÍÌô‰…ÉUÁ‘…Ñ•I…¥°ˆøñ¤øğ½¤øğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…ÉUÁ‘…Ñ•…Éˆøñ¡•…‘•Èøñ‘¥ØøñÍµ…±°ø‘í•Í…Á•!Ñµ°¡É•±•…Í”¹‘…Ñ”¥ôğ½Íµ…±°øñ ÌùØ‘í•Í…Á•!Ñµ°¡É•±•…Í”¹Ù•ÉÍ¥½¸¥ôƒ
Ü€‘í•Í…Á•!Ñµ°¡É•±•…Í”¹Ñ¥Ñ±”¥ôğ½ Ìøğ½‘¥ØøñÍÁ…¸ø‘í•Í…Á•!Ñµ°¡É•±•…Í”¹Ñ…œ¥ôğ½ÍÁ…¸øğ½¡•…‘•ÈøñÕ°ø‘íÉ•±•…Í”¹¹½Ñ•Ì¹µ…À¡¹½Ñ”ôù€ñ±¤ø‘í•Í…Á•!Ñµ°¡¹½Ñ”¥ôğ½±¤ù€¤¹©½¥¸ œœ¥ôğ½Õ°øğ½‘¥Øøğ½…ÉÑ¥±”ù€¤¹©½¥¸ œœ¤ì(€µ½‘…±M¡•±° !¥ÍÓÍÉ¥¼‘”UÁ‘…Ñ•Ìœ°)=I9YIO<€Ä¸Àœ±€ñÀ±…ÍÌô‰…É5½‘…±1•…ˆùÅÕ¤™¥…´É•¥ÍÑÉ…‘…Ì…ÌµÕ‘…»…ÌÉ•…¥Ì‘”…‘„Ù•ÉÏ¼Ãé‰±¥„¸±¥¹¡„€Ä¸À…½É„É••‰”µ¥É¼µÕÁ‘…Ñ•Ì‘”½ÉÉ—Ÿ¼Í•´…Á……È¼¡¥ÍÓÍÉ¥¼‘¼±…»…µ•¹Ñ¼¸ğ½Àøñ‘¥Ø±…ÍÌô‰…ÉUÁ‘…Ñ•Q¥µ•±¥¹”ˆø‘í•¹ÑÉ¥•Íôğ½‘¥Øøñ‘¥Ø±…ÍÌô‰…ÉUÁ‘…Ñ•ÕÑÕÉ”ˆøñÍÁ…¸ùYIO<QU0ğ½ÍÁ…¸øñˆøÄ¸À¸Äƒ
Ü7¼9…Ù•Ÿ…Ù•°ğ½ˆøñÍµ…±°ù½¹ÑÉ½±•ÌÍ•Á…É…‘½Ì‘…Ì…ÉÑ…Ì”…•ÍÍ¼…É…¹Ñ¥‘¼„Ñ½‘„„·¼¹¼A”¹¼•±Õ±…È¸ğ½Íµ…±°øğ½‘¥Øù€¤ì)ô()™Õ¹Ñ¥½¸…ÁÁ±åM•ÑÑ¥¹Ì¡Ù…±Õ”õÍ•ÑÑ¥¹Ì ¤¥ì(€½¹ÍĞ±…ÍÍ•Ìõí…ÉI•‘Õ•‘5½Ñ¥½¸éÙ…±Õ”¹É•‘Õ•‘5½Ñ¥½¸±…ÉA•É™½Éµ…¹”éÙ…±Õ”¹Á•É™½Éµ…¹”±…É1…É•U¤éÙ…±Õ”¹±…É•U¤±…É!¥¡½¹ÑÉ…ÍĞéÙ…±Õ”¹¡¥¡½¹ÑÉ…ÍĞ±…É½µÁ…Ñ…É‘ÌéÙ…±Õ”¹½µÁ…Ñ…É‘Íôì(€=‰©•Ğ¹•¹ÑÉ¥•Ì¡±…ÍÍ•Ì¤¹™½É…  ¡m¹…µ”±½¹t¤ôù‘½Õµ•¹Ğ¹‰½‘ä¹±…ÍÍ1¥ÍĞ¹Ñ½±”¡¹…µ”°„…½¸¤¤ì)ô()™Õ¹Ñ¥½¸±¥­••‘‰…¬¡•Ù•¹Ğ¥ì(€¥˜ …•Ù•¹Ğ¹Ñ…É•Ğ¹±½Í•ÍĞ ‰ÕÑÑ½¸œ¤¥É•ÑÕÉ¸ì(€½¹ÍĞÙ…±Õ”õÍ•ÑÑ¥¹Ì ¤ì(€¥˜¡Ù…±Õ”¹Ù¥‰É…Ñ¥½¸¥ÑÉåí¹…Ù¥…Ñ½È¹Ù¥‰É…Ñ”ü¸ ÄÈ¥õ…Ñ¡íô(€¥˜ …Ù…±Õ”¹Í½Õ¹‘ññÙ…±Õ”¹Ù½±Õµ”ğôÀ¥É•ÑÕÉ¸ì(€ÑÉåì(€€€½¹ÍĞ½¹Ñ•áĞõİ¥¹‘½Ü¹Õ‘¥½½¹Ñ•áÑññİ¥¹‘½Ü¹İ•‰­¥ÑÕ‘¥½½¹Ñ•áĞí¥˜ …½¹Ñ•áĞ¥É•ÑÕÉ¸ì(€€€±¥­••‘‰…¬¹Ñàõ±¥­••‘‰…¬¹Ñáññ¹•Ü½¹Ñ•áĞ ¤ì(€€€½¹ÍĞ½Í¥±±…Ñ½Èõ±¥­••‘‰…¬¹Ñà¹É•…Ñ•=Í¥±±…Ñ½È ¤±…¥¸õ±¥­••‘‰…¬¹Ñà¹É•…Ñ•…¥¸ ¤±¹½Üõ±¥­••‘‰…¬¹Ñà¹ÕÉÉ•¹ÑQ¥µ”ì(€€€½Í¥±±…Ñ½È¹ÑåÁ”ôÍ¥¹”œí½Í¥±±…Ñ½È¹™É•ÅÕ•¹ä¹Í•ÑY…±Õ•ÑQ¥µ” ĞÄÀ±¹½Ü¤í½Í¥±±…Ñ½È¹™É•ÅÕ•¹ä¹•áÁ½¹•¹Ñ¥…±I…µÁQ½Y…±Õ•ÑQ¥µ” ØÈÀ±¹½Ü¬¸ÀĞÔ¤í…¥¸¹…¥¸¹Í•ÑY…±Õ•ÑQ¥µ”¡5…Ñ ¹µ…à ¸ÀÀÄ±Ù…±Õ”¹Ù½±Õµ”¼ÄÀÀÀ¤±¹½Ü¤í…¥¸¹…¥¸¹•áÁ½¹•¹Ñ¥…±I…µÁQ½Y…±Õ•ÑQ¥µ” ¸ÀÀÄ±¹½Ü¬¸ÀÔÔ¤í½Í¥±±…Ñ½È¹½¹¹•Ğ¡…¥¸¤¹½¹¹•Ğ¡±¥­••‘‰…¬¹Ñà¹‘•ÍÑ¥¹…Ñ¥½¸¤í½Í¥±±…Ñ½È¹ÍÑ…ÉĞ¡¹½Ü¤í½Í¥±±…Ñ½È¹ÍÑ½À¡¹½Ü¬¸ÀØ¤ì(€õ…Ñ¡íô)ô()™Õ¹Ñ¥½¸¥¹ÍÑ…±±½¹™¥ÉµQÕÉ¸ ¥ì(€‰å% •¹‘QÕÉ¸œ¤ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±•Ù•¹Ğôùì(€€€¥˜ …Í•ÑÑ¥¹Ì ¤¹½¹™¥ÉµQÕÉ¸¥É•ÑÕÉ¸ì(€€€¥˜ …İ¥¹‘½Ü¹½¹™¥É´ ¹•ÉÉ…ÈÍ•ÔÑÕÉ¹¼…½É„üœ¤¥í•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤í•Ù•¹Ğ¹ÍÑ½Á%µµ•‘¥…Ñ•AÉ½Á……Ñ¥½¸ ¥ô(€ô±ÑÉÕ”¤ì)ô()…Íå¹Œ™Õ¹Ñ¥½¸É•™É•Í¡%‘•¹Ñ¥Ñä ¥ì(€½¹ÍĞÁÉ•Ù¥½ÕÍ%õ¥‘•¹Ñ¥Ñäü¹¥‘ññ¹Õ±°±ÁÉ•Ù¥½ÕÍ‘µ¥¸õ¥Í‘µ¥¸±ÁÉ•Ù¥½ÕÍI•…‘äõÍ•ÕÉ¥ÑåMÑ…Ñ”ü¹…‘µ¥¹I•…‘äì(€ÑÉåì(€€€¥‘•¹Ñ¥Ñäõ…İ…¥Ğ±½‰…±Q¡¥Ì¹É…¹…=¹±¥¹”ü¹ÕÍ•Èü¸ ¥ññ¹Õ±°ì(€€€Í•ÕÉ¥ÑåMÑ…Ñ”õ¥‘•¹Ñ¥Ñäı…İ…¥Ğ±½‰…±Q¡¥Ì¹É…¹…=¹±¥¹”ü¹½¹Ñ•áĞü¸ ¥ññ¹Õ±°é¹Õ±°ì(€€€¥Í‘µ¥¸õÍ•ÕÉ¥ÑåMÑ…Ñ”ü¹É½±”ôôô…‘µ¥¸œì(€õ…Ñ¡í¥‘•¹Ñ¥Ñäõ¹Õ±°íÍ•ÕÉ¥ÑåMÑ…Ñ”õ¹Õ±°í¥Í‘µ¥¸õ™…±Í•ô(€¥˜¡ÁÉ•Ù¥½ÕÍ%„ôô¡¥‘•¹Ñ¥Ñäü¹¥‘ññ¹Õ±°¥ññÁÉ•Ù¥½ÕÍ‘µ¥¸„ôõ¥Í‘µ¥¹ññÁÉ•Ù¥½ÕÍI•…‘ä„ôõÍ•ÕÉ¥ÑåMÑ…Ñ”ü¹…‘µ¥¹I•…‘ä¥É•™É•Í¡1½‰‰ä¡ÑÉÕ”¤ì)ô()™Õ¹Ñ¥½¸¥¹ÍÑ…±° ¥ì(€…ÁÁ±åM•ÑÑ¥¹Ì ¤ì(€¥¹ÍÑ…±±1½‰‰ä ¤ì(€¥¹ÍÑ…±±9…Ù¥…Ñ¥½¹…±±‰…­Ì ¤ì(€Íå¹1½‰‰åY¥Í¥‰¥±¥Ñä ¤ì(€½¹ÍĞ¡½µ”õ‰å% ¡½µ”œ¤ì(€¥˜¡¡½µ”¥¹•Ü5ÕÑ…Ñ¥½¹=‰Í•ÉÙ•È¡Íå¹1½‰‰åY¥Í¥‰¥±¥Ñä¤¹½‰Í•ÉÙ”¡¡½µ”±í…ÑÑÉ¥‰ÕÑ•ÌéÑÉÕ”±…ÑÑÉ¥‰ÕÑ•¥±Ñ•Èél±…ÍÌuô¤ì(€¥¹ÍÑ…±±½¹™¥ÉµQÕÉ¸ ¤ì(€‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ±±¥­••‘‰…¬±íÁ…ÍÍ¥Ù”éÑÉÕ•ô¤ì(€‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ­•å‘½İ¸œ±•Ù•¹Ğôùí¥˜¡•Ù•¹Ğ¹­•äôôôÍ…Á”œ˜™µ½‘…±QåÁ”¥±½Í•5½‘…° ¥ô¤ì(€İ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È …É…¹„éÁÉ½™¥±”œ° ¤ôùÉ•™É•Í¡1½‰‰ä¡ÑÉÕ”¤¤ì(€İ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È …É…¹„é•½¹½µäœ° ¤ôùÉ•™É•Í¡1½‰‰ä¡ÑÉÕ”¤¤ì(€İ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È …É…¹„é¥‘•¹Ñ¥Ñäœ±É•™É•Í¡%‘•¹Ñ¥Ñä¤ì(€İ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È …É…¹„éÍ•ÕÉ¥Ñäœ±É•™É•Í¡%‘•¹Ñ¥Ñä¤ì(€İ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È …É…¹„éµ…Ñ œ° ¤ôùÉ•™É•Í¡1½‰‰ä¡ÑÉÕ”¤¤ì(€İ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ÍÑ½É…”œ° ¤ôùÉ•™É•Í¡1½‰‰ä¡ÑÉÕ”¤¤ì(€Í•ÑQ¥µ•½ÕĞ¡É•™É•Í¡%‘•¹Ñ¥Ñä°ÈÔÀ¤ì(€Í•Ñ%¹Ñ•ÉÙ…°  ¤ôùíÉ•™É•Í¡1½‰‰ä ¤í½¹ÍĞ±½Õõ‰å% …É±½Õ‘5¥¹¤œ¤ü¹Ñ•áÑ½¹Ñ•¹Ññğœœí¥˜ …¥‘•¹Ñ¥Ñåñğ½1=0¼¹Ñ•ÍĞ¡±½Õ¤¥É•™É•Í¡%‘•¹Ñ¥Ñä ¥ô°ÈÈÀÀ¤ì)ô()‘½Õµ•¹Ğ¹É•…‘åMÑ…Ñ”ôôô±½…‘¥¹œœı‘½Õµ•¹Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È =5½¹Ñ•¹Ñ1½…‘•œ±¥¹ÍÑ…±°±í½¹”éÑÉÕ•ô¤é¥¹ÍÑ…±° ¤ì()±½‰…±Q¡¥Ì¹É…¹…1½‰‰äõíÙ•ÉÍ¥½¸é1=		e}YIM%=8±É•™É•Í è ¤ôùÉ•™É•Í¡1½‰‰ä¡ÑÉÕ”¤±½Á•¹M•ÑÑ¥¹Ìè ¤ôù½Á•¹5½‘…° Í•ÑÑ¥¹Ìœ¤±½Á•¹É¥•¹‘Ìè ¤ôù½Á•¹5½‘…° ™É¥•¹‘Ìœ¥ôì(