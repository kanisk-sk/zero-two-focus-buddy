// Sprite sheets use equal square cells; the original bitmap is never rescaled or sliced on disk.
(() => {
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
        image.onload=()=>{this.loaded.add(key);if(this.key===key)this.render();};
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
    }
    pause(value){this.paused=value;}
  }
  window.BuddyAnimation=BuddyAnimation;
})();
