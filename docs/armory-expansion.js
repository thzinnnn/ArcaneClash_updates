(()=>{
const ARMORY_VERSION='0.9.1';
const SET_NAME='Expansão do Arsenal';
const api=globalThis.__ARCANA;
if(!api?.cards||api.cards.some(card=>card.set===SET_NAME))return;

const unit=(name,fac,cost,atk,hp,icon,text,classes,rarity='comum',archetype='Valor',kw=[],extra={})=>({name,fac,cost,atk,hp,maxHp:hp,icon,text,kw,type:'unit',classes,rarity,archetype,set:SET_NAME,...extra});
const spell=(name,fac,cost,icon,text,effect,target,classes,rarity='comum',archetype='Tática')=>({name,fac,cost,icon,text,effect,target:target||'none',type:'spell',classes,rarity,archetype,set:SET_NAME});
const relic=(name,fac,cost,icon,text,effect,classes,rarity='épica',archetype='Motor')=>({name,fac,cost,icon,text,effect,type:'relic',classes,rarity,archetype,set:SET_NAME});

const expansion=[
  // Guerreiro Arcano: 12 novas cartas, completando 20 exclusivas.
  unit('Sentinela do Bastião','solar',1,1,4,'🛡️','Guarda.',['vanguard'],'comum','Defesa',['Guarda']),
  unit('Porta-Escudo Solar','solar',2,2,4,'🌞','Escudo.',['vanguard'],'comum','Defesa',['Escudo']),
  unit('Vigia Radiante','solar',2,2,3,'🔆','Ao entrar, fortalece um aliado.',['vanguard'],'rara','Suporte',[],{onPlay:'buffAlly'}),
  unit('Capitã da Muralha','solar',3,3,5,'🏰','Guarda.',['vanguard'],'rara','Defesa',['Guarda']),
  unit('Colosso da Alvorada','solar',4,4,7,'🗿','Guarda.',['vanguard'],'épica','Defesa',['Guarda']),
  unit('Arconte Protetor','solar',5,5,7,'👼','Escudo.',['vanguard'],'épica','Defesa',['Escudo']),
  unit('Paladino do Zênite','solar',6,6,8,'⚜️','Guarda e Escudo.',['vanguard'],'lendária','Finalizador',['Guarda','Escudo']),
  spell('Escudo Rúnico','solar',1,'🔰','Dê Escudo a um aliado.','shield','ally',['vanguard'],'comum','Defesa'),
  spell('Juramento Dourado','solar',2,'🤝','Dê +2/+2 a um aliado.','buff22','ally',['vanguard'],'rara','Suporte'),
  spell('Luz Restauradora','solar',3,'🌤️','Cure 6 do seu herói.','heal6','none',['vanguard'],'rara','Sustentação'),
  spell('Julgamento Solar','solar',4,'☀️','Cause 2 a todos os inimigos.','aoe2','none',['vanguard'],'épica','Controle'),
  relic('Fortaleza Solar','solar',4,'🏯','Suas invocações recebem +1 de vida.','summonHp',['vanguard'],'lendária','Defesa'),

  // Piromante: 17 novas cartas, completando 20 exclusivas.
  unit('Salamandra de Cinzas','solar',1,2,1,'🦎','Criatura agressiva de baixo custo.',['pyromancer'],'comum','Agressão'),
  unit('Arqueira das Brasas','solar',2,3,1,'🏹','Investida.',['pyromancer'],'comum','Agressão',['Investida']),
  unit('Fanático da Chama','solar',2,2,2,'🕯️','Ao entrar, cause 1 ao herói inimigo.',['pyromancer'],'rara','Queimadura',[],{onPlay:'ping'}),
  unit('Elemental de Fogo','solar',3,5,2,'🔥','Poder alto, mas pouca vida.',['pyromancer'],'comum','Agressão'),
  unit('Cavaleiro Incendiário','solar',3,4,2,'🐎','Investida.',['pyromancer'],'rara','Agressão',['Investida']),
  unit('Fênix Carmesim','solar',4,4,3,'🦅','Ao morrer, compre 1.',['pyromancer'],'épica','Valor',[],{death:'draw'}),
  unit('Demônio das Brasas','solar',4,5,4,'👹','Ao entrar, fere o inimigo mais fraco.',['pyromancer'],'épica','Queimadura',[],{onPlay:'weak2'}),
  unit('Dragão Vulcânico','solar',5,6,5,'🐉','No fim do turno, cause 1 ao herói inimigo.',['pyromancer'],'épica','Queimadura',[],{endPing:1}),
  unit('Avatar do Incêndio','solar',6,8,6,'🌋','Causa +2 ao herói se atacar uma rota vazia.',['pyromancer'],'lendária','Finalizador',[],{heroBonus:2}),
  spell('Faísca Certeira','solar',1,'✦','Cause 2 a qualquer criatura.','arcane2','any',['pyromancer'],'comum','Queimadura'),
  spell('Explosão Rubra','solar',2,'💥','Cause 3 a uma criatura inimiga.','damage3','enemy',['pyromancer'],'comum','Queimadura'),
  spell('Investida Flamejante','solar',2,'⚡','Dê +3 ATQ neste turno; o aliado sofre 1.','overclock','ally',['pyromancer'],'rara','Agressão'),
  spell('Onda de Fogo','solar',3,'🔥','Cause 2 a todos os inimigos.','aoe2','none',['pyromancer'],'rara','Queimadura'),
  spell('Labareda Faminta','solar',3,'🩸','Cause 3 ao herói inimigo e cure 3.','drain','none',['pyromancer'],'épica','Sustentação'),
  spell('Estouro de Magma','solar',3,'🌋','Cause 2; se destruir, compre 1.','rift','enemy',['pyromancer'],'rara','Valor'),
  spell('Raio do Meio-Dia','solar',4,'☄️','Cause 4 ao inimigo de maior ATQ.','missile','none',['pyromancer'],'épica','Finalizador'),
  relic('Olho da Fogueira','solar',3,'👁️','30% de chance de compra extra no turno.','voidEye',['pyromancer'],'lendária','Motor'),

  // Necromante: 11 novas cartas, completando 20 exclusivas.
  unit('Acólito Mortuário','void',1,1,3,'🕯️','Ao morrer, compre 1.',['necromancer'],'comum','Sacrifício',[],{death:'draw'}),
  unit('Esqueleto Coberto','void',2,2,3,'🦴','Ao morrer, ganhe +1 mana no próximo turno.',['necromancer'],'comum','Sacrifício',[],{death:'battery'}),
  unit('Colecionador de Ossos','void',3,3,4,'💀','Ao eliminar uma criatura, recebe +1/+1.',['necromancer'],'rara','Sacrifício',[],{devour:true}),
  unit('Sacerdotisa Fúnebre','void',3,2,5,'🪦','Ao entrar, cure 2 dos aliados.',['necromancer'],'rara','Sustentação',[],{onPlay:'healTeam'}),
  unit('Cavaleiro Revenante','void',4,4,5,'🐴','Vampirismo.',['necromancer'],'épica','Sustentação',['Vampirismo']),
  unit('Dragão Cadáver','void',6,7,7,'🐲','Ao entrar, fere o inimigo mais fraco.',['necromancer'],'lendária','Finalizador',[],{onPlay:'weak2'}),
  spell('Pacto Sepulcral','void',2,'📜','Compre 2 e perca 2 de vida.','draw2hurt','none',['necromancer'],'comum','Sacrifício'),
  spell('Toque Morto','void',2,'☠️','Cause 2; se destruir, compre 1.','rift','enemy',['necromancer'],'rara','Valor'),
  spell('Sifão de Almas','void',3,'🩸','Cause 3 ao herói inimigo e cure 3.','drain','none',['necromancer'],'épica','Sustentação'),
  spell('Sentença do Túmulo','void',4,'⚰️','Destrua criatura inimiga com ATQ 4 ou menos.','erase','enemy',['necromancer'],'épica','Controle'),
  relic('Altar dos Ecos','void',3,'🕍','30% de chance de compra extra no turno.','voidEye',['necromancer'],'lendária','Motor'),

  // Druida: 9 novas cartas, completando 20 exclusivas.
  unit('Semente Guardiã','wild',1,1,4,'🌰','Guarda.',['druid'],'comum','Defesa',['Guarda']),
  unit('Lince Selvagem','wild',2,3,2,'🐈','Recebe +1 ATQ se tiver aliado na rota.',['druid'],'comum','Enxame',[],{pack:true}),
  unit('Curandeira da Mata','wild',3,2,5,'🧝','Ao entrar, cure 2 dos aliados.',['druid'],'rara','Sustentação',[],{onPlay:'healTeam'}),
  unit('Ent Ancião','wild',4,3,7,'🌳','No início do turno, cura um aliado.',['druid'],'épica','Sustentação',[],{turnHeal:true}),
  unit('Avatar da Floresta','wild',6,6,9,'🦌','Guarda e Vampirismo.',['druid'],'lendária','Finalizador',['Guarda','Vampirismo']),
  spell('Casca Viva','wild',1,'🌿','Dê +1 ATQ e +3 de vida a um aliado.','buff13','ally',['druid'],'comum','Crescimento'),
  spell('Cipós Paralisantes','wild',2,'🪴','Congele um inimigo.','freeze','enemy',['druid'],'rara','Controle'),
  spell('Canto da Seiva','wild',3,'💚','Cure o herói em 4 e aliados em 2.','wildHeal','none',['druid'],'épica','Sustentação'),
  relic('Totem da Primavera','wild',3,'🗿','Com 3+ criaturas, cure 1 no fim do turno.','forestHeart',['druid'],'lendária','Enxame'),

  // Criomante: 9 novas cartas, completando 20 exclusivas.
  unit('Raposa Glacial','frost',1,2,2,'🦊','Ao entrar, pode congelar o defensor.',['cryomancer'],'comum','Controle',[],{onPlay:'laneFreeze'}),
  unit('Guardião de Cristal','frost',2,1,5,'💠','Guarda e Escudo.',['cryomancer'],'rara','Defesa',['Guarda','Escudo']),
  unit('Caçadora Boreal','frost',3,4,3,'🏹','25% de chance de congelar ao ferir.',['cryomancer'],'rara','Controle',[],{freezeHit:.25}),
  unit('Oráculo de Neve','frost',4,3,5,'🔮','Ao entrar, congela um inimigo aleatório.',['cryomancer'],'épica','Controle',[],{onPlay:'freezeRandom'}),
  unit('Leviatã Polar','frost',6,6,8,'🐋','Ao entrar, congela todos os inimigos.',['cryomancer'],'lendária','Finalizador',[],{onPlay:'freezeAll'}),
  spell('Agulha de Gelo','frost',1,'🔹','Cause 2; 25% de chance de congelar.','ice2','enemy',['cryomancer'],'comum','Controle'),
  spell('Armadura de Geada','frost',2,'🧊','Dê Escudo a um aliado.','shield','ally',['cryomancer'],'rara','Defesa'),
  spell('Era Glacial','frost',5,'🥶','Congele todas as criaturas e compre 1.','zero','none',['cryomancer'],'lendária','Controle'),
  relic('Trono do Inverno','frost',3,'👑','Ao descongelar, sua criatura recebe +2 de vida.','frostRelic',['cryomancer'],'épica','Motor'),

  // Assassino: 18 novas cartas, completando 20 exclusivas.
  unit('Espiã da Penumbra','void',1,2,1,'🥷','Investida.',['assassin'],'comum','Agressão',['Investida']),
  unit('Lâmina Contratada','void',1,3,1,'🗡️','Investida.',['assassin'],'rara','Agressão',['Investida']),
  unit('Acrobata Sombria','void',2,3,2,'🎭','Causa +1 ao herói se atacar uma rota vazia.',['assassin'],'comum','Agressão',[],{heroBonus:1}),
  unit('Caçador de Alvos','void',2,2,3,'🎯','25% de chance de imobilizar ao ferir.',['assassin'],'rara','Controle',[],{freezeHit:.25}),
  unit('Dançarina de Facas','void',3,4,2,'💃','Investida.',['assassin'],'rara','Agressão',['Investida']),
  unit('Executor do Véu','void',3,3,4,'🩶','Ao eliminar uma criatura, recebe +1/+1.',['assassin'],'rara','Execução',[],{devour:true}),
  unit('Mestre da Emboscada','void',4,5,3,'🕶️','Ao entrar, fere o inimigo mais fraco.',['assassin'],'épica','Execução',[],{onPlay:'weak2'}),
  unit('Predador Noturno','void',4,4,4,'🐆','Vampirismo.',['assassin'],'épica','Sustentação',['Vampirismo']),
  unit('Carrasco do Eclipse','void',5,6,4,'🌘','Ao entrar, cause 1 ao herói inimigo.',['assassin'],'épica','Agressão',[],{onPlay:'ping'}),
  unit('Sombra Suprema','void',6,7,5,'👤','Investida e Escudo.',['assassin'],'lendária','Finalizador',['Investida','Escudo']),
  spell('Adaga Oculta','void',1,'🔪','Cause 2 a qualquer criatura.','arcane2','any',['assassin'],'comum','Execução'),
  spell('Golpe Preciso','void',2,'🎯','Cause 3 a uma criatura inimiga.','damage3','enemy',['assassin'],'comum','Execução'),
  spell('Veneno Persistente','void',2,'☣️','Cause 2; se destruir, compre 1.','rift','enemy',['assassin'],'rara','Valor'),
  spell('Passo Fantasma','void',2,'👻','Dê Escudo a um aliado.','shield','ally',['assassin'],'rara','Proteção'),
  spell('Roubo de Essência','void',3,'🩸','Cause 3 ao herói inimigo e cure 3.','drain','none',['assassin'],'épica','Sustentação'),
  spell('Plano Sombrio','void',3,'📜','Compre 2; devolva 1 aleatória.','forecast','none',['assassin'],'rara','Tempo'),
  spell('Execução Silenciosa','void',4,'❌','Destrua criatura inimiga com ATQ 4 ou menos.','erase','enemy',['assassin'],'épica','Execução'),
  relic('Arsenal Oculto','void',3,'🧰','30% de chance de compra extra no turno.','voidEye',['assassin'],'lendária','Motor'),

  // Invocador: 1 nova carta, completando 20 exclusivas.
  unit('Mestre dos Portais','arcane',5,4,6,'🌀','Ao entrar, copia parte de um aliado.',['summoner'],'lendária','Invocação',[],{onPlay:'copy'}),

  // Cronomante: 17 novas cartas, completando 20 exclusivas.
  unit('Aprendiz do Minuto','arcane',1,1,3,'⌛','Com mão pequena, compre 1.',['chronomancer'],'comum','Tempo',[],{onPlay:'smallDraw'}),
  unit('Coruja Oracular','arcane',2,2,3,'🦉','Com mão pequena, compre 1.',['chronomancer'],'comum','Previsão',[],{onPlay:'smallDraw'}),
  unit('Vigia do Instante','arcane',2,2,4,'⏱️','Guarda.',['chronomancer'],'comum','Defesa',['Guarda']),
  unit('Tecelã do Passado','arcane',3,3,4,'🧵','O próximo feitiço custa 2 a menos.',['chronomancer'],'rara','Combo',[],{onPlay:'discount'}),
  unit('Eco de Amanhã','arcane',3,3,3,'🪞','Ao entrar, copia parte de um aliado.',['chronomancer'],'rara','Combo',[],{onPlay:'copy'}),
  unit('Guardião da Ampulheta','arcane',4,3,6,'⏳','Guarda e Escudo.',['chronomancer'],'épica','Defesa',['Guarda','Escudo']),
  unit('Arquivista Temporal','arcane',4,4,5,'📚','Com mão pequena, compre 1.',['chronomancer'],'rara','Previsão',[],{onPlay:'smallDraw'}),
  unit('Oráculo das Eras','arcane',5,4,7,'🔮','Ao entrar, recebe uma bênção aleatória.',['chronomancer'],'épica','Valor',[],{onPlay:'bless'}),
  unit('Titã do Relógio','arcane',6,6,8,'🕰️','Ao entrar, congela todos os inimigos.',['chronomancer'],'lendária','Finalizador',[],{onPlay:'freezeAll'}),
  spell('Segundo Extra','arcane',0,'⏱️','50%: +2 mana; senão compre 1.','coin','none',['chronomancer'],'comum','Tempo'),
  spell('Repetir Momento','arcane',1,'↩️','Compre 2; devolva 1 aleatória.','forecast','none',['chronomancer'],'comum','Previsão'),
  spell('Pausa Temporal','arcane',2,'⏸️','Congele um inimigo.','freeze','enemy',['chronomancer'],'rara','Controle'),
  spell('Distensão Temporal','arcane',2,'↔️','Cada jogador compra 2.','bothDraw','none',['chronomancer'],'rara','Tempo'),
  spell('Reverter Forma','arcane',3,'🔁','Troque ATQ e vida atual.','swap','any',['chronomancer'],'rara','Combo'),
  spell('Paradoxo','arcane',4,'♾️','Crie uma cópia 1/1 de um aliado.','duplicate','ally',['chronomancer'],'épica','Combo'),
  spell('Instante Congelado','arcane',5,'🕛','Congele todas as criaturas e compre 1.','zero','none',['chronomancer'],'lendária','Controle'),
  relic('Relógio do Infinito','arcane',3,'⌚','Pode aumentar a mana máxima.','hourglass',['chronomancer'],'lendária','Motor'),

  // Quatro Neutras novas: agora toda classe possui 12 opções compartilhadas.
  unit('Exploradora de Ruínas','neutral',2,2,3,'🧭','Investida.',['vanguard','pyromancer','necromancer','druid','cryomancer','assassin','summoner','chronomancer'],'comum','Agressão',['Investida']),
  unit('Guardião Sem Bandeira','neutral',3,3,5,'🛡️','Guarda.',['vanguard','pyromancer','necromancer','druid','cryomancer','assassin','summoner','chronomancer'],'rara','Defesa',['Guarda']),
  spell('Conhecimento Proibido','neutral',2,'📖','Compre 2 e perca 2 de vida.','draw2hurt','none',['vanguard','pyromancer','necromancer','druid','cryomancer','assassin','summoner','chronomancer'],'rara','Valor'),
  relic('Bússola Etérea','neutral',4,'🧭','Mão maior e compra extra a cada 4 turnos.','library',['vanguard','pyromancer','necromancer','druid','cryomancer','assassin','summoner','chronomancer'],'lendária','Motor')
];

function inferArchetype(card){
  const text=`${card.text||''} ${(card.kw||[]).join(' ')} ${card.effect||''} ${card.onPlay||''} ${card.death||''}`.toLowerCase();
  if(/congel|freeze|zero/.test(text))return 'Controle';
  if(/guarda|escudo|shield/.test(text))return 'Defesa';
  if(/cura|heal|vamp/.test(text))return 'Sustentação';
  if(/compre|mana|draw|forecast|library/.test(text))return 'Valor';
  if(/investida|dano|cause|damage|missile|ping/.test(text))return 'Agressão';
  if(/invo|cópia|broto|familiar|factory/.test(text))return 'Enxame';
  return 'Tática';
}

function inferRarity(card){
  if(card.type==='relic'||Number(card.cost)>=6)return 'lendária';
  if(Number(card.cost)>=4)return 'épica';
  if(Number(card.cost)>=3)return 'rara';
  return 'comum';
}

api.cards.forEach(card=>{
  card.rarity=card.rarity||inferRarity(card);
  card.archetype=card.archetype||inferArchetype(card);
  card.set=card.set||'Fundação Arcana';
});
const existingNames=new Set(api.cards.map(card=>card.name));
const added=expansion.filter(card=>!existingNames.has(card.name));
api.cards.push(...added);
api.version=ARMORY_VERSION;

const classIds=['vanguard','pyromancer','necromancer','druid','cryomancer','assassin','summoner','chronomancer'];
const stats=()=>({
  total:api.cards.length,
  added:added.length,
  neutral:api.cards.filter(card=>card.fac==='neutral').length,
  byClass:Object.fromEntries(classIds.map(classId=>[classId,api.cards.filter(card=>card.fac==='neutral'||card.classes?.includes(classId)||(!card.classes&&globalThis.ArcanaEvolution?.cardClasses?.(card)?.includes(classId))).length]))
});
globalThis.ArcanaArmory={version:ARMORY_VERSION,set:SET_NAME,cards:expansion,stats};
window.dispatchEvent(new CustomEvent('arcana:armory-ready',{detail:stats()}));
})();
