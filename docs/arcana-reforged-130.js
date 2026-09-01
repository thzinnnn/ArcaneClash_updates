(()=>{
'use strict';

const VERSION='1.3.0';
const PROFILE_KEY='arcana_profile_v2';
const CLASS_INFO={
  vanguard:{icon:'🛡️',name:'Guerreiro Arcano',doctrine:'Muralha Viva',bonus:'Comece com +3 de vida máxima.'},
  pyromancer:{icon:'🔥',name:'Piromante',doctrine:'Ignição',bonus:'Comece com +1 de mana permanente.'},
  necromancer:{icon:'💀',name:'Necromante',doctrine:'Último Pacto',bonus:'Receba +1 reembaralhamento e uma mão mais resiliente.'},
  druid:{icon:'🌿',name:'Druida',doctrine:'Coração do Bosque',bonus:'Comece com +2 de vida e fortaleça criaturas na Forja.'},
  cryomancer:{icon:'❄️',name:'Criomante',doctrine:'Inverno Preparado',bonus:'Receba +2 reembaralhamentos.'},
  assassin:{icon:'🗡️',name:'Assassino',doctrine:'Primeiro Corte',bonus:'A primeira criatura do deck recebe Investida.'},
  summoner:{icon:'🌀',name:'Invocador',doctrine:'Portal Estável',bonus:'Duas criaturas do deck custam 1 a menos.'},
  chronomancer:{icon:'⏳',name:'Cronomante',doctrine:'Segundo Futuro',bonus:'Receba +2 reembaralhamentos.'}
};
const OBJECTIVES=[
  {id:'bastion',icon:'🛡️',name:'Bastião',text:'O líder da rota recebe +1 de Vida.',effect:'fortify'},
  {id:'well',icon:'💎',name:'Poço de Mana',text:'Concede +1 de mana no próximo turno.',effect:'mana'},
  {id:'hunt',icon:'⚔️',name:'Terreno de Caça',text:'O líder da rota recebe +1 de Ataque.',effect:'attack'},
  {id:'shrine',icon:'🌿',name:'Santuário',text:'O comandante recupera 2 de Vida.',effect:'heal'},
  {id:'rift',icon:'🌌',name:'Fenda Arcana',text:'Compre uma carta da Reserva.',effect:'draw'},
  {id:'forge',icon:'🔥',name:'Forja de Guerra',text:'Todas as criaturas da rota recebem +1 de Vida.',effect:'laneHp'}
];
const parse=(text,fallback={})=>{try{return JSON.parse(text)||fallback}catch{return fallback}};
const clone=value=>JSON.parse(JSON.stringify(value));
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const profile=()=>parse(localStorage.getItem(PROFILE_KEY),{});
function saveProfile(value){localStorage.setItem(PROFILE_KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent('arcana:profile',{detail:value}));globalThis.ArcanaLobby?.refresh?.()}
function data(){const p=profile();return {fusions:{},discoveries:[],fragments:0,matches:0,...(p.reforged130||{})}}
function saveData(value){const p=profile();p.reforged130=value;p.release130={version:VERSION,updatedAt:Date.now()};p.schemaVersion=Math.max(9,Number(p.schemaVersion||0));saveProfile(p)}

function toast(message,state='ok'){
  let root=document.getElementById('arcReforgeToast');if(!root){root=document.createElement('div');root.id='arcReforgeToast';document.body.appendChild(root)}
  root.textContent=message;root.dataset.state=state;root.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>root.classList.remove('show'),2800);
}
function overlay(id,title,subtitle,html){
  let root=document.getElementById(id);if(!root){root=document.createElement('section');root.id=id;root.className='arcReforgeOverlay';document.body.appendChild(root)}
  root.innerHTML=`<div class="arcReforgeShell"><header><div><small>${esc(subtitle)}</small><h2>${esc(title)}</h2></div><button class="arcReforgeClose" aria-label="Fechar">×</button></header><main>${html}</main></div>`;root.classList.remove('hidden');root.querySelector('.arcReforgeClose').onclick=()=>root.classList.add('hidden');root.onclick=event=>{if(event.target===root)root.classList.add('hidden')};return root;
}

let fusionSelection=[];
function activeDeck(){const p=profile(),classId=p.classId||'vanguard',deck=p.classDecks?.[classId];return {p,classId,deck,catalog:globalThis.__ARCANA?.cards||[]}}
function fusionName(a,b){const first=String(a.name).split(' ')[0],last=String(b.name).split(' ').slice(-1)[0];return `${first} ${last} Reforjado`.slice(0,30)}
function fusionDefinition(recipe,catalog){
  const a=catalog.find(card=>card.name===recipe.a),b=catalog.find(card=>card.name===recipe.b);if(!a||!b||a.type!=='unit'||b.type!=='unit')return null;
  const kw=[...new Set([...(a.kw||[]),...(b.kw||[])])].slice(0,3),cost=Math.min(8,Math.max(1,Math.round((Number(a.cost||0)+Number(b.cost||0))/2)+1));
  return {...clone(a),name:recipe.name||fusionName(a,b),icon:'✦',cost,atk:Math.ceil((Number(a.atk||0)+Number(b.atk||0))/2)+1,hp:Math.ceil((Number(a.hp||0)+Number(b.hp||0))/2)+2,maxHp:Math.ceil((Number(a.hp||0)+Number(b.hp||0))/2)+2,kw,rarity:'lendária',text:`Fusão de ${a.name} + ${b.name}. ${a.text||''}`,fusion130:true,fusionSources:[a.name,b.name]};
}
function renderFusion(){
  const {classId,deck,catalog}=activeDeck(),info=CLASS_INFO[classId]||CLASS_INFO.vanguard,value=data(),recipe=value.fusions[classId],current=recipe&&fusionDefinition(recipe,catalog);
  const names=[...new Set((deck?.cards||[]).filter(name=>catalog.find(card=>card.name===name)?.type==='unit'))],cards=names.map(name=>catalog.find(card=>card.name===name)).filter(Boolean);fusionSelection=fusionSelection.filter(name=>names.includes(name)).slice(0,2);
  const cardHtml=cards.map(card=>`<button data-fusion-card="${esc(card.name)}" class="${fusionSelection.includes(card.name)?'selected':''}"><span>${card.icon||'✦'}</span><div><small>${card.cost} MANA · ${card.rarity||'comum'}</small><b>${esc(card.name)}</b><p>${esc(card.text||'')}</p></div><em>⚔${card.atk||0} ♥${card.hp||0}</em></button>`).join('');
  const preview=fusionSelection.length===2?fusionDefinition({a:fusionSelection[0],b:fusionSelection[1]},catalog):null;
  const root=overlay('arcFusionForge','Fusão Arcana','ESCOLHA DUAS CRIATURAS · UMA CARTA REFORJADA',`<section class="arcFusionHero"><span>${info.icon}</span><div><small>${info.name} · ${info.doctrine}</small><h3>${current?`✦ ${esc(current.name)}`:'Nenhuma Fusão equipada'}</h3><p>${current?esc(current.text):'Uma cópia da primeira criatura escolhida será transformada no início de cada partida.'}</p></div>${current?'<button id="arcFusionRemove">REMOVER</button>':''}</section><div class="arcFusionHow"><b>COMO FUNCIONA</b><span>Escolha duas criaturas diferentes do deck. A primeira mantém seu efeito; a segunda transfere atributos e palavras-chave. O deck continua com 30 cartas.</span></div><div class="arcFusionMain"><section><div class="arcFusionTitle"><b>CRIATURAS DO DECK</b><span>${cards.length} opções</span></div><div class="arcFusionCards">${cardHtml||'<p>Equipe um deck com criaturas para usar a Fusão.</p>'}</div></section><aside class="arcFusionPreview">${preview?`<small>PRÉVIA DA FUSÃO</small><span>✦</span><h3>${esc(preview.name)}</h3><p>${esc(preview.text)}</p><div><b>${preview.cost}</b> MANA · <b>⚔${preview.atk}</b> · <b>♥${preview.hp}</b></div><em>${preview.kw.join(' · ')||'Sem palavra-chave'}</em><button id="arcFusionCreate">FUSIONAR E EQUIPAR</button>`:'<small>PRÉVIA DA FUSÃO</small><span>◇</span><h3>Escolha duas cartas</h3><p>A ordem importa: a primeira preserva a habilidade principal.</p>'}</aside></div>`);
  root.querySelectorAll('[data-fusion-card]').forEach(button=>button.onclick=()=>{const name=button.dataset.fusionCard,index=fusionSelection.indexOf(name);if(index>=0)fusionSelection.splice(index,1);else{if(fusionSelection.length>=2)fusionSelection.shift();fusionSelection.push(name)}renderFusion()});
  root.querySelector('#arcFusionCreate')?.addEventListener('click',()=>{const next=data(),definition=fusionDefinition({a:fusionSelection[0],b:fusionSelection[1]},catalog);if(!definition)return;next.fusions[classId]={a:fusionSelection[0],b:fusionSelection[1],name:definition.name,createdAt:Date.now()};next.discoveries=[...new Set([...next.discoveries,definition.name])];saveData(next);fusionSelection=[];renderFusion();toast(`${definition.name} equipada.`)});
  root.querySelector('#arcFusionRemove')?.addEventListener('click',()=>{const next=data();delete next.fusions[classId];saveData(next);renderFusion();toast('Fusão removida do deck.')});
}

function applyDoctrine(player,deck,classId){
  const catalog=globalThis.__ARCANA?.cards||[],evolution=globalThis.ArcanaEvolution,specific=deck.filter(card=>card.fac!=='neutral'&&evolution?.allowedForClass?.(card,classId)).length;if(specific<20)return false;
  player.reforgedDoctrine=CLASS_INFO[classId]?.doctrine||'Identidade Arcana';
  if(classId==='vanguard'){player.maxHp+=3;player.hp+=3}
  if(classId==='pyromancer')player.manaBonus=Number(player.manaBonus||0)+1;
  if(classId==='necromancer')player.rerolls=Number(player.rerolls||0)+1;
  if(classId==='druid'){player.maxHp+=2;player.hp+=2}
  if(classId==='cryomancer'||classId==='chronomancer')player.rerolls=Number(player.rerolls||0)+2;
  if(classId==='assassin'){const unit=deck.find(card=>card.type==='unit');if(unit)unit.kw=[...new Set([...(unit.kw||[]),'Investida'])]}
  if(classId==='summoner')deck.filter(card=>card.type==='unit').slice(0,2).forEach(card=>card.cost=Math.max(0,Number(card.cost||0)-1));
  return true;
}
function wrapDeckBuilder(){
  const evolution=globalThis.ArcanaEvolution;if(!evolution?.buildDeck||evolution.buildDeck.reforged130)return false;const original=evolution.buildDeck;
  function buildDeck(player,catalog,instantiate,shuffle){
    const deck=original(player,catalog,instantiate,shuffle);if(player?.index!==0||globalThis.__ARCANA?.networkRole?.())return deck;
    applyDoctrine(player,deck,player.classId);const recipe=data().fusions[player.classId],definition=recipe&&fusionDefinition(recipe,catalog);if(definition){const index=deck.findIndex(card=>card.name===recipe.a);if(index>=0){deck[index]=instantiate(definition);player.fusion130=definition.name}}
    return deck;
  }
  buildDeck.reforged130=true;buildDeck.original=original;evolution.buildDeck=buildDeck;return true;
}

function objectiveSet(game){if(Array.isArray(game.reforged130?.objectives)&&game.reforged130.objectives.length===3)return game.reforged130.objectives;const seed=String(game.id||'arcana').split('').reduce((sum,char)=>sum+char.charCodeAt(0),0),pool=[...OBJECTIVES];for(let index=pool.length-1;index>0;index--){const swap=(seed+index*7)%pool.length;[pool[index],pool[swap]]=[pool[swap],pool[index]]}const previous=game.reforged130||{};game.reforged130={...previous,objectives:pool.slice(0,3).map(item=>item.id),conquest:Array.isArray(previous.conquest)?previous.conquest:[0,0],history:Array.isArray(previous.history)?previous.history:[],lastRound:Number(previous.lastRound||0)};return game.reforged130.objectives}
function laneStrength(player,lane){return (player?.lanes?.[lane]||[]).reduce((sum,unit)=>sum+Number(unit.atk||0)+Number(unit.hp||0)*.25,0)}
function draw(player){if(!player?.deck?.length||player.hand.length>=9)return false;player.hand.push(player.deck.pop());return true}
function applyObjective(game,lane,winner,objective){
  const player=game.p[winner],units=player.lanes[lane]||[],leader=[...units].sort((a,b)=>Number(b.atk||0)-Number(a.atk||0))[0];if(!player)return;
  if(objective.effect==='fortify'&&leader){leader.maxHp=Number(leader.maxHp||leader.hp)+1;leader.hp++}
  if(objective.effect==='mana')player.bonusNext=Number(player.bonusNext||0)+1;
  if(objective.effect==='attack'&&leader)leader.atk=Number(leader.atk||0)+1;
  if(objective.effect==='heal')player.hp=Math.min(player.maxHp,Number(player.hp||0)+2);
  if(objective.effect==='draw')draw(player);
  if(objective.effect==='laneHp')units.forEach(unit=>{unit.maxHp=Number(unit.maxHp||unit.hp)+1;unit.hp++});
}
function processRound(game,masteryNodes=new Set()){
  if(!game||game.over||globalThis.__ARCANA?.networkRole?.())return false;const ids=objectiveSet(game),meta=game.reforged130,round=Number(game.round||1);if(round<2||meta.lastRound===round)return true;meta.lastRound=round;
  const lane=(round-2)%3,objective=OBJECTIVES.find(item=>item.id===ids[lane])||OBJECTIVES[0],a=laneStrength(game.p[0],lane),b=laneStrength(game.p[1],lane),winner=a===b?null:a>b?0:1;if(winner!==null){applyObjective(game,lane,winner,objective);const me=game.p[0],leader=game.p[winner].lanes[lane]?.[0];if(winner===0&&masteryNodes.has('grove'))me.hp=Math.min(me.maxHp,me.hp+1);if(winner===0&&[...masteryNodes].some(id=>['furnace','edge'].includes(id)))me.bonusNext=Number(me.bonusNext||0)+1;if(winner===0&&masteryNodes.has('winter')&&leader)leader.atk++}
  const controls=[0,1].map(side=>[0,1,2].filter(index=>laneStrength(game.p[side],index)>laneStrength(game.p[1-side],index)).length);for(let side=0;side<2;side++)meta.conquest[side]=controls[side]>=2?Number(meta.conquest[side]||0)+1:Math.max(0,Number(meta.conquest[side]||0)-1);
  const needed=[...masteryNodes].some(id=>['oath','absolute','portal'].includes(id))?2:3;meta.needed=needed;for(let side=0;side<2;side++)if(meta.conquest[side]>=needed){game.over=true;game.winner=side;toast(`${side===0?'Vitória':'Derrota'} por Conquista: duas rotas dominadas por ${needed} rodadas.`,side===0?'ok':'error')}
  meta.history.unshift({round,lane,winner,objective:objective.id,controls});meta.history=meta.history.slice(0,20);return true;
}

function renderBattleUi(){
  const game=globalThis.__ARCANA?.state?.(),active=game?.id&&!game.over&&!document.getElementById('game')?.classList.contains('hidden');let hud=document.getElementById('arcReforgeBattleHud');if(!active){hud?.classList.add('hidden');return}objectiveSet(game);if(!hud){hud=document.createElement('section');hud.id='arcReforgeBattleHud';document.body.appendChild(hud)}
  const current=Math.max(0,(Number(game.round||1)-2)%3),conquest=game.reforged130.conquest||[0,0],needed=Number(game.reforged130.needed||3);hud.innerHTML=`<div class="arcConquest"><span>VOCÊ</span><i><em style="width:${Math.min(100,conquest[0]/needed*100)}%"></em></i><b>${conquest[0]}/${needed}</b><small>CONQUISTA</small><b>${conquest[1]}/${needed}</b><i><em class="enemy" style="width:${Math.min(100,conquest[1]/needed*100)}%"></em></i><span>RIVAL</span></div>`;hud.classList.remove('hidden');
  document.querySelectorAll('#board .lane').forEach((lane,index)=>{const mid=lane.querySelector('.mid'),objective=OBJECTIVES.find(item=>item.id===game.reforged130.objectives[index]);if(!mid||!objective)return;let badge=mid.querySelector('.arcRouteObjective');if(!badge){badge=document.createElement('span');badge.className='arcRouteObjective';mid.appendChild(badge)}badge.classList.toggle('active',index===current&&game.round>=2);badge.innerHTML=`<i>${objective.icon}</i><b>${objective.name}</b><small>${objective.text}</small>`;const a=laneStrength(game.p[0],index),b=laneStrength(game.p[1],index);lane.dataset.control=a===b?'tie':a>b?'player':'enemy'});
  let doctrine=document.getElementById('arcDoctrineBadge');if(!doctrine){doctrine=document.createElement('div');doctrine.id='arcDoctrineBadge';document.body.appendChild(doctrine)}const me=game.p?.[0],info=CLASS_INFO[me?.classId];doctrine.innerHTML=`<span>${info?.icon||'✦'}</span><div><small>DOUTRINA ATIVA</small><b>${esc(me?.reforgedDoctrine||info?.doctrine||'Identidade Arcana')}</b>${me?.fusion130?`<em>✦ ${esc(me.fusion130)}</em>`:''}</div>`;doctrine.classList.remove('hidden');
}

function injectLobby(){
  const grid=document.querySelector('#arcLobbyRoot .arcFeatureGrid');if(!grid||grid.querySelector('[data-reforge-action="fusion"]'))return;const button=document.createElement('button');button.className='arcFeature arcReforgeFeature';button.dataset.reforgeAction='fusion';button.innerHTML='<span class="arcFeatureIcon">✦</span><b>Fusão Arcana</b><small>Combine duas criaturas do deck</small><span class="arcFeatureBadge">1.3</span>';grid.appendChild(button);
}
function actions(event){const action=event.target.closest?.('[data-reforge-action]')?.dataset.reforgeAction;if(action==='fusion'){event.preventDefault();event.stopImmediatePropagation();fusionSelection=[];renderFusion()}}
function migrate(){const value=data();saveData(value)}
function recordMatch(){const value=data();value.matches=Number(value.matches||0)+1;value.fragments=Number(value.fragments||0)+1;saveData(value)}
function install(){migrate();wrapDeckBuilder();document.addEventListener('click',actions,true);window.addEventListener('arcana:match',recordMatch);setInterval(()=>{wrapDeckBuilder();injectLobby();renderBattleUi()},180);document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.arcReforgeOverlay:not(.hidden)').forEach(root=>root.classList.add('hidden'))});if(globalThis.__ARCANA)globalThis.__ARCANA.version=VERSION}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
globalThis.ArcanaReforged={version:VERSION,handlesRoutes:true,processRound,openFusion:renderFusion,objectives:OBJECTIVES,state:data};
})();
