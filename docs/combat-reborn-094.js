(()=>{
  const VERSION='1.0.1';
  const MODE_KEY='arcana_lobby_mode_v1';
  const MAPS={
    solo:{id:'citadel',name:'Bastião Celeste',tagline:'Muralhas acima das nuvens',lanes:[['Ponte das Nuvens','☁'],['Pátio do Juramento','⚜'],['Torre do Oráculo','✦']]},
    duel:{id:'arena',name:'Arena do Sol',tagline:'Honra sob o olhar da cidade',lanes:[['Galeria Rubra','◆'],['Círculo Solar','☀'],['Galeria Dourada','◇']]},
    duo:{id:'bridges',name:'Pontes Gêmeas',tagline:'Duas fortalezas, um só abismo',lanes:[['Baluarte Oeste','♜'],['Ponte do Vínculo','∞'],['Baluarte Leste','♜']]},
    raidcoop:{id:'architect',name:'Covil do Arquiteto',tagline:'A fortaleza observa o seu grupo',lanes:[['Galeria Óssea','☠'],['Portal do Arquiteto','◉'],['Câmara Rúnica','⌁']]},
    blitz:{id:'rift',name:'Fenda Rubra',tagline:'Mana instável sob cada passo',lanes:[['Escarpa Ígnea','♨'],['Coração da Fenda','ϟ'],['Trilha de Cinzas','✺']]},
    chaos:{id:'islands',name:'Ilhas Impossíveis',tagline:'O campo não obedece às mesmas leis',lanes:[['Ilha Invertida','△'],['Passagem do Paradoxo','◈'],['Recife Astral','▽']]},
    survival:{id:'forest',name:'Bosque dos Ecos',tagline:'Cada trilha esconde uma nova onda',lanes:[['Trilha das Raízes','❦'],['Clareira Ancestral','♧'],['Pântano dos Sussurros','≈']]},
    raid:{id:'abyss',name:'Abismo Coroado',tagline:'O trono partido aguarda um desafiante',lanes:[['Escadaria Perdida','♟'],['Trono do Vazio','♛'],['Fosso Corrompido','☾']]},
    draft:{id:'market',name:'Mercado Flutuante',tagline:'Toda passagem oferece uma escolha',lanes:[['Cais das Relíquias','⚓'],['Praça das Lanternas','✦'],['Passarela Mercante','¤']]}
  };
  const FALLBACK=MAPS.solo;
  const unitMemory=new Map();
  let scheduled=false;
  let surrendering=false;
  let surrenderFocus=null;

  function modeId(){
    return globalThis.__ARCANA?.state?.()?.mode||localStorage.getItem(MODE_KEY)||'solo';
  }

  function ensureScene(){
    const app=document.getElementById('app');
    if(!app)return;
    if(!document.getElementById('arcBattleScene')){
      const scene=document.createElement('div');
      scene.id='arcBattleScene';scene.setAttribute('aria-hidden','true');
      scene.innerHTML='<i class="arcSceneSkyline"></i><i class="arcSceneHorizon"></i><i class="arcSceneMist one"></i><i class="arcSceneMist two"></i><i class="arcSceneSigil">✦</i>';
      app.prepend(scene);
    }
    if(!document.getElementById('arcBattleRegion')){
      const badge=document.createElement('div');
      badge.id='arcBattleRegion';badge.setAttribute('aria-hidden','true');
      document.getElementById('eventBar')?.insertAdjacentElement('afterend',badge);
    }
  }

  function closeSurrender(){
    const modal=document.getElementById('arcSurrenderConfirm');
    if(!modal||modal.classList.contains('hidden'))return;
    modal.classList.add('hidden');
    document.body.classList.remove('arcSurrenderOpen');
    surrenderFocus?.isConnected&&surrenderFocus.focus();
    surrenderFocus=null;
  }

  function openSurrender(){
    const modal=document.getElementById('arcSurrenderConfirm');
    const gameover=document.getElementById('gameover');
    if(!document.body.classList.contains('arcBattleActive')||!modal||!gameover?.classList.contains('hidden'))return;
    surrenderFocus=document.activeElement;
    modal.classList.remove('hidden');
    document.body.classList.add('arcSurrenderOpen');
    requestAnimationFrame(()=>document.getElementById('arcSurrenderStay')?.focus());
  }

  function confirmSurrender(){
    if(surrendering)return;
    surrendering=true;
    const state=globalThis.__ARCANA?.state?.();
    closeSurrender();
    window.dispatchEvent(new CustomEvent('arcana:match',{detail:{
      win:false,
      surrendered:true,
      mode:modeId(),
      survivalWave:state?.wave||1,
      classId:state?.me?.classId
    }}));
    document.getElementById('returnHome')?.click();
    setTimeout(()=>{surrendering=false;schedule()},120);
  }

  function ensureSurrenderControls(){
    const modeStrip=document.getElementById('modeStrip');
    if(modeStrip){
      let leave=document.getElementById('arcLeaveMatch');
      if(!leave){
        leave=document.createElement('button');
        leave.id='arcLeaveMatch';leave.type='button';leave.setAttribute('aria-label','Sair da partida');
        leave.innerHTML='<span aria-hidden="true">↩</span><b>SAIR</b>';
        document.body.appendChild(leave);
      }
      if(leave.parentElement!==document.body)document.body.appendChild(leave);
      const stripBounds=modeStrip.getBoundingClientRect();
      leave.style.setProperty('--arc-leave-top',`${stripBounds.top+stripBounds.height/2}px`);
      leave.style.setProperty('--arc-leave-right',`${Math.max(8,innerWidth-stripBounds.right+8)}px`);
      leave.dataset.surrenderControl='ready';
      leave.onclick=event=>{event.preventDefault();event.stopPropagation();openSurrender()};
    }
    if(document.getElementById('arcSurrenderConfirm'))return;
    const modal=document.createElement('section');
    modal.id='arcSurrenderConfirm';modal.className='hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','arcSurrenderTitle');
    modal.innerHTML='<button class="arcSurrenderBackdrop" type="button" aria-label="Continuar partida"></button><div class="arcSurrenderPanel"><div class="arcSurrenderIcon" aria-hidden="true">⚑</div><small>DESISTIR DA BATALHA</small><h2 id="arcSurrenderTitle">Tem certeza que deseja desistir?</h2><p>Esta partida contará como derrota e você voltará ao Lobby Arcano.</p><div class="arcSurrenderActions"><button id="arcSurrenderStay" type="button">CONTINUAR PARTIDA</button><button id="arcSurrenderLeave" type="button">DESISTIR E SAIR</button></div></div>';
    modal.querySelector('.arcSurrenderBackdrop').addEventListener('click',closeSurrender);
    modal.querySelector('#arcSurrenderStay').addEventListener('click',closeSurrender);
    modal.querySelector('#arcSurrenderLeave').addEventListener('click',confirmSurrender);
    document.body.appendChild(modal);
  }

  function decorateUnits(){
    const nextMemory=new Map();
    document.querySelectorAll('#board .unit').forEach(unit=>{
      const name=unit.querySelector('.un')?.textContent?.trim()||'';
      const key=`${unit.dataset.o}/${unit.dataset.l}/${unit.dataset.i}/${name}`;
      const stats=unit.querySelector('.us')?.textContent?.trim()||'';
      const previous=unitMemory.get(key);
      if(previous==null)unit.classList.add('arcUnitArriving');
      else if(previous!==stats)unit.classList.add('arcUnitImpact');
      nextMemory.set(key,stats);
    });
    unitMemory.clear();nextMemory.forEach((value,key)=>unitMemory.set(key,value));
  }

  function decorate(){
    scheduled=false;
    const board=document.getElementById('board');
    if(!board)return;
    ensureScene();
    ensureSurrenderControls();
    const home=document.getElementById('home');
    const gameover=document.getElementById('gameover');
    const active=board.querySelector('.lane')!=null&&home?.classList.contains('hidden')&&gameover?.classList.contains('hidden');
    document.body.classList.toggle('arcBattleActive',active);
    const leave=document.getElementById('arcLeaveMatch');
    if(leave)leave.hidden=!active;
    if(!active){closeSurrender();return}
    const map=MAPS[modeId()]||FALLBACK;
    document.body.dataset.battleMap=map.id;
    board.dataset.region=map.name;
    const badge=document.getElementById('arcBattleRegion');
    if(badge){
      const signature=`${map.name}|${map.tagline}`;
      if(badge.dataset.signature!==signature){
        badge.dataset.signature=signature;
        badge.innerHTML=`<small>CAMPO DE BATALHA</small><b>${map.name}</b><span>${map.tagline}</span>`;
      }
    }
    const sceneSigil=document.querySelector('#arcBattleScene .arcSceneSigil');
    if(sceneSigil)sceneSigil.textContent=map.lanes[1]?.[1]||'✦';
    board.querySelectorAll('.lane').forEach((lane,index)=>{
      const route=map.lanes[index]||[`Rota ${index+1}`,'✦'];
      lane.dataset.route=route[0];lane.dataset.landmark=route[1];
      lane.style.setProperty('--route-index',String(index));
      const zones=lane.querySelectorAll(':scope>.zone');
      zones[0]?.setAttribute('data-side','rival');zones[1]?.setAttribute('data-side','arcano');
      const mid=lane.querySelector(':scope>.mid');
      const routeMarkup=`<small>ROTA ${index+1}</small><b>${route[0]}</b>`;
      if(mid&&mid.innerHTML!==routeMarkup)mid.innerHTML=routeMarkup;
    });
    if(!document.querySelector('.card.selected')){
      board.querySelectorAll('.lane.valid,.unit.valid').forEach(element=>element.classList.remove('valid'));
      document.getElementById('selectionBar')?.classList.add('hidden');
    }
    decorateUnits();
  }

  function schedule(){
    if(scheduled)return;scheduled=true;requestAnimationFrame(decorate);
  }

  function install(){
    ensureScene();ensureSurrenderControls();schedule();
    const board=document.getElementById('board');
    if(board)new MutationObserver(schedule).observe(board,{childList:true});
    const modeStrip=document.getElementById('modeStrip');
    if(modeStrip)new MutationObserver(schedule).observe(modeStrip,{childList:true});
    ['home','modeSetup','heroScreen','gameover'].forEach(id=>{
      const screen=document.getElementById(id);if(screen)new MutationObserver(schedule).observe(screen,{attributes:true,attributeFilter:['class']});
    });
    window.addEventListener('arcana:match',schedule);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!document.getElementById('arcSurrenderConfirm')?.classList.contains('hidden'))closeSurrender();
    });
    setInterval(schedule,700);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
  globalThis.ArcanaCombatReborn={version:VERSION,maps:MAPS,refresh:schedule};
})();
