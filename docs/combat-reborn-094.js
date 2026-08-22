(()=>{
  const VERSION='0.9.4';
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
    const active=board.querySelector('.lane')!=null;
    document.body.classList.toggle('arcBattleActive',active);
    if(!active)return;
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
    ensureScene();schedule();
    const board=document.getElementById('board');
    if(board)new MutationObserver(schedule).observe(board,{childList:true});
    ['home','modeSetup','heroScreen','gameover'].forEach(id=>{
      const screen=document.getElementById(id);if(screen)new MutationObserver(schedule).observe(screen,{attributes:true,attributeFilter:['class']});
    });
    window.addEventListener('arcana:match',schedule);
    setInterval(schedule,700);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
  globalThis.ArcanaCombatReborn={version:VERSION,maps:MAPS,refresh:schedule};
})();
