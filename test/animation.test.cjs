const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(){
 const callbacks=[],images=[];
 class Image{constructor(){images.push(this);}}
 const context={window:{},Image,setInterval:fn=>callbacks.push(fn)};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/animation.js'),'utf8'),context);
 const element={style:{},hidden:true},fallback={hidden:false};
 const player=new context.window.BuddyAnimation(element,fallback);
 return{player,element,fallback,images,bounds:context.window.BuddySpriteBounds,tick:()=>callbacks.forEach(fn=>fn())};
}
test('standing image stays visible until the requested sheet is available',()=>{
 const s=setup();s.player.show('walk');assert.equal(s.fallback.hidden,false);
 s.images[0].onload();assert.equal(s.fallback.hidden,false);
 s.images[2].onload();assert.equal(s.fallback.hidden,true);assert.equal(s.element.hidden,false);
});
test('eight-frame loops wrap without leaking into an adjacent row and pause freezes frames',()=>{
 const s=setup();s.images.forEach(image=>image.onload());s.player.show('walk');
 for(let i=0;i<7;i++)s.tick();
 assert.equal(s.element.style.backgroundPosition,'100% 100%');
 s.player.pause(true);s.tick();assert.equal(s.player.frame,7);
 s.player.pause(false);s.tick();assert.equal(s.player.frame,0);
 assert.equal(s.element.style.backgroundPosition,'0% 0%');
 s.player.show('walk',-1);assert.equal(s.element.style.transform,'scaleX(-1)');
});
test('sleep and rest have distinct frames; expression selection is static',()=>{
 const s=setup();s.images.forEach(image=>image.onload());
 s.player.show('rest');assert.equal(s.element.style.backgroundPosition,'66.66666666666666% 0%');
 s.player.show('sleep');assert.equal(s.element.style.backgroundPosition,'100% 0%');
 s.player.show('calm');assert.equal(s.element.style.backgroundPosition,'100% 100%');
 s.tick();assert.equal(s.element.style.backgroundPosition,'100% 100%');
 s.player.show('idle');assert.equal(s.element.hidden,true);assert.equal(s.fallback.hidden,false);
});
test('driven walk advances with actual distance rather than elapsed time',()=>{
 const s=setup();s.images.forEach(image=>image.onload());s.player.show('walk');s.player.drive();
 s.tick();assert.equal(s.player.frame,0);
 s.player.advanceMotion(12,100);assert.equal(s.player.frame,3);
 s.player.advanceMotion(0,1000);assert.equal(s.player.frame,3);
 s.player.advanceMotion(-20,100);assert.equal(s.player.frame,0);
 s.player.pause(true);s.player.advanceMotion(8,100);assert.equal(s.player.frame,0);
});
test('climb holds a reach longer and moves more strongly during pull frames',()=>{
 const s=setup();s.images.forEach(image=>image.onload());s.player.show('climb');s.player.drive();
 s.player.advanceMotion(0,219);assert.equal(s.player.frame,0);const reach=s.player.pullFactor();
 s.player.advanceMotion(0,141);assert.equal(s.player.frame,2);assert.ok(s.player.pullFactor()>reach);
 s.player.advanceMotion(0,1080);assert.equal(s.player.frame,0);
});
test('stretch raises, holds and releases once rather than cycling or freezing overhead',()=>{
 const s=setup();s.images.forEach(image=>image.onload());s.player.show('stretch');
 s.player.advanceMotion(0,900);assert.equal(s.player.frame,3);
 s.player.advanceMotion(0,3100);assert.equal(s.player.frame,7);
 s.player.advanceMotion(0,10000);assert.equal(s.player.frame,7);
 s.player.loop=true;s.player.advanceMotion(0,1);assert.equal(s.player.frame,0);
});
test('sprite boundary detection excludes disconnected neighboring hair and head fragments',()=>{
 const s=setup(),width=20,height=20,data=new Uint8ClampedArray(width*height*4);
 for(let y=3;y<17;y++)for(let x=5;x<15;x++)data[(y*width+x)*4+3]=255;
 for(const [x,y] of [[0,7],[1,7],[8,19],[9,19]])data[(y*width+x)*4+3]=255;
 const box=s.bounds(data,width,height);
 assert.deepEqual([box.minX,box.minY,box.maxX,box.maxY],[5,3,14,16]);
});
