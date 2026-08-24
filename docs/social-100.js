(()=>{
'use strict';

const VERSION='1.0.1';
const MODE_KEY='arcana_lobby_mode_v1';
let root=null;
let currentUser=null;
let busy=false;
const online=()=>globalThis.ArcanaOnline;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));

function notice(message,state=''){
  const node=root?.querySelector('#arcSocialStatus');if(node){node.textContent=message;node.dataset.state=state}
}

async function identity(){
  try{currentUser=await online()?.user?.()||null}catch{currentUser=null}
  return currentUser;
}

function shell(){
  if(root)return root;root=document.createElement('section');root.id='arcanaSocial100';root.className='hidden';document.body.appendChild(root);return root;
}

async function open(){
  if(!online()?.friendList||!await identity()){online()?.open?.();return}
  shell().classList.remove('hidden');root.innerHTML=`<div class="arcSocialPanel"><header><div><small>CONTA ARCANA · SOCIAL 1.0</small><h2>Amigos & Desafios</h2></div><button id="arcSocialClose">×</button></header><section class="arcSocialIdentity"><div><small>SEU ID ARCANA</small><code>${esc(currentUser.id)}</code></div><button id="arcSocialCopy">COPIAR ID</button></section><p>Compartilhe seu ID com quem você conhece. Solicitações, presença e amizades são validadas pelo servidor; ninguém recebe seu e-mail ou seus dados privados.</p><div class="arcSocialAdd"><input id="arcSocialInput" maxlength="36" spellcheck="false" placeholder="Cole o ID Arcana do amigo"><button id="arcSocialAdd">ENVIAR PEDIDO</button></div><span id="arcSocialStatus">Carregando seus amigos...</span><div id="arcSocialRows"></div></div>`;
  root.querySelector('#arcSocialClose').onclick=close;root.onclick=event=>{if(event.target===root)close()};root.querySelector('#arcSocialCopy').onclick=async()=>{await navigator.clipboard.writeText(currentUser.id);notice('Seu ID foi copiado.','ok')};root.querySelector('#arcSocialAdd').onclick=sendRequest;root.querySelector('#arcSocialInput').onkeydown=event=>{if(event.key==='Enter')sendRequest()};await load();
}

function close(){root?.classList.add('hidden')}

function errorText(error){return ({user_not_found:'Nenhuma Conta Arcana existe com esse ID.',incoming_pending:'Essa pessoa já enviou um pedido para você. Aceite abaixo.',invalid_request:'Cole um ID Arcana válido e diferente do seu.',request_not_found:'O pedido não existe mais.',banned:'Sua conta está suspensa para recursos online.'}[error?.code]||'O servidor social não está disponível neste momento.')}

async function sendRequest(){
  if(busy)return;const input=root.querySelector('#arcSocialInput'),target=input.value.trim();if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(target))return notice('Cole um ID Arcana válido.','error');
  busy=true;notice('Enviando pedido...');try{await online().friendRequest(target);input.value='';notice('Pedido enviado.','ok');await load()}catch(error){notice(errorText(error),'error')}finally{busy=false}
}

async function load(){
  const rows=root?.querySelector('#arcSocialRows');if(!rows)return;
  try{
    const entries=await online().friendList();notice(`${entries.filter(item=>item.direction==='friend').length} amigos · ${entries.filter(item=>item.direction==='incoming').length} pedidos recebidos`);
    rows.innerHTML=entries.length?entries.map(item=>`<article class="arcSocialFriend ${item.online?'online':''}"><span>${esc((item.displayName||'A').slice(0,1).toUpperCase())}</span><div><b>${esc(item.displayName||'Arcano')}</b><small>${item.direction==='incoming'?'PEDIDO RECEBIDO':item.direction==='outgoing'?'PEDIDO ENVIADO':item.online?item.presenceState==='match'?`ONLINE · ${esc(item.mode||'em partida')}`:'ONLINE · NO LOBBY':'OFFLINE'}</small><code>${esc(item.userId)}</code></div><div>${item.direction==='incoming'?`<button data-accept="${esc(item.userId)}">ACEITAR</button>`:item.direction==='friend'?`<button data-challenge="${esc(item.userId)}">DESAFIAR</button>`:''}<button data-copy="${esc(item.userId)}">ID</button><button class="danger" data-remove="${esc(item.userId)}">${item.direction==='friend'?'REMOVER':'CANCELAR'}</button></div></article>`).join(''):'<div class="arcSocialEmpty"><span>♟</span><b>Nenhum amigo ainda</b><p>Envie seu ID para um amigo ou cole o ID dele acima.</p></div>';
    rows.querySelectorAll('[data-accept]').forEach(button=>button.onclick=()=>act(()=>online().friendAccept(button.dataset.accept),'Pedido aceito.'));
    rows.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>act(()=>online().friendRemove(button.dataset.remove),'Amizade ou pedido removido.'));
    rows.querySelectorAll('[data-copy]').forEach(button=>button.onclick=async()=>{await navigator.clipboard.writeText(button.dataset.copy);notice('ID do amigo copiado.','ok')});
    rows.querySelectorAll('[data-challenge]').forEach(button=>button.onclick=()=>challenge(button.dataset.challenge));
  }catch(error){notice(errorText(error),'error');rows.innerHTML='<div class="arcSocialEmpty"><span>☁</span><b>Social indisponível</b><p>A migração online da versão 1.0 ainda não respondeu.</p></div>'}
}

async function act(call,success){
  if(busy)return;busy=true;try{await call();notice(success,'ok');await load()}catch(error){notice(errorText(error),'error')}finally{busy=false}
}

function challenge(friendId){
  localStorage.setItem(MODE_KEY,'duel');close();const mode=document.querySelector('[data-mode-choice="duel"]');mode?.click();setTimeout(()=>document.querySelector('[data-action="play"]')?.click(),80);setTimeout(()=>document.getElementById('setupCreate')?.click(),260);navigator.clipboard?.writeText(friendId).catch(()=>{});
}

async function refreshEvent(){
  if(!online()?.currentEvent||!await identity())return;
  try{const event=await online().currentEvent();if(event){globalThis.ArcanaLiveEvent={id:event.id,icon:event.icon||'✦',name:event.title,desc:event.description,tone:event.rules?.tone||'#63e7ff',official:true,endsAt:event.endsAt}}}catch{}
}

function intercept(event){
  const button=event.target.closest?.('[data-action="friends"]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();open();
}

function install(){document.addEventListener('click',intercept,true);window.addEventListener('arcana:identity',()=>{identity();refreshEvent()});setTimeout(refreshEvent,800);setInterval(()=>{if(root&&!root.classList.contains('hidden'))load()},12000);document.addEventListener('keydown',event=>{if(event.key==='Escape')close()})}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
globalThis.ArcanaSocial={version:VERSION,open,refresh:load};
})();
