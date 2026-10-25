const{test}=require('node:test');
const assert=require('node:assert/strict');
const{FocusSession}=require('../src/focus.js');
function storage(initial={}){const values=new Map(Object.entries(initial));return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
test('focus starts with a persisted deadline and can be stopped before time',()=>{
 const saved=storage(),focus=new FocusSession(saved,()=>1000);
 assert.equal(focus.start(25),true);assert.equal(focus.remaining(),1500000);assert.equal(saved.getItem('focusEnd'),'1501000');
 assert.equal(focus.stop(),true);assert.equal(focus.deadline,0);assert.equal(saved.getItem('focusEnd'),null);
 assert.equal(focus.remaining(2000000),0);assert.equal(new FocusSession(saved,()=>2000000).deadline,0);assert.equal(focus.stop(),false);
});
test('active sessions survive reopening; expired or corrupt deadlines do not trigger a new session',()=>{
 assert.equal(new FocusSession(storage({focusEnd:'9000'}),()=>1000).deadline,9000);
 for(const value of ['500','NaN','Infinity','-9']){const saved=storage({focusEnd:value});assert.equal(new FocusSession(saved,()=>1000).deadline,0);assert.equal(saved.getItem('focusEnd'),null);}
});
test('focus rejects invalid durations without creating a deadline',()=>{
 const focus=new FocusSession(storage(),()=>0);for(const minutes of [0,-1,181,NaN,Infinity])assert.equal(focus.start(minutes),false);assert.equal(focus.deadline,0);
});
