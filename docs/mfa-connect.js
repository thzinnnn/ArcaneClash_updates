(()=>{
  const button=document.getElementById('openAuthenticator');
  const status=document.getElementById('connectStatus');
  let enrollmentUri='';

  function decodePayload(value){
    if(!/^[A-Za-z0-9_-]{20,4096}$/.test(value))throw new Error('invalid-payload');
    const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
    const binary=atob(padded),bytes=new Uint8Array(binary.length);
    for(let index=0;index<binary.length;index+=1)bytes[index]=binary.charCodeAt(index);
    return new TextDecoder().decode(bytes);
  }

  function validTotpUri(value){
    if(typeof value!=='string'||value.length>2048)throw new Error('invalid-uri');
    const uri=new URL(value);
    const secret=uri.searchParams.get('secret')||'';
    if(uri.protocol!=='otpauth:'||uri.hostname!=='totp'||!/^[A-Z2-7]{16,128}$/i.test(secret))throw new Error('invalid-totp');
    if(!['SHA1','SHA256','SHA512'].includes((uri.searchParams.get('algorithm')||'SHA1').toUpperCase()))throw new Error('invalid-algorithm');
    if(!['6','8'].includes(uri.searchParams.get('digits')||'6'))throw new Error('invalid-digits');
    if((uri.searchParams.get('period')||'30')!=='30')throw new Error('invalid-period');
    return value;
  }

  try{
    const payload=location.hash.slice(1);
    history.replaceState(null,'',location.pathname+location.search);
    enrollmentUri=validTotpUri(decodePayload(payload));
    button.disabled=false;
    status.textContent='Vínculo pronto. Toque no botão para continuar.';
  }catch{
    status.textContent='Este vínculo expirou ou é inválido. Volte ao ArcanaClash e gere um QR novo.';
  }

  button.addEventListener('click',()=>{
    if(!enrollmentUri)return;
    status.textContent='Abrindo o aplicativo autenticador…';
    location.assign(enrollmentUri);
    setTimeout(()=>{status.textContent='Se nenhum aplicativo abriu, instale um autenticador compatível e tente novamente.'},1400);
  });
})();
