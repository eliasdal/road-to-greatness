const app=document.getElementById('app');
const positions=['PG','SG','SF','PF','C'];
const STORAGE_KEY='rtg82_exact_v2';
const DEFAULT_STATE=()=>({screen:'home',mode:'classic',round:0,roster:[],teamSkip:1,decadeSkip:1,combo:null,options:[],selected:null,record:null,season:[],stats:null});
let state=DEFAULT_STATE();

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const teamName=id=>TEAMS[id]||id;
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){}}
function validState(s){
  if(!s||typeof s!=='object')return false;
  if(!['home','spin','draft','lineup','result'].includes(s.screen))return false;
  if(!['classic','hoopiq'].includes(s.mode))s.mode='classic';
  if(!Array.isArray(s.roster)||!Array.isArray(s.options))return false;
  if(s.screen==='draft' && (!s.combo||!s.combo.team||!s.combo.decade||s.options.length<3))return false;
  if(s.screen==='lineup' && s.roster.length!==5)return false;
  if(s.screen==='result' && (!Array.isArray(s.season)||s.season.length!==82||typeof s.record!=='number'))return false;
  return true;
}
function load(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return;
    const s=JSON.parse(raw);
    if(validState(s))state=s; else localStorage.removeItem(STORAGE_KEY);
  }catch(e){try{localStorage.removeItem(STORAGE_KEY)}catch(_){} state=DEFAULT_STATE()}
}
function remainingPlayers(team,decade){
  return PLAYERS.filter(p=>p.team===team&&p.decade===decade&&!state.roster.some(r=>r.name===p.name&&r.team===p.team&&r.decade===p.decade));
}
function availableCombos(){
  return [...new Set(PLAYERS.map(p=>p.team+'|'+p.decade))].filter(k=>{
    const [team,decade]=k.split('|');
    return remainingPlayers(team,decade).length>=3;
  });
}
function randomCombo(){
  const combos=availableCombos();
  if(!combos.length)return null;
  const [team,decade]=combos[Math.floor(Math.random()*combos.length)].split('|');
  return {team,decade};
}
function optionsFor(c){return c?shuffle(remainingPlayers(c.team,c.decade)).slice(0,5):[]}
function start(){
  const mode=state.mode;
  state=DEFAULT_STATE(); state.mode=mode; spin();
}
function spin(){
  if(state.round>=5)return;
  const combo=randomCombo();
  if(!combo){showError('There are not enough player choices left for another round.');return}
  const options=optionsFor(combo);
  if(options.length<3){showError('The player pool is missing choices for this round.');return}
  state.selected=null; state.combo=combo; state.options=options; state.screen='spin'; save(); render();
  setTimeout(()=>{
    if(state.screen==='spin'){state.screen='draft';save();render()}
  },1450);
}
function skipTeam(){
  if(!state.teamSkip||!state.combo)return;
  const decade=state.combo.decade;
  const choices=shuffle(availableCombos().filter(k=>k.split('|')[1]===decade&&k.split('|')[0]!==state.combo.team));
  if(!choices.length)return;
  const [team,d]=choices[0].split('|');
  state.teamSkip=0; state.combo={team,decade:d}; state.options=optionsFor(state.combo); state.selected=null; save(); render();
}
function skipDecade(){
  if(!state.decadeSkip||!state.combo)return;
  const team=state.combo.team;
  const choices=shuffle(availableCombos().filter(k=>k.split('|')[0]===team&&k.split('|')[1]!==state.combo.decade));
  if(!choices.length)return;
  const [t,decade]=choices[0].split('|');
  state.decadeSkip=0; state.combo={team:t,decade}; state.options=optionsFor(state.combo); state.selected=null; save(); render();
}
function selectPlayer(i){if(state.options[i]){state.selected=state.options[i];render()}}
function confirmPick(pos){
  if(!state.selected||!positions.includes(pos)||state.roster.some(p=>p.slot===pos))return;
  state.roster.push({...state.selected,slot:pos});
  state.selected=null; state.round++;
  if(state.round>=5){state.screen='lineup';save();render();}
  else spin();
}
function statRating(p){return Math.max(1,Math.min(99,Math.round(45+p.ppg*1.05+p.rpg*.75+p.apg*.95+p.spg*2.4+p.bpg*2.5)))}
function teamPower(){
  if(state.roster.length!==5)return 0;
  const base=state.roster.reduce((s,p)=>s+statRating(p),0)/5;
  const totals=['ppg','rpg','apg','spg','bpg'].map(k=>state.roster.reduce((s,p)=>s+Number(p[k]||0),0));
  const max=Math.max(...totals), min=Math.min(...totals);
  const balance=max>0?min/max:0;
  return Math.round(base+balance*10+4);
}
function winProbability(){
  const power=teamPower();
  const z=(power-77)/7;
  return Math.max(.01,Math.min(.995,1/(1+Math.exp(-z))));
}
function randomScore(win){
  let a=Math.round(108+Math.random()*22),b=Math.round(96+Math.random()*24);
  if(win&&a<=b)a=b+Math.ceil(Math.random()*9);
  if(!win&&a>=b)b=a+Math.ceil(Math.random()*9);
  return a+'-'+b;
}
const OPPONENTS=['Boston Celtics','New York Knicks','Milwaukee Bucks','Cleveland Cavaliers','Miami Heat','Orlando Magic','Philadelphia 76ers','Indiana Pacers','Chicago Bulls','Detroit Pistons','Atlanta Hawks','Charlotte Hornets','Toronto Raptors','Brooklyn Nets','Washington Wizards','Denver Nuggets','Oklahoma City Thunder','Minnesota Timberwolves','Phoenix Suns','LA Clippers','Los Angeles Lakers','Golden State Warriors','Sacramento Kings','Dallas Mavericks','Houston Rockets','San Antonio Spurs','New Orleans Pelicans','Memphis Grizzlies','Portland Trail Blazers','Utah Jazz'];
function simulate(){
  const base=winProbability();
  const power=teamPower();
  const games=[];
  for(let i=0;i<82;i++){
    const lateSeason=1-(i/81)*.035;
    const strengthBoost=Math.max(0,(power-90))*.0025;
    const p=Math.max(.015,Math.min(.997,base*lateSeason+strengthBoost));
    const win=Math.random()<p;
    games.push({n:i+1,win,score:randomScore(win),opponent:OPPONENTS[i%OPPONENTS.length]});
  }
  return games;
}
function runSeason(){
  if(state.roster.length!==5)return;
  state.season=simulate(); state.record=state.season.filter(g=>g.win).length;
  state.stats={power:teamPower(),prob:Math.round(winProbability()*100)};
  state.screen='result'; save(); render();
}
function reset(){try{localStorage.removeItem(STORAGE_KEY)}catch(e){} state=DEFAULT_STATE();render()}
function shell(content){app.innerHTML=`<header><div class="logo" onclick="reset()"><span>82–0</span><small>ROAD TO GREATNESS</small></div><div class="headerRight"><span class="liveDot"></span><span>${state.mode==='hoopiq'?'HOOPIQ NBA DRAFT':'CLASSIC NBA DRAFT'}</span><button class="new" onclick="reset()">NEW GAME</button></div></header><main>${content}</main>`}
function home(){shell(`<section class="home"><div class="pill">THE ULTIMATE FIVE-MAN DRAFT</div><h1>Can you build a team<br>good enough to go <i>82–0?</i></h1><p class="lead">Spin for a random franchise and decade. Draft one player each round. Complete your starting five, then put them through the full 82-game season.</p><div class="modeWrap"><button class="mode ${state.mode==='classic'?'on':''}" onclick="state.mode='classic';render()"><strong>CLASSIC</strong><span>Player stats visible</span></button><button class="mode ${state.mode==='hoopiq'?'on':''}" onclick="state.mode='hoopiq';render()"><strong>HOOPIQ</strong><span>Player stats hidden</span></button></div><button class="primary huge" onclick="start()">START DRAFT <b>→</b></button><div class="rulebar"><div><b>5</b><span>ROUNDS</span></div><div><b>1</b><span>TEAM SKIP</span></div><div><b>1</b><span>DECADE SKIP</span></div><div><b>82</b><span>GAMES</span></div></div><div class="how"><span>HOW IT WORKS</span><div>SPIN <b>→</b> SEE PLAYERS <b>→</b> PICK <b>→</b> POSITION <b>→</b> BUILD FIVE <b>→</b> SIMULATE 82</div></div></section>`)}
const PHOTO_CACHE_KEY='rtg_photo_cache_v1';
function photoInitials(name){return String(name||'').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function photoCache(){try{return JSON.parse(localStorage.getItem(PHOTO_CACHE_KEY)||'{}')}catch(e){return {}}}
function setPhotoCache(c){try{localStorage.setItem(PHOTO_CACHE_KEY,JSON.stringify(c))}catch(e){}}
async function hydratePhotos(){
  const cache=photoCache();
  const imgs=[...document.querySelectorAll('img[data-player]')];
  await Promise.all(imgs.map(async img=>{
    const name=img.dataset.player;
    if(cache[name]){img.src=cache[name];return}
    try{
      const url='https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=180&titles='+encodeURIComponent(name)+'&origin=*';
      const r=await fetch(url); const j=await r.json();
      const pages=j?.query?.pages||{}; const page=Object.values(pages)[0]; const src=page?.thumbnail?.source;
      if(src){cache[name]=src;setPhotoCache(cache);img.src=src;img.classList.add('loaded')}
    }catch(e){}
  }));
}
function playerVisual(p){return `<div class="playerPhoto"><img data-player="${esc(p.name)}" alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' rx='14' fill='%23191b20'/%3E%3Ctext x='40' y='46' text-anchor='middle' fill='%23f1b53b' font-size='22' font-family='Arial' font-weight='700'%3E${encodeURIComponent(photoInitials(p.name))}%3C/text%3E%3C/svg%3E"></div>`}
function spinScreen(){
  const team=teamName(state.combo.team);
  const fake=shuffle(Object.values(TEAMS)).slice(0,8);
  return `<section class="spinScreen"><div class="pill">ROUND ${state.round+1} OF 5</div><h1>SPINNING...</h1><p>The franchise wheel is picking your team.</p><div class="teamReel">${fake.map((t,i)=>`<div style="--i:${i}" class="reelTeam ${i===fake.length-1?'final':''}">${esc(t)}</div>`).join('')}<div class="reelGlow"></div></div><div class="spinResult"><span>LOCKED IN</span><strong>${esc(team)}</strong><small>${esc(state.combo.decade)}</small></div></section>`
}
function draft(){
  const c=state.combo,round=state.round+1,selected=state.selected;
  const cards=state.options.map((p,i)=>`<button class="playerCard ${selected===p?'chosen':''}" onclick="selectPlayer(${i})"><div class="cardTop"><div class="playerIdentity">${playerVisual(p)}<div><small>${esc(p.pos)}</small><h3>${esc(p.name)}</h3></div></div><strong>${statRating(p)}</strong></div>${state.mode==='classic'?`<div class="stats"><span><b>${Number(p.ppg).toFixed(1)}</b>PPG</span><span><b>${Number(p.rpg).toFixed(1)}</b>RPG</span><span><b>${Number(p.apg).toFixed(1)}</b>APG</span><span><b>${Number(p.spg).toFixed(1)}</b>SPG</span><span><b>${Number(p.bpg).toFixed(1)}</b>BPG</span></div>`:`<div class="hidden">HOOPIQ · STATS HIDDEN</div>`}<div class="selectLabel">${selected===p?'PLAYER SELECTED · CHOOSE POSITION':'SELECT PLAYER'} <span>→</span></div></button>`).join('');
  shell(`<section class="draftHead"><div><div class="pill">ROUND ${round} OF 5</div><h1>${esc(teamName(c.team))} <em>·</em> ${esc(c.decade)}</h1><p>Spin result locked. Choose one player from this team and era.</p></div><div class="skipBox"><button onclick="skipTeam()" ${state.teamSkip?'':'disabled'}>TEAM SKIP <b>${state.teamSkip}</b></button><button onclick="skipDecade()" ${state.decadeSkip?'':'disabled'}>DECADE SKIP <b>${state.decadeSkip}</b></button></div></section><section class="progress">${positions.map((pos,i)=>{const rp=state.roster.find(p=>p.slot===pos);return `<div class="slot ${rp?'filled':''}"><small>${pos}</small><strong>${rp?esc(rp.name):'EMPTY'}</strong></div>`}).join('')}</section><div class="draftTools"><span><b>AVAILABLE PLAYERS</b> · ${state.options.length} SHOWN</span><span>MODE: <b>${state.mode.toUpperCase()}</b></span></div><section class="cards">${cards}</section>${selected?positionPicker(selected):''}`);
  hydratePhotos();
}
function positionPicker(p){
  const used=new Set(state.roster.map(x=>x.slot));
  const eligible=positions.filter(pos=>p.pos.split('/').includes(pos)&&!used.has(pos));
  return `<div class="overlay"><div class="picker"><button class="close" onclick="state.selected=null;render()">×</button><div class="pill">LOCK IN PICK</div><h2>${esc(p.name)}</h2><p>Choose an open position for this player.</p><div class="positionBtns">${eligible.length?eligible.map(pos=>`<button onclick="confirmPick('${pos}')"><strong>${pos}</strong><span>LOCK PLAYER</span></button>`).join(''):`<p>No open eligible position. Pick another player.</p>`}</div></div></div>`
}
function lineup(){
  shell(`<section class="lineup"><div class="pill">DRAFT COMPLETE</div><h1>YOUR STARTING FIVE</h1><p>Move any player to another position they are eligible to play.</p><div class="five">${positions.map(pos=>{const p=state.roster.find(x=>x.slot===pos);return p?`<div class="fiveRow"><span>${pos}</span>${playerVisual(p)}<div><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(teamName(p.team))} · ${esc(p.decade)}</small></div><strong>${statRating(p)}</strong><button class="secondary smallBtn" onclick="openReassign('${esc(p.name)}')">CHANGE</button></div>`:`<div class="fiveRow"><span>${pos}</span><div><b>EMPTY</b></div></div>`}).join('')}</div><button class="primary huge" onclick="runSeason()">SIMULATE 82 GAMES <b>→</b></button></section>`);
}
function openReassign(name){
  const p=state.roster.find(x=>x.name===name); if(!p)return;
  const used=new Set(state.roster.filter(x=>x!==p).map(x=>x.slot));
  const eligible=positions.filter(pos=>p.pos.split('/').includes(pos)&&!used.has(pos));
  app.innerHTML+=`<div class="overlay"><div class="picker"><button class="close" onclick="render()">×</button><div class="pill">CHANGE POSITION</div><h2>${esc(p.name)}</h2><p>Choose any position this player can play that is currently open.</p><div class="positionBtns">${eligible.map(pos=>`<button onclick="reassign('${esc(p.name)}','${pos}')"><strong>${pos}</strong><span>MOVE HERE</span></button>`).join('')}</div></div></div>`;
}
function reassign(name,pos){
  const p=state.roster.find(x=>x.name===name); if(!p||!p.pos.split('/').includes(pos))return;
  if(state.roster.some(x=>x!==p&&x.slot===pos))return;
  p.slot=pos; save(); render();
}
function result(){
  const r=state.record,perfect=r===82,recent=state.season.slice(-8);
  shell(`<section class="result ${perfect?'perfect':''}"><div class="pill">SEASON COMPLETE</div><h1>${perfect?'PERFECT SEASON':'FINAL RECORD'}</h1><div class="record"><strong>${r}</strong><i>–</i><strong>${82-r}</strong></div><div class="recordLabels"><span>WINS</span><span>LOSSES</span></div><div class="resultGrid"><div><b>${state.stats?.power??0}</b><span>TEAM POWER</span></div><div><b>${state.stats?.prob??0}%</b><span>WIN PROJECTION</span></div><div><b>82</b><span>GAMES PLAYED</span></div></div><div class="seasonBox"><div class="seasonTitle">LAST 8 GAMES</div>${recent.map(g=>`<div class="game ${g.win?'W':'L'}"><span>GAME ${g.n}</span><b>${g.win?'W':'L'}</b><span>vs ${esc(g.opponent)}</span><strong>${esc(g.score)}</strong></div>`).join('')}</div><p class="resultMsg">${perfect?'YOU DID IT. EVERY GAME. 82–0.':'The perfect season is still out there. Draft again and build a stronger five.'}</p><div class="actions"><button class="primary" onclick="start()">PLAY AGAIN <b>↻</b></button><button class="secondary" onclick="state.screen='lineup';render()">VIEW LINEUP</button></div></section>`)
}
function showError(message){
  app.innerHTML=`<div style="min-height:100vh;display:grid;place-items:center;padding:30px;background:#08090c;color:#fff;font-family:system-ui"><div style="max-width:620px;border:1px solid #333;padding:28px;border-radius:16px;background:#111318"><h1 style="margin-top:0">Road to Greatness</h1><p>${esc(message)}</p><button onclick="reset()" style="padding:12px 18px;border:0;border-radius:9px;background:#f1b53b;color:#111;font-weight:800;cursor:pointer">START NEW GAME</button></div></div>`;
}
function render(){
  try{
    if(state.screen==='home')home();
    else if(state.screen==='spin'&&state.combo&&state.options.length>=3)spinScreen();
    else if(state.screen==='draft'&&state.combo&&state.options.length>=3)draft();
    else if(state.screen==='lineup'&&state.roster.length===5)lineup();
    else if(state.screen==='result'&&Array.isArray(state.season)&&state.season.length===82)result();
    else {state=DEFAULT_STATE();save();home();}
  }catch(e){showError('The game hit an error while loading this screen. Your saved draft was reset so you can start clean.');}
}
load();render();
