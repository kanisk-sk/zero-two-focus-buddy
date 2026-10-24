const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseCommand}=require('../src/commands.cjs');
test('focus durations are bounded and default to 25 minutes',()=>{
 assert.deepEqual(parseCommand('focus'),{type:'focus',minutes:25});
 assert.deepEqual(parseCommand('focus for 10 minutes'),{type:'focus',minutes:10});
 for(const value of ['focus 0','focus 181'])assert.equal(parseCommand(value).type,'invalid-focus');
});
test('search retains the original query',()=>assert.deepEqual(parseCommand('search for Darling in the Franxx'),{type:'search',query:'Darling in the Franxx'}));
test('unrecognized commands never become executable instructions',()=>{
 for(const text of ['open Calculator; say hello','open $(whoami)','open /tmp/example.app','rm -rf /','focus 5; say hello','<script>'])assert.equal(parseCommand(text).type,'chat');
});
test('app launch requests are parsed as names and the installed-app list is discoverable',()=>{
 assert.deepEqual(parseCommand('Open Google Chrome'),{type:'open-app',name:'Google Chrome'});
 assert.deepEqual(parseCommand('launch app VS Code'),{type:'open-app',name:'VS Code'});
 assert.deepEqual(parseCommand('apps'),{type:'apps'});
 assert.deepEqual(parseCommand('start Calculator'),{type:'open-app',name:'Calculator'});
 assert.equal(parseCommand('open '+'a'.repeat(81)).type,'chat');
});
test('animation commands retain their intended actions',()=>{
 assert.deepEqual(parseCommand('climb up'),{type:'climb'});
 assert.deepEqual(parseCommand('go to top'),{type:'top-edge'});
 assert.deepEqual(parseCommand('lie down'),{type:'rest'});
 assert.deepEqual(parseCommand('stretch'),{type:'pose',name:'stretch'});
 assert.deepEqual(parseCommand('look surprised'),{type:'expression',name:'surprised'});
 assert.deepEqual(parseCommand('expression determined'),{type:'expression',name:'determined'});
 assert.equal(parseCommand('look anything; open terminal').type,'chat');
});

test('desk commands choose writing, reading or laptop without starting a timer',()=>{
 assert.deepEqual(parseCommand('work mode'),{type:'desk',activity:'laptop'});
 assert.deepEqual(parseCommand('study writing'),{type:'desk',activity:'writing'});
 assert.deepEqual(parseCommand('read'),{type:'desk',activity:'reading'});
 assert.deepEqual(parseCommand('typing'),{type:'desk',activity:'laptop'});
});
