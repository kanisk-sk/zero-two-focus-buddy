const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFile,spawn}=require('node:child_process');
const {promisify}=require('node:util');
const execFileAsync=promisify(execFile);

function catalog(platform=process.platform,env=process.env,home=os.homedir()){
  if(platform==='darwin'){
    const definitions=[
      ['calculator','Calculator',['calc'],'Calculator'],
      ['notes','Notes',[],'Notes'],['calendar','Calendar',[],'Calendar'],
      ['mail','Mail',['email'],'Mail'],['music','Music',['apple music'],'Music'],
      ['safari','Safari',[],'Safari'],['chrome','Google Chrome',['google chrome'],'Google Chrome'],
      ['brave','Brave Browser',['brave browser'],'Brave Browser'],['spotify','Spotify',[],'Spotify'],
      ['vscode','Visual Studio Code',['vs code','visual studio code','code'],'Visual Studio Code'],
      ['word','Microsoft Word',['microsoft word'],'Microsoft Word'],
      ['excel','Microsoft Excel',['microsoft excel'],'Microsoft Excel'],
      ['pages','Pages',[],'Pages'],['numbers','Numbers',[],'Numbers'],['keynote','Keynote',[],'Keynote'],
      ['whatsapp','WhatsApp',[],'WhatsApp'],['iina','IINA',[],'IINA']
    ];
    return definitions.map(([id,label,aliases,bundle])=>({id,label,aliases,
      paths:[`/System/Applications/${bundle}.app`,`/Applications/${bundle}.app`,path.join(home,'Applications',bundle+'.app')]
    }));
  }
  if(platform==='win32'){
    const join=path.win32.join;
    const windows=env.SystemRoot||'C:\\Windows';
    const programs=env.ProgramFiles||'C:\\Program Files';
    const programs86=env['ProgramFiles(x86)']||'C:\\Program Files (x86)';
    const local=env.LOCALAPPDATA,roaming=env.APPDATA;
    return [
      {id:'calculator',label:'Calculator',aliases:['calc'],paths:[join(windows,'System32','calc.exe')]},
      {id:'notepad',label:'Notepad',aliases:['notes'],paths:[join(windows,'System32','notepad.exe')]},
      {id:'explorer',label:'File Explorer',aliases:['file explorer','files'],paths:[join(windows,'explorer.exe')]},
      {id:'edge',label:'Microsoft Edge',aliases:['microsoft edge'],paths:[join(programs86,'Microsoft','Edge','Application','msedge.exe'),join(programs,'Microsoft','Edge','Application','msedge.exe')]},
      {id:'chrome',label:'Google Chrome',aliases:['google chrome'],paths:[join(programs,'Google','Chrome','Application','chrome.exe'),join(programs86,'Google','Chrome','Application','chrome.exe'),...(local?[join(local,'Google','Chrome','Application','chrome.exe')]:[])]},
      {id:'vscode',label:'Visual Studio Code',aliases:['vs code','visual studio code','code'],paths:[join(programs,'Microsoft VS Code','Code.exe'),...(local?[join(local,'Programs','Microsoft VS Code','Code.exe')]:[])]},
      {id:'spotify',label:'Spotify',aliases:[],paths:roaming?[join(roaming,'Spotify','Spotify.exe')]:[]}
    ];
  }
  return [];
}
function normalize(value){return typeof value==='string'?value.trim().toLowerCase().replace(/\s+/g,' '):'';}
function resolveApp(name,options={}){
  const platform=options.platform||process.platform;
  const item=catalog(platform,options.env,options.home).find(app=>[app.id,app.label,...app.aliases].some(alias=>normalize(alias)===normalize(name)));
  if(!item)return{ok:false,reason:'unsupported',requested:typeof name==='string'?name.slice(0,80):''};
  const target=item.paths.find(options.exists||fs.existsSync);
  return target?{ok:true,id:item.id,label:item.label,target,platform}:{ok:false,reason:'not-installed',label:item.label};
}
function availableApps(options={}){
  return catalog(options.platform,options.env,options.home).filter(app=>app.paths.some(options.exists||fs.existsSync)).map(({id,label})=>({id,label}));
}
async function run(plan){
  if(plan.platform==='darwin'){
    await execFileAsync('/usr/bin/open',['-a',plan.target],{shell:false,timeout:10000});
  }else if(plan.platform==='win32'){
    await new Promise((resolve,reject)=>{
      const child=spawn(plan.target,[],{shell:false,detached:true,stdio:'ignore'});
      child.once('error',reject);
      child.once('spawn',()=>{child.unref();resolve();});
    });
  }else throw new Error('Unsupported platform');
}
async function launchApp(name,options={}){
  const plan=resolveApp(name,options);
  if(!plan.ok)return plan;
  try{
    await(options.run||run)(plan);
    return{ok:true,id:plan.id,label:plan.label};
  }catch{return{ok:false,reason:'launch-failed',label:plan.label};}
}
module.exports={availableApps,resolveApp,launchApp};
