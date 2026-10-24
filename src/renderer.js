const $=id=>document.getElementById(id);
let state='idle', paused=false, focusEnd=Number(localStorage.getItem('focusEnd'))||0, lastInteraction=Date.now(), dragging=null, moved=false;
const say=text=>{$('bubble').textContent=text; const p=document.createElement('p');p.textContent=text;$('history').append(p);while($('history').children.length>12)$('history').firstChild.remove();$('history').scrollTop=$('history').scrollHeight;};
function mood(next){state=next;$('character').className='interactive '+(next==='idle'?'':next)+(paused?' paused':'');$('mood').textContent=({sleep:'recharging my charm… zzz',walk:'a tiny adventure',sit:'staying right here ♡',jump:'up we go!',idle:'here for you ♡'})[next];}
function toggleChat(){const opening=$('panel').hidden;$('panel').hidden=!opening;$('bubble').hidden=opening;if(opening)$('input').focus();lastInteraction=Date.now();}
async function command(text){
  const p=document.createElement('p');p.className='user';p.textContent='You · '+text;$('history').append(p);lastInteraction=Date.now();
  try{
    const result=await window.buddy.command(text);
    switch(result.type){
      case 'focus':focusEnd=Date.now()+result.minutes*60000;localStorage.setItem('focusEnd',focusEnd);mood('sit');say(`${result.minutes} minutes. You bring the effort, I’ll bring the moral support. ♡`);break;
      case 'invalid-focus':say('Pick a focus session between 1 and 180 minutes, darling.');break;
      case 'stop':focusEnd=0;localStorage.removeItem('focusEnd');mood('idle');say('Timer stopped. A fresh start whenever you need it.');break;
      case 'sleep':mood('sleep');say('A little beauty sleep. Click me when you need me. zzz');break;
      case 'wake':mood('idle');say('Missed me already? I’m here. ♡');break;
      case 'jump':mood('jump');say('A tiny leap of faith!');setTimeout(()=>{if(state==='jump')mood('idle');},700);break;
      case 'walk':wander();break;
      case 'sit':mood('sit');say('Right here, cheering you on.');break;
      case 'search':say('Opened your search in your browser. Curiosity looks good on you.');break;
      case 'help':say('Try: focus 25 · stop · walk · jump · sit · sleep · wake · search for something. Drag me to move!');break;
      default:say('I’m still learning conversation, darling. Try “help” for what I can do today.');
    }
  }catch{say('That didn’t work. Try again in a moment.');}
}
$('chat').addEventListener('submit',event=>{event.preventDefault();const text=$('input').value.trim();if(text){$('input').value='';command(text);}});
document.querySelectorAll('[data-command]').forEach(button=>button.onclick=()=>command(button.dataset.command));
$('close').onclick=toggleChat;
window.buddy.onToggle(toggleChat);
function pause(){paused=!paused;$('pause').textContent=paused?'Resume':'Pause';mood(state);say(paused?'Taking a quiet moment. Reminders and wandering paused.':'Back with you, darling. ♡');}
$('pause').onclick=pause;window.buddy.onPause(pause);$('hide').onclick=()=>window.buddy.hide();
for(const id of ['water','stretch','roam','quiet']){const saved=localStorage.getItem(id);if(saved!==null)$(id).checked=saved==='true';$(id).onchange=()=>localStorage.setItem(id,$(id).checked);}
function size(){const n=Math.min(210,Math.max(110,Number($('size').value)||170));$('character').style.height=n+'px';$('character').style.width=n+'px';$('panel').style.bottom=(n+35)+'px';localStorage.setItem('size',n);}
$('size').value=localStorage.getItem('size')||170;$('size').oninput=size;size();
const pet=$('character');
pet.onpointerdown=event=>{dragging={x:event.screenX,y:event.screenY,wx:window.screenX,wy:window.screenY};moved=false;pet.setPointerCapture(event.pointerId);lastInteraction=Date.now();};
pet.onpointermove=event=>{if(!dragging)return;const dx=event.screenX-dragging.x,dy=event.screenY-dragging.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;if(moved)window.buddy.move(dragging.wx+dx,dragging.wy+dy);};
pet.onpointerup=()=>{dragging=null;if(!moved){if(state==='sleep')mood('idle');toggleChat();}else say('A change of scenery? I approve. ♡');};
pet.onpointercancel=()=>{dragging=null;};
document.addEventListener('mousemove',event=>window.buddy.passthrough(!dragging&&!event.target.closest('.interactive')));
function wander(){if(paused||dragging||!$('panel').hidden||state==='sleep'||focusEnd)return;mood('walk');const direction=Math.random()>.5?1:-1;let steps=0;const interval=setInterval(()=>{if(paused||dragging||!$('panel').hidden||state!=='walk'||++steps>45){clearInterval(interval);if(state==='walk')mood('idle');return;}window.buddy.move(window.screenX+direction*3,window.screenY);},80);}
let nextWater=Date.now()+45*60000,nextStretch=Date.now()+60*60000;
setInterval(()=>{
 const now=Date.now();
 if(focusEnd){const remaining=focusEnd-now;$('timer').hidden=false;$('timer').textContent='FOCUS TIME · '+Math.floor(Math.max(0,remaining)/60000)+':'+String(Math.floor(Math.max(0,remaining)/1000)%60).padStart(2,'0');if(remaining<=0){focusEnd=0;localStorage.removeItem('focusEnd');mood('idle');say('Look at you! Focus session finished. Take a proper little break. ♡');if(!$('quiet').checked)window.buddy.notify('Focus session complete. Time for a little break.');}}else $('timer').hidden=true;
 if(now>=nextWater){nextWater=now+45*60000;if(!paused&&!$('quiet').checked&&$('water').checked){say('Hydration check, darling. A few sips before your next adventure.');window.buddy.notify('Time for a few sips of water.');}}
 if(now>=nextStretch){nextStretch=now+60*60000;if(!paused&&!$('quiet').checked&&$('stretch').checked){say('Your chair called. It needs a break from you. Stretch for a minute? ♡');window.buddy.notify('Stand up and stretch for a minute.');}}
},1000);
setInterval(()=>{if($('roam').checked&&Date.now()-lastInteraction>20000)wander();if(!paused&&!focusEnd&&Date.now()-lastInteraction>180000&&state==='idle'){mood('sleep');say('I’ll be right here. Just resting my eyes…');}},30000);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('panel').hidden)toggleChat();});
