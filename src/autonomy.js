// Local personality and behavior scheduling; no network or other-app monitoring.
(function(root){
 const scenes=[
  {name:'wave',steps:[['curious',900],['wave',1700],['happy',1600]],lines:['There you are. Ready for a little adventure? ♡','Hey, darling. You’ve got company.']},
  {name:'jump',steps:[['jump',900],['victory',1400],['smug',1700]],lines:['Tiny victory! I’m celebrating in advance.','A little energy boost. Catch! ♡']},
  {name:'dance',steps:[['dance',2400],['wink',1400]],lines:['Don’t mind me. The soundtrack in my head is excellent.','One tiny dance break. You can join in. ♡']},
  {name:'stretch',steps:[['stretch',4200],['yawn',1300],['crossleg',4500]],lines:['Stretch with me? Even heroes have shoulders.','Little stretch. Big plans.']},
  {name:'teasing',steps:[['curious',1200],['teasing',1800],['wink',1200]],lines:['You looked over. I saw that. ♡','I was being perfectly innocent. Mostly.']},
  {name:'sit',steps:[['sit',6000],['smug',1800]],lines:['I’ll claim this little spot. You handle the adventure.','Settling in. We’re a team today. ♡']},
  {name:'walk',steps:[],lines:['Just exploring my tiny kingdom.','A little patrol. I’ll be right here. ♡']}
 ];
 class CompanionBehavior{
  constructor(now=Date.now(),random=Math.random){this.random=random;this.nextAction=now+4000;this.nextSpeech=now+15000;this.nextFocusSpeech=now+180000;this.holdUntil=0;this.nextHover=0;this.lastAction='';this.lastLine='';this.greeted=false;this.restingUntil=0;this.nextNap=0;this.nextDrink=now+300000;this.workSince=null;}
  between(min,max){return min+this.random()*(max-min);}
  hold(now,duration=12000){this.holdUntil=Math.max(this.holdUntil,now+duration);}
  resume(now){this.holdUntil=now+3000;this.nextAction=now+3000;this.restingUntil=0;}
  line(lines){const choices=lines.filter(line=>line!==this.lastLine);const line=choices[Math.floor(this.random()*choices.length)];this.lastLine=line;return line;}
  blocked(c,ignoreHold=false){return !c.enabled||c.paused||c.hidden||c.dragging||c.chatOpen||c.speaking||c.busy||(!ignoreHold&&c.now<this.holdUntil);}
  speak(c,lines,force=false){if(c.quiet||(!force&&c.now<this.nextSpeech))return undefined;this.nextSpeech=c.now+this.between(c.energy==='gentle'?180000:60000,c.energy==='gentle'?300000:120000);return this.line(lines);}
  scene(scene,c){return{kind:'sequence',name:scene.name,steps:scene.steps.map(([name,duration])=>({name,duration})),text:this.speak(c,scene.lines)};}
  drink(c,desk=false){
   this.nextDrink=c.now+this.between(1200000,1800000);
   if(desk)this.workSince=c.now;
   const prefix=desk?'desk-drink-':'drink-';
   return{kind:'sequence',name:'drink-break',returnState:desk?c.state:undefined,steps:[{name:prefix+'ready',duration:1400},{name:prefix+'sip',duration:2200},{name:prefix+'done',duration:1800}],text:this.speak(c,desk?['Tiny pit stop. Your co-pilot is still on duty. ♡']:['Bored? A tiny sip, then back to our adventure. ♡'])};
  }
  tick(c){
   if(this.blocked(c)||c.now<this.nextAction)return null;
   const gentle=c.energy==='gentle';
   this.nextAction=c.now+this.between(gentle?25000:9000,gentle?45000:18000);
   const atDesk=c.focus||['writing','reading','laptop'].includes(c.state);
   if(atDesk){if(this.workSince===null)this.workSince=c.now;}else this.workSince=null;
   if(atDesk&&c.now-this.workSince>=1200000&&c.now>=this.nextDrink)return this.drink(c,true);
   if(c.focus){
    if(!c.quiet&&c.now>=this.nextFocusSpeech){this.nextFocusSpeech=c.now+this.between(240000,420000);return{kind:'message',text:this.line(['You keep the focus. I’ll keep you company. ♡','One task, one little step. We’ve got this.','Still working alongside you, darling.'])};}
    return{kind:'attention',duration:1600};
   }
   if(!['idle','rest','sit','crossleg','sleep','writing','reading','laptop'].includes(c.state))return null;
   if(['writing','reading','laptop'].includes(c.state))return{kind:'attention',duration:1800,text:this.speak(c,['Look at us, being productive. ♡','Keeping you company at my little desk.'])};
   if(!this.greeted){this.greeted=true;return{kind:'sequence',name:'greeting',steps:[{name:'wave',duration:1800},{name:'happy',duration:1500}],text:this.speak(c,['There you are, darling. Let’s make today interesting. ♡'],true)};}
   if(c.state==='sleep'){
    if(c.now<this.restingUntil)return null;
    return{kind:'sequence',name:'waking',steps:[{name:'yawn',duration:2500},{name:'stretch',duration:4200},{name:'wave',duration:1600}],text:this.speak(c,['Okay, beauty sleep complete. Missed me? ♡'])};
   }
   if(c.state!=='sleep'&&c.idleFor>=300000&&c.idleFor<600000&&c.now>=this.nextDrink)return this.drink(c);
   // Time away from the companion does not mean the user is inactive elsewhere.
   if(c.idleFor>(gentle?600000:1200000)&&c.now>=this.nextNap){this.nextNap=c.now+1200000;this.restingUntil=c.now+this.between(90000,150000);return{kind:'settle',name:'sleep',text:this.speak(c,['I’m resting my eyes. I’ll be right here. ♡'])};}
   const choices=scenes.filter(scene=>scene.name!==this.lastAction&&(c.roam||scene.name!=='walk'));
   const scene=choices[Math.floor(this.random()*choices.length)];this.lastAction=scene.name;
   if(scene.name==='walk')return{kind:'walk',text:this.speak(c,scene.lines)};
   return this.scene(scene,c);
  }
  hover(c){
   if(this.blocked(c)||c.now<this.nextHover)return null;
   this.nextHover=c.now+(c.energy==='gentle'?35000:12000);this.nextAction=c.now+this.between(9000,16000);
   if(c.focus||['writing','reading','laptop'].includes(c.state))return{kind:'attention',duration:1600};
   if(c.state==='sleep'){this.restingUntil=0;return{kind:'sequence',name:'wake-hover',steps:[{name:'yawn',duration:1800},{name:'wave',duration:1800}],text:this.speak(c,['Oh! Hey, darling. I’m awake. Mostly.'])};}
   if(!['idle','rest','sit','crossleg'].includes(c.state))return null;
   return{kind:'sequence',name:'hover',steps:[{name:this.random()<.5?'wink':'curious',duration:1300},{name:'teasing',duration:1600}],text:this.speak(c,['Caught you looking. ♡','Yes, darling? I’m right here.'])};
  }
  play(c){
   if(this.blocked(c,true))return null;
   if(c.focus)return{kind:'attention',duration:1600};
   this.nextHover=c.now+12000;this.nextAction=c.now+15000;
   return{kind:'sequence',name:'play',steps:[{name:'surprised',duration:700},{name:'teasing',duration:1400},{name:'dance',duration:2200}],text:this.speak(c,['Poking the co-pilot? Bold move, darling. ♡','Oh, we’re playing now? Your move.'],true)};
  }
 }
 if(typeof module!=='undefined')module.exports={CompanionBehavior};else root.CompanionBehavior=CompanionBehavior;
})(typeof window!=='undefined'?window:globalThis);
