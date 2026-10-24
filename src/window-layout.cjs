function clampPosition(x,y,rect,area){
  return{
    x:Math.round(Math.max(area.x-rect.x,Math.min(area.x+area.width-rect.x-rect.width,x))),
    y:Math.round(Math.max(area.y-rect.y,Math.min(area.y+area.height-rect.y-rect.height,y)))
  };
}
function planLayout({area,window,oldRect,size,mode,bubbleHeight=80,chatHeight=310}){
  const width=Math.min(area.width,mode==='quiet'?size+24:360);
  const anchor={x:window.x+oldRect.x,y:window.y+oldRect.y};
  const above=Math.max(0,anchor.y-area.y),below=Math.max(0,area.y+area.height-anchor.y-size);
  const desired=mode==='chat'?Math.max(100,Math.min(360,chatHeight)):mode==='bubble'?Math.max(60,Math.min(180,bubbleHeight+24)):0;
  const side=desired<=above||above>=below?'above':'below';
  const extra=mode==='quiet'?0:Math.min(desired,Math.max(0,(side==='above'?above:below)-12));
  const height=Math.min(area.height,size+24+extra);
  const rect={x:(width-size)/2,y:side==='above'?height-size-12:12,width:size,height:size};
  const position=clampPosition(anchor.x-rect.x,anchor.y-rect.y,rect,area);
  if(mode!=='quiet')position.x=Math.round(Math.max(area.x,Math.min(area.x+area.width-width,position.x)));
  return{...position,width,height,rect,side};
}
module.exports={clampPosition,planLayout};
