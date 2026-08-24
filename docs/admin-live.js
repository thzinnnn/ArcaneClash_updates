(()=>{
'use strict';

const VERSION='1.0.1';
const MODE_KEY='arcana_lobby_mode_v1';
let user=null;
let context=null;
let heartbeatBusy=false;
let lastBeat=0;
let lastState='';
let liveTimer=null;
let spectatorTimer=null;
let spectatorTarget=null;
let installed=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const online=()=>globalThis.ArcanaOnline;
const modeId=()=>globalThis.__ARCANA?.state?.()?.mode||localStorage.getItem(MODE_KEY)||'solo';
const modeName=id=>globalThis.__ARCANA?.modes?.[id]?.name||id||'Lobby';

function notify(message,state=''){
  let node=document.getElementById('arcAdminLiveToast');if(!node){node=document.createElement('div');node.id='arcAdminLiveToast';document.body.appendChild(node)}
  node.textContent=message;node.dataset.state=state;node.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>node.classList.remove('show'),3000);
}

function unit(unit){return {name:String(unit?.name||'Criatura').slice(0,48),icon:String(unit?.icon||'✦').slice(0,8),atk:Math.max(0,Number(unit?.atk||0)),hp:Math.max(0,Number(unit?.hp||0)),shield:!!unit?.shield,frozen:Math.max(0,Number(unit?.frozen||0))}}

function safeSnapshotFromGame(value){
  if(!value?.p?.length)return null;
  const sides=value.p.slice(0,2).map(side=>({name:String(side.hero?.name||'Arcano').slice(0,32),icon:String(side.hero?.icon||'✦').slice(0,8),hp:Math.max(0,Number(side.hp||0)),maxHp:Math.max(1,Number(side.maxHp||1)),mana:Math.max(0,Number(side.mana||0)),maxMana:Math.max(0,Number(side.maxMana||0)),handCount:Array.isArray(side.hand)?side.hand.length:Number(side.handCount||0),reserve:Array.isArray(side.deck)?side.deck.length:Number(side.deck||0),classId:String(side.classId||'').slice(0,32),lanes:[0,1,2].map(index=>(side.lanes?.[index]||[]).slice(0,2).map(unit))}));
  return {schema:1,round:Math.max(1,Number(value.round||1)),turn:Number(value.cur||0),over:!!value.over,winner:value.winner==null?null:Number(value.winner),event:value.event?String(value.event.name||'Evento').slice(0,64):null,sides};
}

function safeSnapshotFromDom(){
  if(!document.body.classList.contains('arcBattleActive')&&!document.querySelector('.partyGameTop'))return null;
  const hp=text=>Math.max(0,Number(String(text||'').match(/\d+/)?.[0]||0));
  const lanes=[...document.querySelectorAll('#board .lane')].slice(0,3).map(lane=>{const zones=lane.querySelectorAll(':scope > .zone');const parseZone=zone=>[...(zone?.querySelectorAll('.unit')||[])].map(node=>({name:node.querySelector('.un')?.textContent?.trim()||'Criatura',icon:node.querySelector('.ui')?.textContent?.trim()||'✦',atk:hp(node.querySelector('.atk')?.textContent),hp:hp(node.querySelector('.life')?.textContent)}));return {op:parseZone(zones[0]),me:parseZone(zones[1])}});
  return {schema:1,round:hp(document.getElementById('roundText')?.textContent)||1,turn:/SUA VEZ/.test(document.getElementById('turnText')?.textContent||'')?0:1,over:false,sides:[{name:document.getElementById('meHero')?.textContent||'Arcano',icon:document.getElementById('meAvatar')?.textContent||'✦',hp:hp(document.getElementById('meHp')?.textContent),handCount:document.querySelectorAll('#hand .card').length,lanes:lanes.map(lane=>lane.me)},{name:document.getElementById('enemyHero')?.textContent||'Rival',icon:document.getElementById('enemyAvatar')?.textContent||'✦',hp:hp(document.getElementById('enemyHp')?.textContent),handCount:hp(document.getElementById('enemyHand')?.textContent),lanes:lanes.map(lane=>lane.op)}]};
}

function presence(){
  const raw=globalThis.__ARCANA?.state?.()||globalThis.ArcanaPartyLive?.state?.(),snapshot=safeSnapshotFromGame(raw)||safeSnapshotFromDom();
  if(snapshot){const id=String(raw?.id||sessionStorage.getItem('arcana_live_match_id')||crypto.randomUUID?.()||Date.now());sessionStorage.setItem('arcana_live_match_id',id);return {state:'match',mode:raw?.mode||modeId(),matchId:id,snapshot}}
  sessionStorage.removeItem('arcana_live_match_id');return {state:document.getElementById('home')?.classList.contains('hidden')?'menu':'lobby',mode:modeId(),matchId:null,snapshot:null};
}

function showBan(ban){
  let root=document.getElementById('arcanaBanScreen');if(!root){root=document.createElement('section');root.id='arcanaBanScreen';document.body.appendChild(root)}
  const expiry=ban?.permanent?'Permanente':ban?.expiresAt?new Date(ban.expiresAt).toLocaleString('pt-BR'):'Até revisão administrativa';
  root.innerHTML=`<div><span>⛔</span><small>CONTA ARCANA SUSPENSA</small><h1>Acesso online bloqueado</h1><p>${esc(ban?.reason||'Esta conta foi suspensa pela administração.')}</p><dl><div><dt>DURAÇÃO</dt><dd>${esc(expiry)}</dd></div><div><dt>PROTEÇÃO</dt><dd>Nenhum save ou partida online será aceito enquanto o banimento estiver ativo.</dd></div></dl><button id="arcBanSignOut">SAIR DA CONTA</button><button id="arcBanRetry">VERIFICAR NOVAMENTE</button></div>`;
  root.querySelector('#arcBanSignOut').onclick=async()=>{await online()?.signOut?.();location.reload()};root.querySelector('#arcBanRetry').onclick=()=>heartbeat(true);
}

async function refreshIdentity(){
  try{user=await online()?.user?.()||null;context=user?await online()?.context?.()||null:null}catch{user=null;context=null}
  installAdminSection();
}

async function heartbeat(force=false){
  if(heartbeatBusy||!online()?.presenceHeartbeat)return;
  if(!user){if(force)await refreshIdentity();if(!user)return}
  const value=presence(),signature=JSON.stringify([value.state,value.mode,value.matchId,value.snapshot?.round,value.snapshot?.turn,value.snapshot?.sides?.map(side=>[side.hp,side.mana,side.handCount,side.lanes?.map(lane=>lane.map(unit=>[unit.name,unit.atk,unit.hp]))])]);
  const wait=value.state==='match'?2600:12000;if(!force&&signature===lastState&&Date.now()-lastBeat<wait)return;
  heartbeatBusy=true;
  try{const result=await online().presenceHeartbeat(value);if(result?.code==='banned')showBan(result.ban);else document.getElementById('arcanaBanScreen')?.remove();lastBeat=Date.now();lastState=signature}catch(error){if(!/function|404|PGRST202/i.test(String(error?.message||error)))console.warn('Arcana presence unavailable') }finally{heartbeatBusy=false}
}

function requireAccount(event){
  const target=event.target.closest?.('#setupCreate,#setupJoin,#createRoom,#openJoin,.arcPlayPrimary');if(!target)return;
  const selected=localStorage.getItem(MODE_KEY)||'solo',mode=globalThis.__ARCANA?.modes?.[selected];if(!mode?.online||user)return;
  event.preventDefault();event.stopImmediatePropagation();notify('Entre na Conta Arcana para jogar modos online protegidos.','error');online()?.open?.();
}

function statusText(error){return ({mfa_required:'Confirme novamente o código MFA na Conta Arcana.',forbidden:'O servidor recusou a permissão administrativa.',player_offline:'O jogador ficou offline.',not_in_match:'O jogador está online, mas não está em uma partida.',invalid_request:'Confira o ID, a duração e um motivo com pelo menos 8 caracteres.',user_not_found:'Conta não encontrada.'}[error?.code]||'Não foi possível concluir esta operação.')}

function installAdminSection(){
  if(context?.role!=='admin'||!context?.adminReady)return;
  const body=document.querySelector('#arcLobbyModal .arcLobbyModalBody');if(!body||!body.querySelector('.arcAdminIdentity')||body.querySelector('#arcAdminLive'))return;
  const section=document.createElement('section');section.id='arcAdminLive';section.innerHTML=`<header><div><small>MODERAÇÃO EM TEMPO REAL</small><h3>Jogadores online</h3></div><div><button id="arcAdminEvent">CRIAR EVENTO</button><button id="arcAdminReloadLive">ATUALIZAR</button></div></header><p>Veja IDs, acompanhe partidas sem revelar mãos privadas e aplique banimentos auditados. Somente contas autenticadas aparecem aqui.</p><div id="arcAdminLiveRows"><span class="arcAdminLiveStatus">Consultando o servidor...</span></div>`;
  body.querySelector('.arcAdminIdentity').after(section);section.querySelector('#arcAdminReloadLive').onclick=loadLivePlayers;section.querySelector('#arcAdminEvent').onclick=configureEvent;loadLivePlayers();
}

async function configureEvent(){
  const title=prompt('Nome do evento oficial:','Convergência Arcana');if(title===null)return;
  const description=prompt('Descrição do evento (mínimo de 8 caracteres):','Maestria acelerada e recompensas especiais durante a semana.');if(description===null)return;
  const days=Math.trunc(Number(prompt('Duração em dias (1 a 30):','7')));if(!title.trim()||description.trim().length<8||!Number.isFinite(days)||days<1||days>30)return notify('Confira nome, descrição e duração do evento.','error');
  const reason=prompt('Motivo administrativo (mínimo de 8 caracteres):','Programação do evento oficial da temporada');if(reason===null||reason.trim().length<8)return;
  const startsAt=new Date(),endsAt=new Date(startsAt.getTime()+days*86400000);
  try{await online().adminSetEvent({eventId:`event-${Date.now().toString(36)}`,title,description,icon:'🌌',rules:{tone:'#7f8cff',masteryMultiplier:2},startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString(),reason});globalThis.ArcanaLiveEvent={id:`event-${Date.now().toString(36)}`,icon:'🌌',name:title.trim(),desc:description.trim(),tone:'#7f8cff',official:true,endsAt:endsAt.toISOString()};notify('Evento oficial publicado e operação auditada.','ok')}catch(error){notify(statusText(error),'error')}
}

async function loadLivePlayers(){
  const rows=document.getElementById('arcAdminLiveRows');if(!rows)return;rows.innerHTML='<span class="arcAdminLiveStatus">Atualizando...</span>';
  try{
    const entries=await online().adminLivePlayers();
    rows.innerHTML=entries.length?entries.map(player=>`<article class="arcLivePlayer ${player.banned?'banned':''}"><span class="arcLiveDot"></span><div><b>${esc(player.displayName||'Arcano')}</b><small>${esc(player.state==='match'?`${modeName(player.mode)} · em partida`:player.state==='lobby'?'no lobby':'nos menus')}</small><code>${esc(player.userId)}</code></div><div><button data-copy-id="${esc(player.userId)}">ID</button>${player.state==='match'?`<button data-watch="${esc(player.userId)}">ASSISTIR</button>`:''}<button class="danger" data-ban="${esc(player.userId)}">BANIR</button>${player.banned?`<button data-unban="${esc(player.userId)}">DESBANIR</button>`:''}</div></article>`).join(''):'<span class="arcAdminLiveStatus">Nenhuma Conta Arcana online nos últimos 45 segundos.</span>';
    rows.querySelectorAll('[data-copy-id]').forEach(button=>button.onclick=async()=>{await navigator.clipboard.writeText(button.dataset.copyId);notify('ID da conta copiado.','ok')});
    rows.querySelectorAll('[data-watch]').forEach(button=>button.onclick=()=>openSpectator(button.dataset.watch));
    rows.querySelectorAll('[data-ban]').forEach(button=>button.onclick=()=>banPlayer(button.dataset.ban));
    rows.querySelectorAll('[data-unban]').forEach(button=>button.onclick=()=>unbanPlayer(button.dataset.unban));
  }catch(error){rows.innerHTML=`<span class="arcAdminLiveStatus error">${esc(statusText(error))}</span>`}
}

async function banPlayer(targetUserId){
  const reason=prompt('Motivo do banimento (mínimo de 8 caracteres):','Violação das regras do ArcanaClash');if(reason==null)return;
  if(reason.trim().length<8)return notify('Informe um motivo com pelo menos 8 caracteres.','error');
  const duration=prompt('Duração em minutos. Deixe vazio para permanente:','1440');if(duration===null)return;
  const minutes=duration.trim()===''?null:Math.trunc(Number(duration));if(minutes!==null&&(!Number.isFinite(minutes)||minutes<5||minutes>525600))return notify('Use de 5 a 525600 minutos, ou vazio para permanente.','error');
  if(!confirm(`Tem certeza que deseja banir a conta ${targetUserId}?\n\nMotivo: ${reason}\nDuração: ${minutes===null?'permanente':`${minutes} minutos`}`))return;
  try{await online().adminBan({targetUserId,reason,durationMinutes:minutes});notify('Conta banida e operação registrada na auditoria.','ok');loadLivePlayers()}catch(error){notify(statusText(error),'error')}
}

async function unbanPlayer(targetUserId){
  if(!confirm(`Remover o banimento da conta ${targetUserId}?`))return;
  try{await online().adminUnban({targetUserId,reason:'Banimento removido pelo administrador'});notify('Banimento removido e auditado.','ok');loadLivePlayers()}catch(error){notify(statusText(error),'error')}
}

function spectatorMarkup(result){
  const snapshot=result.snapshot||{},sides=snapshot.sides||[],a=sides[0]||{},b=sides[1]||{};
  return `<header><div><small>ESPECTADOR ADM · SOMENTE LEITURA</small><h2>${esc(result.player?.displayName||'Partida')}</h2><p>${esc(modeName(result.player?.mode))} · ${esc(result.player?.matchId||'')}</p></div><button id="arcSpectatorClose">×</button></header><div class="arcSpectatorScore"><article><span>${esc(a.icon||'✦')}</span><b>${esc(a.name||'Arcano')}</b><strong>${Number(a.hp||0)}♥</strong><small>${Number(a.handCount||0)} cartas · ${Number(a.mana||0)}/${Number(a.maxMana||0)} mana</small></article><div><small>RODADA</small><b>${Number(snapshot.round||1)}</b><span>${Number(snapshot.turn||0)===0?'VEZ DO ARCANO':'VEZ DO RIVAL'}</span></div><article><span>${esc(b.icon||'✦')}</span><b>${esc(b.name||'Rival')}</b><strong>${Number(b.hp||0)}♥</strong><small>${Number(b.handCount||0)} cartas · ${Number(b.mana||0)}/${Number(b.maxMana||0)} mana</small></article></div><div class="arcSpectatorBoard">${[0,1,2].map(index=>`<article><small>ROTA ${index+1}</small><div>${(b.lanes?.[index]||[]).map(unit=>`<span>${esc(unit.icon)} <b>${esc(unit.name)}</b><i>${unit.atk}/${unit.hp}</i></span>`).join('')||'<em>Vazia</em>'}</div><div>${(a.lanes?.[index]||[]).map(unit=>`<span>${esc(unit.icon)} <b>${esc(unit.name)}</b><i>${unit.atk}/${unit.hp}</i></span>`).join('')||'<em>Vazia</em>'}</div></article>`).join('')}</div><footer>As cartas nas mãos não são transmitidas. O espectador recebe apenas o estado público do campo.</footer>`;
}

async function openSpectator(targetUserId){
  spectatorTarget=targetUserId;let root=document.getElementById('arcAdminSpectator');if(!root){root=document.createElement('section');root.id='arcAdminSpectator';document.body.appendChild(root)}
  root.innerHTML='<div class="arcSpectatorPanel"><p class="arcAdminLiveStatus">Conectando ao estado seguro da partida...</p></div>';root.classList.remove('hidden');clearInterval(spectatorTimer);
  const refresh=async()=>{if(spectatorTarget!==targetUserId||!document.body.contains(root))return;try{const result=await online().adminSpectate(targetUserId);root.querySelector('.arcSpectatorPanel').innerHTML=spectatorMarkup(result);root.querySelector('#arcSpectatorClose').onclick=closeSpectator}catch(error){root.querySelector('.arcSpectatorPanel').innerHTML=`<button id="arcSpectatorClose">×</button><p class="arcAdminLiveStatus error">${esc(statusText(error))}</p>`;root.querySelector('#arcSpectatorClose').onclick=closeSpectator}};
  await refresh();spectatorTimer=setInterval(refresh,2400);
}

function closeSpectator(){spectatorTarget=null;clearInterval(spectatorTimer);document.getElementById('arcAdminSpectator')?.remove()}

function install(){
  if(installed)return;installed=true;refreshIdentity();document.addEventListener('click',requireAccount,true);window.addEventListener('arcana:identity',refreshIdentity);window.addEventListener('arcana:security',refreshIdentity);window.addEventListener('beforeunload',()=>online()?.presenceOffline?.());new MutationObserver(installAdminSection).observe(document.body,{subtree:true,childList:true});setInterval(()=>heartbeat(),900);liveTimer=setInterval(()=>{if(document.getElementById('arcAdminLiveRows'))loadLivePlayers()},10000);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
globalThis.ArcanaAdminLive={version:VERSION,refresh:loadLivePlayers,spectate:openSpectator,heartbeat:()=>heartbeat(true)};
})();
