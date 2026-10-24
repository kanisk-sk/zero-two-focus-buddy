// Continuous two-bone gait. One set of painted parts keeps the face/body fixed.
(function(root){
 function leg(hip,foot,length=32){
  const dx=foot.x-hip.x,dy=foot.y-hip.y,d=Math.min(length*2-.001,Math.hypot(dx,dy));
  const actual=Math.hypot(dx,dy)||1,h=Math.sqrt(Math.max(0,length*length-d*d/4));
  return{x:(hip.x+foot.x)/2+dy/actual*h,y:(hip.y+foot.y)/2-dx/actual*h};
 }
 function gait(distance,size=170){
  const cycle=48*size/170,phase=((distance/cycle)%1+1)%1;
  const bob=1.1*Math.cos(phase*Math.PI*4);
  const hips=[{x:99,y:130+bob},{x:101,y:130+bob}];
  const legs=hips.map((hip,i)=>{
   const p=(phase+i*.5)%1,stance=.62;
   const span=cycle*stance*200/size;
   const x=p<stance?span/2-span*p/stance:-span/2+span*(p-stance)/(1-stance);
   const lift=p<stance?0:7*Math.sin(Math.PI*(p-stance)/(1-stance));
   const foot={x:hip.x+x,y:190-lift};
   return{hip,knee:leg(hip,foot),foot,planted:p<stance};
  });
  return{phase,bob,legs};
 }
 if(typeof module!=='undefined'){module.exports={gait,leg};return;}
 let shared;
 function load(){
  if(shared)return shared;
  shared=Promise.all(['../assets/walk-parts.png','../assets/walk.png'].map(url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;}))).then(([atlas,head])=>{
   const c=document.createElement('canvas');c.width=atlas.naturalWidth;c.height=atlas.naturalHeight;
   const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(atlas,0,0);
   const parts=[];
   for(let i=0;i<12;i++){
    const x=Math.round(i%4*c.width/4),y=Math.round(Math.floor(i/4)*c.height/3),w=Math.round((i%4+1)*c.width/4)-x,h=Math.round((Math.floor(i/4)+1)*c.height/3)-y;
    const b=root.BuddySpriteBounds(ctx.getImageData(x,y,w,h).data,w,h);
    parts.push(b?{x:x+b.minX,y:y+b.minY,w:b.maxX-b.minX+1,h:b.maxY-b.minY+1}:{x,y,w,h});
   }
   return{atlas,head,parts};
  });return shared;
 }
 class BuddyWalkRig{
  constructor(element,onReady){
   this.element=element;this.canvas=document.createElement('canvas');this.canvas.className='walk-rig';this.canvas.hidden=true;element.append(this.canvas);
   this.ctx=this.canvas.getContext('2d');this.distance=0;this.visual=0;this.active=false;this.paused=false;this.ready=false;
   load().then(data=>{this.data=data;this.ready=true;onReady();}).catch(()=>{});
  }
  show(active,direction){this.active=active;this.direction=direction;this.canvas.hidden=!active;if(active&&!this.paused&&!this.raf){this.last=performance.now();this.raf=requestAnimationFrame(t=>this.draw(t));}}
  setPaused(value){this.paused=value;if(value&&this.raf){cancelAnimationFrame(this.raf);this.raf=null;}else if(!value&&this.active)this.show(true,this.direction);}
  reset(){this.distance=0;this.visual=0;}
  move(distance){if(!this.paused)this.distance+=Math.abs(distance);}
  part(index,x,y,w,h,angle=0){const p=this.data.parts[index],c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(this.data.atlas,p.x,p.y,p.w,p.h,-w/2,-h/2,w,h);c.restore();}
  segment(index,a,b,width){const angle=-Math.atan2(b.x-a.x,b.y-a.y),length=Math.hypot(b.x-a.x,b.y-a.y);this.part(index,(a.x+b.x)/2,(a.y+b.y)/2,width,length+4,angle);}
  draw(now){
   this.raf=null;if(!this.active||!this.ready)return;
   const dt=Math.min(50,now-this.last);this.last=now;
   if(!this.paused)this.visual+=(this.distance-this.visual)*(1-Math.exp(-dt/28));
   const size=this.element.clientWidth||170,dpr=Math.min(2,window.devicePixelRatio||1),pixels=Math.round(size*dpr);
   if(this.canvas.width!==pixels){this.canvas.width=pixels;this.canvas.height=pixels;}
   const c=this.ctx;c.setTransform(pixels/200,0,0,pixels/200,0,0);c.clearRect(0,0,200,200);
   const pose=gait(this.visual,size),bob=pose.bob;
   this.part(1,87,86+bob,88,145,Math.sin(pose.phase*Math.PI*2)*.018);
   const arm=i=>{
    const swing=Math.sin(pose.phase*Math.PI*2+i*Math.PI)*.28;
    const shoulder={x:i===0?100:108,y:84+bob};
    const elbow={x:shoulder.x+Math.sin(swing)*24,y:shoulder.y+Math.cos(swing)*24};
    const hand={x:elbow.x+Math.sin(swing-.08)*23,y:elbow.y+Math.cos(swing-.08)*23};
    this.segment(4+i,shoulder,elbow,10);this.segment(6+i,elbow,hand,10);
   };
   arm(0);
   pose.legs.forEach((l,i)=>{this.segment(8+i,l.hip,l.knee,14);this.segment(10+i,l.knee,l.foot,14);});
   this.part(3,101,133+bob,22,17);
   this.part(2,103,110+bob,35,65);
   arm(1);
   // Reuse one established profile head in every phase instead of changing faces per frame.
   c.drawImage(this.data.head,150,0,190,195,76,10+bob,65,67);
   this.raf=requestAnimationFrame(t=>this.draw(t));
  }
 }
 root.BuddyWalkRig=BuddyWalkRig;
})(typeof window!=='undefined'?window:globalThis);
