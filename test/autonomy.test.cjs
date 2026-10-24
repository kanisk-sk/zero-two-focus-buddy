const{test}=require('node:test');
const assert=require('node:assert/strict');
const{CompanionBehavior}=require('../src/autonomy.js');
const context=(overrides={})=>({now:25000,idleFor:25000,state:'idle',enabled:true,paused:false,hidden:false,dragging:false,chatOpen:false,speaking:false,focus:false,quiet:false,roam:true,...overrides});
test('companion initiates an action without a command and avoids immediate repetition',()=>{
 const b=new CompanionBehavior(0,()=>0);const a=b.tick(context());assert.equal(a.name,'wave');
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
 assert.equal(b.tick(context({focus:true})),null);
 const a=b.tick(context({now:200000,focus:true}));assert.equal(a.kind,'message');
 assert.equal(b.hover(context({now:300000,focus:true})),null);
});
test('hover reactions have a cooldown and manual commands take priority',()=>{
 const b=new CompanionBehavior(0,()=>0);
 assert.equal(b.hover(context()).name,'wink');assert.equal(b.hover(context({now:26000})),null);
 b.hold(70000);assert.equal(b.hover(context({now:71000})),null);
});
test('long absence leads to a settled nap and disabling roaming prevents walks',()=>{
 const b=new CompanionBehavior(0,()=>.99);assert.equal(b.tick(context({now:500000,idleFor:500000})).name,'sleep');
 const c=new CompanionBehavior(0,()=>.99);assert.notEqual(c.tick(context({roam:false})).kind,'walk');
});
