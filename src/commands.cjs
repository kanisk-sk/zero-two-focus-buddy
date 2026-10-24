function parseCommand(input) {
  const text = String(input).trim().toLowerCase();
  const focus = text.match(/^focus(?: for)?(?: (\d+))?(?: min(?:ute)?s?)?$/);
  if (focus) {
    const minutes = Number(focus[1] || 25);
    return minutes >= 1 && minutes <= 180 ? {type:'focus', minutes} : {type:'invalid-focus'};
  }
  if (/^(stop|cancel)( focus| timer)?$/.test(text)) return {type:'stop'};
  if (/^(sleep|nap)$/.test(text)) return {type:'sleep'};
  if (/^(wake|wake up)$/.test(text)) return {type:'wake'};
  if (/^(jump|hop)$/.test(text)) return {type:'jump'};
  if (/^(walk|wander)$/.test(text)) return {type:'walk'};
  if (/^(sit|stay)$/.test(text)) return {type:'sit'};
  if (/^(help|commands)$/.test(text)) return {type:'help'};
  const search = String(input).trim().match(/^search(?: for)?\s+(.+)$/i);
  if (search) return {type:'search', query:search[1]};
  return {type:'chat'};
}
module.exports = {parseCommand};
