const SB_URL='https://omhokhrpddahfowdkklb.supabase.co';
const SB_KEY=['sb','publishable','RsbRDUAfTbKTTeCAp4UloQ','XssHlksm'].join('_');
const PROFILE_KEY='arcana_profile_v2';
const STRATEGY_KEY='arcana_strategy_pack_v1';
const SESSION_KEY='arcana_supabase_session_v1';
const LOCAL_SYNC_KEY='arcana_cloud_known_revision_v1';
const SECURITY_VERSION='rls-rpc-v2';
const EMPTY_SECURITY={role:'player',aal:'aal1',adminReady:false,cloudAuthority:'unavailable'};

let knownRevision=Number(localStorage.getItem(LOCAL_SYNC_KEY)||0);
let syncTimer=null;
let syncing=false;
let lastSnapshot='';
let legacyChecked=false;
let conflictPending=false;
let securityContext={...EMPTY_SECURITY};
let trustedProgress=null;
let remoteAccount=null;

const parse=(value,fallback=null)=>{try{return JSON.parse(value)}catch{return fallback}};
const snapshot=()=>JSON.stringify({profile:parse(localStorage.getItem(PROFILE_KEY),{}),strategy:parse(localStorage.getItem(STRATEGY_KEY),{})});
const localSave=()=>({...parse(snapshot(),{}),schema:2});
const requestId=()=>{
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  const bytes=new Uint8Array(16);
  if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(bytes);
  else for(let index=0;index<bytes.length;index++)bytes[index]=Math.floor(Math.random()*256);
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(value=>value.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};

function migrateLegacySession(){
  const legacy=parse(localStorage.getItem(SESSION_KEY));
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('arcana_remember_account');
  if(legacy?.access_token&&legacy?.refresh_token&&!sessionStorage.getItem(SESSION_KEY)){
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(legacy));
  }
}

function getSession(){
  const session=parse(sessionStorage.getItem(SESSION_KEY));
  return session?.access_token&&session?.refresh_token?session:null;
}

function setSession(session){
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('arcana_remember_account');
  sessionStorage.removeItem(SESSION_KEY);
  if(session?.access_token&&session?.refresh_token)sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
}

function clearSession(){
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('arcana_remember_account');
}

async function sb(path,{method='GET',body,token}={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  const headers={apikey:SB_KEY,Accept:'application/json','Content-Type':'application/json','X-Client-Info':`ArcanaClash/${SECURITY_VERSION}`};
  if(token)headers.Authorization=`Bearer ${token}`;
  try{
    const response=await fetch(`${SB_URL}${path}`,{
      method,
      headers,
      body:body===undefined?undefined:JSON.stringify(body),
      cache:'no-store',
      credentials:'omit',
      referrerPolicy:'no-referrer',
      signal:controller.signal
    });
    let data={};
    try{data=await response.json()}catch{}
    if(!response.ok){
      const error=new Error('request_failed');
      error.status=response.status;
      error.code=data.code||data.error_code||'';
      throw error;
    }
    return data;
  }finally{clearTimeout(timeout)}
}

async function refreshIfNeeded(){
  let session=getSession();
  if(!session)return null;
  if(session.expires_at&&Date.now()/1000<session.expires_at-90)return session;
  try{
    const next=await sb('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});
    session={...session,...next,expires_at:Math.floor(Date.now()/1000)+(next.expires_in||3600)};
    setSession(session);
    return session;
  }catch{
    clearSession();
    conflictPending=false;securityContext={...EMPTY_SECURITY};trustedProgress=null;remoteAccount=null;
    return null;
  }
}

async function currentUser(){
  const session=await refreshIfNeeded();
  if(!session)return null;
  return sb('/auth/v1/user',{token:session.access_token});
}

async function rpc(name,params={}){
  const session=await refreshIfNeeded();
  if(!session)throw Object.assign(new Error('not_logged'),{code:'not_logged'});
  try{return await sb(`/rest/v1/rpc/${name}`,{method:'POST',token:session.access_token,body:params})}
  catch(error){
    if([404,405,428].includes(error.status))error.code='server_protection_missing';
    throw error;
  }
}

function normalizeAccount(data){
  remoteAccount=data&&typeof data==='object'?data:null;
  securityContext={...EMPTY_SECURITY,...(remoteAccount?.security||{})};
  trustedProgress=remoteAccount?.trusted||null;
  knownRevision=Number(remoteAccount?.revision||0);
  localStorage.setItem(LOCAL_SYNC_KEY,String(knownRevision));
  return remoteAccount;
}

async function loadAccount(migrate=true){
  let data;
  if(migrate&&!legacyChecked){
    data=await rpc('arcana_migrate_legacy_save');
    legacyChecked=true;
  }else data=await rpc('arcana_load_account');
  return normalizeAccount(data);
}

async function signIn(email,password){
  const data=await sb('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
  data.expires_at=Math.floor(Date.now()/1000)+(data.expires_in||3600);
  setSession(data);legacyChecked=false;
  return data;
}

async function signUp(email,password,displayName){
  const data=await sb('/auth/v1/signup',{method:'POST',body:{email,password,data:{display_name:displayName||email.split('@')[0]}}});
  if(data.access_token){data.expires_at=Math.floor(Date.now()/1000)+(data.expires_in||3600);setSession(data)}
  legacyChecked=false;
  return data;
}

async function signOut(){
  const session=getSession();
  try{if(session?.access_token)await sb('/auth/v1/logout',{method:'POST',token:session.access_token})}catch{}
  clearSession();knownRevision=0;legacyChecked=false;conflictPending=false;securityContext={...EMPTY_SECURITY};trustedProgress=null;remoteAccount=null;
  localStorage.removeItem(LOCAL_SYNC_KEY);renderButton();mini('LOCAL');
  window.dispatchEvent(new CustomEvent('arcana:identity',{detail:null}));
  window.dispatchEvent(new CustomEvent('arcana:security',{detail:{...securityContext}}));
}

async function writeCloud(payload,baseRevision=knownRevision){
  const result=await rpc('arcana_save_cloud',{
    p_payload:payload,
    p_base_revision:Number(baseRevision||0),
    p_request_id:requestId()
  });
  if(!result?.ok){
    const error=Object.assign(new Error(result?.code||'cloud_rejected'),{code:result?.code||'cloud_rejected',retryAfterMs:result?.retryAfterMs});
    if(error.code==='revision_conflict'){
      const latest=await loadAccount(false);
      error.remote=latest?.save?{...latest.save,revision:Number(latest.revision||0)}:null;
    }
    throw error;
  }
  knownRevision=Number(result.revision||0);
  localStorage.setItem(LOCAL_SYNC_KEY,String(knownRevision));
  lastSnapshot=snapshot();
  return result;
}

async function syncNow(silent=false){
  if(syncing||conflictPending)return;
  const session=await refreshIfNeeded();
  if(!session)return;
  syncing=true;if(!silent)mini('SALVANDO...');
  try{
    await writeCloud(localSave());
    mini(securityContext.adminReady?'ADMIN · PROTEGIDO':'PROTEGIDO');
    status('☁ SAVE PRIVADO SINCRONIZADO','ok');
  }catch(error){
    if(error.code==='revision_conflict'){
      mini('CONFLITO');showConflict(error.remote);
    }else if(error.code==='rate_limited'){
      mini('AGUARDANDO');
      setTimeout(()=>syncNow(true),Math.max(2000,Number(error.retryAfterMs)||2000));
    }else if(error.code==='server_protection_missing'){
      mini('PROTEÇÃO PENDENTE');
      if(!silent)status('A proteção do banco ainda não foi ativada. O save local foi preservado e nada foi enviado.','error');
    }else{
      mini('OFFLINE');
      if(!silent)status('Não foi possível acessar o cofre online. O save local foi mantido.','error');
    }
  }finally{syncing=false}
}

function scheduleSync(){
  if(!getSession()||conflictPending)return;
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>syncNow(true),3200);
}

function applyCloud(cloud){
  if(!cloud)return;
  conflictPending=false;
  localStorage.setItem(PROFILE_KEY,JSON.stringify(cloud.profile||{}));
  localStorage.setItem(STRATEGY_KEY,JSON.stringify(cloud.strategy||{}));
  knownRevision=Number(cloud.revision||0);
  localStorage.setItem(LOCAL_SYNC_KEY,String(knownRevision));
  lastSnapshot=snapshot();
  location.reload();
}

function status(text,state=''){
  const element=document.getElementById('arcAccountStatus');
  if(element){element.textContent=text;element.dataset.state=state}
}

function mini(text){
  let element=document.getElementById('arcCloudMini');
  if(!element){element=document.createElement('div');element.id='arcCloudMini';document.body.appendChild(element)}
  element.textContent=`☁ ${text}`;
}

function showConflict(remote){
  openPanel();
  const conflict=document.getElementById('arcConflict');
  if(!conflict)return;
  conflictPending=true;
  conflict.classList.remove('hidden');
  conflict.querySelector('#arcUseCloud').onclick=()=>applyCloud(remote);
  conflict.querySelector('#arcUseLocal').onclick=async()=>{
    knownRevision=Number(remote?.revision||0);
    localStorage.setItem(LOCAL_SYNC_KEY,String(knownRevision));
    conflictPending=false;conflict.classList.add('hidden');await syncNow(false);
  };
  conflict.querySelector('#arcLater').onclick=closePanel;
}

function renderButton(){
  const button=document.getElementById('arcAccountMenuBtn');
  if(!button)return;
  const session=getSession();
  button.classList.toggle('logged',!!session);
  button.textContent=session?'CONTA ARCANA':'☁ CONTA ARCANA';
}

function build(){
  if(document.getElementById('arcAccountOnline'))return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='./account-online.css?v=security4';document.head.appendChild(css);
  const mfaCss=document.createElement('link');mfaCss.rel='stylesheet';mfaCss.href='./account-mfa.css?v=security4';document.head.appendChild(mfaCss);
  const root=document.createElement('section');
  root.id='arcAccountOnline';root.className='arcAccountOnline hidden';
  root.innerHTML=`<div class="arcAccountBackdrop"></div><div class="arcAccountPanel"><div class="arcAccountHead"><div><small>ARCANA CLASH ONLINE · COFRE V2</small><h2>☁ Conta Arcana</h2></div><button class="arcAccountClose" aria-label="Fechar">×</button></div><div id="arcAccountGuest"><p class="arcAccountLead">Entre para usar um save isolado por conta. Tokens e permissões ADM nunca entram no save.</p><label class="arcAccountField"><span>NOME</span><input id="arcDisplayName" maxlength="24" autocomplete="nickname" placeholder="Seu nome no jogo"></label><label class="arcAccountField"><span>E-MAIL</span><input id="arcEmail" type="email" maxlength="254" autocomplete="email" placeholder="voce@email.com"></label><label class="arcAccountField"><span>SENHA</span><input id="arcPassword" type="password" autocomplete="current-password" minlength="12" maxlength="128" placeholder="12+ caracteres fortes"></label><p class="arcPasswordHint">Use maiúscula, minúscula, número e símbolo. A sessão termina ao fechar o navegador.</p><div id="arcAccountStatus" class="arcAccountStatus">Use Entrar ou Criar conta.</div><div class="arcAccountActions"><button id="arcLogin" class="arcAccountPrimary">ENTRAR</button><button id="arcSignup" class="arcAccountSecondary">CRIAR CONTA</button></div></div><div id="arcAccountLogged" class="hidden"><div class="arcAccountProfile"><div class="arcAccountProfileIcon">☁</div><div><small>CONECTADO</small><strong id="arcAccountEmail"></strong></div></div><div id="arcAccountRole" class="arcAccountRole"></div><div id="arcAccountSecurity" class="arcAccountSecurity"></div><div id="arcMfaBox" class="arcMfaBox hidden"></div><div class="arcAccountCloud">SAVE PRIVADO · RLS · REVISÃO PROTEGIDA</div><div class="arcAccountActions"><button id="arcSync" class="arcAccountPrimary">SINCRONIZAR</button><button id="arcLogout" class="arcAccountDanger">SAIR DA CONTA</button></div></div><div id="arcConflict" class="arcConflict hidden"><b>CONFLITO DE SAVE</b><p>O save deste aparelho e o da nuvem são diferentes. Escolha qual deve continuar.</p><button id="arcUseCloud" class="arcAccountPrimary">USAR SAVE DA NUVEM</button><button id="arcUseLocal" class="arcAccountSecondary">USAR ESTE APARELHO</button><button id="arcLater" class="arcAccountSecondary">DECIDIR DEPOIS</button></div></div>`;
  document.body.appendChild(root);
  root.querySelector('.arcAccountBackdrop').onclick=closePanel;
  root.querySelector('.arcAccountClose').onclick=closePanel;
  root.querySelector('#arcLogin').onclick=loginUi;
  root.querySelector('#arcSignup').onclick=signupUi;
  root.querySelector('#arcSync').onclick=()=>syncNow(false);
  root.querySelector('#arcLogout').onclick=async()=>{await signOut();closePanel();renderUi()};
}

function openPanel(){build();document.getElementById('arcAccountOnline').classList.remove('hidden');if(conflictPending)document.getElementById('arcConflict')?.classList.remove('hidden');renderUi()}
function closePanel(){document.getElementById('arcAccountOnline')?.classList.add('hidden')}

function validEmail(email){return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
function strongPassword(password){return password.length>=12&&password.length<=128&&/[a-z]/.test(password)&&/[A-Z]/.test(password)&&/\d/.test(password)&&/[^A-Za-z0-9]/.test(password)}
function safeName(name){return name.replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,24)}

async function loginUi(){
  const email=document.getElementById('arcEmail').value.trim().toLowerCase();
  const password=document.getElementById('arcPassword').value;
  if(!validEmail(email)||!password)return status('Confira o e-mail e a senha.','error');
  status('Entrando...');
  try{await signIn(email,password);await afterAuth();status('Login seguro realizado.','ok');renderUi()}
  catch{status('Não foi possível entrar. Confira os dados ou aguarde antes de tentar novamente.','error')}
  finally{document.getElementById('arcPassword').value=''}
}

async function signupUi(){
  const email=document.getElementById('arcEmail').value.trim().toLowerCase();
  const password=document.getElementById('arcPassword').value;
  const name=safeName(document.getElementById('arcDisplayName').value);
  if(!validEmail(email))return status('Use um e-mail válido.','error');
  if(!strongPassword(password))return status('A senha precisa ter 12+ caracteres, maiúscula, minúscula, número e símbolo.','error');
  status('Criando conta protegida...');
  try{
    const data=await signUp(email,password,name);
    document.getElementById('arcPassword').value='';
    if(!data.access_token){status('Conta criada. Confirme o e-mail recebido e depois entre.','ok');return}
    await afterAuth();status('Conta criada e conectada.','ok');renderUi();
  }catch{status('Não foi possível criar a conta. O e-mail pode já estar em uso ou o limite de tentativas foi atingido.','error')}
  finally{document.getElementById('arcPassword').value=''}
}

async function afterAuth(){
  const account=await loadAccount(true);
  const cloud=account?.save?{...account.save,revision:Number(account.revision||0)}:null;
  const local=localSave();
  if(!cloud){
    conflictPending=false;knownRevision=0;await writeCloud(local,0);mini('PROTEGIDO');return;
  }
  const localSnap=JSON.stringify({profile:local.profile,strategy:local.strategy});
  const cloudSnap=JSON.stringify({profile:cloud.profile||{},strategy:cloud.strategy||{}});
  if(localSnap!==cloudSnap)showConflict(cloud);
  else{conflictPending=false;lastSnapshot=snapshot();mini(securityContext.adminReady?'ADMIN · PROTEGIDO':'PROTEGIDO')}
}

function showMfaCode(factorId,lead='Digite o código atual do seu aplicativo autenticador.'){
  const box=document.getElementById('arcMfaBox');if(!box)return;
  box.classList.remove('hidden');
  box.innerHTML=`<b>🛡️ VERIFICAÇÃO EM DUAS ETAPAS</b><p>${lead}</p><label><span>CÓDIGO DE 6 DÍGITOS</span><input id="arcMfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"></label><button id="arcMfaVerify" class="arcAccountPrimary">VERIFICAR CÓDIGO</button><small id="arcMfaStatus"></small>`;
  box.querySelector('#arcMfaCode').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,6);
  box.querySelector('#arcMfaVerify').onclick=()=>verifyMfa(factorId,box.querySelector('#arcMfaCode').value);
  box.querySelector('#arcMfaCode').focus();
}

function mfaQrSource(value){
  if(typeof value!=='string')return '';
  const qr=value.trim();
  if(/^data:image\/(?:svg\+xml|png|webp);/i.test(qr))return qr;
  const svgStart=qr.search(/<svg\b/i);
  if(svgStart!==-1&&/<\/svg>\s*$/i.test(qr))return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.slice(svgStart))}`;
  return '';
}

function encodeMfaPayload(value){
  const bytes=new TextEncoder().encode(value);
  let binary='';
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function mobileReaderQrSource(uri){
  if(typeof uri!=='string'||!uri.startsWith('otpauth://totp/'))return '';
  const bridge=new URL('./mfa-connect.html',location.href);
  bridge.hash=encodeMfaPayload(uri);
  const {qrcode}=await import('./vendor/qrcode-generator.mjs?v=204');
  const qr=qrcode(0,'M');
  qr.addData(bridge.href,'Byte');
  qr.make();
  return qr.createDataURL(5,20);
}

async function showMfaEnrollment(enrollment){
  const box=document.getElementById('arcMfaBox');if(!box)return;
  const factorId=enrollment?.id,totp=enrollment?.totp||{};
  box.classList.remove('hidden');
  box.innerHTML='<b>🛡️ ATIVAR AUTENTICADOR</b><p id="arcMfaLead">Use a câmera ou o Leitor de QR do celular. Depois toque em “Abrir no autenticador”.</p><div class="arcMfaQrTabs"><button id="arcMfaPhoneQr" class="active">CÂMERA DO CELULAR</button><button id="arcMfaDirectQr">DIRETO NO APP</button></div><img id="arcMfaQr" alt="QR code do autenticador"><small id="arcMfaQrHelp">Preparando QR para o leitor do celular…</small><details class="arcMfaManual"><summary>USAR CHAVE MANUAL</summary><code id="arcMfaSecret"></code></details><label><span>CÓDIGO DE 6 DÍGITOS</span><input id="arcMfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"></label><button id="arcMfaVerify" class="arcAccountPrimary">ATIVAR E VERIFICAR</button><small id="arcMfaStatus">Não compartilhe o QR nem a chave.</small>';
  const qr=box.querySelector('#arcMfaQr');
  const directQr=mfaQrSource(totp.qr_code);
  if(directQr)qr.src=directQr;
  box.querySelector('#arcMfaSecret').textContent=totp.secret||'';
  let phoneQr='';
  try{phoneQr=await mobileReaderQrSource(totp.uri)}catch{}
  const phoneButton=box.querySelector('#arcMfaPhoneQr'),directButton=box.querySelector('#arcMfaDirectQr'),help=box.querySelector('#arcMfaQrHelp'),lead=box.querySelector('#arcMfaLead');
  const showQr=mode=>{
    const usePhone=mode==='phone'&&phoneQr;
    const source=usePhone?phoneQr:directQr;
    if(source){qr.src=source;qr.hidden=false}else qr.hidden=true;
    phoneButton.classList.toggle('active',!!usePhone);directButton.classList.toggle('active',!usePhone);
    lead.textContent=usePhone?'Use a câmera ou o Leitor de QR do celular. Depois toque em “Abrir no autenticador”.':'Abra o Google Authenticator, Microsoft Authenticator ou app compatível e use o leitor dentro dele.';
    help.textContent=usePhone?'Compatível com o leitor comum do celular. A chave não é enviada ao servidor.':'QR tradicional para escanear diretamente dentro do aplicativo autenticador.';
  };
  phoneButton.disabled=!phoneQr;directButton.disabled=!directQr;
  phoneButton.onclick=()=>showQr('phone');directButton.onclick=()=>showQr('direct');
  showQr(phoneQr?'phone':'direct');
  if(!phoneQr&&!directQr)box.querySelector('#arcMfaStatus').textContent='QR indisponível. Use a chave manual e não a compartilhe.';
  box.querySelector('#arcMfaCode').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,6);
  box.querySelector('#arcMfaVerify').onclick=()=>verifyMfa(factorId,box.querySelector('#arcMfaCode').value);
}

async function beginMfa(){
  const box=document.getElementById('arcMfaBox');
  if(box){box.classList.remove('hidden');box.textContent='Preparando autenticação forte...'}
  try{
    const session=await refreshIfNeeded(),user=await currentUser();
    const factors=Array.isArray(user?.factors)?user.factors:[];
    const verified=factors.find(factor=>factor.factor_type==='totp'&&factor.status==='verified');
    if(verified)return showMfaCode(verified.id);
    const pending=factors.find(factor=>factor.factor_type==='totp'&&factor.status!=='verified');
    if(pending)try{await sb(`/auth/v1/factors/${pending.id}`,{method:'DELETE',token:session.access_token})}catch{}
    const enrollment=await sb('/auth/v1/factors',{method:'POST',token:session.access_token,body:{factor_type:'totp',friendly_name:'ArcanaClash ADM'}});
    await showMfaEnrollment(enrollment);
  }catch{if(box)box.textContent='Não foi possível iniciar o MFA agora. Tente novamente em instantes.'}
}

async function verifyMfa(factorId,code){
  const box=document.getElementById('arcMfaBox'),message=box?.querySelector('#arcMfaStatus');
  if(!factorId||!/^[0-9]{6}$/.test(code)){if(message)message.textContent='Digite os 6 números.';return}
  if(message)message.textContent='Verificando...';
  try{
    const session=await refreshIfNeeded();
    const challenge=await sb(`/auth/v1/factors/${factorId}/challenge`,{method:'POST',token:session.access_token,body:{}});
    const verified=await sb(`/auth/v1/factors/${factorId}/verify`,{method:'POST',token:session.access_token,body:{challenge_id:challenge.id,code}});
    const next={...session,...verified,expires_at:Math.floor(Date.now()/1000)+(verified.expires_in||3600)};
    setSession(next);await loadAccount(false);
    if(message)message.textContent='MFA confirmado. Operações ADM liberadas nesta sessão.';
    window.dispatchEvent(new CustomEvent('arcana:security',{detail:{...securityContext}}));
    setTimeout(renderUi,350);
  }catch{if(message)message.textContent='Código inválido ou expirado. Gere outro código e tente novamente.'}
}

async function renderUi(){
  build();
  const guest=document.getElementById('arcAccountGuest'),logged=document.getElementById('arcAccountLogged'),session=await refreshIfNeeded();
  guest.classList.toggle('hidden',!!session);logged.classList.toggle('hidden',!session);
  if(!session){mini('LOCAL');renderButton();return}
  try{
    const user=await currentUser();
    document.getElementById('arcAccountEmail').textContent=user?.email||'Conta Arcana';
    let account;
    try{account=await loadAccount(true)}catch(error){
      securityContext={...EMPTY_SECURITY};trustedProgress=null;remoteAccount=null;
      if(error.code==='server_protection_missing')mini('PROTEÇÃO PENDENTE');else mini('OFFLINE');
    }
    const role=document.getElementById('arcAccountRole'),security=document.getElementById('arcAccountSecurity');
    if(securityContext.role==='admin'){
      role.className=securityContext.adminReady?'arcAccountRole admin ready':'arcAccountRole admin locked';
      role.innerHTML=`<b>${securityContext.adminReady?'🛡️ ADM PROTEGIDO':'🔒 ADM BLOQUEADO'}</b><small>${securityContext.adminReady?'Papel validado no banco e MFA ativo nesta sessão.':'Sua função ADM foi reconhecida, mas operações exigem autenticação em duas etapas.'}</small>${securityContext.adminReady?'':'<button id="arcEnableMfa">ATIVAR / VERIFICAR MFA</button>'}`;
      role.querySelector('#arcEnableMfa')?.addEventListener('click',beginMfa);
      mini(securityContext.adminReady?'ADMIN · PROTEGIDO':'ADMIN · MFA');
    }else if(account){
      role.className='arcAccountRole ready';
      role.innerHTML='<b>✦ CONTA DE JOGADOR PROTEGIDA</b><small>Seu save está isolado por RLS. Esta conta não possui privilégios administrativos.</small>';
      mini('PROTEGIDO');
    }else{
      role.className='arcAccountRole locked';
      role.innerHTML='<b>⚠ PROTEÇÃO DO SERVIDOR PENDENTE</b><small>O login existe, mas o cofre RLS ainda não foi instalado. Nenhum save será enviado de modo inseguro.</small>';
    }
    security.innerHTML=`<span><b>${account?'RLS ATIVA':'RLS PENDENTE'}</b><small>Isolamento entre contas</small></span><span><b>${securityContext.aal?.toUpperCase()||'AAL1'}</b><small>Nível da sessão</small></span><span><b>${account?.integrity==='legacy_unverified'?'LEGADO':'PRIVADO'}</b><small>Save não competitivo</small></span>`;
    window.dispatchEvent(new CustomEvent('arcana:identity',{detail:user}));
    window.dispatchEvent(new CustomEvent('arcana:security',{detail:{...securityContext,trusted:trustedProgress}}));
  }catch{mini('OFFLINE')}
  renderButton();
}

async function getSecurityContext(force=false){
  if(force||securityContext.cloudAuthority==='unavailable')try{await loadAccount(true)}catch{}
  return {...securityContext,trusted:trustedProgress};
}

async function adminAdjust({targetUserId,coinsDelta=0,essenceDelta=0,reason=''}){
  const result=await rpc('arcana_admin_adjust_progress',{
    p_target_user_id:targetUserId,
    p_coins_delta:Number(coinsDelta||0),
    p_essence_delta:Number(essenceDelta||0),
    p_reason:String(reason||'').trim(),
    p_request_id:requestId()
  });
  if(!result?.ok)throw Object.assign(new Error(result?.code||'admin_rejected'),{code:result?.code||'admin_rejected'});
  if(targetUserId===(await currentUser())?.id)trustedProgress=result.trusted||trustedProgress;
  return result;
}

async function adminAudit(limit=25){
  const result=await rpc('arcana_admin_recent_audit',{p_limit:Math.max(1,Math.min(100,Number(limit)||25))});
  if(!result?.ok)throw Object.assign(new Error(result?.code||'admin_rejected'),{code:result?.code||'admin_rejected'});
  return result.entries||[];
}

function installButton(){
  const actions=document.querySelector('.homeActions');
  if(!actions||document.getElementById('arcAccountMenuBtn'))return;
  const button=document.createElement('button');button.id='arcAccountMenuBtn';button.className='ghost arcAccountMenuBtn';button.onclick=openPanel;actions.prepend(button);renderButton();
}

function install(){
  migrateLegacySession();build();installButton();renderUi();lastSnapshot=snapshot();
  window.addEventListener('arcana:profile',scheduleSync);
  window.addEventListener('online',()=>syncNow(true));
  setInterval(()=>{installButton();if(getSession()&&snapshot()!==lastSnapshot)scheduleSync()},3000);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
globalThis.ArcanaOnline={open:openPanel,sync:syncNow,user:currentUser,signOut,context:getSecurityContext,trusted:()=>trustedProgress,isAdmin:async()=>{const context=await getSecurityContext();return context.role==='admin'},beginMfa,adminAdjust,adminAudit};
