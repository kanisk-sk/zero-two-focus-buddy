function parseCommand(input) {
  const text = String(input).trim().toLowerCase();
  if(/^(apps|list apps|show apps|what apps can you open\??)$/.test(text))return{type:'apps'};
  if(/^(?:go|move) to (?:the )?top(?: edge)?$/.test(text))return{type:'top-edge'};
  const launch=String(input).trim().match(/^(?:open|launch|start)\s+(?:app\s+)?([a-zA-Z][a-zA-Z0-9 .-]{0,79})$/i);
  if(launch)return{type:'open-app',name:launch[1].trim()};
  const desk=text.match(/^(?:work|study|desk)(?: mode)?(?: (write|writing|read|reading|laptop|typing))?$|^(write|writing|read|reading|laptop|typing)$/);
  if(desk){const activity=desk[1]||desk[2]||'laptop';return{type:'desk',activity:/^writ/.test(activity)?'writing':/^read/.test(activity)?'reading':'laptop'};}
  const focus = text.match(/^focus(?: for)?(?: (\d+))?(?: min(?:ute)?s?)?$/);
  if (focus) {
    const minutes = Number(focus[1] || 25);
    return minutes >= 1 && minutes <= 180 ? {type:'focus', minutes} : {type:'invalid-focus'};
  }
  if (/^(?:stop|cancel|end)(?: (?:my )?(?:focus(?: mode| session)?|timer|session))?$|^stop focusing$/.test(text)) return {type:'stop'};
  if (/^(drink|monster|drink break)$/.test(text)) return {type:'drink'};
  if (/^(sleep|nap)$/.test(text)) return {type:'sleep'};
  if (/^(wake|wake up)$/.test(text)) return {type:'wake'};
  if (/^(jump|hop)$/.test(text)) return {type:'jump'};
  if (/^(walk|wander)$/.test(text)) return {type:'walk'};
  if (/^(sit|stay)$/.test(text)) return {type:'sit'};
  if (/^(rest|lie down|relax)$/.test(text)) return {type:'rest'};
  if (/^(climb|climb up)$/.test(text)) return {type:'climb'};
  if (/^(hang|hang on)$/.test(text)) return {type:'hang'};
  if (/^(stretch|yawn|wave|dance|victory|crossleg)$/.test(text)) return {type:'pose',name:text};
  const expression=text.match(/^(?:express(?:ion)?|look|feel)\s+(neutral|happy|smile|excited|laughing|smug|teasing|wink|curious|surprised|shocked|angry|annoyed|pout|embarrassed|sad|determined|worried|sleepy|calm)$/);
  if(expression)return {type:'expression',name:expression[1]};
  if(/^(happy|smile|wink|smug|sad|angry)$/.test(text))return {type:'expression',name:text};
  if (/^(help|commands)$/.test(text)) return {type:'help'};
  const search = String(input).trim().match(/^search(?: for)?\s+(.+)$/i);
  if (search) return {type:'search', query:search[1]};
  const conversation=[['greeting',/^(hi|hey|hello|good morning|good evening)(?: there| zero two| darling| buddy)?[!. ]*$/],['thanks',/^(thanks|thank you|thankyou)(?: so much)?[!. ]*$/],['tired',/^(?:i(?: am|’m|'m)? )?(?:so |really )?(tired|exhausted|sleepy)[!. ]*$/],['bored',/^(?:i(?: am|’m|'m)? )?(?:so |really )?bored[!. ]*$/],['compliment',/^(?:you(?: are|’re|'re)? )?(?:so |really )?(cute|adorable|amazing)[!. ]*$/],['status',/^(how are you|what are you doing|what’s up|what's up)[?! .]*$/]];
  for(const [intent,pattern] of conversation)if(pattern.test(text))return{type:'conversation',intent};
  return {type:'chat'};
}
module.exports = {parseCommand};
