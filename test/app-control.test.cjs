const{test}=require('node:test');
const assert=require('node:assert/strict');
const{availableApps,resolveApp,launchApp}=require('../src/app-control.cjs');
test('macOS app aliases resolve only to known installed bundles',()=>{
 const options={platform:'darwin',home:'/Users/test',exists:p=>p==='/Applications/Google Chrome.app'};
 assert.equal(resolveApp('  GOOGLE   CHROME ',options).target,'/Applications/Google Chrome.app');
 assert.equal(resolveApp('Chrome',options).ok,true);
 assert.equal(resolveApp('Calculator',options).reason,'not-installed');
 assert.deepEqual(availableApps(options),[{id:'chrome',label:'Google Chrome'}]);
});
test('Windows support uses fixed executable locations and excludes absent apps',()=>{
 const options={platform:'win32',env:{SystemRoot:'D:\\Windows',ProgramFiles:'D:\\Programs','ProgramFiles(x86)':'D:\\Programs86',LOCALAPPDATA:'D:\\User\\Local'},exists:p=>p==='D:\\Windows\\System32\\calc.exe'||p==='D:\\User\\Local\\Programs\\Microsoft VS Code\\Code.exe'};
 assert.equal(resolveApp('calc',options).target,'D:\\Windows\\System32\\calc.exe');
 assert.equal(resolveApp('vs code',options).target,'D:\\User\\Local\\Programs\\Microsoft VS Code\\Code.exe');
 assert.deepEqual(availableApps(options).map(x=>x.id),['calculator','vscode']);
});
test('shell fragments, paths, unknown apps, and argument injection cannot reach the launcher',async()=>{
 let called=false;
 const options={platform:'darwin',exists:()=>true,run:async()=>{called=true;}};
 for(const name of ['Calculator; rm -rf /','$(whoami)','/tmp/Calculator.app','Terminal','Chrome --remote-debugging-port=9222','constructor','__proto__']){
  const result=await launchApp(name,options);assert.equal(result.ok,false);assert.equal(result.reason,'unsupported');
 }
 assert.equal(called,false);
});
test('launch reports success and operating-system failures without exposing paths',async()=>{
 let target;
 const options={platform:'darwin',exists:p=>p==='/System/Applications/Calculator.app',run:async plan=>{target=plan.target;}};
 assert.deepEqual(await launchApp('Calculator',options),{ok:true,id:'calculator',label:'Calculator'});
 assert.equal(target,'/System/Applications/Calculator.app');
 assert.deepEqual(await launchApp('Calculator',{...options,run:async()=>{throw new Error('private details');}}),{ok:false,reason:'launch-failed',label:'Calculator'});
 assert.deepEqual(availableApps({platform:'linux'}),[]);
});
