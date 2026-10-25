(function(root){
 class FocusSession{
  constructor(storage,clock=Date.now){this.storage=storage;this.clock=clock;const saved=Number(storage.getItem('focusEnd'));this.deadline=Number.isFinite(saved)&&saved>clock()?saved:0;if(!this.deadline)storage.removeItem('focusEnd');}
  start(minutes){if(!Number.isFinite(minutes)||minutes<1||minutes>180)return false;this.deadline=this.clock()+minutes*60000;this.storage.setItem('focusEnd',String(this.deadline));return true;}
  stop(){const wasActive=this.deadline>0;this.deadline=0;this.storage.removeItem('focusEnd');return wasActive;}
  remaining(now=this.clock()){return Math.max(0,this.deadline-now);}
 }
 if(typeof module!=='undefined')module.exports={FocusSession};else root.FocusSession=FocusSession;
})(typeof window!=='undefined'?window:globalThis);
