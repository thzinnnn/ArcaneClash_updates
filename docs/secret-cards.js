(()=>{
const SECRET_CHANCE=0.0025;

const cards={
  vanguard:{name:'Aegis, o Juramento Final',fac:'solar',cost:7,atk:7,hp:10,maxHp:10,icon:'🛡️',text:'Guarda e Escudo. Ao entrar, fortalece um aliado.',kw:['Guarda','Escudo'],type:'unit',onPlay:'buffAlly',classes:['vanguard'],rarity:'secreta',archetype:'Lenda Oculta',secret:true,set:'Arquivo Proibido'},
  pyromancer:{name:'Ignivar, Coração do Sol',fac:'solar',cost:6,atk:9,hp:5,maxHp:5,icon:'🌋',text:'Investida. No fim do turno, causa 1 ao herói inimigo.',kw:['Investida'],type:'unit',endPing:1,heroBonus:2,classes:['pyromancer'],rarity:'secreta',archetype:'Lenda Oculta',secret:true,set:'Arquivo Proibido'},
  necromancer:{name:'Morthys, Rei sem Túmulo',fac:'void',cost:6,atk:7,hp:8,maxHp:8,icon:'👑',text:'Vampirismo. Ao eliminar, recebe +1/+1. Ao morrer, compre 1.',kw:['Vampirismo'],type:'unit',devour:true,death:'draw',classes:['necromancer'],rarity:'secreta',archetype:'Lenda Oculta',secret:true,set:'Arquivo Proibido'},
  druid:{name:'Elyndra, Raiz do Mundo',fac:'wild',cost:6,atk:6,hp:10,maxHp:10,icon:'🌳',text:'Guarda e Vampirismo. No início do turno, cura um aliado.',kw:['Guarda','Vampirismo'],type:'unit',turnHeal:true,classes:['druid'],rarity:'secreta',archetype:'Lenda Oculta',secret:true,set:'Arquivo Proibido'},
  cryomancer:{name:'Nivara, Fim do Inverno',fac:'frost',cost:7,atk:7,hp:9,maxHp:9,icon:'🜲',text:'Ao entrar, congela todos os inimigos. Recebe +2 ATQ contra congelados.',kw:[],type:'unit',onPlay:'freezeAll',frostPredator:2,classes:['cryomancer'],rarity:'secreta',archetype:'Lenda Oculta',secret:true,set:'Arquivo Proibido'},
  assassin:{name:'Nox, a Última Sombra',fac:'void',cost:5,atk:8,hp:4,maxHp:4,icon:'🌑',text:'Investida e Escudo. Ao entrar, fere o inimigo mais fraco.',kw:['Investida','Escudo'],type:'unit',onPlay:'weak2',devour:true,classes:['assassin'],rarity:'secreta',archetype:'Lenda Oculta',secret:true,set:'Arquivo Proibido'},
  summoner:{name:'O Inominável do Portal',fac:'arcane',cost:5,atk:5,hp:7,maxHp:7,icon:'🌀',text:'Escudo. Ao entrar, copia parte de um aliado.',kw:['Escudo'],type:'unit',onPlay:'copy',spellGrow:true,manaGrow:true,classes:['summoner'],rarity:'secreta',archetype:'Lenda Oculta',secret:true,set:'Arquivo Proibido'},
  chronomancer:{name:'Aeon, o Turno Perdido',fac:'arcane',cost:5,atk:5,hp:8,maxHp:8,icon:'⌛',text:'Escudo. Ao entrar, seu próximo feitiço custa 2 a menos.',kw:['Escudo'],type:'unit',onPlay:'discount',spellGrow:true,classes:['chronomancer'],rarity:'secreta',archetype:'Lenda Oculta',secret:true,set:'Arquivo Proibido'}
};

const clone=value=>JSON.parse(JSON.stringify(value));
const isLocalTest=()=>['127.0.0.1','localhost'].includes(location.hostname);
const forcedClass=isLocalTest()?new URLSearchParams(location.search).get('secret-test'):null;
let forcedConsumed=false;

function eligible(player){
  return !!player&&!player.ai&&!player.arcSecretOffered&&!!cards[player.classId];
}

function shouldReveal(player,random=Math.random,force=false){
  if(!eligible(player))return false;
  if(force)return true;
  if(!forcedConsumed&&forcedClass===player.classId){forcedConsumed=true;return true}
  return random()<SECRET_CHANCE;
}

function offer(player,regular,instantiate,random=Math.random,force=false){
  if(!Array.isArray(regular)||regular.length!==2||!shouldReveal(player,random,force))return regular;
  const secret=cards[player.classId];
  const create=typeof instantiate==='function'?instantiate:clone;
  const options=[...regular];
  options[random()<.5?0:1]=create(clone(secret));
  player.arcSecretOffered=true;
  return options;
}

const evolution=globalThis.ArcanaEvolution;
if(evolution?.draftOptions&&!evolution.__secretCardsInstalled){
  const original=evolution.draftOptions.bind(evolution);
  evolution.draftOptions=(player,rarity,catalog,instantiate)=>offer(player,original(player,rarity,catalog,instantiate),instantiate);
  evolution.__secretCardsInstalled=true;
}

globalThis.ArcanaSecrets={
  chance:SECRET_CHANCE,
  cards,
  cardByName:name=>Object.values(cards).find(card=>card.name===String(name||'').replace(/\s+Eco$/,'').trim())||null,
  testOffer:(classId,regular=[{name:'A'},{name:'B'}],instantiate=clone)=>offer({classId,ai:false},regular,instantiate,()=>0,true)
};
})();
