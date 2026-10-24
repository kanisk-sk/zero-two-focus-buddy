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
 for(const text of ['open Terminal','rm -rf /','focus 5; say hello','<script>'])assert.equal(parseCommand(text).type,'chat');
});
