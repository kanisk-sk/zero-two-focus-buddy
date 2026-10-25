const $=id=>document.getElementById(id);
const pet=$('character');
const player=new window.BuddyAnimation($('sprite'),$('standing'));
let state='idle',paused=false,dragging=null,moved=false;
const focus=new window.FocusSession(localStorage);
let lastInteraction=Date.now();
let deskActivity=localStorage.getItem('deskActivity')||'laptop';
if(!['writing','reading','laptop'].includes(deskActivity))deskActivity='laptop';
let movementTimer=null,poseTimer=null,motionSerial=0;
let bubbleTimer=null,layoutSerial=0,sceneSerial=0,sceneTimer=null,sceneBusy=false,attentionTimer=null;
const behavior=new window.CompanionBehavior();
function syncLayout(){
  const mode=!$('panel').hidden?'chat':!$('bubble').hidden?'bubble':'quiet';
  const token=++layoutSerial;
  document.body.dataset.mode=mode;
  return window.buddy.layout({mode,size:Number($('size').value)||170,bubbleHeight:$('bubble').offsetHeight,chatHeight:$('settings').hidden?(($('quick-reply').hidden?118:210)+($('focus-controls').hidden?0:48)):310}).then(result=>{if(token===layoutSerial&&result)document.body.dataset.side=result.side;}).catch(()=>{});
}
const labels={'drink-ready':'a tiny drink break','drink-sip':'just a little sip ♡','drink-done':'ready for our next adventure','desk-drink-ready':'a little work break','desk-drink-sip':'co-pilot pit stop ♡','desk-drink-done':'back to it, darling',writing:'one page at a time',reading:'a little reading time',laptop:'working together ♡',idle:'here for you ♡',sleep:'recharging my charm… zzz',walk:'a tiny adventure',climb:'one step higher',sit:'staying right here ♡',crossleg:'getting comfortable',rest:'a little breather',jump:'up we go!',hang:'just hanging around',stretch:'a little stretch',yawn:'getting sleepy',wave:'hey, darling ♡',dance:'a little celebration',victory:'we did it!',drag:'taking the scenic route'};
function say(text){
  $('bubble').textContent=text;
  $('quick-reply').textContent=text;
  const p=document.createElement('p');p.textContent=text;$('history').append(p);
  while($('history').children.length>12)$('history').firstChild.remove();
  $('history').scrollTop=$('history').scrollHeight;
  clearTimeout(bubbleTimer);
  if(!$('panel').hidden){
    $('quick-reply').hidden=false;syncLayout();
  }else{
    $('bubble').hidden=false;syncLayout();
    bubbleTimer=setTimeout(()=>{$('bubble').hidden=true;syncLayout();},Math.max(4000,Math.min(10000,text.length*55)));
  }
}
function cancelMovement(){motionSerial++;clearInterval(movementTimer);movementTimer=null;}
function cancelScene(){sceneSerial++;clearTimeout(sceneTimer);sceneTimer=null;sceneBusy=false;}
function mood(next,direction=1,fromScene=false){
  if(!fromScene)cancelScene();
  cancelMovement();clearTimeout(poseTimer);state=next;
  pet.className='interactive state-'+next+(paused?' paused':'');
  player.show(next,direction);player.pause(paused);
  $('mood').textContent=labels[next]||next;
  pet.setAttribute('aria-label','Zero Two · '+next+': drag to move, click to chat');
}
function rect(){
  const r=pet.getBoundingClientRect();
  // Grip the edge at the hand's anchor inside the transparent sprite cell.
  return ['climb','hang'].includes(state)?{x:r.x+r.width*.06,y:r.y,width:r.width*.78,height:r.height}:{x:r.x,y:r.y,width:r.width,height:r.height};
}
function toggleChat(){
  const opening=$('panel').hidden;
  if(opening){
    if(sceneBusy){cancelScene();mood(focus.deadline>Date.now()?deskActivity:'idle');}
    if(['walk','climb','hang'].includes(state))mood('idle');
    window.buddy.passthrough(false);
  }
  clearTimeout(bubbleTimer);$('panel').hidden=!opening;$('bubble').hidden=true;
  $('quick-reply').hidden=true;
  $('settings').hidden=true;$('settings-toggle').setAttribute('aria-expanded','false');
  if(opening)$('input').focus();lastInteraction=Date.now();
  syncLayout();
}
function closeChat(){if(!$('panel').hidden)toggleChat();}
function temporaryPose(name,ms=3500){mood(name);poseTimer=setTimeout(()=>{if(state===name)mood(focus.deadline>Date.now()?deskActivity:'idle');},ms);}
function startMovement(kind,direction=1){
  if(paused||dragging||focus.deadline)return;
  closeChat();mood(kind,direction);
  const token=motionSerial;let elapsed=0,turnElapsed=0,busy=false,lastTick=Date.now(),remainder=0;
  player.drive();
  const start=async()=>{
    if(kind==='climb'){
      const edge=await window.buddy.desktop({action:'edge',rect:rect()});
      if(motionSerial!==token)return;
      if(!edge){mood('idle');return;}
      direction=edge.edge==='left'?-1:1;player.show('climb',direction);
    }
    if(motionSerial!==token)return;
    lastTick=Date.now();
    movementTimer=setInterval(async()=>{
      const now=Date.now();
      if(busy||paused||dragging||document.hidden||motionSerial!==token||state!==kind){lastTick=now;return;}
      const dt=Math.min(100,now-lastTick);lastTick=now;
      busy=true;
      try{
        elapsed+=dt;
        if(elapsed>=(kind==='walk'?6000:16000)){
          mood(kind==='walk'?'idle':'hang',direction);
          if(kind==='climb')say('Made it. Just hanging around, darling. ♡');
          return;
        }
        if(kind==='climb')player.advanceMotion(0,dt);
        const ramp=kind==='walk'?Math.min(1,(elapsed-turnElapsed)/400,(6000-elapsed)/600):1;
        const delta=(kind==='walk'?32*Math.max(0,ramp):24*player.pullFactor())*dt/1000+remainder;
        const pixels=Math.floor(delta);remainder=delta-pixels;
        if(!pixels)return;
        const step=await window.buddy.desktop({action:'step',dx:kind==='walk'?direction*pixels:0,dy:kind==='climb'?-pixels:0,rect:rect()});
        if(motionSerial!==token)return;
        if(kind==='walk'){
          if(step?.moved)player.advanceMotion(step.dx,dt);
          if(step&&!step.moved){turnElapsed=elapsed;direction*=-1;player.show('walk',direction);}
        }else if(step&&!step.moved){mood('hang',direction);say('Made it. Just hanging around, darling. ♡');}
      }catch{if(motionSerial===token)mood('idle');}finally{busy=false;}
    },40);
  };
  start().catch(()=>{if(motionSerial===token)mood('idle');});
}
async function command(text){
  const p=document.createElement('p');p.className='user';p.textContent='You · '+text;$('history').append(p);lastInteraction=Date.now();
  behavior.hold(Date.now());
  try{
    const result=await window.buddy.command(text);
    behavior.hold(Date.now(),result.type==='sleep'?180000:['rest','sit','pose','expression'].includes(result.type)?30000:12000);
    switch(result.type){
      case 'top-edge':
        mood('idle');closeChat();await syncLayout();
        await window.buddy.desktop({action:'top'});
        say('Up here, darling. Still with you. ♡');break;
      case 'apps':
        $('apps').replaceChildren();
        for(const app of result.apps){const button=document.createElement('button');button.textContent=app.label;button.onclick=()=>command('open '+app.id);$('apps').append(button);}
        $('settings').hidden=false;$('settings-toggle').setAttribute('aria-expanded','true');
        $('app-section').hidden=false;$('app-section').open=true;
        say(result.apps.length?'Pick an app below, or type “open Chrome”, darling.':'I couldn’t find any supported apps on this computer yet.');break;
      case 'open-app':
        if(result.ok){temporaryPose('happy',2500);say('Opening '+result.label+'. Go make something good. ♡');}
        else if(result.reason==='not-installed')say(result.label+' isn’t installed in a supported location. Try “apps” to see what I can open.');
        else if(result.reason==='launch-failed')say('I couldn’t open '+result.label+'. Try opening it normally once, then ask me again.');
        else say('That app isn’t on my supported list yet. Type “apps” to see the ones I found.');
        break;
      case 'drink':closeChat();actOnOwn(behavior.drink(behaviorContext(),focus.deadline>Date.now()||['writing','reading','laptop'].includes(state)));break;
      case 'desk':deskActivity=result.activity;localStorage.setItem('deskActivity',deskActivity);mood(deskActivity);closeChat();say(({writing:'Notebook ready. One little task at a time. ♡',reading:'A quiet reading moment, darling.',laptop:'Laptop open. Let’s get something done. ♡'})[deskActivity]);break;
      case 'focus':focus.start(result.minutes);mood(deskActivity);updateFocusUI();say(`${result.minutes} minute${result.minutes===1?'':'s'}. You bring the effort, I’ll bring the moral support. ♡`);break;
      case 'invalid-focus':say('Pick a focus session between 1 and 180 minutes, darling.');break;
      case 'stop':endFocus();break;
      case 'sleep':mood('sleep');closeChat();say('A little beauty sleep. Click me when you need me. zzz');break;
      case 'wake':mood('idle');say('Missed me already? I’m here. ♡');break;
      case 'jump':temporaryPose('jump',900);closeChat();say('A tiny leap of faith!');break;
      case 'walk':case 'climb':
        if(paused){say('Resume me first, darling.');break;}
        if(focus.deadline){say('Let’s finish our focus session first.');break;}
        startMovement(result.type,result.type==='walk'&&Math.random()<.5?-1:1);
        say(result.type==='climb'?'Race you to the screen edge. ♡':'A tiny adventure. I won’t go far. ♡');break;
      case 'hang':{
        closeChat();mood('hang');const token=motionSerial;
        const edge=await window.buddy.desktop({action:'edge',rect:rect()});
        if(token===motionSerial&&edge)player.show('hang',edge.edge==='left'?-1:1);
        say('Just hanging around. Literally.');break;
      }
      case 'sit':case 'rest':mood(result.type);closeChat();say(result.type==='rest'?'Even tiny co-pilots need a breather.':'Right here, cheering you on.');break;
      case 'pose':
        if(result.name==='crossleg')mood('crossleg');else temporaryPose(result.name,result.name==='stretch'?4200:3500);
        closeChat();say(({stretch:'Stretch with me for a second?',yawn:'Who made the day so long?',wave:'Hey, darling. ♡',dance:'A little victory dance!',victory:'Look at us go! ♡',crossleg:'Getting comfortable.'})[result.name]);break;
      case 'expression':temporaryPose(result.name,6000);closeChat();say('Feeling '+result.name+'. ♡');break;
      case 'search':temporaryPose('curious');say('Opened your search in your browser. Curiosity looks good on you.');break;
      case 'conversation':{
        const replies={greeting:{name:'wave',text:'Hey, darling! There you are. What are we getting into today? ♡'},thanks:{name:'happy',text:'You’re welcome. Look at us, making a pretty good team. ♡'},tired:{name:'worried',text:'Then let’s be kind to you. A little water, a stretch, or a proper break?'},bored:{name:'teasing',text:'A boredom emergency? Right-click me for a tiny play break. Or we can pick one little task together. ♡'},compliment:{name:'smug',text:'Oh? Excellent taste, darling. I’ll allow the compliment. ♡'},status:{name:'curious',text:'Keeping you company, causing a very manageable amount of chaos. How about you?'}};
        const reply=replies[result.intent];if(focus.deadline>Date.now())attention();else temporaryPose(reply.name,4000);say(reply.text);break;
      }
      case 'help':say('Try: apps · open Chrome · open Calculator · go to top · focus 25 · stop · walk · climb · rest · sleep · stretch · look happy.');break;
      default:temporaryPose('curious');say('I’m still learning conversation, darling. Try “help” for what I can do today.');
    }
  }catch{say('That didn’t work. Try again in a moment.');}
}
$('chat').addEventListener('submit',event=>{event.preventDefault();const text=$('input').value.trim();if(text){$('input').value='';command(text);}});
const expressionNames=['neutral','happy','smile','excited','laughing','smug','teasing','wink','curious','surprised','shocked','angry','annoyed','pout','embarrassed','sad','determined','worried','sleepy','calm'];
for(const name of expressionNames){const button=document.createElement('button');button.textContent=name;button.dataset.command='look '+name;$('expressions').append(button);}
document.querySelectorAll('[data-command]').forEach(button=>button.onclick=()=>command(button.dataset.command));
$('open-chat').onclick=toggleChat;
$('settings-toggle').onclick=()=>{$('settings').hidden=!$('settings').hidden;$('settings-toggle').setAttribute('aria-expanded',String(!$('settings').hidden));syncLayout();};
window.addEventListener('blur',()=>{if(!$('input').value.trim())closeChat();});
$('close').onclick=toggleChat;window.buddy.onToggle(toggleChat);
function pause(){paused=!paused;if(paused){const transient=sceneBusy||!['idle','sleep','rest','sit','crossleg','writing','reading','laptop','walk','climb'].includes(state);cancelScene();clearTimeout(poseTimer);if(transient)mood(focus.deadline>Date.now()?deskActivity:'idle');}$('pause').textContent=paused?'Resume':'Pause';pet.classList.toggle('paused',paused);player.pause(paused);say(paused?'Taking a quiet moment. Reminders and wandering paused.':'Back with you, darling. ♡');}
$('pause').onclick=pause;window.buddy.onPause(pause);$('hide').onclick=()=>window.buddy.hide();
$('gallery').onclick=()=>window.buddy.gallery();
$('end-focus').onclick=()=>command('stop');$('end-focus-quick').onclick=()=>command('stop');
$('energy').value=localStorage.getItem('energy')==='gentle'?'gentle':'lively';
$('energy').onchange=()=>{localStorage.setItem('energy',$('energy').value);behavior.resume(Date.now());};
for(const id of ['water','stretch','roam','quiet','companion-behavior']){const saved=localStorage.getItem(id);if(saved!==null)$(id).checked=saved==='true';$(id).onchange=()=>{localStorage.setItem(id,$(id).checked);if(id==='companion-behavior'){cancelScene();mood(focus.deadline>Date.now()?deskActivity:'idle');if($(id).checked)behavior.resume(Date.now());}};}
function size(){const n=Math.min(210,Math.max(110,Number($('size').value)||170));pet.style.height=n+'px';pet.style.width=n+'px';document.documentElement.style.setProperty('--pet-size',n+'px');localStorage.setItem('size',n);syncLayout();}
$('size').value=localStorage.getItem('size')||170;$('size').oninput=size;size();
pet.onpointerdown=event=>{if(event.button!==0)return;dragging={x:event.screenX,y:event.screenY,wx:window.screenX,wy:window.screenY};moved=false;cancelMovement();pet.setPointerCapture(event.pointerId);lastInteraction=Date.now();const transient=sceneBusy||!['idle','sleep','rest','sit','crossleg','writing','reading','laptop'].includes(state);cancelScene();clearTimeout(poseTimer);if(transient)mood(focus.deadline>Date.now()?deskActivity:'idle');behavior.hold(lastInteraction,8000);};
pet.onpointermove=event=>{
  if(!dragging)return;const dx=event.screenX-dragging.x,dy=event.screenY-dragging.y;
  if(Math.abs(dx)+Math.abs(dy)>5){if(!moved)mood('drag');moved=true;}
  if(moved)window.buddy.move(dragging.wx+dx,dragging.wy+dy);
};
pet.onpointerup=event=>{if(event.button!==0||!dragging)return;dragging=null;if(!moved){if(['sleep','walk','climb','drag','hang'].includes(state))mood('idle');toggleChat();}else{temporaryPose('smug',2000);say('A change of scenery? I approve. ♡');}};
pet.onpointercancel=()=>{dragging=null;mood(focus.deadline>Date.now()?deskActivity:'idle');};
pet.addEventListener('click',event=>{if(event.detail===0)toggleChat();});
document.addEventListener('mousemove',event=>window.buddy.passthrough(!dragging&&!event.target.closest('.interactive')));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&sceneBusy){cancelScene();mood(focus.deadline>Date.now()?deskActivity:'idle');}player.pause(paused||document.hidden);});
let nextWater=Date.now()+45*60000,nextStretch=Date.now()+60*60000;
setInterval(()=>{
  const now=Date.now();
  if(focus.deadline&&focus.remaining(now)<=0){
    focus.stop();updateFocusUI();temporaryPose('victory');say('Look at you! Focus session finished. Take a proper little break. ♡');
    if(!$('quiet').checked)window.buddy.notify('Focus session complete. Time for a little break.');
  }else updateFocusUI(now);
  if(now>=nextWater){nextWater=now+45*60000;if(!paused&&!$('quiet').checked&&$('water').checked){say('Hydration check, darling. A few sips before your next adventure.');window.buddy.notify('Time for a few sips of water.');}}
  if(now>=nextStretch){nextStretch=now+60*60000;if(!paused&&!$('quiet').checked&&$('stretch').checked){if(state==='idle')temporaryPose('stretch',4200);say('Your chair called. It needs a break from you. Stretch for a minute? ♡');window.buddy.notify('Stand up and stretch for a minute.');}}
},1000);
function updateFocusUI(now=Date.now()){
  const active=focus.deadline>now,changed=$('focus-controls').hidden===active;
  $('focus-controls').hidden=!active;$('end-focus-quick').hidden=!active;
  const seconds=Math.ceil(focus.remaining(now)/1000);
  $('timer').textContent='FOCUS · '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  if(changed)syncLayout();
}
function endFocus(){
  const wasFocused=focus.stop();updateFocusUI();mood('idle');behavior.resume(Date.now());
  say(wasFocused?'Focus ended. No guilt, darling. We can start fresh whenever you’re ready. ♡':'Timer and movement stopped. A fresh start whenever you need it.');
}
function behaviorContext(){const now=Date.now();return{now,idleFor:now-lastInteraction,state,enabled:$('companion-behavior').checked,energy:$('energy').value,paused,hidden:document.hidden,dragging:!!dragging,chatOpen:!$('panel').hidden,speaking:!$('bubble').hidden,busy:sceneBusy,focus:focus.deadline>now,quiet:$('quiet').checked,roam:$('roam').checked};}
function attention(duration=1800){clearTimeout(attentionTimer);pet.classList.add('noticing');attentionTimer=setTimeout(()=>pet.classList.remove('noticing'),duration);}
function playScene(action){
  cancelScene();const token=sceneSerial;sceneBusy=true;
  let index=0;
  const next=()=>{
    if(token!==sceneSerial||paused||dragging||document.hidden){cancelScene();return;}
    const step=action.steps[index++];
    if(!step){sceneBusy=false;mood(focus.deadline>Date.now()?deskActivity:action.returnState||'idle');return;}
    mood(step.name,1,true);sceneTimer=setTimeout(next,step.duration);
  };next();
}
function actOnOwn(action){
  if(!action)return;
  if(action.kind==='walk')startMovement('walk',Math.random()<.5?-1:1);
  else if(action.kind==='settle')mood(action.name);
  else if(action.kind==='sequence')playScene(action);
  else if(action.kind==='attention')attention(action.duration);
  if(action.text)say(action.text);
}
setInterval(()=>actOnOwn(behavior.tick(behaviorContext())),1000);
pet.addEventListener('pointerenter',()=>{if($('companion-behavior').checked&&!paused)pet.classList.add('attending');actOnOwn(behavior.hover(behaviorContext()));});
pet.addEventListener('pointerleave',()=>pet.classList.remove('attending'));
pet.addEventListener('pointermove',event=>{if(!dragging&&!paused&&$('companion-behavior').checked){const r=pet.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(event.clientX-r.x)/r.width*2-1));pet.style.setProperty('--look-x',x*2+'px');pet.style.setProperty('--look-tilt',x*1.2+'deg');}});
pet.addEventListener('contextmenu',event=>{event.preventDefault();lastInteraction=Date.now();cancelScene();mood(focus.deadline>Date.now()?deskActivity:'idle');actOnOwn(behavior.play(behaviorContext()));});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('panel').hidden)toggleChat();});
mood(focus.deadline>Date.now()?deskActivity:'idle');
updateFocusUI();
