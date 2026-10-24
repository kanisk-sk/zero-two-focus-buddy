// Local behavior scheduling: no model, microphone, app tracking or network access.
(function(root){
 class CompanionBehavior{
  constructor(now=Date.now(),random=Math.random){this.random=random;this.nextAction=now+20000;this.nextSpeech=now+180000;this.holdUntil=0;this.nextHover=0;this.lastAction='';this.lastLine='';}
  between(min,max){return min+this.random()*(max-min);}
  hold(now,duration=120000){this.holdUntil=Math.max(this.holdUntil,now+duration);}
  line(lines){const choices=lines.filter(line=>line!==this.lastLine);const line=choices[Math.floor(this.random()*choices.length)];this.lastLine=line;return line;}
  blocked(c){return !c.enabled||c.paused||c.hidden||c.dragging||c.chatOpen||c.speaking||c.now<this.holdUntil;}
  tick(c){
   if(this.blocked(c)||c.now<this.nextAction)return null;
   this.nextAction=c.now+this.between(35000,70000);
   if(c.focus){
    if(c.quiet||c.now<this.nextSpeech)return null;
    this.nextSpeech=c.now+this.between(480000,720000);
    return{kind:'message',text:this.line(['I’m working alongside you. One little step at a time. ♡','No rush, darling. Just the next small task.','You keep going. I’ll keep you company. ♡'])};
   }
   if(!['idle','rest','sit','crossleg','sleep','writing','reading','laptop'].includes(c.state))return null;
   if(['writing','reading','laptop'].includes(c.state))return null;
   if(c.state==='sleep')return{kind:'pose',name:'yawn',duration:3500};
   if(c.idleFor>480000&&c.state!=='sleep'){this.nextAction=c.now+this.between(120000,240000);return{kind:'settle',name:'sleep'};}
   const options=c.idleFor>180000?['rest','sit','yawn','stretch']:['wave','wink','curious','stretch','sit','crossleg','jump',...(c.roam?['walk','walk']:[])];
   const choices=options.filter(name=>name!==this.lastAction);
   const name=choices[Math.floor(this.random()*choices.length)];this.lastAction=name;
   const result=name==='walk'?{kind:'walk'}:{kind:'pose',name,duration:['rest','sit','crossleg'].includes(name)?20000: name==='stretch'?4200:name==='jump'?900:3000};
   if(!c.quiet&&c.now>=this.nextSpeech){
    result.text=this.line(['Just checking in. How’s your little mission going? ♡','I’m taking a tiny break. You’re allowed one too.','Still here, darling. You’ve got company. ♡','A little progress counts. Don’t undersell it.']);
    this.nextSpeech=c.now+this.between(300000,540000);
   }
   return result;
  }
  hover(c){
   if(this.blocked(c)||c.focus||c.now<this.nextHover||!['idle','rest','sit','crossleg','sleep'].includes(c.state))return null;
   this.nextHover=c.now+45000;this.nextAction=c.now+this.between(25000,45000);
   return{kind:'pose',name:c.state==='sleep'?'yawn':this.random()<.5?'wink':'wave',duration:2500};
  }
 }
 if(typeof module!=='undefined')module.exports={CompanionBehavior};
 else root.CompanionBehavior=CompanionBehavior;
})(typeof window!=='undefined'?window:globalThis);
