// Earth renderer (stand-in drawing: used when there is no NASA texture / no track video).
const RAD = Math.PI/180;
const LAND_RAW = [
 ['#5E9462',[[-168,66],[-156,71],[-128,70],[-108,68],[-90,68],[-80,62],[-65,60],[-56,52],[-66,45],[-70,42],[-76,35],[-81,31],[-80,25],[-83,29],[-90,30],[-97,26],[-97,20],[-90,18],[-87,21],[-88,16],[-83,10],[-78,8],[-80,7],[-85,11],[-95,16],[-105,20],[-110,24],[-113,31],[-118,34],[-124,40],[-124,48],[-131,55],[-140,60],[-152,59],[-160,56],[-165,61]]],
 ['#EEF4FA',[[-45,60],[-52,65],[-55,70],[-68,77],[-60,82],[-30,83],[-20,78],[-22,70],[-38,65]]],
 ['#3F8A52',[[-78,8],[-72,12],[-62,10],[-52,5],[-50,0],[-37,-5],[-35,-9],[-39,-17],[-48,-26],[-54,-34],[-58,-38],[-65,-42],[-68,-52],[-72,-53],[-74,-45],[-72,-35],[-70,-20],[-76,-14],[-81,-5],[-80,1]]],
 ['#A9A066',[[-17,15],[-16,22],[-10,29],[-6,35],[10,37],[20,32],[32,31],[35,24],[43,12],[51,12],[48,4],[40,-3],[39,-10],[35,-20],[32,-28],[26,-34],[19,-34],[15,-27],[12,-17],[13,-8],[9,0],[9,4],[-4,5],[-8,4],[-13,8]]],
 ['#74A067',[[-9,37],[-9,43],[-1,44],[-4,48],[3,51],[8,54],[8,57],[5,59],[6,62],[14,68],[25,71],[40,67],[60,69],[70,73],[90,76],[105,77],[115,74],[140,73],[160,70],[178,69],[178,65],[165,60],[162,56],[156,51],[155,58],[142,59],[135,54],[141,48],[132,43],[128,36],[126,34],[122,37],[118,38],[122,31],[120,26],[110,21],[108,17],[109,12],[105,9],[100,13],[99,8],[103,2],[98,9],[95,16],[90,22],[86,20],[80,15],[78,8],[73,17],[72,21],[67,25],[57,25],[59,22],[55,17],[45,13],[43,16],[39,21],[35,28],[36,36],[28,37],[27,41],[23,38],[20,40],[13,45],[16,41],[15,38],[12,42],[9,44],[3,42],[0,39],[-5,36]]],
 ['#BC9560',[[114,-22],[122,-17],[130,-12],[137,-12],[136,-15],[142,-11],[146,-19],[153,-26],[151,-34],[146,-39],[140,-38],[135,-35],[130,-32],[123,-34],[115,-34]]],
 ['#EEF4FA',Array.from({length:18},(_,i)=>[-180+i*20,-70+4*Math.sin(i*1.3)])],
 ['#74A067',[[-5,50],[1,51],[0,54],[-3,58],[-6,56],[-4,53]]],
 ['#74A067',[[130,32],[136,34],[141,37],[142,43],[145,44],[141,45],[139,38],[133,35]]],
 ['#5E9462',[[44,-25],[47,-25],[50,-16],[49,-12],[44,-17]]],
 ['#3F8A52',[[109,1],[117,7],[119,1],[116,-4],[110,-2]]],
 ['#3F8A52',[[95,5],[100,2],[106,-6],[104,-5]]],
 ['#3F8A52',[[131,-1],[141,-3],[150,-7],[147,-10],[138,-8],[132,-4]]],
 ['#DCE8E4',[[-24,65],[-14,66],[-14,64],[-22,63]]]
];
function dens(poly){ const out=[]; for (let i=0;i<poly.length;i++){ const a=poly[i], b=poly[(i+1)%poly.length]; let dl=b[0]-a[0]; if (dl>180) dl-=360; if (dl<-180) dl+=360;
  const n=Math.max(1,Math.ceil(Math.max(Math.abs(dl),Math.abs(b[1]-a[1]))/4)); for (let k=0;k<n;k++){ const lo=(a[0]+dl*k/n)*RAD, la=(a[1]+(b[1]-a[1])*k/n)*RAD; out.push([lo,Math.sin(la),Math.cos(la)]); } } return out; }
const LAND = LAND_RAW.map(([c,p]) => [c, dens(p)]);
let seed = 7; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
const CLOUDS = Array.from({length:30}, () => { const lo=-180+360*rnd(), la=-60+120*rnd(), a=8+16*rnd(), b=2+4*rnd();
  return dens(Array.from({length:10},(_,i)=>[lo+a*Math.cos(i*.628)/Math.max(.35,Math.cos(la*RAD)), la+b*Math.sin(i*.628)])); });
export function drawEarth(c, cx, cy, R, lon0, lat0, ice){
  const l0=lon0*RAD, s0=Math.sin(lat0*RAD), c0=Math.cos(lat0*RAD);
  const path = (pts, off) => {
    const n = pts.length, P = new Array(n); let first = -1;
    for (let i=0;i<n;i++){ const d=pts[i][0]-l0-(off||0), sl=pts[i][1], cl=pts[i][2];
      P[i] = [cl*Math.sin(d), c0*sl-s0*cl*Math.cos(d), s0*sl+c0*cl*Math.cos(d)]; if (first<0 && P[i][2]>=0) first=i; }
    c.beginPath(); if (first<0) return;
    const cross = (a,b) => { const t=a[2]/(a[2]-b[2]), x=a[0]+(b[0]-a[0])*t, y=a[1]+(b[1]-a[1])*t, m=Math.hypot(x,y)||1; return Math.atan2(y/m, x/m); };
    let exitA = null; c.moveTo(cx+R*P[first][0], cy-R*P[first][1]);
    for (let k=1;k<=n;k++){ const a=P[(first+k-1)%n], b=P[(first+k)%n];
      if (a[2]>=0 && b[2]>=0) c.lineTo(cx+R*b[0], cy-R*b[1]);
      else if (a[2]>=0){ exitA = cross(a,b); c.lineTo(cx+R*Math.cos(exitA), cy-R*Math.sin(exitA)); }
      else if (b[2]>=0){ const inA = cross(a,b); let dA = inA-exitA; while (dA>Math.PI) dA-=2*Math.PI; while (dA<-Math.PI) dA+=2*Math.PI;
        for (let j=1;j<=10;j++){ const an=exitA+dA*j/10; c.lineTo(cx+R*Math.cos(an), cy-R*Math.sin(an)); }
        c.lineTo(cx+R*b[0], cy-R*b[1]); } }
    c.closePath(); };
  let g = c.createRadialGradient(cx,cy,R*.95,cx,cy,R*1.17); g.addColorStop(0,'rgba(143,211,255,.55)'); g.addColorStop(1,'rgba(143,211,255,0)');
  c.fillStyle=g; c.beginPath(); c.arc(cx,cy,R*1.17,0,7); c.fill();
  g = c.createRadialGradient(cx-R*.35,cy-R*.35,R*.1,cx,cy,R); g.addColorStop(0,'#3C86C8'); g.addColorStop(.6,'#1B4F8A'); g.addColorStop(1,'#0B2A55');
  c.fillStyle=g; c.beginPath(); c.arc(cx,cy,R,0,7); c.fill();
  c.save(); c.beginPath(); c.arc(cx,cy,R,0,7); c.clip();
  for (const [col,pts] of LAND){ path(pts); c.fillStyle=col; c.fill(); }
  const il=(90-(7+21*ice)), cap=[]; for (let i=0;i<60;i++){ const lo=i*6*RAD, la=(il+2.2*Math.sin(i*.9)+1.2*Math.sin(i*2.3))*RAD; cap.push([lo,Math.sin(la),Math.cos(la)]); }
  path(cap); c.fillStyle='rgba(248,252,255,.95)'; c.fill();
  c.fillStyle='rgba(255,255,255,.26)'; for (const cl of CLOUDS){ path(cl, -l0*.12); c.fill(); }
  g = c.createRadialGradient(cx-R*.45,cy-R*.4,R*.25,cx,cy,R*1.03); g.addColorStop(0,'rgba(255,255,255,.10)'); g.addColorStop(.55,'rgba(0,0,16,.12)'); g.addColorStop(1,'rgba(0,0,16,.72)');
  c.fillStyle=g; c.fillRect(cx-R,cy-R,2*R,2*R); c.restore();
  c.strokeStyle='rgba(170,220,255,.55)'; c.lineWidth=Math.max(1,R*.012); c.beginPath(); c.arc(cx,cy,R,0,7); c.stroke();
}
