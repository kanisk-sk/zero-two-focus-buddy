const{test}=require('node:test');
const assert=require('node:assert/strict');
const{CompanionBehavior}=require('../src/autonomy.js');
const context=(overrides={})=>({now:25000,idleFor:25000,state:'idle',enabled:true,paused:false,hidden:false,dragging:false,chatOpen:false,speaking:false,focus:false,quiet:false,roam:true,...overrides});
test('companion initiates an action without a command and avoids immediate repetition',()=>{
 const b=new CompanionBehavior(0,()=>0);const a=b.tick(context());assert.equal(a.name,'greeting');
 assert.ok(a.steps.length>1);
 assert.equal(b.tick(context({now:26000})),null);
 const next=b.tick(context({now:70000}));assert.notEqual(next.name,a.name);
});
test('pause, disabled behavior, dragging, hidden window and conversation block autonomous actions',()=>{
 for(const property of ['paused','dragging','hidden','chatOpen','speaking']){
  const b=new CompanionBehavior(0,()=>0);assert.equal(b.tick(context({[property]:true})),null);
 }
 const b=new CompanionBehavior(0,()=>0);assert.equal(b.tick(context({enabled:false})),null);
 b.hold(20000);assert.equal(b.tick(context()),null);
});
test('quiet mode permits silent gestures but suppresses unsolicited speech',()=>{
 const b=new CompanionBehavior(0,()=>0);const a=b.tick(context({now:200000,quiet:true}));assert.ok(a);assert.equal(a.text,undefined);
});
test('focus sessions never trigger movement or replace the desk pose',()=>{
 const b=new CompanionBehavior(0,()=>.9);
 assert.equal(b.tick(context({focus:true})).kind,'attention');
 const a=b.tick(context({now:200000,focus:true}));assert.equal(a.kind,'message');
 assert.equal(b.hover(context({now:300000,focus:true})).kind,'attention');
});
test('hover reactions have a cooldown and manual commands take priority',()=>{
 const b=new CompanionBehavior(0,()=>0);
 assert.equal(b.hover(context()).steps[0].name,'wink');assert.equal(b.hover(context({now:26000})),null);
 b.hold(70000);assert.equal(b.hover(context({now:71000})),null);
});
test('long absence leads to a settled nap and disabling roaming prevents walks',()=>{
 const b=new CompanionBehavior(0,()=>.99);b.tick(context());assert.equal(b.tick(context({now:1300000,idleFor:1300000})).name,'sleep');
 const c=new CompanionBehavior(0,()=>.99);c.tick(context());assert.notEqual(c.tick(context({now:70000,roam:false})).kind,'walk');
});

test('lively mode begins promptly and chains actions instead of leaving a long idle gap',()=>{
 const b=new CompanionBehavior(0,()=>0);assert.equal(b.tick(context({now:3999})),null);
 const greeting=b.tick(context({now:4000}));assert.equal(greeting.name,'greeting');assert.ok(greeting.text);assert.ok(greeting.steps.length>=2);
 assert.ok(b.nextAction<=22000);b.hold(5000);assert.equal(b.tick(context({now:6000})),null);
 assert.ok(b.tick(context({now:18000})));
});
test('an active sequence cannot be interrupted by another autonomous scene',()=>{
 const b=new CompanionBehavior(0,()=>0);assert.equal(b.tick(context({busy:true})),null);assert.equal(b.hover(context({busy:true})),null);assert.equal(b.play(context({busy:true})),null);
});
test('right-click play is expressive but stays at the desk during focus',()=>{
 const b=new CompanionBehavior(0,()=>0);const play=b.play(context());assert.equal(play.kind,'sequence');assert.ok(play.steps.length>=2);assert.ok(play.text);
 assert.equal(b.play(context({focus:true})).kind,'attention');
});
test('quiet focus gives only silent attention and gentle mode spaces scenes farther apart',()=>{
 const lively=new CompanionBehavior(0,()=>0),gentle=new CompanionBehavior(0,()=>0);
 assert.equal(lively.tick(context({now:200000,focus:true,quiet:true})).kind,'attention');
 gentle.tick(context({energy:'gentle'}));const other=new CompanionBehavior(0,()=>0);other.tick(context());assert.ok(gentle.nextAction>other.nextAction);
});

test('a long gap in companion interaction does not send her straight back to sleep after waking',()=>{
 const b=new CompanionBehavior(0,()=>0);b.tick(context());
 assert.equal(b.tick(context({now:1300000,idleFor:1300000})).name,'sleep');
 assert.equal(b.tick(context({now:1450000,idleFor:1450000,state:'sleep'})).name,'waking');
 assert.notEqual(b.tick(context({now:1500000,idleFor:1500000})).kind,'settle');
});

test('bored drink break has ordered poses, cooldown, and obeys pause and quiet mode',()=>{
 const b=new CompanionBehavior(0,()=>0);b.greeted=true;
 const c=context({now:310000,idleFor:310000,quiet:true});
 const a=b.tick(c);assert.equal(a.name,'drink-break');assert.equal(a.text,undefined);
 assert.deepEqual(a.steps.map(s=>s.name),['drink-ready','drink-sip','drink-done']);
 assert.notEqual(b.tick({...c,now:340000}).name,'drink-break');
 const paused=new CompanionBehavior(0,()=>0);assert.equal(paused.tick({...c,paused:true}),null);
});
test('long desk work takes a seated break and returns to the selected desk activity',()=>{
 const b=new CompanionBehavior(0,()=>0);
 b.tick(context({now:25000,focus:true,state:'reading'}));
 const a=b.tick(context({now:1225000,focus:true,state:'reading'}));
 assert.equal(a.name,'drink-break');assert.equal(a.returnState,'reading');
 assert.deepEqual(a.steps.map(s=>s.name),['desk-drink-ready','desk-drink-sip','desk-drink-done']);
 assert.notEqual(b.tick(context({now:1255000,focus:true,state:'reading'})).name,'drink-break');
});
test('leaving desk work resets continuous work duration',()=>{
 const b=new CompanionBehavior(0,()=>0);b.greeted=true;
 b.tick(context({now:25000,focus:true,state:'laptop'}));
 b.tick(context({now:800000,idleFor:0}));
 b.tick(context({now:900000,focus:true,state:'laptop'}));
 assert.notEqual(b.tick(context({now:1250000,focus:true,state:'laptop'})).name,'drink-break');
});
