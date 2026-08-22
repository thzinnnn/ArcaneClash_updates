(()=>{
const MARKET_VERSION='0.9.2';
const STRATEGY_KEY='arcana_strategy_pack_v1';
const DEFAULT_OWNED=['theme_arcana','frame_arcana','sigil_star'];
const ITEMS=[
  {id:'theme_arcana',type:'theme',icon:'✦',name:'Salão Arcano',desc:'Tema clássico do lobby.',currency:'coins',price:0,starter:true},
  {id:'theme_aurora',type:'theme',icon:'🌅',name:'Aurora Dourada',desc:'Ilumina o lobby com ouro solar.',currency:'coins',price:450},
  {id:'theme_ember',type:'theme',icon:'🔥',name:'Câmara de Brasas',desc:'Tons rubros e brilho vulcânico.',currency:'coins',price:650},
  {id:'theme_grove',type:'theme',icon:'🌿',name:'Santuário Vivo',desc:'Verde profundo do Círculo Selvagem.',currency:'coins',price:650},
  {id:'theme_frost',type:'theme',icon:'❄️',name:'Palácio Invernal',desc:'Azul glacial e cristais de gelo.',currency:'coins',price:800},
  {id:'theme_void',type:'theme',icon:'🌘',name:'Trono do Vazio',desc:'Violeta sombrio para veteranos.',currency:'essence',price:110},
  {id:'frame_arcana',type:'frame',icon:'◇',name:'Moldura Arcana',desc:'Contorno clássico para cartas da mão.',currency:'coins',price:0,starter:true},
  {id:'frame_runic',type:'frame',icon:'🔷',name:'Moldura Rúnica',desc:'Runas cianas nas cartas em batalha.',currency:'coins',price:500},
  {id:'frame_solar',type:'frame',icon:'☀️',name:'Moldura Solar',desc:'Acabamento dourado e luminoso.',currency:'coins',price:900},
  {id:'frame_prism',type:'frame',icon:'💠',name:'Moldura Prismática',desc:'Contorno multicolorido de alta raridade.',currency:'essence',price:160},
  {id:'frame_anomaly',type:'frame',icon:'✺',name:'Moldura da Anomalia',desc:'Energia secreta para toda a sua mão.',currency:'essence',price:260},
  {id:'sigil_star',type:'sigil',icon:'✦',name:'Sigilo do Iniciado',desc:'Símbolo clássico do perfil.',currency:'coins',price:0,starter:true},
  {id:'sigil_crown',type:'sigil',icon:'👑',name:'Coroa da Ascensão',desc:'Um selo de prestígio no lobby.',currency:'coins',price:1200},
  {id:'sigil_dragon',type:'sigil',icon:'🐉',name:'Marca do Dragão',desc:'Para quem encara chefes sem recuar.',currency:'essence',price:190},
  {id:'sigil_secret',type:'sigil',icon:'🔒',name:'Olho Secreto',desc:'Um símbolo cercado de mistério.',currency:'essence',price:320}
];
const TYPE_NAMES={theme:'TEMAS DO LOBBY',frame:'MOLDURAS DE CARTA',sigil:'SIGILOS DE PERFIL'};
const parse=(value,fallback={})=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const strategy=()=>globalThis.ArcanaStrategy?.state?.()||parse(localStorage.getItem(STRATEGY_KEY),{});

function ensure(state=strategy()){
  const market=state.market&&typeof state.market==='object'?state.market:{};
  market.version=2;
  market.owned=Array.from(new Set([...DEFAULT_OWNED,...(Array.isArray(market.owned)?market.owned:[])]));
  market.equipped={theme:'theme_arcana',frame:'frame_arcana',sigil:'sigil_star',...(market.equipped||{})};
  market.purchases=Array.isArray(market.purchases)?market.purchases:[];
  state.market=market;
  return market;
}

function persist(state=strategy()){
  ensure(state);
  if(globalThis.ArcanaStrategy?.state?.()===state&&globalThis.ArcanaStrategy?.save)globalThis.ArcanaStrategy.save();
  else{
    localStorage.setItem(STRATEGY_KEY,JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('arcana:economy',{detail:{coins:Number(state.coins||0),essence:Number(state.essence||0)}}));
  }
  globalThis.ArcanaLobby?.refresh?.();
}

function apply(){
  const state=strategy(),market=ensure(state),body=document.body;
  body.dataset.arcTheme=(market.equipped.theme||'theme_arcana').replace('theme_','');
  body.dataset.arcFrame=(market.equipped.frame||'frame_arcana').replace('frame_','');
  body.dataset.arcSigil=(market.equipped.sigil||'sigil_star').replace('sigil_','');
}

function wallet(state=strategy()){
  return `<div class="arcMarketWallet"><span><i>🪙</i><b>${Number(state.coins||0)}</b><small>OURO</small></span><span><i>✦</i><b>${Number(state.essence||0)}</b><small>ESSÊNCIA</small></span></div>`;
}

function itemCard(item,state,market){
  const owned=market.owned.includes(item.id),equipped=market.equipped[item.type]===item.id,available=Number(state[item.currency]||0)>=item.price;
  const label=equipped?'EQUIPADO':owned?'EQUIPAR':`${item.currency==='coins'?'🪙':'✦'} ${item.price}`;
  return `<article class="arcMarketItem ${owned?'owned':''} ${equipped?'equipped':''}" data-market-type="${item.type}">
    <div class="arcMarketItemIcon">${item.icon}</div><div class="arcMarketItemCopy"><small>${TYPE_NAMES[item.type]}</small><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.desc)}</p></div>
    <button data-market-item="${item.id}" ${equipped||(!owned&&!available)?'disabled':''}>${label}</button>
  </article>`;
}

function render(){
  let root=document.getElementById('arcaneMarket');
  if(!root){root=document.createElement('section');root.id='arcaneMarket';root.className='arcaneMarket hidden';document.body.appendChild(root)}
  const state=strategy(),market=ensure(state);
  root.innerHTML=`<div class="arcMarketBackdrop"></div><div class="arcMarketPanel"><header><div><small>ECONOMIA 0.9.2 · SEM VANTAGEM PAGA</small><h2>✦ Mercado Arcano</h2><p>Transforme Ouro e Essência em personalização permanente. Nenhuma compra aumenta dano, vida ou mana.</p></div><button id="arcMarketClose" aria-label="Fechar">×</button></header>${wallet(state)}<nav class="arcMarketTabs"><button data-market-filter="all" class="active">TUDO</button><button data-market-filter="theme">TEMAS</button><button data-market-filter="frame">MOLDURAS</button><button data-market-filter="sigil">SIGILOS</button></nav><main class="arcMarketGrid">${ITEMS.map(item=>itemCard(item,state,market)).join('')}</main><footer><div><b>REFINAR OURO</b><small>Converta 600 Ouro em 30 Essências. A conversão é permanente e entra no cloud save.</small></div><button id="arcMarketExchange" ${Number(state.coins||0)<600?'disabled':''}>600 🪙 → 30 ✦</button></footer></div>`;
  root.querySelector('.arcMarketBackdrop').onclick=close;
  root.querySelector('#arcMarketClose').onclick=close;
  root.querySelectorAll('[data-market-item]').forEach(button=>button.onclick=()=>select(button.dataset.marketItem));
  root.querySelectorAll('[data-market-filter]').forEach(button=>button.onclick=()=>{
    root.querySelectorAll('[data-market-filter]').forEach(node=>node.classList.toggle('active',node===button));
    root.querySelectorAll('.arcMarketItem').forEach(node=>node.classList.toggle('hidden',button.dataset.marketFilter!=='all'&&node.dataset.marketType!==button.dataset.marketFilter));
  });
  root.querySelector('#arcMarketExchange').onclick=exchange;
  apply();
}

function select(id){
  const item=ITEMS.find(entry=>entry.id===id);if(!item)return;
  const state=strategy(),market=ensure(state);
  if(market.owned.includes(id)){
    market.equipped[item.type]=id;persist(state);apply();render();notify(`${item.icon} ${item.name} equipado.`);return;
  }
  if(Number(state[item.currency]||0)<item.price)return notify('Você ainda não possui recursos suficientes.');
  state[item.currency]=Number(state[item.currency]||0)-item.price;
  market.owned.push(id);market.equipped[item.type]=id;market.purchases.push({id,price:item.price,currency:item.currency,at:Date.now()});
  persist(state);apply();render();notify(`${item.icon} ${item.name} comprado e equipado.`);
}

function exchange(){
  const state=strategy();if(Number(state.coins||0)<600)return notify('São necessários 600 de Ouro.');
  state.coins-=600;state.essence=Number(state.essence||0)+30;ensure(state).purchases.push({id:'exchange_30',price:600,currency:'coins',at:Date.now()});
  persist(state);render();notify('30 Essências foram refinadas.');
}

function unlockAll(){
  const state=strategy(),market=ensure(state);market.owned=Array.from(new Set([...market.owned,...ITEMS.map(item=>item.id)]));persist(state);apply();return market;
}

function notify(message){
  let node=document.getElementById('arcMarketToast');if(!node){node=document.createElement('div');node.id='arcMarketToast';document.body.appendChild(node)}
  node.textContent=message;node.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>node.classList.remove('show'),2400);
}
function open(){render();document.getElementById('arcaneMarket')?.classList.remove('hidden')}
function close(){document.getElementById('arcaneMarket')?.classList.add('hidden')}
function install(){
  const localTest=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&new URLSearchParams(location.search).get('economy-test')==='1';
  if(localTest&&!sessionStorage.getItem('arcana_market_test_seeded')){const state=strategy();state.coins=Math.max(2400,Number(state.coins||0));state.essence=Math.max(600,Number(state.essence||0));sessionStorage.setItem('arcana_market_test_seeded','1');persist(state)}
  ensure();apply();window.addEventListener('storage',apply);window.addEventListener('arcana:economy',apply);document.addEventListener('keydown',event=>{if(event.key==='Escape')close()})
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
globalThis.ArcanaMarket={version:MARKET_VERSION,items:ITEMS,open,close,apply,unlockAll,state:()=>ensure()};
document.documentElement.dataset.arcanaMarket=MARKET_VERSION;
document.documentElement.dataset.arcanaMarketItems=String(ITEMS.length);
})();
