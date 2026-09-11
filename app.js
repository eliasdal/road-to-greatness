const NBA=[
["ATL","Atlanta Hawks"],["BOS","Boston Celtics"],["BKN","Brooklyn Nets"],["CHA","Charlotte Hornets"],["CHI","Chicago Bulls"],["CLE","Cleveland Cavaliers"],["DAL","Dallas Mavericks"],["DEN","Denver Nuggets"],["DET","Detroit Pistons"],["GSW","Golden State Warriors"],["HOU","Houston Rockets"],["IND","Indiana Pacers"],["LAC","LA Clippers"],["LAL","Los Angeles Lakers"],["MEM","Memphis Grizzlies"],["MIA","Miami Heat"],["MIL","Milwaukee Bucks"],["MIN","Minnesota Timberwolves"],["NOP","New Orleans Pelicans"],["NYK","New York Knicks"],["OKC","Oklahoma City Thunder"],["ORL","Orlando Magic"],["PHI","Philadelphia 76ers"],["PHX","Phoenix Suns"],["POR","Portland Trail Blazers"],["SAC","Sacramento Kings"],["SAS","San Antonio Spurs"],["TOR","Toronto Raptors"],["UTA","Utah Jazz"],["WAS","Washington Wizards"]
];
const NFL=[
["ARI","Arizona Cardinals"],["ATL","Atlanta Falcons"],["BAL","Baltimore Ravens"],["BUF","Buffalo Bills"],["CAR","Carolina Panthers"],["CHI","Chicago Bears"],["CIN","Cincinnati Bengals"],["CLE","Cleveland Browns"],["DAL","Dallas Cowboys"],["DEN","Denver Broncos"],["DET","Detroit Lions"],["GB","Green Bay Packers"],["HOU","Houston Texans"],["IND","Indianapolis Colts"],["JAX","Jacksonville Jaguars"],["KC","Kansas City Chiefs"],["LV","Las Vegas Raiders"],["LAC","Los Angeles Chargers"],["LAR","Los Angeles Rams"],["MIA","Miami Dolphins"],["MIN","Minnesota Vikings"],["NE","New England Patriots"],["NO","New Orleans Saints"],["NYG","New York Giants"],["NYJ","New York Jets"],["PHI","Philadelphia Eagles"],["PIT","Pittsburgh Steelers"],["SF","San Francisco 49ers"],["SEA","Seattle Seahawks"],["TB","Tampa Bay Buccaneers"],["TEN","Tennessee Titans"],["WAS","Washington Commanders"]
];

let state=JSON.parse(localStorage.getItem("perfectSeason"))||{league:null,team:null,games:[],page:"home"};
const save=()=>localStorage.setItem("perfectSeason",JSON.stringify(state));
const teams=()=>state.league==="NBA"?NBA:NFL;
const target=()=>state.league==="NBA"?82:17;
const name=code=>teams().find(x=>x[0]===code)?.[1]||code;
function toast(x){let t=document.querySelector("#toast");t.textContent=x;t.style.display="block";setTimeout(()=>t.style.display="none",1800)}
function go(p){state.page=p;save();document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===p));render()}
function reset(){if(confirm("Reset this franchise?")){state={league:null,team:null,games:[],page:"home"};save();go("home")}}
function start(league,team){state.league=league;state.team=team;state.games=[];state.page="franchise";save();render();toast("Franchise started")}
function home(){
return `<section class="hero"><div class="eyebrow">Browser sports franchise simulator</div><h1>Can you go<br>perfect?</h1><p>Build a franchise, survive the schedule, and chase an undefeated season. NBA: 82–0. NFL: 17–0.</p><div class="toolbar"><button class="btn" onclick="choose('NBA')">Start NBA</button><button class="btn secondary" onclick="choose('NFL')">Start NFL</button></div></section>
<section class="cards"><div class="card league" onclick="choose('NBA')"><div class="eyebrow">82 games</div><h2>NBA</h2><p class="muted">Pick an NBA franchise and try to finish 82–0.</p></div><div class="card league" onclick="choose('NFL')"><div class="eyebrow">17 games</div><h2>NFL</h2><p class="muted">Pick an NFL franchise and try to finish 17–0.</p></div><div class="card"><h3>How it works</h3><p class="muted">Each week you play the next matchup. Choose your strategy and simulate the result. Your record and schedule are saved in your browser.</p></div></section>`;
}
function choose(l){
state.league=l;state.page="choose";save();render();
}
function choosePage(){
return `<section class="section"><div class="eyebrow">${state.league}</div><h1>Choose your franchise</h1><p class="muted">Every team starts 0–0.</p><div class="team-grid">${teams().map(t=>`<div class="team" onclick="start('${state.league}','${t[0]}')"><strong>${t[1]}</strong><span class="muted">${t[0]}</span></div>`).join("")}</div></section>`;
}
function franchise(){
if(!state.team)return choose("NBA");
let w=state.games.filter(g=>g.win).length,l=state.games.length-w,remain=target()-state.games.length;
return `<section class="section"><div class="eyebrow">${state.league} FRANCHISE</div><h1>${name(state.team)}</h1><div class="stat-grid"><div class="stat">Record<b>${w}-${l}</b></div><div class="stat">Games left<b>${remain}</b></div><div class="stat">Win streak<b>${streak()}</b></div><div class="stat">Goal<b>${target()}–0</b></div></div><div class="toolbar"><button class="btn" onclick="playNext()">Play next game</button><button class="btn secondary" onclick="go('schedule')">View schedule</button><button class="btn danger" onclick="reset()">Reset</button></div><div class="card"><h3>Franchise status</h3><p class="muted">${state.games.length===0?"Your season hasn't started yet.":remain===0?(l===0?"PERFECT SEASON!":"Season complete."):l===0?"Undefeated. Keep it going.":"The perfect season is over, but the franchise can continue."}</p></div></section>`;
}
function streak(){let s=0;for(let i=state.games.length-1;i>=0&&state.games[i].win;i--)s++;return s}
function opponent(){let pool=teams().filter(t=>t[0]!==state.team);return pool[Math.floor(Math.random()*pool.length)]}
function playNext(){
if(state.games.length>=target()){toast("Season complete");return}
let opp=opponent(),win=Math.random()<(state.league==="NBA"?.68:.62);
let score;if(state.league==="NBA"){let a=95+Math.floor(Math.random()*35),b=90+Math.floor(Math.random()*35);if(win&&a<=b)a=b+1;if(!win&&a>=b)b=a+1;score=win?`${a}-${b}`:`${a}-${b}`}else{let a=14+Math.floor(Math.random()*25),b=10+Math.floor(Math.random()*25);if(win&&a<=b)a=b+1;if(!win&&a>=b)b=a+1;score=`${a}-${b}`}
state.games.push({n:state.games.length+1,opp:opp[0],win,score,date:new Date().toLocaleDateString()});save();render();toast(win?"WIN!":"LOSS")}
function schedule(){
if(!state.team)return `<section class="section"><div class="empty">Start a franchise first.</div></section>`;
return `<section class="section"><div class="eyebrow">${state.league} SCHEDULE</div><h1>${name(state.team)}</h1><div class="game-list">${state.games.length?state.games.map(g=>`<div class="game"><div>Game ${g.n}<br><span class="muted">${g.date}</span></div><div class="away"><strong>${name(state.team)}</strong></div><div><b class="${g.win?'win':'loss'}">${g.win?'W':'L'} ${g.score}</b><br><span class="muted">vs ${name(g.opp)}</span></div></div>`).join(""):`<div class="empty">No games played yet. Go to Franchise and play your first game.</div>`}</div></section>`;
}
function standings(){
if(!state.league)return `<section class="section"><div class="empty">Choose NBA or NFL to view standings.</div></section>`;
let arr=teams().map(t=>{let g=t[0]===state.team?state.games:[];return {t,w:g.filter(x=>x.win).length,l:g.filter(x=>!x.win).length}});
arr.sort((a,b)=>b.w-a.w||a.l-b.l);
return `<section class="section"><div class="eyebrow">${state.league}</div><h1>Standings</h1><div class="table-wrap"><table class="standings"><thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>Win %</th></tr></thead><tbody>${arr.map((x,i)=>`<tr><td>${i+1}</td><td>${x.t[1]}</td><td class="win">${x.w}</td><td class="loss">${x.l}</td><td>${x.w+x.l?(x.w/(x.w+x.l)*100).toFixed(1):"0.0"}%</td></tr>`).join("")}</tbody></table></div><p class="footer-note">In this starter build, unplayed teams remain at 0–0. The selected franchise is simulated game by game.</p></section>`;
}
function render(){
let app=document.querySelector("#app");
app.innerHTML=state.page==="home"?home():state.page==="choose"?choosePage():state.page==="franchise"?franchise():state.page==="schedule"?schedule():standings();
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>go(b.dataset.page));
}
render();
