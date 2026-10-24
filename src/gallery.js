const players=[];
let paused=false;
function card(name,container){
  const item=document.createElement('article');item.className='card';
  const art=document.createElement('div');art.className='art';
  const fallback=document.createElement('img');fallback.src='../assets/zero-two-idle.png';fallback.alt='Zero Two · '+name;
  const sprite=document.createElement('div');sprite.className='sprite';sprite.hidden=true;
  art.append(fallback,sprite);
  const caption=document.createElement('p');caption.textContent=name;
  item.append(art,caption);document.getElementById(container).append(item);
  const player=new window.BuddyAnimation(sprite,fallback);player.show(name);
  if(name==='walk'||name==='climb')player.drive();
  if(name==='stretch')player.loop=true;
  players.push({player,name});
}
['writing','reading','laptop','walk','climb','rest','sleep','sit','crossleg','stretch','wave'].forEach(name=>card(name,'motion'));
['neutral','happy','smile','excited','laughing','smug','teasing','wink','curious','surprised','shocked','angry','annoyed','pout','embarrassed','sad','determined','worried','sleepy','calm'].forEach(name=>card(name,'faces'));
setInterval(()=>{if(!paused)players.forEach(({player,name})=>{if(name==='walk')player.advanceMotion(1.28,40);else if(name==='climb')player.advanceMotion(0,40);});},40);
document.getElementById('play').onclick=()=>{paused=!paused;players.forEach(({player})=>player.pause(paused));document.getElementById('play').textContent=paused?'Play animations':'Pause animations';};
