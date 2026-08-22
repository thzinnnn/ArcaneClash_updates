(()=>{
const RARITIES={
  comum:{label:'COMUM',symbol:'●',tone:'#aab6c8'},
  rara:{label:'RARA',symbol:'◆',tone:'#58dcff'},
  'épica':{label:'ÉPICA',symbol:'✦',tone:'#b985ff'},
  'lendária':{label:'LENDÁRIA',symbol:'★',tone:'#ffd15c'},
  secreta:{label:'SECRETA',symbol:'✧',tone:'#ff62e6',hiddenLegend:true}
};

const normalize=value=>String(value||'')
  .replace(/\s+Eco$/i,'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .trim()
  .toLowerCase();

function catalog(){
  return globalThis.__ARCANA?.cards||[];
}

function rarityOf(value){
  const key=normalize(value);
  if(key==='epica')return 'épica';
  if(key==='lendaria')return 'lendária';
  if(key==='secreta')return 'secreta';
  if(key==='rara')return 'rara';
  return 'comum';
}

function cardByName(name){
  const wanted=normalize(name);
  return catalog().find(card=>normalize(card.name)===wanted)||Object.values(globalThis.ArcanaSecrets?.cards||{}).find(card=>normalize(card.name)===wanted)||null;
}

function cardName(element,selector){
  return element.querySelector(selector)?.textContent?.trim()||'';
}

function badge(info,compact=false){
  const element=document.createElement('span');
  element.className=`arcRarityBadge${compact?' arcRarityCompact':''}`;
  element.innerHTML=`<i aria-hidden="true">${info.symbol}</i><span>${info.label}</span>`;
  element.setAttribute('aria-label',`Raridade ${info.label}`);
  element.title=`Raridade: ${info.label}`;
  return element;
}

function decorate(element,card,{compact=false}={}){
  if(!element||!card)return;
  const rarity=rarityOf(card.rarity);
  const info=RARITIES[rarity];
  element.classList.add('arcRarityCard');
  element.dataset.cardRarity=rarity;
  element.style.setProperty('--rarity-tone',info.tone);
  element.style.setProperty('--rarity-symbol',`"${info.symbol}"`);
  const current=element.querySelector(':scope > .arcRarityBadge');
  if(current?.dataset.rarity===rarity)return;
  current?.remove();
  const next=badge(info,compact);
  next.dataset.rarity=rarity;
  element.appendChild(next);
}

const SURFACES=[
  ['.arcForgeCard','.arcForgeCardText > b',false],
  ['.arcMulliganCards button','b',false],
  ['.chestChoice','.pickName',false],
  ['.card','.cn, .cName',false],
  ['.pCard','b',false],
  ['.unit','.un, .uName',true],
  ['.pUnit','b',true]
];

function renderLegend(){
  document.querySelectorAll('.arcForgeCollection').forEach(collection=>{
    if(collection.querySelector(':scope > .arcRarityLegend'))return;
    const legend=document.createElement('div');
    legend.className='arcRarityLegend';
    legend.setAttribute('aria-label','Legenda de raridades');
    legend.innerHTML=`<small>RARIDADE</small>${Object.entries(RARITIES).filter(([,info])=>!info.hiddenLegend).map(([rarity,info])=>`<span data-rarity="${rarity}" style="--rarity-tone:${info.tone}"><i>${info.symbol}</i>${info.label}</span>`).join('')}<em>Moldura, símbolo e nome identificam o nível da carta.</em>`;
    const filters=collection.querySelector('.arcForgeFilters');
    filters?.insertAdjacentElement('afterend',legend);
  });
}

function renderInspector(){
  const panel=document.querySelector('.inspectPanel');
  const name=document.getElementById('inspectName')?.textContent?.trim();
  const card=cardByName(name);
  if(!panel||!card)return;
  const rarity=rarityOf(card.rarity),info=RARITIES[rarity];
  panel.dataset.cardRarity=rarity;
  panel.style.setProperty('--rarity-tone',info.tone);
  let signal=panel.querySelector('.arcInspectorRarity');
  if(!signal){
    signal=badge(info);
    signal.classList.add('arcInspectorRarity');
    panel.querySelector('#inspectMeta')?.insertAdjacentElement('afterend',signal);
  }
  signal.dataset.rarity=rarity;
  signal.innerHTML=`<i aria-hidden="true">${info.symbol}</i><span>${info.label}</span>`;
  signal.setAttribute('aria-label',`Raridade ${info.label}`);
  signal.title=`Raridade: ${info.label}`;
  if(card.secret){
    const art=panel.querySelector('#inspectArt'),text=panel.querySelector('#inspectText');
    if(art&&art.textContent!==card.icon)art.textContent=card.icon;
    if(text&&text.textContent!==card.text)text.textContent=card.text;
  }
}

function setText(element,value){
  if(element&&element.textContent!==value)element.textContent=value;
}

function renderSecretReveal(){
  const panel=document.getElementById('chestPanel');
  if(panel){
    const secret=panel.querySelector('.chestChoice[data-card-rarity="secreta"]');
    panel.classList.toggle('arcSecretReward',!!secret);
    if(secret){
      setText(document.getElementById('chestRarity'),'✧ ANOMALIA SECRETA');
      setText(document.getElementById('chestIcon'),'🔒');
      setText(panel.querySelector('.lead.small'),'Uma carta impossível rompeu o catálogo. Você talvez nunca volte a encontrá-la.');
      setText(secret.querySelector('.pickTitle'),'ARQUIVO PROIBIDO');
    }
  }
  document.querySelectorAll('.partyChestBox').forEach(box=>{
    const secret=box.querySelector('.pCard[data-card-rarity="secreta"]');
    box.classList.toggle('arcSecretReward',!!secret);
    if(secret)setText(box.querySelector('h2,h3'),'✧ ANOMALIA SECRETA');
  });
}

let queued=false;
function scan(){
  queued=false;
  for(const [surface,nameSelector,compact] of SURFACES){
    document.querySelectorAll(surface).forEach(element=>{
      decorate(element,cardByName(cardName(element,nameSelector)),{compact});
    });
  }
  renderLegend();
  renderInspector();
  renderSecretReveal();
}

function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(scan);
}

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
window.addEventListener('arcana:armory-ready',schedule);
window.addEventListener('arcana:profile',schedule);
document.addEventListener('click',()=>setTimeout(schedule,0));
schedule();

globalThis.ArcanaRarity={rarities:RARITIES,refresh:schedule};
})();
