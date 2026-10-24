const{test}=require('node:test');
const assert=require('node:assert/strict');
const{clampPosition,planLayout}=require('../src/window-layout.cjs');
const area={x:0,y:0,width:1440,height:900};
test('drag constraints let the character reach every display edge despite a large transparent window',()=>{
 const rect={x:95,y:318,width:170,height:170};
 const topLeft=clampPosition(-1000,-1000,rect,area);
 assert.equal(topLeft.x+rect.x,0);assert.equal(topLeft.y+rect.y,0);
 const bottomRight=clampPosition(5000,5000,rect,area);
 assert.equal(bottomRight.x+rect.x+rect.width,1440);
 assert.equal(bottomRight.y+rect.y+rect.height,900);
});
test('quiet layout shrinks to the character and preserves its screen position',()=>{
 const oldRect={x:95,y:318,width:170,height:170},window={x:900,y:200,width:360,height:500};
 const result=planLayout({area,window,oldRect,size:170,mode:'quiet'});
 assert.equal(result.width,194);assert.equal(result.height,194);
 assert.equal(result.x+result.rect.x,window.x+oldRect.x);
 assert.equal(result.y+result.rect.y,window.y+oldRect.y);
});
test('chat near the top opens below the character without pushing her downward',()=>{
 const oldRect={x:12,y:12,width:170,height:170},window={x:500,y:-12,width:194,height:194};
 const result=planLayout({area,window,oldRect,size:170,mode:'chat'});
 assert.equal(result.side,'below');assert.equal(result.y+result.rect.y,0);
 assert.ok(result.y+result.height<=900);
});
test('speech near the bottom appears above and closing it preserves the character anchor',()=>{
 const oldRect={x:12,y:12,width:170,height:170},window={x:700,y:718,width:194,height:194};
 const bubble=planLayout({area,window,oldRect,size:170,mode:'bubble',bubbleHeight:80});
 assert.equal(bubble.side,'above');assert.equal(bubble.y+bubble.rect.y,730);
 const quiet=planLayout({area,window:bubble,oldRect:bubble.rect,size:170,mode:'quiet'});
 assert.equal(quiet.y+quiet.rect.y,730);
});
test('negative monitor coordinates are supported and chat stays horizontally visible',()=>{
 const monitor={x:-1920,y:-200,width:1920,height:1080},oldRect={x:12,y:12,width:170,height:170};
 const result=planLayout({area:monitor,window:{x:-1932,y:200,width:194,height:194},oldRect,size:170,mode:'chat'});
 assert.ok(result.x>=monitor.x);assert.ok(result.x+result.width<=0);
});
test('compact chat and expanded settings preserve the same character anchor',()=>{
 const oldRect={x:12,y:12,width:170,height:170},window={x:500,y:500,width:194,height:194};
 const compact=planLayout({area,window,oldRect,size:170,mode:'chat',chatHeight:118});
 const expanded=planLayout({area,window:compact,oldRect:compact.rect,size:170,mode:'chat',chatHeight:310});
 assert.equal(compact.height,312);assert.equal(expanded.height,504);
 assert.equal(compact.y+compact.rect.y,expanded.y+expanded.rect.y);
 assert.equal(compact.x+compact.rect.x,expanded.x+expanded.rect.x);
});
