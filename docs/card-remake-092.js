(()=>{
const REMAKE_VERSION='0.9.2';
const api=globalThis.__ARCANA;
const evolution=globalThis.ArcanaEvolution;
if(!api?.cards?.length||!evolution?.cardClasses||api.cards.some(card=>card.remakeVersion===REMAKE_VERSION))return;

const CLASS_NAMES={
  vanguard:'Guerreiro Arcano',pyromancer:'Piromante',necromancer:'Necromante',druid:'Druida',
  cryomancer:'Criomante',assassin:'Assassino',summoner:'Invocador',chronomancer:'Cronomante',neutral:'Neutra'
};

const UNIT_KEYS=['onPlay','death','devour','heroBonus','pack','turnHeal','freezeHit','frostPredator','endPing','spellGrow','manaGrow'];
const unit=(title,text,props={},atk=0,hp=0)=>({title,text,props,atk,hp});
const spell=(title,text,effect,target='none')=>({title,text,effect,target});
const relic=(title,text,effect)=>({title,text,effect});

const UNIT_KITS={
  vanguard:[
    unit('Linha de Frente','Guarda.',{kw:['Guarda']}),
    unit('Égide Solar','Escudo.',{kw:['Escudo']}),
    unit('Muralha Viva','Guarda e Escudo.',{kw:['Guarda','Escudo']},-1,0),
    unit('Comando','Ao entrar, um aliado aleatório recebe +1 ATQ.',{onPlay:'buffAlly'}),
    unit('Reagrupar','Ao entrar, restaure 2 de vida de todas as suas criaturas.',{onPlay:'healTeam'},-1,1),
    unit('Juramento','Guarda. Ao morrer, compre 1 carta da Reserva.',{kw:['Guarda'],death:'draw'},-1,0),
    unit('Avanço Protegido','Escudo. Causa +1 ao herói ao atacar uma rota vazia.',{kw:['Escudo'],heroBonus:1},0,-1),
    unit('Formação','Guarda. Recebe +1 ATQ enquanto tiver um aliado na mesma rota.',{kw:['Guarda'],pack:true},-1,0),
    unit('Vigília','No início do seu turno, restaura 1 de vida do aliado mais ferido.',{turnHeal:true},-1,1),
    unit('Contra-ataque','No fim do seu turno, cause 1 ao herói inimigo.',{endPing:1},-1,-1),
    unit('Promoção','Ao entrar, recebe uma entre quatro bênçãos táticas.',{onPlay:'bless'},-1,0),
    unit('Bastião Final','Guarda e Vampirismo.',{kw:['Guarda','Vampirismo']},-1,0)
  ],
  pyromancer:[
    unit('Ignição','Investida.',{kw:['Investida']},0,-1),
    unit('Fagulha','Ao entrar, cause 1 ao herói inimigo.',{onPlay:'ping'},0,-1),
    unit('Chama Faminta','Ao eliminar uma criatura, recebe +1/+1.',{devour:true},0,-1),
    unit('Brasa Persistente','No fim do seu turno, cause 1 ao herói inimigo.',{endPing:1},-1,-1),
    unit('Incêndio Aberto','Causa +2 ao herói ao atacar uma rota vazia.',{heroBonus:2},0,-2),
    unit('Explosão de Entrada','Ao entrar, cause 2 ao inimigo com menos vida.',{onPlay:'weak2'},0,-1),
    unit('Cinzas Vivas','Ao morrer, compre 1 carta da Reserva.',{death:'draw'},0,-1),
    unit('Caldeira','Ao morrer, ganhe +1 mana no próximo turno.',{death:'battery'},0,-1),
    unit('Labareda Gêmea','Investida. Recebe +1 ATQ com um aliado na mesma rota.',{kw:['Investida'],pack:true},0,-1),
    unit('Coração Ígneo','Vampirismo.',{kw:['Vampirismo']},0,-1),
    unit('Combustão Arcana','Seus feitiços concedem +1 ATQ a esta criatura neste turno.',{spellGrow:true},-1,0),
    unit('Apoteose Vulcânica','Investida e Escudo.',{kw:['Investida','Escudo']},-1,-1)
  ],
  necromancer:[
    unit('Último Sussurro','Ao morrer, compre 1 carta da Reserva.',{death:'draw'},-1,0),
    unit('Ossos de Mana','Ao morrer, ganhe +1 mana no próximo turno.',{death:'battery'},-1,0),
    unit('Colheita','Ao eliminar uma criatura, recebe +1/+1.',{devour:true},0,-1),
    unit('Dreno Vital','Vampirismo.',{kw:['Vampirismo']},-1,0),
    unit('Agouro','Ao entrar, cause 1 ao herói inimigo.',{onPlay:'ping'},-1,0),
    unit('Ceifador','Ao entrar, cause 2 ao inimigo com menos vida.',{onPlay:'weak2'},0,-1),
    unit('Legião dos Mortos','Recebe +1 ATQ enquanto tiver um aliado na mesma rota.',{pack:true},-1,1),
    unit('Mortalha','Escudo. Ao morrer, compre 1 carta da Reserva.',{kw:['Escudo'],death:'draw'},-1,-1),
    unit('Guardião da Cripta','Guarda. Ao morrer, ganhe +1 mana no próximo turno.',{kw:['Guarda'],death:'battery'},-1,0),
    unit('Memória Roubada','Ao entrar, copia metade do ATQ e da vida de um aliado aleatório.',{onPlay:'copy'},-1,0),
    unit('Profanação','No fim do seu turno, cause 1 ao herói inimigo.',{endPing:1},-1,-1),
    unit('Retorno Impossível','Vampirismo. Ao eliminar uma criatura, recebe +1/+1.',{kw:['Vampirismo'],devour:true},-1,-1)
  ],
  druid:[
    unit('Casca Protetora','Guarda.',{kw:['Guarda']},-1,1),
    unit('Matilha','Recebe +1 ATQ enquanto tiver um aliado na mesma rota.',{pack:true},0,0),
    unit('Seiva Curativa','Ao entrar, restaure 2 de vida de todas as suas criaturas.',{onPlay:'healTeam'},-1,1),
    unit('Regeneração','No início do seu turno, restaura 1 de vida do aliado mais ferido.',{turnHeal:true},-1,1),
    unit('Crescimento','Ao eliminar uma criatura, recebe +1/+1.',{devour:true},-1,1),
    unit('Esporos','Ao entrar, um aliado aleatório recebe +1 ATQ.',{onPlay:'buffAlly'},-1,1),
    unit('Simbiose','Vampirismo.',{kw:['Vampirismo']},-1,1),
    unit('Bosque Fechado','Guarda. Recebe +1 ATQ com um aliado na mesma rota.',{kw:['Guarda'],pack:true},-1,0),
    unit('Renascimento','Ao morrer, compre 1 carta da Reserva.',{death:'draw'},-1,1),
    unit('Florescer','Ao entrar, recebe uma entre quatro bênçãos naturais.',{onPlay:'bless'},-1,0),
    unit('Espinho Retaliador','No fim do seu turno, cause 1 ao herói inimigo.',{endPing:1},-1,0),
    unit('Avatar Ancestral','Guarda e Vampirismo.',{kw:['Guarda','Vampirismo']},-1,0)
  ],
  cryomancer:[
    unit('Toque Frio','Ao entrar, tem 25% de chance de congelar o defensor da rota.',{onPlay:'laneFreeze'}),
    unit('Cristalização','Escudo.',{kw:['Escudo']},-1,1),
    unit('Sentinela Invernal','Guarda.',{kw:['Guarda']},-1,1),
    unit('Lâmina Gélida','Tem 25% de chance de congelar a criatura que ferir.',{freezeHit:.25},0,-1),
    unit('Caçada Polar','Recebe +2 ATQ ao enfrentar uma criatura congelada.',{frostPredator:2},0,-1),
    unit('Rajada de Neve','Ao entrar, congela um inimigo aleatório.',{onPlay:'freezeRandom'},-1,0),
    unit('Inverno Súbito','Ao entrar, congela todas as criaturas inimigas.',{onPlay:'freezeAll'},-2,-1),
    unit('Fortaleza de Gelo','Guarda e Escudo.',{kw:['Guarda','Escudo']},-1,0),
    unit('Predador Branco','Vampirismo. Recebe +2 ATQ contra alvos congelados.',{kw:['Vampirismo'],frostPredator:2},-1,-1),
    unit('Geada Persistente','No fim do seu turno, cause 1 ao herói inimigo.',{endPing:1},-1,-1),
    unit('Memória Congelada','Ao morrer, compre 1 carta da Reserva.',{death:'draw'},-1,0),
    unit('Soberano do Zero','Escudo. Ao entrar, congela um inimigo aleatório.',{kw:['Escudo'],onPlay:'freezeRandom'},-1,-1)
  ],
  assassin:[
    unit('Emboscada','Investida.',{kw:['Investida']},1,-1),
    unit('Flanco','Causa +1 ao herói ao atacar uma rota vazia.',{heroBonus:1},1,-1),
    unit('Execução','Ao eliminar uma criatura, recebe +1/+1.',{devour:true},0,-1),
    unit('Golpe Debilitante','Tem 25% de chance de imobilizar a criatura que ferir.',{freezeHit:.25},0,-1),
    unit('Entrada Silenciosa','Ao entrar, cause 2 ao inimigo com menos vida.',{onPlay:'weak2'},0,-1),
    unit('Veneno','No fim do seu turno, cause 1 ao herói inimigo.',{endPing:1},0,-2),
    unit('Sombra Protetora','Investida e Escudo.',{kw:['Investida','Escudo']},0,-1),
    unit('Roubo de Vida','Vampirismo.',{kw:['Vampirismo']},0,-1),
    unit('Dupla Oculta','Investida. Recebe +1 ATQ com um aliado na mesma rota.',{kw:['Investida'],pack:true},0,-1),
    unit('Desaparecer','Escudo. Ao morrer, compre 1 carta da Reserva.',{kw:['Escudo'],death:'draw'},-1,-1),
    unit('Sabotagem','Ao morrer, ganhe +1 mana no próximo turno.',{death:'battery'},0,-1),
    unit('Golpe Perfeito','Investida. Causa +2 ao herói em rota vazia.',{kw:['Investida'],heroBonus:2},0,-2)
  ],
  summoner:[
    unit('Familiar','Recebe +1 ATQ enquanto tiver um aliado na mesma rota.',{pack:true},-1,1),
    unit('Eco Vinculado','Ao entrar, copia metade do ATQ e da vida de um aliado aleatório.',{onPlay:'copy'},-1,0),
    unit('Canalização','Seus feitiços concedem +1 ATQ a esta criatura neste turno.',{spellGrow:true},-1,0),
    unit('Convergência','Ao segundo feitiço do turno, recebe +1/+1.',{manaGrow:true},-1,0),
    unit('Portal Breve','Ao entrar com até 3 cartas na mão, compre 1.',{onPlay:'smallDraw'},-1,0),
    unit('Preparar Ritual','Ao entrar, seu próximo feitiço custa 2 a menos.',{onPlay:'discount'},-1,0),
    unit('Construto-Bateria','Ao morrer, ganhe +1 mana no próximo turno.',{death:'battery'},-1,0),
    unit('Forma Instável','Ao entrar, recebe uma entre quatro bênçãos arcanas.',{onPlay:'bless'},-1,0),
    unit('Protetor Conjurado','Guarda e Escudo.',{kw:['Guarda','Escudo']},-1,0),
    unit('Mente Coletiva','Ao entrar, um aliado aleatório recebe +1 ATQ.',{onPlay:'buffAlly'},-1,1),
    unit('Retorno ao Éter','Ao morrer, compre 1 carta da Reserva.',{death:'draw'},-1,0),
    unit('Mestre da Convergência','Escudo. Ao entrar, copia metade dos atributos de um aliado.',{kw:['Escudo'],onPlay:'copy'},-2,-1)
  ],
  chronomancer:[
    unit('Antecipação','Ao entrar com até 3 cartas na mão, compre 1.',{onPlay:'smallDraw'},-1,0),
    unit('Atalho Temporal','Ao entrar, seu próximo feitiço custa 2 a menos.',{onPlay:'discount'},-1,0),
    unit('Eco do Passado','Ao entrar, copia metade do ATQ e da vida de um aliado aleatório.',{onPlay:'copy'},-1,0),
    unit('Possibilidade','Ao entrar, recebe uma entre quatro bênçãos temporais.',{onPlay:'bless'},-1,0),
    unit('Linha Alternativa','Seus feitiços concedem +1 ATQ a esta criatura neste turno.',{spellGrow:true},-1,0),
    unit('Ponto de Convergência','Ao segundo feitiço do turno, recebe +1/+1.',{manaGrow:true},-1,0),
    unit('Instante Suspenso','Ao entrar, congela um inimigo aleatório.',{onPlay:'freezeRandom'},-1,0),
    unit('Fim dos Tempos','Ao entrar, congela todas as criaturas inimigas.',{onPlay:'freezeAll'},-2,-1),
    unit('Memória Futura','Ao morrer, compre 1 carta da Reserva.',{death:'draw'},-1,0),
    unit('Guardião do Agora','Guarda e Escudo.',{kw:['Guarda','Escudo']},-1,0),
    unit('Repetição','Ao entrar, um aliado aleatório recebe +1 ATQ.',{onPlay:'buffAlly'},-1,0),
    unit('Paradoxo Vivo','Escudo. Ao segundo feitiço do turno, recebe +1/+1.',{kw:['Escudo'],manaGrow:true},-1,-1)
  ],
  neutral:[
    unit('Experiência de Combate','Investida.',{kw:['Investida']}),
    unit('Postura Defensiva','Guarda.',{kw:['Guarda']},-1,1),
    unit('Equipamento Raro','Escudo.',{kw:['Escudo']},-1,0),
    unit('Trabalho em Equipe','Recebe +1 ATQ enquanto tiver um aliado na mesma rota.',{pack:true},-1,1),
    unit('Último Recurso','Ao morrer, compre 1 carta da Reserva.',{death:'draw'},-1,0),
    unit('Veterano de Rotas','Guarda e Escudo.',{kw:['Guarda','Escudo']},-1,0)
  ]
};

const SPELL_KITS={
  vanguard:[spell('Fortificar','Dê Escudo a uma criatura aliada.','shield','ally'),spell('Consagrar','Dê +2/+2 a uma criatura aliada.','buff22','ally'),spell('Restaurar','Cure 6 do seu herói.','heal6'),spell('Julgamento','Cause 2 a todas as criaturas inimigas.','aoe2'),spell('Armadura Rúnica','Dê +1/+1 e Escudo a uma criatura aliada.','mechBuff','ally'),spell('Purificação','Cure 3 do herói e descongele uma criatura aliada.','purify','ally'),spell('Proteção Vital','Cure 4 do herói e 2 de todas as criaturas aliadas.','wildHeal')],
  pyromancer:[spell('Centelha','Cause 2 a qualquer criatura.','arcane2','any'),spell('Explosão','Cause 3 a uma criatura inimiga.','damage3','enemy'),spell('Onda de Calor','Cause 2 a todas as criaturas inimigas.','aoe2'),spell('Combustão','Dê +3 ATQ neste turno a um aliado; ele sofre 1.','overclock','ally'),spell('Meteoro Guiado','Cause 4 ao inimigo de maior ATQ.','missile'),spell('Fogo Vital','Cause 3 ao herói inimigo e cure 3 do seu.','drain'),spell('Brasa Faminta','Cause 2; se eliminar o alvo, compre 1.','rift','enemy')],
  necromancer:[spell('Pacto Sombrio','Compre 2 cartas e perca 2 de vida.','draw2hurt'),spell('Colheita de Alma','Cause 2; se eliminar o alvo, compre 1.','rift','enemy'),spell('Sifão','Cause 3 ao herói inimigo e cure 3 do seu.','drain'),spell('Sentença','Destrua uma criatura inimiga com 4 ATQ ou menos.','erase','enemy'),spell('Reciclar Cadáveres','Compre 1; compre outra se um aliado morreu neste turno.','recycle'),spell('Eco do Túmulo','Crie uma cópia 1/1 de uma criatura aliada.','duplicate','ally'),spell('Presságio','Compre 2 e devolva 1 carta aleatória à Reserva.','forecast')],
  druid:[spell('Crescimento','Dê +1 ATQ e +3 de vida a uma criatura aliada.','buff13','ally'),spell('Seiva Vital','Cure 4 do herói e 2 de todas as criaturas aliadas.','wildHeal'),spell('Germinação','Invoque dois Brotos 1/4 com Guarda.','sprouts'),spell('Renovar','Cure 3 do herói e descongele uma criatura aliada.','purify','ally'),spell('Raízes','Congele uma criatura inimiga.','freeze','enemy'),spell('Casca Prismática','Dê Escudo a uma criatura aliada.','shield','ally'),spell('Florescimento','Dê +2/+2 a uma criatura aliada.','buff22','ally')],
  cryomancer:[spell('Estilhaço','Cause 2; tem 25% de chance de congelar o alvo.','ice2','enemy'),spell('Prisão','Congele uma criatura inimiga.','freeze','enemy'),spell('Nevasca','Cause 1 e congele todas as criaturas inimigas.','blizzard'),spell('Espelho de Gelo','Dê Escudo a uma criatura aliada.','shield','ally'),spell('Zero Absoluto','Congele todas as criaturas e compre 1.','zero'),spell('Geada Cortante','Cause 3 a uma criatura inimiga.','damage3','enemy'),spell('Degelo','Cure 3 do herói e descongele uma criatura aliada.','purify','ally')],
  assassin:[spell('Adaga','Cause 2 a qualquer criatura.','arcane2','any'),spell('Golpe Preciso','Cause 3 a uma criatura inimiga.','damage3','enemy'),spell('Veneno Oportunista','Cause 2; se eliminar o alvo, compre 1.','rift','enemy'),spell('Execução','Destrua uma criatura inimiga com 4 ATQ ou menos.','erase','enemy'),spell('Roubo de Vida','Cause 3 ao herói inimigo e cure 3 do seu.','drain'),spell('Ataque Preparado','Dê +3 ATQ neste turno a um aliado; ele sofre 1.','overclock','ally'),spell('Plano de Fuga','Compre 2 e devolva 1 carta aleatória à Reserva.','forecast'),spell('Cortina de Fumaça','Dê Escudo a uma criatura aliada.','shield','ally')],
  summoner:[spell('Reflexo','Crie uma cópia 1/1 de uma criatura aliada.','duplicate','ally'),spell('Abrir Portais','Invoque dois Brotos 1/4 com Guarda.','sprouts'),spell('Conjuração Planejada','Compre 2 e devolva 1 carta aleatória à Reserva.','forecast'),spell('Mana Instável','50%: ganhe +2 mana; senão, compre 1.','coin'),spell('Convergência','Cada jogador compra 2 cartas.','bothDraw'),spell('Aprimorar Familiar','Dê +1/+1 e Escudo a uma criatura aliada.','mechBuff','ally'),spell('Reciclar Construto','Compre 1; compre outra se um aliado morreu neste turno.','recycle'),spell('Transmutação','Troque o ATQ e a vida atual de uma criatura.','swap','any')],
  chronomancer:[spell('Previsão','Compre 2 e devolva 1 carta aleatória à Reserva.','forecast'),spell('Segundo Extra','50%: ganhe +2 mana; senão, compre 1.','coin'),spell('Pausa','Congele uma criatura inimiga.','freeze','enemy'),spell('Linha Compartilhada','Cada jogador compra 2 cartas.','bothDraw'),spell('Reverter','Troque o ATQ e a vida atual de uma criatura.','swap','any'),spell('Paradoxo','Crie uma cópia 1/1 de uma criatura aliada.','duplicate','ally'),spell('Fim do Instante','Congele todas as criaturas e compre 1.','zero'),spell('Salvar Momento','Dê Escudo a uma criatura aliada.','shield','ally')],
  neutral:[spell('Sorte de Viajante','50%: ganhe +2 mana; senão, compre 1.','coin'),spell('Mapa Compartilhado','Cada jogador compra 2 cartas.','bothDraw'),spell('Primeiros Socorros','Cure 3 do herói e descongele uma criatura aliada.','purify','ally'),spell('Conhecimento Perigoso','Compre 2 cartas e perca 2 de vida.','draw2hurt')]
};

const RELIC_KITS={
  vanguard:[relic('Fortaleza','Suas criaturas invocadas recebem +1 de vida.','summonHp'),relic('Santuário','Com 3 ou mais criaturas, cure 1 no fim do turno.','forestHeart')],
  pyromancer:[relic('Fornalha','A cada 3 turnos, invoque um Drone 2/1.','factory'),relic('Olho da Chama','No começo do turno, tem 30% de chance de comprar 1.','voidEye')],
  necromancer:[relic('Altar das Almas','No começo do turno, tem 30% de chance de comprar 1.','voidEye'),relic('Cripta Infinita','Sua mão comporta 14 cartas e compra 1 extra a cada 4 turnos.','library')],
  druid:[relic('Coração da Mata','Com 3 ou mais criaturas, cure 1 no fim do turno.','forestHeart'),relic('Semente Ancestral','Suas criaturas invocadas recebem +1 de vida.','summonHp')],
  cryomancer:[relic('Cristal Eterno','Ao descongelar, sua criatura recebe +2 de vida.','frostRelic'),relic('Arquivo de Gelo','Sua mão comporta 14 cartas e compra 1 extra a cada 4 turnos.','library')],
  assassin:[relic('Arsenal Oculto','No começo do turno, tem 30% de chance de comprar 1.','voidEye'),relic('Relógio da Emboscada','Tem chance de aumentar sua mana máxima no início do turno.','hourglass')],
  summoner:[relic('Fábrica Autônoma','A cada 3 turnos, invoque um Drone 2/1.','factory'),relic('Biblioteca de Formas','Sua mão comporta 14 cartas e compra 1 extra a cada 4 turnos.','library')],
  chronomancer:[relic('Ampulheta Partida','Tem chance de aumentar sua mana máxima no início do turno.','hourglass'),relic('Biblioteca do Amanhã','Sua mão comporta 14 cartas e compra 1 extra a cada 4 turnos.','library')],
  neutral:[relic('Relógio Errante','Tem chance de aumentar sua mana máxima no início do turno.','hourglass'),relic('Bússola Etérea','Sua mão comporta 14 cartas e compra 1 extra a cada 4 turnos.','library')]
};

const effectArchetype={
  shield:'Defesa',buff22:'Suporte',heal6:'Sustentação',aoe2:'Controle',mechBuff:'Defesa',purify:'Sustentação',wildHeal:'Sustentação',
  arcane2:'Execução',damage3:'Execução',overclock:'Agressão',missile:'Finalizador',drain:'Sustentação',rift:'Valor',draw2hurt:'Sacrifício',
  erase:'Controle',recycle:'Valor',duplicate:'Combo',forecast:'Previsão',buff13:'Crescimento',sprouts:'Enxame',freeze:'Controle',ice2:'Controle',
  blizzard:'Controle',zero:'Controle',coin:'Tempo',bothDraw:'Valor',swap:'Combo',summonHp:'Defesa',forestHeart:'Sustentação',factory:'Enxame',
  voidEye:'Valor',library:'Motor',frostRelic:'Controle',hourglass:'Tempo',buffAlly:'Suporte',healTeam:'Sustentação',weak2:'Execução',
  freezeRandom:'Controle',freezeAll:'Controle',laneFreeze:'Controle',copy:'Combo',smallDraw:'Valor',discount:'Tempo',bless:'Valor',draw:'Valor',battery:'Sacrifício'
};

const assignments=new Map();
api.cards.forEach(card=>{
  const classes=evolution.cardClasses(card);
  assignments.set(card,card.fac==='neutral'?'neutral':classes[0]||'neutral');
});

function resetUnit(card){
  UNIT_KEYS.forEach(key=>delete card[key]);
  card.kw=[];
}

function applyUnit(card,kit,classId,index){
  resetUnit(card);
  const props=kit.props||{};
  Object.entries(props).forEach(([key,value])=>{card[key]=Array.isArray(value)?[...value]:value});
  card.atk=Math.max(0,Number(card.atk||0)+Number(kit.atk||0));
  card.hp=Math.max(1,Number(card.hp||1)+Number(kit.hp||0));
  card.maxHp=card.hp;
  card.text=`${kit.title} — ${kit.text}`;
  card.abilityName=kit.title;
  card.archetype=effectArchetype[card.onPlay]||effectArchetype[card.death]||((card.kw||[]).some(keyword=>keyword==='Guarda'||keyword==='Escudo')?'Defesa':card.archetype||'Tática');
  if(card.devour)card.archetype=classId==='necromancer'?'Sacrifício':'Execução';
  if(card.pack)card.archetype='Enxame';
  if(card.heroBonus||card.endPing||(card.kw||[]).includes('Investida'))card.archetype='Agressão';
  card.abilityIndex=index;
}

function applySpell(card,kit,index){
  card.effect=kit.effect;card.target=kit.target||'none';card.text=`${kit.title} — ${kit.text}`;
  card.abilityName=kit.title;card.archetype=effectArchetype[kit.effect]||'Tática';card.abilityIndex=index;
}

function applyRelic(card,kit,index){
  card.effect=kit.effect;card.text=`${kit.title} — ${kit.text}`;
  card.abilityName=kit.title;card.archetype=effectArchetype[kit.effect]||'Motor';card.abilityIndex=index;
}

Object.keys(CLASS_NAMES).forEach(classId=>{
  const cards=api.cards.filter(card=>assignments.get(card)===classId).sort((a,b)=>a.type.localeCompare(b.type)||Number(a.cost)-Number(b.cost)||a.name.localeCompare(b.name,'pt-BR'));
  const cursors={unit:0,spell:0,relic:0};
  cards.forEach(card=>{
    const kits=card.type==='unit'?UNIT_KITS[classId]:card.type==='spell'?SPELL_KITS[classId]:RELIC_KITS[classId];
    const index=cursors[card.type]++;
    const kit=kits[index%kits.length];
    if(card.type==='unit')applyUnit(card,kit,classId,index);
    else if(card.type==='spell')applySpell(card,kit,index);
    else applyRelic(card,kit,index);
    card.remakeVersion=REMAKE_VERSION;
    card.identityClass=classId;
    if(classId!=='neutral')card.classes=[classId];
    card.set=card.set||'Fundação Arcana';
  });
});

api.version=REMAKE_VERSION;
const stats={
  total:api.cards.filter(card=>card.remakeVersion===REMAKE_VERSION).length,
  byClass:Object.fromEntries(Object.keys(CLASS_NAMES).map(classId=>[classId,api.cards.filter(card=>card.identityClass===classId).length])),
  uniqueAbilities:new Set(api.cards.map(card=>`${card.identityClass}:${card.abilityName}`)).size
};
globalThis.ArcanaCardRemake={version:REMAKE_VERSION,stats,cards:api.cards};
document.documentElement.dataset.arcanaRemake=REMAKE_VERSION;
document.documentElement.dataset.arcanaCards=String(stats.total);
document.documentElement.dataset.arcanaAbilities=String(stats.uniqueAbilities);
document.documentElement.dataset.arcanaClassCounts=JSON.stringify(stats.byClass);
window.dispatchEvent(new CustomEvent('arcana:card-remake-ready',{detail:stats}));
})();
