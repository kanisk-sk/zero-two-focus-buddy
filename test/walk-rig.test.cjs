const{test}=require('node:test');
const assert=require('node:assert/strict');
const{gait}=require('../src/walk-rig.js');
test('walk always has a planted foot and planted feet remain on one ground line',()=>{
 for(let distance=0;distance<48;distance+=.2){const p=gait(distance);assert.ok(p.legs.some(l=>l.planted));for(const l of p.legs)if(l.planted)assert.equal(l.foot.y,190);}
});
test('gait loops continuously, scales with display size and keeps bone lengths constant',()=>{
 assert.deepEqual(gait(0),gait(48));assert.deepEqual(gait(12),gait(24,340));
 for(let distance=0;distance<48;distance+=.5)for(const l of gait(distance).legs){assert.ok(Math.abs(Math.hypot(l.knee.x-l.hip.x,l.knee.y-l.hip.y)-32)<.001);assert.ok(Math.abs(Math.hypot(l.foot.x-l.knee.x,l.foot.y-l.knee.y)-32)<.001);}
 const before=gait(48-.0001),after=gait(48+.0001);
 for(let i=0;i<2;i++)assert.ok(Math.hypot(before.legs[i].foot.x-after.legs[i].foot.x,before.legs[i].foot.y-after.legs[i].foot.y)<.001);
});

test('a planted foot cancels screen travel instead of sliding along with the body',()=>{
 const size=170,step=2,a=gait(2,size).legs[0],b=gait(2+step,size).legs[0];
 assert.ok(a.planted&&b.planted);
 assert.ok(Math.abs((b.foot.x-a.foot.x)*size/200+step)<1e-9);
});
