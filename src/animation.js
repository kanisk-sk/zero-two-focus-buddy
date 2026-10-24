// Sprite sheets use equal square cells; the original bitmap is never rescaled or sliced on disk.
(() => {
  // Find the main connected silhouette, ignoring stray pixels from neighboring cells.
  function spriteBounds(data,width,height){
    const seen=new Uint8Array(width*height),stack=new Int32Array(width*height);
    let largest=0,result=null;
    for(let start=0;start<seen.length;start++){
      if(seen[start]||data[start*4+3]<96)continue;
      let size=0,count=0,minX=width,minY=height,maxX=0,maxY=0;
      stack[size++]=start;seen[start]=1;
      while(size){
        const index=stack[--size],x=index%width,y=Math.floor(index/width);
        count++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
        const visit=next=>{if(!seen[next]&&data[next*4+3]>=96){seen[next]=1;stack[size++]=next;}};
        if(x>0)visit(index-1);if(x+1<width)visit(index+1);if(y>0)visit(index-width);if(y+1<height)visit(index+width);
      }
      if(count>largest){largest=count;result={minX,minY,maxX,maxY};}
    }
    return result;
  }
  function analyze(sheet,image){
    if(sheet.bounds||typeof document==='undefined')return;
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context)return;
    context.drawImage(image,0,0);sheet.bounds=[];
    for(let row=0;row<sheet.rows;row++)for(let col=0;col<sheet.cols;col++){
      const x=Math.round(col*canvas.width/sheet.cols),y=Math.round(row*canvas.height/sheet.rows);
      const width=Math.round((col+1)*canvas.width/sheet.cols)-x,height=Math.round((row+1)*canvas.height/sheet.rows)-y;
      const bounds=spriteBounds(context.getImageData(x,y,width,height).data,width,height);
      sheet.bounds.push(bounds?`${Math.max(0,bounds.minY-2)/height*100}% ${Math.max(0,width-bounds.maxX-3)/width*100}% ${Math.max(0,height-bounds.maxY-3)/height*100}% ${Math.max(0,bounds.minX-2)/width*100}%`:'0%');
    }
  }
  const expressions = ['neutral','happy','smile','excited','laughing','smug','teasing','wink','curious','surprised','shocked','angry','annoyed','pout','embarrassed','sad','determined','worried','sleepy','calm'];
  const poses = ['sit','crossleg','rest','sleep','stretch','yawn','wave','jump','drag','hang','dance','victory'];
  const sheets = {
    expressions: {url:'../assets/expressions.png',cols:4,rows:5},
    poses: {url:'../assets/poses.png',cols:4,rows:3},
    walk: {url:'../assets/walk.png',cols:4,rows:2},
    climb: {url:'../assets/climb.png',cols:4,rows:2},
    stretch: {url:'../assets/stretch.png',cols:4,rows:2}
  };
  class BuddyAnimation {
    constructor(element, fallback) {
      this.element=element;
      this.fallback=fallback;
      this.frame=0;
      this.paused=false;
      this.direction=1;
      this.driven=false;
      this.distance=0;
      this.elapsed=0;
      this.loop=false;
      this.loaded=new Set();
      this.images=[];
      for(const [key,sheet] of Object.entries(sheets)) {
        const image=new Image();
        image.onload=()=>{try{analyze(sheet,image);}catch{delete sheet.bounds;}this.loaded.add(key);if(this.key===key)this.render();};
        image.src=sheet.url;
        this.images.push(image);
      }
      this.timer=setInterval(()=>{if(!this.paused&&!this.driven&&this.count>1){if(this.name==='stretch')this.advanceMotion(0,110);else{this.frame=(this.frame+1)%this.count;this.render();}}},110);
    }
    show(name, direction=1) {
      this.direction=direction;
      this.element.style.transform=direction<0?'scaleX(-1)':'none';
      const previous=this.name;
      this.name=name;
      this.count=1;
      if(name==='walk'||name==='climb'||name==='stretch'){this.key=name;this.start=0;this.count=8;}
      else if(poses.includes(name)){this.key='poses';this.start=poses.indexOf(name);}
      else if(expressions.includes(name)){this.key='expressions';this.start=expressions.indexOf(name);}
      else {this.key=null;this.start=0;}
      if(previous!==name){this.frame=0;this.driven=false;this.distance=0;this.elapsed=0;}
      this.render();
    }
    drive(){this.driven=true;}
    advanceMotion(distance,milliseconds=0){
      if(this.paused)return;
      if(this.name==='walk'){
        this.distance+=Math.abs(distance);
        this.frame=Math.floor(this.distance/4)%8;
      }else if(this.name==='climb'||this.name==='stretch'){
        const stretch=this.name==='stretch';
        const durations=stretch?[220,300,350,650,800,800,350,530]:[220,140,180,220,140,180,180,180];
        const total=stretch?4000:1440;
        this.elapsed=stretch&&!this.loop?Math.min(total-1,this.elapsed+milliseconds):(this.elapsed+milliseconds)%total;
        let cursor=this.elapsed;
        this.frame=0;
        while(this.frame<7&&cursor>=durations[this.frame])cursor-=durations[this.frame++];
      }
      this.render();
    }
    pullFactor(){return [0.25,0.65,1.9,0.25,0.65,1.9,0.7,0.7][this.frame]||0.7;}
    render() {
      const sheet=sheets[this.key];
      const ready=sheet&&this.loaded.has(this.key);
      this.fallback.hidden=!!ready;
      this.element.hidden=!ready;
      if(!ready)return;
      const cell=this.start+this.frame;
      const col=cell%sheet.cols,row=Math.floor(cell/sheet.cols);
      this.element.style.backgroundImage=`url("${sheet.url}")`;
      this.element.style.backgroundSize=`${sheet.cols*100}% ${sheet.rows*100}%`;
      this.element.style.backgroundPosition=`${col/(sheet.cols-1)*100}% ${row/(sheet.rows-1)*100}%`;
      this.element.style.clipPath=`inset(${sheet.bounds?.[cell]||'0%'})`;
    }
    pause(value){this.paused=value;}
  }
  window.BuddyAnimation=BuddyAnimation;
  window.BuddySpriteBounds=spriteBounds;
})();
