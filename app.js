const $=id=>document.getElementById(id);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const newP=(name)=>({id:uid(),name,first:0,last:35,count:10,direction:'up',method:'poly',prot:'tab',measures:[]});
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch(e){return f}}
/* État : profils + profil actif (migration de l'ancienne version) */
let S=load('bb_state',null);
if(!S){
  const p=newP('Mon matériel');
  const old=load('bb_config',null), om=load('bb_measures',null);
  if(old)Object.assign(p,old);
  p.measures=om||[{id:'1',dist:18,mm:11},{id:'2',dist:30,mm:25}];
  S={profiles:[p],active:p.id};
}
if(S&&!S.polyMig){S.profiles.forEach(p=>{if(!p.method||p.method==='curve')p.method='poly'});S.polyMig=1}
const P=()=>S.profiles.find(p=>p.id===S.active)||S.profiles[0];
function save(){try{localStorage.setItem('bb_state',JSON.stringify(S))}catch(e){toast('Stockage indisponible')}}
function toast(m,ms){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),ms||1800)}
const r2=n=>Math.round(n*100)/100;
const fm=v=>String(Math.round(v));

/* Navigation */
function go(id){if(id!=='calib'){calOff=0;calRaw=null}
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('on'));
  $('v-'+id).classList.add('on');$('n-'+id).classList.add('on');
  refresh(id);scrollTo(0,0);
}
function refresh(id){
  id=id||document.querySelector('.view.on').id.slice(2);
  fillProfSel();applyProt();
  if(id==='calc'){chips();slopeChips();renderChart();calculate()}
  if(id==='meas'){mTable();mDrop()}
  if(id==='cfg'){loadCfg();renderHelp()}
  if(id==='pal')drawOverview();
  if(id==='calib')calibInit();
}

/* Profils */
function fillProfSel(){
  const s=$('profSel');s.innerHTML='';
  S.profiles.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;s.appendChild(o)});
  s.value=P().id;
}
function setActive(id){S.active=id;save();$('calcDist').value='';refresh()}
function newProf(){const n=prompt('Nom du nouveau profil :','Nouveau matériel');if(!n)return;const p=newP(n);S.profiles.push(p);S.active=p.id;save();refresh();toast('Profil créé')}
function dupProf(){const p=JSON.parse(JSON.stringify(P()));p.id=uid();p.name+=' (copie)';S.profiles.push(p);S.active=p.id;save();refresh();toast('Profil dupliqué')}
function delProf(){
  if(S.profiles.length<2){toast('Gardez au moins un profil');return}
  if(!confirm('Supprimer le profil « '+P().name+' » ?'))return;
  S.profiles=S.profiles.filter(p=>p.id!==S.active);S.active=S.profiles[0].id;save();refresh();
}
function renameProf(){const n=$('pName').value.trim();if(n){P().name=n;save();fillProfSel()}}

/* Coutures */
function step(){const p=P();if(isGlove()){const F=fingers();return F.length>1?(F[F.length-1].mm-F[0].mm)/(F.length-1):0}return p.count>1?(p.last-p.first)/(p.count-1):0}
function coutures(){
  if(isGlove())return gMarks();
  const p=P(),s=step(),l=[];if(p.count<2)return l;
  for(let i=0;i<p.count;i++){
    l.push({n:i+1,half:false,mm:Math.round(p.first+i*s)});
    if(i<p.count-1)l.push({n:i+1.5,half:true,mm:Math.round(p.first+(i+.5)*s)});
  }
  return l;
}
function cNum(mm){
  if(isGlove())return gLabel(mm);
  const p=P(),s=step();if(p.count<2||!s)return '—';
  const i=p.direction==='down'?1+(p.last-mm)/s:1+(mm-p.first)/s;
  const r=Math.round(i*2)/2,t=String(r).replace('.',',');
  return(r<1||r>p.count)?t+' (hors règle)':t;
}
function loadCfg(){
  const p=P();$('pName').value=p.name;$('cfgF').value=p.first;$('cfgL').value=p.last;
  $('cfgC').value=p.count;$('cfgD').value=p.direction;$('cfgM').value=p.method||'poly';$('cfgDeg').value=p.deg||'auto';$('cfgDeg').disabled=(p.method||'poly')!=='poly';$('cfgU').value=p.upAdj||0;$('cfgDn').value=p.downAdj||0;$('pProt').value=p.prot||'tab';offlineStatus();cfgPrev();
  drawPal($('palCfg'),null,null);
  if(isGlove())renderGlove();
}
function saveCfg(){
  const p=P();
  p.first=parseFloat($('cfgF').value)||0;p.last=parseFloat($('cfgL').value)||0;
  p.count=Math.max(2,parseInt($('cfgC').value)||2);p.direction=$('cfgD').value;p.method=$('cfgM').value;p.deg=$('cfgDeg').value;$('cfgDeg').disabled=p.method!=='poly';p.upAdj=parseFloat($('cfgU').value)||0;p.downAdj=parseFloat($('cfgDn').value)||0;
  save();cfgPrev();drawPal($('palCfg'),null,null);
}
function cfgPrev(){$('cfgP').textContent='Espacement : ~'+fm(Math.abs(step()))+' mm entre 2 coutures'}
function mDrop(){
  const s=$('mMk');s.innerHTML='<option value="">— choisir —</option>';
  coutures().forEach(c=>{const o=document.createElement('option');o.value=c.mm;o.textContent=(isGlove()?c.label:'Couture '+String(c.n).replace('.',','))+' ('+c.mm+' mm)';s.appendChild(o)});
}

/* Interpolation : pente monotone (Fritsch–Carlson), extrapolation linéaire aux extrémités */
function estimate(d){const e=estimateRaw(d);if(e)e.mm=Math.round(e.mm);return e}
/* Courbe théorique : polynôme ajusté à l'ensemble des mesures (moindres carrés).
   Logique pure dans calc.js (SWCalc) : testable unitairement, sans DOM ni stockage. */
function polyDeg(n){return SWCalc.polyDegFor(P(),n)}
function estimateRaw(d){return SWCalc.estimateFor(P(),d)}

/* Schéma de la palette : corde, coutures, position */
function drawPal(svg,mm,ghost){
  const p=P(),s=step();if(!svg)return;
  const top=22,bot=228,X=140,span=p.last-p.first||1;
  const Y=v=>{const t=((v-p.first)/span+.12)/1.24;return p.direction==='up'?bot-t*(bot-top):top+t*(bot-top)};
  let h='<line x1="'+X+'" y1="'+top+'" x2="'+X+'" y2="'+bot+'" stroke="var(--accent)" stroke-width="1.5"/>';
  h+='<text x="'+X+'" y="12" text-anchor="middle">'+(p.direction==='up'?'Encoche':'Encoche')+'</text>';
  coutures().forEach(c=>{
    const y=Y(c.mm);
    h+='<line x1="'+(X-(c.half?7:14))+'" y1="'+y+'" x2="'+(X+(c.half?7:14))+'" y2="'+y+'" stroke="var(--muted)" stroke-width="'+(c.half?.7:1.2)+'"/>';
    if(!c.half)h+='<text x="'+(X+22)+'" y="'+(y+3)+'">'+c.n+'</text>';
  });
  const mark=(v,cls)=>{
    const y=Y(v),g=cls==='g';
    let o='<line x1="'+(X-70)+'" y1="'+y+'" x2="'+(X+16)+'" y2="'+y+'" stroke="var(--accent)" stroke-width="'+(g?1:1.6)+'"'+(g?' stroke-dasharray="3 3" opacity=".6"':'')+'/>';
    if(!g&&isGlove())o+=gBox(v,y,X);
    else if(!g)o+='<rect x="'+(X-134)+'" y="'+(y-19)+'" width="98" height="38" rx="12" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.4"/>'
      +'<text x="'+(X-126)+'" y="'+(y+6)+'" style="fill:var(--accent);font-size:18px;font-weight:700">'+cNum(v).replace(' (hors règle)','!')+'</text><text x="'+(X-42)+'" y="'+(y+4)+'" text-anchor="end" style="fill:var(--muted);font-size:9px">'+fm(v)+' mm</text>';
    if(!g&&P().prot==='glove')o+=[-9,0,9].map(d=>'<rect x="'+(X-12)+'" y="'+(y+d-3.5)+'" width="24" height="7" rx="3.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.2"/>').join('');
    return o;
  };
  if(ghost!=null&&!isNaN(ghost))h+=mark(ghost,'g');
  if(mm!=null&&!isNaN(mm))h+=mark(mm,'m');
  svg.innerHTML=h;
}

/* Calcul */
function chips(){
  const M=P().measures.slice().sort((a,b)=>a.dist-b.dist),c=$('chips'),cur=parseFloat($('calcDist').value);
  c.innerHTML='';c.style.display=M.length?'flex':'none';
  M.forEach(m=>{const e=document.createElement('div');e.className='chip'+(m.dist===cur?' sel':'');e.textContent=m.dist+' m';
    e.onclick=()=>{$('calcDist').value=m.dist;calculate();chips()};c.appendChild(e)});
}
function calculate(){
  const d=parseFloat($('calcDist').value),B=$('rB');B.innerHTML='';drawGraph($('graphC'),null);
  const need=isGlove()&&!gValid(),gn=$('gNeed');gn.style.display=need?'block':'none';
  if(need){gn.innerHTML=tx('gneed')+' <a data-a="gset" style="color:var(--accent);text-decoration:underline;cursor:pointer">'+tx('gopen')+'</a>';$('rMk').textContent='—';$('rMm').textContent='';$('rD').textContent='';drawPal($('palCalc'),null,null);return}
  if(isNaN(d)){$('rMm').textContent='';$('rMk').textContent='—';$('rD').textContent='Entrez une distance';drawPal($('palCalc'),null,null);return}
  const a=angleFor(d),de=d*Math.cos(a*Math.PI/180),e=estimate(de);
  if(!e){$('rMm').textContent='';$('rMk').textContent='—';$('rD').textContent='Au moins 2 mesures nécessaires';drawPal($('palCalc'),null,null);return}
  const adj=slopeAdjMm(a,$('calcDir').value);if(adj)e.mm=Math.round(e.mm+adj);$('rMm').textContent='Position '+fm(e.mm)+' mm';
  $('rMk').textContent=mk(e.mm);
  const M=P().measures.map(m=>m.dist);
  $('rD').textContent='Plage mesurée : '+Math.min(...M)+' – '+Math.max(...M)+' m'+(a?' · distance utile '+de.toFixed(1)+' m (pente '+($('calcDir').value==='down'?'descendante':'montante')+' ≈ '+Math.round(a)+'°'+(adj?', '+(adj>0?'+':'')+Math.round(adj)+' mm':'')+')':'');
  B.innerHTML=(e.extra?'<span class="badge warn">Extrapolé — à vérifier au tir</span>':'<span class="badge ok">'+(P().method==='poly'?'Courbe théorique (polynôme)':'Interpolé entre vos mesures')+'</span>')+(coherence().length?'<span class="badge warn" style="margin-left:6px">Mesures à vérifier</span>':'');drawGraph($('graphC'),de);
  drawPal($('palCalc'),e.mm,null);
}
function renderChart(){
  const M=P().measures.slice().sort((a,b)=>a.dist-b.dist),tb=$('chart');tb.innerHTML='';
  if(M.length<2){tb.innerHTML='<tr><td colspan="3" class="empty">Ajoutez au moins 2 mesures</td></tr>';return}
  const set=new Set(M.map(m=>m.dist));
  for(let d=Math.ceil(M[0].dist/5)*5;d<=M[M.length-1].dist;d+=5)set.add(d);
  [...set].sort((a,b)=>a-b).forEach(d=>{const e=estimate(d);if(!e)return;
    const r=document.createElement('tr');r.innerHTML='<td>'+d+' m</td><td style="font-weight:700;color:var(--accent);font-size:1rem">'+cNum(e.mm)+'</td><td style="color:var(--muted);font-size:.78rem">'+fm(e.mm)+' mm</td>';tb.appendChild(r)});
}

/* Calibration */
let base=null,calOff=0,calRaw=null,calD=null;
function toCalib(){const d0=parseFloat($('calcDist').value),a=isNaN(d0)?0:angleFor(d0),d=isNaN(d0)?'':Math.round(d0*Math.cos(a*Math.PI/180)*10)/10;go('calib');if(d!==''){calOff=slopeAdjMm(a,$('calcDir').value);calRaw=d0;calD=d;$('cDist').value=d;calibInit()}}
function calibInit(){
  const d=parseFloat($('cDist').value),e=isNaN(d)?null:estimate(d);if(e)e.mm=Math.round(e.mm+calOff);
  base=e?e.mm:null;$('cObs').value='centre';
  $('cTheo').textContent=e?mk(e.mm)+' · '+fm(e.mm)+' mm':'—';
  $('cMm').value=e?fm(e.mm):'';calMark();
}
function autoAdj(){
  if(base===null)return;const h=Math.max(1,Math.round(unitStep(base))),o=$('cObs').value;
  $('cMm').value=fm(o==='haut'?base-h:o==='bas'?base+h:base);calMark();
}
function nudge(k){const v=parseFloat($('cMm').value),h=Math.max(1,Math.round(unitStep(v)));if(isNaN(v)||!h)return;$('cMm').value=fm(v+k*h);calMark()}
function calMark(){
  const v=parseFloat($('cMm').value);
  $('cMk').textContent=isNaN(v)?'':mk(v);
  drawPal($('palCal'),isNaN(v)?null:v,base);
}
function saveCal(){
  const d=parseFloat($('cDist').value),mm=parseFloat($('cMm').value);
  if(isNaN(d)||isNaN(mm)){toast('Distance et position requises');return}
  upsert(d,Math.round(mm-calOff));toast('Correction enregistrée');$('calcDist').value=(calRaw!=null&&d===calD)?calRaw:d;go('calc');
}

/* Mesures */
function upsert(dist,mm){mm=Math.round(mm);
  const M=P().measures,ex=M.find(m=>m.dist===dist);
  if(ex)ex.mm=mm;else M.push({id:uid(),dist,mm});
  M.sort((a,b)=>a.dist-b.dist);save();const w=coherence();if(w.length)setTimeout(()=>toast(w[0],4000),50);
}
function saveMeas(e){
  e.preventDefault();const d=parseFloat($('mDist').value),mm=parseFloat($('mMm').value);
  if(isNaN(d)||isNaN(mm))return;upsert(d,mm);
  $('mDist').value='';$('mMm').value='';$('mMk').value='';mTable();toast('Mesure enregistrée');
}
function delMeas(id){if(!confirm('Supprimer cette mesure ?'))return;P().measures=P().measures.filter(m=>m.id!==id);save();mTable()}
function mTable(){mExtras();
  const M=P().measures.slice().sort((a,b)=>a.dist-b.dist),tb=$('mBody');tb.innerHTML='';
  if(!M.length){tb.innerHTML='<tr><td colspan="5" class="empty">Aucune mesure</td></tr>';return}
  M.forEach(m=>{const r=document.createElement('tr'),eg=estimateRaw(m.dist),g=eg?Math.round(m.mm-eg.mm):0;
    r.innerHTML='<td>'+m.dist+' m</td><td style="font-weight:700;color:var(--accent);font-size:1rem">'+cNum(m.mm)+'</td><td style="color:var(--muted);font-size:.78rem">'+fm(m.mm)+' mm</td><td style="font-size:.85rem;color:'+(Math.abs(g)>=3?'var(--gap)':'var(--muted)')+'">'+(g>0?'+':g<0?'−':'')+Math.abs(g)+'</td><td><button class="x" aria-label="Supprimer">✕</button></td>';
    r.querySelector('button').onclick=()=>delMeas(m.id);tb.appendChild(r)});
}

/* Export / import */
function copy(t,msg){
  const fb=()=>{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');toast(msg)}catch(e){toast('Copie impossible')}a.remove()};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(()=>toast(msg),fb);else fb();
}
const today=()=>new Date().toISOString().slice(0,10);
function dlBlob(name,blob){
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
}
function dl(name,text,type){dlBlob(name,new Blob([text],{type:type||'application/json'}))}
function exportCSV(){
  const M=P().measures.slice().sort((a,b)=>a.dist-b.dist);
  const rows=['profil;distance_m;position_mm;repere'].concat(M.map(m=>P().name+';'+m.dist+';'+m.mm+';'+cNum(m.mm)));
  dl('stringwalker-mesures-'+today()+'.csv','\ufeff'+rows.join('\r\n'),'text/csv');toast(tx('dlok'));
}
function exportJSON(){
  dl('stringwalker-sauvegarde-'+today()+'.json',JSON.stringify(Object.assign({app:'stringwalker',savedWith:INFO.version,date:today()},S),null,1));toast(tx('dlok'));
}
function importFile(inp){
  const f=inp.files&&inp.files[0];inp.value='';if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const o=JSON.parse(rd.result);let ps;
      if(Array.isArray(o.profiles)&&o.profiles.length)ps=o.profiles;
      else if(Array.isArray(o.measures)){const p=newP('Importé');Object.assign(p,o.config||{});p.measures=o.measures;ps=[p]}
      else throw 0;
      ps=ps.map(p=>Object.assign(newP(p.name||'Profil'),p,{id:String(p.id||uid()),measures:(Array.isArray(p.measures)?p.measures:[]).map(m=>({id:String(m.id||uid()),dist:+m.dist,mm:Math.round(+m.mm)})).filter(m=>isFinite(m.dist)&&isFinite(m.mm))}));
      const nm=ps.reduce((n,p)=>n+p.measures.length,0);
      if(!confirm(tx('impq').replace('{p}',ps.length).replace('{m}',nm)))return;
      S={profiles:ps,active:ps.some(p=>p.id===o.active)?o.active:ps[0].id,polyMig:1};
      save();refresh();toast(tx('impok'));
    }catch(e){toast(tx('impbad'))}
  };
  rd.readAsText(f);
}
/* Export de l'aperçu des distances en image PNG (fond blanc, lisible à l'impression) */
const GPAL={'--bg':'#ffffff','--text':'#1d1f23','--muted':'#6f7178','--accent':'#7d6a45','--line':'#d8d4ca','--surface':'#f3f1ec','--warn':'#b45309','--gap':'#c2410c','--ok':'#3f7d5a','--card':'#ffffff'};
function ovSVG(){
  const svg=$('palOv');if(!svg||!svg.firstChild)return null;
  const vb=svg.getAttribute('viewBox').split(' ').map(Number),w=vb[2],h=vb[3];
  const inner=svg.innerHTML.replace(/var\((--[a-z]+)\)/g,(m,k)=>GPAL[k]||'#000');
  return{w,h,svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'"><style>text{font-family:Georgia,\'Times New Roman\',serif;font-size:10px;fill:#6f7178}</style>'+inner+'</svg>'};
}
function exportOverviewPNG(){
  const o=ovSVG();if(!o){toast(tx('nodata'));return}
  const sc=3,W=o.w*sc,H0=150,Hs=o.h*sc,H=H0+Hs+90,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const c=cv.getContext('2d');c.fillStyle='#ffffff';c.fillRect(0,0,W,H);
  c.fillStyle='#1d1f23';c.font='bold 54px Georgia,serif';c.fillText('Stringwalker',40,80);
  c.fillStyle='#6f7178';c.font='32px Georgia,serif';c.fillText(P().name+' · '+protName()+' · '+today(),40,125);
  const img=new Image();
  img.onload=()=>{c.drawImage(img,0,H0,W,Hs);c.fillStyle='#6f7178';c.font='26px Georgia,serif';c.fillText(tx('pngnote'),40,H-40);
    cv.toBlob(b=>{if(!b){toast(tx('pngfail'));return}dlBlob('stringwalker-distances-'+today()+'.png',b);toast(tx('dlok'))},'image/png')};
  img.onerror=()=>toast(tx('pngfail'));
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(o.svg);
}

/* Graphique distance → position */
function drawGraph(svg,cd){
  if(!svg)return;
  const fr=LG==='fr',p=P(),M=p.measures.slice().sort((a,b)=>a.dist-b.dist);
  svg.setAttribute('viewBox','0 0 320 272');
  if(M.length<2){svg.innerHTML='<text x="160" y="130" text-anchor="middle" style="font-size:12px">'+(fr?'Au moins 2 mesures':'At least 2 measurements')+'</text>';return}
  const W=320,H=236,L=46,R=14,T=70,B=34,x0=M[0].dist,x1=M[M.length-1].dist,pad=Math.max((x1-x0)*.06,1),lo=x0-pad,hi=x1+pad,S=[];
  for(let i=0;i<=80;i++){const d=lo+(hi-lo)*i/80,e=estimateRaw(d);if(e)S.push({d,mm:e.mm,x:e.extra})}
  const ys=S.map(s=>s.mm).concat(M.map(m=>m.mm)),a=Math.min(...ys),b=Math.max(...ys),q=(b-a||1)*.12,y0=a-q,y1=b+q;
  const px=d=>L+(d-lo)/(hi-lo)*(W-L-R),py=v=>H-B-(v-y0)/(y1-y0)*(H-T-B),f1=n=>n.toFixed(1);
  const T11='style="font-size:11px"',TX='style="font-size:11px;fill:var(--text)"';
  let h='';
  [0,1,2,3].forEach(i=>{const v=a+(b-a)*i/3,y=py(v);h+='<line x1="'+L+'" y1="'+f1(y)+'" x2="'+(W-R)+'" y2="'+f1(y)+'" stroke="var(--line)"/><text x="'+(L-6)+'" y="'+f1(y+4)+'" text-anchor="end" '+T11+'>'+Math.round(v)+'</text>'});
  h+='<line x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'" stroke="var(--muted)"/><line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'" stroke="var(--muted)"/>';
  M.forEach((m,i)=>{if(M.length<=7||i%2===0)h+='<line x1="'+f1(px(m.dist))+'" y1="'+(H-B)+'" x2="'+f1(px(m.dist))+'" y2="'+(H-B+4)+'" stroke="var(--muted)"/><text x="'+f1(px(m.dist))+'" y="'+(H-B+17)+'" text-anchor="middle" '+T11+'>'+m.dist+'</text>'});
  h+='<text x="'+(L-6)+'" y="'+(T-9)+'" text-anchor="end" '+T11+'>mm</text><text x="'+(W-R)+'" y="'+(H-3)+'" text-anchor="end" '+T11+'>distance (m)</text>';
  const meth=p.method==='poly'?(fr?'polynôme, degré ':'polynomial, degree ')+polyDeg(M.length):p.method==='linear'?(fr?'linéaire':'linear'):(fr?'courbe monotone':'monotone curve');
  h+='<line x1="14" y1="12" x2="42" y2="12" stroke="var(--accent)" stroke-width="2.6"/><text x="50" y="16" '+TX+'>'+(fr?'Théorique (':'Theoretical (')+meth+')</text>'
    +'<line x1="14" y1="30" x2="42" y2="30" stroke="var(--text)" stroke-width="1.8" stroke-dasharray="5 4"/><circle cx="28" cy="30" r="4" fill="var(--bg)" stroke="var(--text)" stroke-width="2"/><text x="50" y="34" '+TX+'>'+(fr?'Réelle (vos mesures)':'Real (your measurements)')+'</text>'
    +'<line x1="28" y1="43" x2="28" y2="55" stroke="var(--gap)" stroke-width="2.6"/><text x="50" y="52" '+TX+'>'+(fr?'Écart mesure / théorique':'Measurement vs theoretical gap')+'</text>';
  let pin='',pex='';
  for(let i=1;i<S.length;i++){const sg='M'+f1(px(S[i-1].d))+','+f1(py(S[i-1].mm))+'L'+f1(px(S[i].d))+','+f1(py(S[i].mm));if(S[i-1].x||S[i].x)pex+=sg;else pin+=sg}
  h+='<path d="'+pex+'" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="2 4" fill="none" opacity=".85"/><path d="'+pin+'" stroke="var(--accent)" stroke-width="2.6" fill="none" stroke-linejoin="round"/>';
  let mx=0,at=M[0].dist;
  M.forEach(m=>{const t=estimateRaw(m.dist),te=t?t.mm:m.mm,df=m.mm-te;if(Math.abs(df)>Math.abs(mx)){mx=df;at=m.dist}
    if(Math.abs(df)>=0.5)h+='<line x1="'+f1(px(m.dist))+'" y1="'+f1(py(m.mm))+'" x2="'+f1(px(m.dist))+'" y2="'+f1(py(te))+'" stroke="var(--gap)" stroke-width="2.6"/>';
    if(Math.round(Math.abs(df))>=1)h+='<text x="'+f1(px(m.dist))+'" y="'+f1(py(m.mm)+(df>0?-11:21))+'" text-anchor="middle" style="font-size:12px;font-weight:700;fill:var(--gap)">'+(df>0?'+':'−')+Math.round(Math.abs(df))+'</text>'});
  h+='<polyline points="'+M.map(m=>f1(px(m.dist))+','+f1(py(m.mm))).join(' ')+'" fill="none" stroke="var(--text)" stroke-width="1.8" stroke-dasharray="5 4"/>';
  M.forEach(m=>{h+='<circle cx="'+f1(px(m.dist))+'" cy="'+f1(py(m.mm))+'" r="4.5" fill="var(--bg)" stroke="var(--text)" stroke-width="2"/>'});
  if(cd!=null){const e=estimateRaw(cd);if(e&&cd>=lo&&cd<=hi)h+='<line x1="'+f1(px(cd))+'" y1="'+T+'" x2="'+f1(px(cd))+'" y2="'+(H-B)+'" stroke="var(--muted)" stroke-dasharray="3 3"/><circle cx="'+f1(px(cd))+'" cy="'+f1(py(e.mm))+'" r="5.5" fill="var(--accent)" stroke="var(--bg)" stroke-width="2"/>'}
  const g=Math.round(Math.abs(mx));
  h+='<text x="14" y="266" style="font-size:11px;fill:var(--muted)">'+(fr?'Écart maximal : ':'Maximum gap: ')+g+' mm'+(g>=1?(fr?' (à ':' (at ')+at+' m)':'')+'</text>';
  svg.innerHTML=h;
}

/* Cohérence des mesures */
function coherence(){
  const M=P().measures.slice().sort((a,b)=>a.dist-b.dist),w=[];
  if(M.length<3)return w;
  const s=[];for(let i=0;i<M.length-1;i++)s.push((M[i+1].mm-M[i].mm)/(M[i+1].dist-M[i].dist));
  for(let i=0;i<s.length-1;i++){
    const a=s[i],b=s[i+1],d=M[i+1].dist+' m';
    if(a*b<0)w.push('Sens inversé autour de '+d+' : la courbe monte puis redescend');
    else if(a!==0&&b!==0&&(Math.abs(a/b)>3||Math.abs(b/a)>3))w.push('Variation brutale autour de '+d+' : revérifiez cette mesure');
  }
  M.forEach(m=>{if(cNum(m.mm).indexOf('hors')>-1)w.push(m.dist+' m : position hors de la règle de coutures')});
  return w;
}
function renderWarn(){
  const w=coherence(),e=$('warn');
  e.innerHTML=w.length?w.map(x=>'<div class="help" style="border-left-color:var(--warn);margin:12px 0 0">'+x+'</div>').join(''):(P().measures.length>2?'<span class="badge ok" style="margin-top:12px">Mesures cohérentes</span>':'');
}

/* Distances à calibrer : milieu des plus grands écarts */
function suggest(){
  const D=P().measures.map(m=>m.dist).sort((a,b)=>a-b),g=[];
  for(let i=0;i<D.length-1;i++)g.push({gap:D[i+1]-D[i],mid:Math.round((D[i]+D[i+1])/2)});
  return g.filter(x=>x.gap>=8).sort((a,b)=>b.gap-a.gap).slice(0,3).map(x=>x.mid);
}
function goCal(d){go('calib');$('cDist').value=d;calibInit()}
function renderSugg(){
  const c=$('sugg'),s=suggest();c.innerHTML='';
  if(P().measures.length<2){c.innerHTML='<div style="font-size:.8rem;color:var(--muted)">Mesurez d’abord 2 distances éloignées (une courte, une longue).</div>';return}
  if(!s.length){c.innerHTML='<div style="font-size:.8rem;color:var(--muted)">Plage bien couverte : aucun écart supérieur à 8 m.</div>';return}
  s.forEach(d=>{const e=document.createElement('div');e.className='chip';e.textContent=d+' m';e.onclick=()=>goCal(d);c.appendChild(e)});
}
function mExtras(){drawGraph($('graphM'),null);renderWarn();renderSugg()}

/* Palette : aperçu de toutes les distances (repère en gros, mm en petit) */
function drawOverview(){
  const svg=$('palOv');if(!svg)return;
  const p=P(),all=$('ovAll').value==='all',M=p.measures.map(m=>m.dist).sort((a,b)=>a-b),ds=new Set(M);
  if(all&&M.length>1)for(let d=Math.ceil(M[0]/5)*5;d<=M[M.length-1];d+=5)ds.add(d);
  const items=[...ds].sort((a,b)=>a-b).map(d=>{const e=estimate(d);return e?{d,mm:e.mm}:null}).filter(Boolean);
  if(!items.length){svg.innerHTML='<text x="150" y="240" text-anchor="middle">Ajoutez au moins 2 mesures</text>';return}
  const gap=26,top=34,bot=Math.max(466,top+(items.length+1)*gap),X=140,span=p.last-p.first||1;
  const Y=v=>{const t=((v-p.first)/span+.12)/1.24;return p.direction==='up'?bot-t*(bot-top):top+t*(bot-top)};
  let h='<text x="'+X+'" y="14" text-anchor="middle">Encoche</text><line x1="'+X+'" y1="'+top+'" x2="'+X+'" y2="'+bot+'" stroke="var(--accent)" stroke-width="1.5"/>';
  coutures().forEach(c=>{const y=Y(c.mm),w=c.half?4:8;h+='<line x1="'+(X-w)+'" y1="'+y+'" x2="'+(X+w)+'" y2="'+y+'" stroke="var(--muted)" stroke-width="'+(c.half?.6:1)+'" opacity=".7"/>'});
  items.forEach(i=>i.y=Y(i.mm));
  const L=items.slice().sort((a,b)=>a.y-b.y);
  L.forEach((it,k)=>{it.ly=k?Math.max(it.y,L[k-1].ly+gap):it.y});
  const last=L[L.length-1];
  if(last.ly>bot+14){last.ly=bot+14;for(let k=L.length-2;k>=0;k--)L[k].ly=Math.min(L[k].ly,L[k+1].ly-gap)}
  L.forEach(it=>{
    const c=cNum(it.mm).replace(' (hors règle)','!').replace(' (hors gant)','!').replace(' (off glove)','!');
    h+='<path d="M'+X+','+it.y+'L'+(X-18)+','+it.ly+'L'+(X-34)+','+it.ly+'M'+X+','+it.y+'L'+(X+18)+','+it.ly+'L'+(X+34)+','+it.ly+'" stroke="var(--line)" fill="none"/>'
      +'<circle cx="'+X+'" cy="'+it.y+'" r="3.5" fill="var(--accent)"/>'
      +'<text x="'+(X-40)+'" y="'+(it.ly+4)+'" text-anchor="end" style="fill:var(--text);font-size:12px;font-weight:600">'+it.d+' m</text>'
      +(isGlove()?'<text x="'+(X+40)+'" y="'+(it.ly+3)+'" style="fill:var(--accent);font-size:'+(c.length>20?8:c.length>14?10:12)+'px;font-weight:700">'+c+'</text><text x="'+(X+40)+'" y="'+(it.ly+14)+'" style="fill:var(--muted);font-size:9px">'+fm(it.mm)+' mm</text>':'<text x="'+(X+40)+'" y="'+(it.ly+6)+'" style="fill:var(--accent);font-size:19px;font-weight:700">'+c+'</text><text x="294" y="'+(it.ly+4)+'" text-anchor="end" style="fill:var(--muted);font-size:9px">'+fm(it.mm)+' mm</text>');
  });
  svg.setAttribute('viewBox','0 0 300 '+Math.ceil(bot+30));
  svg.innerHTML=h;
}

/* Mode terrain */
let FD=20,FS=0,wl=null;
async function lock(){try{wl=await navigator.wakeLock.request('screen')}catch(e){}}
function openField(){
  FD=parseFloat($('calcDist').value);
  if(isNaN(FD)){const M=P().measures;FD=M.length?M[0].dist:20}
  FS=Math.round(angleFor(FD));FDr=$('calcDir').value||'up';
  $('field').classList.add('on');lock();fieldRender();
}
function closeField(){
  $('field').classList.remove('on');try{wl&&wl.release()}catch(e){}wl=null;
  $('calcDist').value=FD;$('calcSlope').value=FS||0;$('calcDir').value=FDr;$('calcH').value='';slopeChips();calculate();chips();
}
function fAdd(k){FD=Math.max(0,r2(FD+k));fieldRender()}
function fSet(d){FD=d;fieldRender()}
/* Pente par niveaux (angle inconnu en tir nature) */
const LV=[{a:0,n:'Plat'},{a:10,n:'Faible'},{a:20,n:'Moyenne'},{a:30,n:'Forte'}];
let FDr='up';
function slopeAdjMm(a,dir){if(!a)return 0;const p=P(),k=dir==='down'?(p.downAdj||0):(p.upAdj||0);return k*unitStep()}
function setDir(d){FDr=d;fieldRender()}
function lvIdx(a){let b=0;LV.forEach((l,i)=>{if(Math.abs(l.a-a)<Math.abs(LV[b].a-a))b=i});return b}
function angleFor(d){const h=parseFloat($('calcH').value);if(h>0&&d>0)return Math.asin(Math.min(1,h/d))*180/Math.PI;return parseFloat($('calcSlope').value)||0}
function slopeChips(){
  const c=$('slopeChips');if(!c)return;c.innerHTML='';
  const hOn=parseFloat($('calcH').value)>0,cur=parseFloat($('calcSlope').value)||0;
  LV.forEach(l=>{const e=document.createElement('div');e.className='chip'+(!hOn&&l.a===cur?' sel':'');e.textContent=l.n;
    e.onclick=()=>{$('calcSlope').value=l.a;$('calcH').value='';slopeChips();calculate()};c.appendChild(e)});
  const dc=$('dirChips');
  if(dc){dc.innerHTML='';[['up','Montée'],['down','Descente']].forEach(([k,n])=>{const e=document.createElement('div');e.className='chip'+(($('calcDir').value||'up')===k?' sel':'');e.textContent=n;e.onclick=()=>{$('calcDir').value=k;slopeChips();calculate()};dc.appendChild(e)})}
}
function fSl(k){const i=Math.max(0,Math.min(LV.length-1,lvIdx(FS)+k));FS=LV[i].a;fieldRender()}
function fieldRender(){
  const de=FD*Math.cos(FS*Math.PI/180),e=estimate(de),adj=e?slopeAdjMm(FS,FDr):0;if(adj)e.mm=Math.round(e.mm+adj);
  $('fProf').textContent=P().name;$('fUp').classList.toggle('on',FDr!=='down');$('fDn').classList.toggle('on',FDr==='down');
  $('fDist').textContent=String(Number.isInteger(FD)?FD:FD.toFixed(1)).replace('.',',');document.querySelectorAll('#fQuick button').forEach(b=>b.classList.toggle('sel',+b.dataset.d===FD));
  $('fSlope').textContent=FS?LV[lvIdx(FS)].n+' · '+FS+'°'+(FDr==='down'?' ↓':' ↑'):'Plat';
  $('fMm').textContent=e?fm(e.mm)+' mm':'Mesures insuffisantes';
  $('fMk').textContent=e?mk(e.mm):'—';
  $('fInfo').textContent=(FS?'Distance utile '+de.toFixed(1)+' m':'')+(e&&e.extra?(FS?' · ':'')+'Extrapolé':'');
  drawPal($('palField'),e?e.mm:null,null);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&$('field').classList.contains('on'))lock()});

/* Hors ligne : état du cache et protection des données */
async function offlineStatus(){
  const el=$('offStat');if(!el)return;let t;
  try{
    if(location.protocol==='file:')t='Fichier local : fonctionne sans réseau. Gardez une sauvegarde JSON (onglet Mesures).';
    else if(!('serviceWorker' in navigator))t='Mise en cache indisponible ici : utilisez le fichier HTML en local.';
    else{
      const reg=await navigator.serviceWorker.getRegistration(),has=await caches.keys().then(k=>k.length>0).catch(()=>false);
      t=(reg&&navigator.serviceWorker.controller&&has)?'Prêt hors ligne : l’appli est en cache sur cet appareil.':'Pas encore en cache : ouvrez l’appli une fois avec du réseau, puis rechargez la page.';
    }
    if(navigator.storage&&navigator.storage.persist&&await navigator.storage.persist())t+=' Données protégées contre le nettoyage automatique.';
  }catch(e){t='État indisponible dans cet aperçu : téléchargez les fichiers pour un usage hors ligne.'}
  el.textContent=t;
}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
/* ===== Version, aide au premier démarrage, mentions, mises à jour ===== */
const INFO={version:'1.7.2',author:'Chili le one',contact:'',license:'Licence CC BY-NC 4.0 — https://creativecommons.org/licenses/by-nc/4.0/deed.fr',host:'Netlify'};
const LG=(function(){let l='';try{l=localStorage.getItem('bb_lang')||''}catch(e){}return l||(/^fr/i.test(navigator.language||'fr')?'fr':'en')})();
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
const TX={
fr:{t0:'Langue / Language',b0:'Choisissez la langue de l’application.',skip:'Je connais déjà l’appli — passer',
t1:'Avertissements importants',
d:['Cet outil donne des estimations à partir de VOS mesures. Vérifiez toujours en tirant avant de vous y fier.','Sécurité : tirez uniquement sur un pas de tir autorisé et dégagé, selon les règles du lieu et du club. Ne regardez pas le téléphone en position de tir.','Application fournie « en l’état », sans garantie : vous l’utilisez sous votre seule responsabilité.','Aucune donnée n’est collectée ni envoyée : tout reste sur votre appareil. Faites des sauvegardes (onglet Mesures).','Application indépendante, non affiliée à une fédération ou à un fabricant.'],
ack:'J’ai lu et j’accepte ces avertissements',more:'Lire les mentions complètes',next:'Continuer',
t2:'Votre règle de coutures',b2:'Posez le zéro d’une règle sur le début du fil de la 1ère couture, puis mesurez jusqu’à la dernière. Tout reste modifiable dans Réglages.',
fName:'Nom du profil',fF:'1ère couture (mm)',fL:'Dernière couture (mm)',fC:'Nombre de coutures',fD:'Sens de comptage',up:'Du bas vers le haut',dn:'Du haut vers le bas',saveNext:'Enregistrer et continuer',skipS:'Passer cette étape',
t3:'Vos premières mesures',b3:'Entrez la position du pianotage (en mm) qui touche le centre à deux distances éloignées, par exemple une courte et une longue. Vous en ajouterez d’autres ensuite. Les mesures d’exemple du départ seront supprimées.',dist:'Distance (m)',pos:'Position (mm)',mes:'Mesure',errC:'Vérifiez les coutures et leurs positions',errP:'Complétez distance et position, ou laissez vide',errD:'Deux distances différentes sont nécessaires',ready:'Prêt ! Bon tir.',dlok:'Fichier téléchargé',impq:'Restaurer cette sauvegarde ({p} profil(s), {m} mesure(s)) ? Vos données actuelles seront remplacées.',impok:'Sauvegarde restaurée',impbad:'Fichier invalide',nodata:'Rien à exporter',pngnote:'Aperçu à plat, sans pente.',pngfail:'Export impossible',gcard:'Doigts du gant',gh:'Le gant n’a pas de coutures : ce sont vos doigts (1, 2, 3, 4) qui servent de repères. Les doigts n’ont pas tous la même taille : mesurez chacun séparément. Posez le zéro de la règle avant le doigt 1, puis mesurez en mm (nombres entiers) la distance du zéro jusqu’à chaque doigt. Laissez vides les doigts inutilisés, en commençant par le doigt 4.',gdl:'Position du zéro',gdn:'Zéro côté encoche (en haut)',gdu:'Zéro côté opposé (en bas)',gmin:'Renseignez au moins les doigts 1 et 2.',gneed:'Avant de commencer : mesurez la distance de chaque doigt du gant (doigts 1 et 2 au minimum). Les doigts n’ont pas tous la même taille.',gopen:'Ouvrir les réglages',errG:'Mesurez au moins les doigts 1 et 2, du plus proche au plus éloigné du zéro, sans doigt vide entre deux.',adjUpG:'Montée (mm)',adjDnG:'Descente (mm)',adjUpS:'Montée (½ couture)',adjDnS:'Descente (½ couture)',nmS:'− ½ couture',npS:'+ ½ couture',nmG:'− 1 mm',npG:'+ 1 mm',
gg:[['1. Mesurer vos doigts','Le gant n’a pas de coutures : ce sont vos doigts, numérotés 1, 2, 3, 4, qui servent de repères. Comme ils n’ont pas tous la même taille, mesurez chacun séparément. Avec une règle rigide, posez le zéro (0 mm) avant le doigt 1, puis mesurez, en mm arrondis à l’unité, la distance du zéro jusqu’à chaque doigt. Saisissez-les dans Réglages > Doigts du gant.'],['2. Faire vos mesures de référence','Sur le pas de tir, trouvez la position qui touche le centre à au moins 2 distances éloignées (par exemple 18 m et 30 m), idéalement 3 ou 4. Mesurez cette position en mm (nombre entier) avec le même zéro, ou choisissez le doigt dans la liste, puis saisissez-la dans l’onglet Mesures.'],['3. Utiliser l’appli','Onglet Calcul : tapez la distance ou touchez une puce. Le repère s’affiche en doigt : entre le zéro et le doigt 1, c’est le doigt 1 ; entre le doigt 1 et le doigt 2, c’est le doigt 2 ; et ainsi de suite. La position en mm (nombre entier) s’affiche en petit. L’onglet {P} montre toutes vos distances sur la corde.']],fProt:'Protection des doigts',optTab:'Palette',optGlove:'Gant',guide:'Guide d’utilisation',guideL:'Comment mesurer ?',gt:'Guide d’utilisation',inst:'Installer l’application',instd:'Application installée sur cet appareil',instt:'Installer sur l’écran d’accueil',instbar:'Installez l’appli pour l’utiliser sans réseau.',instbtn:'Installer',
instA:'Android (Chrome) : touchez le menu ⋮ en haut à droite, puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».',instI:'iPhone / iPad (Safari) : touchez le bouton Partager, puis « Sur l’écran d’accueil ».',instNote:'Si l’option n’apparaît pas, ouvrez d’abord l’adresse de l’appli avec du réseau dans Chrome (Android) ou Safari (iPhone), hors navigation privée.',
g:[['À quoi ça sert','Le pianotage consiste à déplacer la prise des doigts sur la corde selon la distance de la cible. Vous mesurez votre réglage à quelques distances, et l’appli calcule la position pour toutes les distances entre elles.'],['1. Mesurer vos coutures','Les coutures sont les repères de la corde. Avec une règle rigide, posez le zéro (0 mm) au début du fil de la 1ère couture, puis lisez la distance en mm jusqu’au début du fil de la dernière. Notez aussi leur nombre et le sens de comptage (1ère en bas ou en haut), puis saisissez ces 4 valeurs dans Réglages > Coutures. Les demi-coutures sont calculées pour vous.'],['2. Faire vos mesures de référence','Sur le pas de tir, trouvez la position qui touche le centre à au moins 2 distances éloignées (par exemple 18 m et 30 m), idéalement 3 ou 4 (par exemple 10, 18, 30 et 40 m). Mesurez cette position en mm depuis la 1ère couture, comme pour les coutures, ou choisissez la couture dans la liste, puis saisissez-la dans l’onglet Mesures. Plus vos distances sont éloignées, plus le calcul est fiable.'],['3. Utiliser l’appli','Onglet Calcul : tapez la distance ou touchez une puce. La couture à utiliser s’affiche en grand (« Couture 7,5 » = à mi-chemin entre la 7 et la 8) et la position en mm en petit. La table de tir liste les distances usuelles, et l’onglet {P} montre toutes vos distances sur la corde.'],['4. Affiner sur le terrain','Après quelques flèches, touchez « Ajuster sur le terrain » : indiquez si elles sont trop hautes ou trop basses, ou décalez par demi-couture, puis enregistrez. La mesure est mise à jour et la courbe s’améliore. Un avertissement apparaît dans Mesures si vos points se contredisent. Différence : Mesures sert à saisir directement une position connue ; Calibrer part du calcul de l’appli et la corrige.'],['5. Pente','Choisissez le niveau (plat, faible, moyenne, forte) ou saisissez un dénivelé estimé en mètres, puis montée ou descente : la distance utile est raccourcie. Si vos flèches partent plus haut ou plus bas dans un sens, corrigez dans Réglages > Pente : ajustement.'],['6. Mode terrain','Plein écran avec de gros boutons pour changer la distance et la pente d’une main. L’écran reste allumé.'],['7. Profils','Créez un profil par arc ou par jeu de flèches (Réglages). Chaque profil a ses coutures et ses mesures ; changez de profil avec le sélecteur en haut de l’écran.'],['8. Sauvegarde et hors ligne','Sauvegardez vos mesures en JSON (onglet Mesures) : un nettoyage du navigateur peut les effacer. Une fois installée sur l’écran d’accueil, l’appli fonctionne sans réseau.']],
t4:'Bien démarrer',tips:['Calcul : entrez la distance, lisez la couture à régler.','Après chaque tir, utilisez « Ajuster sur le terrain » : la courbe s’affine.','Pente : choisissez le niveau, puis montée ou descente.','Hors ligne : ouvrez l’appli une fois avec du réseau, elle marchera ensuite sans.','Cette aide reste disponible dans Réglages.'],done:'Terminer',
help:'Aide et informations',ver:'Version',again:'Revoir l’introduction',legal:'Avertissements et mentions légales',check:'Rechercher une mise à jour',newv:'Mise à jour disponible',doupd:'Mettre à jour',later:'Plus tard',updtxt:'La version {n} est disponible (vous avez la {o}). Vos mesures et réglages sont conservés.',uptodate:'Application à jour',upfail:'Vérification impossible (hors ligne ?)',close:'Fermer',
lt:'Mentions et avertissements',ed:'Éditeur et hébergement',author:'Auteur / éditeur',contact:'Contact',host:'Hébergeur',
l:[['Nature de l’outil','Cette application est une aide au réglage : elle calcule des estimations (interpolation) à partir des mesures que vous saisissez. Aucune exactitude n’est garantie. Vérifiez toujours en tirant, avant chaque séance ou compétition.'],['Sécurité','Tirez uniquement sur un pas de tir autorisé, avec une zone dégagée, en respectant les règles du lieu, du club et de la fédération. Ne regardez pas le téléphone en position de tir. Vérifiez l’état de votre matériel. Vous restez seul responsable de votre sécurité et de celle des autres.'],['Responsabilité','Application fournie « en l’état », sans garantie d’aucune sorte. Dans les limites permises par la loi, l’auteur décline toute responsabilité pour tout dommage ou résultat lié à son utilisation.'],['Données personnelles','L’application ne collecte ni n’envoie aucune donnée personnelle : pas de compte, pas de publicité, pas de traceurs. Vos mesures et réglages restent sur votre appareil (stockage local du navigateur) et peuvent être effacés par celui-ci : faites des sauvegardes JSON. Seules requêtes réseau : le chargement du site et la vérification de version ; l’hébergeur peut voir votre adresse IP dans ses journaux techniques.'],['Indépendance','Application indépendante, non affiliée à une fédération, un club ou un fabricant, et non approuvée par eux. Les noms cités appartiennent à leurs propriétaires.']]},
en:{t0:'Langue / Language',b0:'Choose the app language.',skip:'I already know the app — skip',
t1:'Important warnings',
d:['This tool gives estimates based on YOUR measurements. Always check by shooting before relying on it.','Safety: shoot only on an authorised, clear range and follow local and club rules. Do not look at your phone at full draw.','Provided “as is”, without warranty: you use it at your own risk.','No data is collected or sent: everything stays on your device. Make backups (Data tab).','Independent app, not affiliated with any federation or manufacturer.'],
ack:'I have read and accept these warnings',more:'Read the full notice',next:'Continue',
t2:'Your stitch ruler',b2:'Place the zero of a ruler at the start of the thread of the 1st stitch, then measure to the last one. Everything can be changed later in Settings.',
fName:'Profile name',fF:'1st stitch (mm)',fL:'Last stitch (mm)',fC:'Number of stitches',fD:'Counting direction',up:'Bottom to top',dn:'Top to bottom',saveNext:'Save and continue',skipS:'Skip this step',
t3:'Your first measurements',b3:'Enter the string-walk position (in mm) that hits the centre at two distances far apart, for example a short and a long one. You can add more later. The starting example measurements will be removed.',dist:'Distance (m)',pos:'Position (mm)',mes:'Measurement',errC:'Check the stitches and their positions',errP:'Complete distance and position, or leave blank',errD:'Two different distances are needed',ready:'Ready! Good shooting.',dlok:'File downloaded',impq:'Restore this backup ({p} profile(s), {m} measurement(s))? Your current data will be replaced.',impok:'Backup restored',impbad:'Invalid file',nodata:'Nothing to export',pngnote:'Flat preview, no slope.',pngfail:'Export failed',gcard:'Glove fingers',gh:'The glove has no stitches: your fingers (1, 2, 3, 4) are the reference marks. Fingers are not all the same size, so measure each one separately. Place the ruler zero before finger 1, then measure in mm (whole numbers) the distance from zero to each finger. Leave unused fingers blank, starting with finger 4.',gdl:'Zero position',gdn:'Zero on the nock side (top)',gdu:'Zero on the opposite side (bottom)',gmin:'Fill in at least fingers 1 and 2.',gneed:'Before you start: measure the distance of each glove finger (fingers 1 and 2 at least). Fingers are not all the same size.',gopen:'Open settings',errG:'Measure at least fingers 1 and 2, from closest to farthest from zero, with no blank finger in between.',adjUpG:'Uphill (mm)',adjDnG:'Downhill (mm)',adjUpS:'Uphill (½ stitch)',adjDnS:'Downhill (½ stitch)',nmS:'− ½ stitch',npS:'+ ½ stitch',nmG:'− 1 mm',npG:'+ 1 mm',
gg:[['1. Measure your fingers','The glove has no stitches: your fingers, numbered 1, 2, 3, 4, are the reference marks. As they are not all the same size, measure each one separately. With a rigid ruler, place zero (0 mm) before finger 1, then measure, in mm rounded to the unit, the distance from zero to each finger. Enter them in Settings > Glove fingers.'],['2. Take your reference measurements','On the range, find the position that hits the centre at 2 distances far apart at least (for example 18 m and 30 m), ideally 3 or 4. Measure that position in mm (whole number) with the same zero, or pick the finger from the list, then enter it in the Data tab.'],['3. Use the app','Calc tab: type the distance or tap a chip. The mark is shown as a finger: between zero and finger 1 it is finger 1; between finger 1 and finger 2 it is finger 2; and so on. The position in mm (whole number) is shown small. The {P} tab shows all your distances on the string.']],fProt:'Finger protection',optTab:'Tab',optGlove:'Glove',guide:'User guide',guideL:'How to measure?',gt:'User guide',inst:'Install the app',instd:'App installed on this device',instt:'Install on the home screen',instbar:'Install the app to use it without a network.',instbtn:'Install',
instA:'Android (Chrome): tap the ⋮ menu at the top right, then “Install app” or “Add to Home screen”.',instI:'iPhone / iPad (Safari): tap the Share button, then “Add to Home Screen”.',instNote:'If the option does not appear, first open the app address with a network in Chrome (Android) or Safari (iPhone), outside private browsing.',
g:[['What it is for','String walking means moving your finger position on the string according to the target distance. You measure your setting at a few distances, and the app computes the position for every distance in between.'],['1. Measure your stitches','The stitches are the marks on the string. With a rigid ruler, place zero (0 mm) at the start of the thread of the 1st stitch, then read the distance in mm to the start of the thread of the last one. Also note how many there are and the counting direction (1st at the bottom or at the top), then enter these 4 values in Settings > Stitches. Half-stitches are computed for you.'],['2. Take your reference measurements','On the range, find the position that hits the centre at 2 distances far apart at least (for example 18 m and 30 m), ideally 3 or 4 (for example 10, 18, 30 and 40 m). Measure that position in mm from the 1st stitch, as you did for the stitches, or pick the stitch from the list, then enter it in the Data tab. The wider apart your distances, the more reliable the calculation.'],['3. Use the app','Calc tab: type the distance or tap a chip. The stitch to use is shown large (“Stitch 7.5” = halfway between 7 and 8) and the position in mm small. The shooting table lists common distances, and the {P} tab shows all your distances on the string.'],['4. Fine-tune in the field','After a few arrows, tap “Adjust in the field”: say whether they are too high or too low, or shift by half a stitch, then save. The measurement is updated and the curve improves. A warning appears in Data if your points contradict each other. Difference: Data is for entering a known position directly; Calibrate starts from the app’s calculation and corrects it.'],['5. Slope','Choose the level (flat, slight, moderate, steep) or enter an estimated height difference in metres, then uphill or downhill: the effective distance is shortened. If your arrows land higher or lower in one direction, correct it in Settings > Slope: adjustment.'],['6. Field mode','Full screen with big buttons to change the distance and slope with one hand. The screen stays on.'],['7. Profiles','Create one profile per bow or arrow set (Settings). Each profile has its own stitches and measurements; switch profiles with the selector at the top of the screen.'],['8. Backup and offline','Back up your measurements as JSON (Data tab): a browser cleanup can erase them. Once installed on the home screen, the app works without a network.']],
t4:'Getting started',tips:['Calc: enter the distance, read the stitch to set.','After each shot, use “Adjust in the field”: the curve gets sharper.','Slope: choose the level, then uphill or downhill.','Offline: open the app once with a network, then it works without.','This help stays available in Settings.'],done:'Finish',
help:'Help and information',ver:'Version',again:'Replay the introduction',legal:'Warnings and legal notice',check:'Check for updates',newv:'Update available',doupd:'Update now',later:'Later',updtxt:'Version {n} is available (you have {o}). Your measurements and settings are kept.',uptodate:'App is up to date',upfail:'Check failed (offline?)',close:'Close',
lt:'Notice and warnings',ed:'Publisher and hosting',author:'Author / publisher',contact:'Contact',host:'Host',
l:[['Nature of the tool','This app is a tuning aid: it computes estimates (interpolation) from the measurements you enter. No accuracy is guaranteed. Always check by shooting, before every session or competition.'],['Safety','Shoot only on an authorised range with a clear area, following the rules of the venue, the club and the federation. Do not look at your phone at full draw. Check the condition of your equipment. You remain solely responsible for your safety and that of others.'],['Liability','Provided “as is”, without warranty of any kind. To the extent permitted by law, the author disclaims all liability for any damage or result linked to its use.'],['Personal data','The app collects and sends no personal data: no account, no ads, no trackers. Your measurements and settings stay on your device (browser local storage) and may be erased by it: make JSON backups. The only network requests are loading the site and the version check; the host may see your IP address in its technical logs.'],['Independence','Independent app, not affiliated with or endorsed by any federation, club or manufacturer. Names mentioned belong to their owners.']]}};
const tx=k=>TX[LG][k];
function infoLines(){const a=[tx('ver')+' '+INFO.version];if(INFO.author)a.push(tx('author')+' : '+INFO.author);if(INFO.contact)a.push(tx('contact')+' : '+INFO.contact);a.push(tx('host')+' : '+INFO.host);if(INFO.license)a.push(INFO.license);return a}

let obSkip=false,upd=null;
function openOb(s){
  const o=$('ob'),p=P(),li=a=>'<ul>'+a.map(t=>'<li>'+t+'</li>').join('')+'</ul>',sk='<a class="obs" data-a="finish">'+tx('skipS')+'</a>';
  const dots=[0,1,2,3,4].map(i=>'<i'+(i===s?' class="on"':'')+'></i>').join('');
  let b='',f='';
  if(s===0){b='<img class="logo" alt="" style="width:72px;height:72px;border-radius:16px;margin:0 0 14px;display:block" src="'+document.querySelector('header img').src+'"><p>'+tx('b0')+'</p><div class="obl"><button class="btn" data-a="lang" data-v="fr">Français</button><button class="btn" data-a="lang" data-v="en">English</button></div>';f='<a class="obs" data-a="skipall">'+tx('skip')+'</a>'}
  if(s===1){b=li(tx('d'))+'<label class="ck"><input type="checkbox" id="obAck"><span>'+tx('ack')+'</span></label><a class="obs" data-a="legal">'+tx('more')+'</a>';f='<button class="btn" id="obGo" data-a="accept" disabled>'+tx('next')+'</button>'}
  if(s===2){b='<p>'+tx('b2')+' <a data-a="guide" style="color:var(--accent);text-decoration:underline;cursor:pointer">'+tx('guideL')+'</a></p><div class="fg"><label>'+tx('fName')+'</label><input id="obName"></div><div class="fg"><label>'+tx('fProt')+'</label><select id="obP"><option value="tab">'+tx('optTab')+'</option><option value="glove">'+tx('optGlove')+'</option></select></div><div class="row"><div class="fg"><label>'+tx('fF')+'</label><input id="obF" type="number" step="1" inputmode="numeric"></div><div class="fg"><label>'+tx('fL')+'</label><input id="obL" type="number" step="1" inputmode="numeric"></div></div><div class="row"><div class="fg"><label>'+tx('fC')+'</label><input id="obC" type="number" inputmode="numeric"></div><div class="fg"><label>'+tx('fD')+'</label><select id="obD"><option value="up">'+tx('up')+'</option><option value="down">'+tx('dn')+'</option></select></div></div>';f='<button class="btn" data-a="save">'+tx('saveNext')+'</button>'+sk}
  if(s===3){b='<p>'+tx('b3')+'</p>'+[1,2].map(i=>'<h3>'+tx('mes')+' '+i+'</h3><div class="row"><div class="fg"><label>'+tx('dist')+'</label><input id="obD'+i+'" type="number" step="any" inputmode="decimal" placeholder="'+(i===1?'18':'30')+'"></div><div class="fg"><label>'+tx('pos')+'</label><input id="obM'+i+'" type="number" step="1" inputmode="numeric" placeholder="'+(i===1?'11':'25')+'"></div></div>').join('');f='<button class="btn" data-a="meas">'+tx('next')+'</button>'+sk}
  if(s===4){b=li(tx('tips'));f=(isStandalone()?'':'<button class="btn sec" style="margin:0 0 8px" data-a="install">'+tx('inst')+'</button>')+'<button class="btn" data-a="finish">'+tx('done')+'</button><a class="obs" data-a="guide">'+tx('guide')+'</a>'}
  o.innerHTML='<div class="obi"><div class="dots">'+dots+'</div><h2>'+tx('t'+s)+'</h2>'+b+'<div class="obf">'+f+'</div></div>';
  if(s===1)$('obAck').onchange=function(){$('obGo').disabled=!this.checked};
  if(s===2){$('obName').value=p.name;$('obF').value=p.first;$('obL').value=p.last;$('obC').value=p.count;$('obD').value=p.direction;$('obP').value=p.prot||'tab';obGloveInit()}
  o.classList.add('on');o.scrollTop=0;
}
function obSave(){
  const p=P(),n=$('obName').value.trim();if(n)p.name=n;
  if($('obP').value==='glove'){
    const fv=[0,1,2,3].map(i=>{const v=parseFloat($('obG'+i).value);return isNaN(v)?null:Math.round(v)});
    if(!gOk(fv)){toast(tx('errG'));return}
    p.prot='glove';p.fingers=fv;p.direction=$('obGD').value;p.first=0;p.last=Math.max(...fv.filter(v=>v!==null));p.count=fv.filter(v=>v!==null).length;
    save();fillProfSel();openOb(3);return;
  }
  const f=parseFloat($('obF').value),l=parseFloat($('obL').value),c=parseInt($('obC').value);
  if(!(c>=2)||isNaN(f)||isNaN(l)||f===l){toast(tx('errC'));return}
  p.first=f;p.last=l;p.count=c;p.direction=$('obD').value;p.prot=$('obP').value;
  save();fillProfSel();openOb(3);
}
function obMeas(){
  const r=[1,2].map(i=>({d:parseFloat($('obD'+i).value),m:Math.round(parseFloat($('obM'+i).value))}));
  if(r.some(q=>isNaN(q.d)!==isNaN(q.m))){toast(tx('errP'));return}
  const ms=r.filter(q=>!isNaN(q.d)).map(q=>({id:uid(),dist:q.d,mm:q.m}));
  if(ms.length===2&&ms[0].dist===ms[1].dist){toast(tx('errD'));return}
  if(ms.length){P().measures=ms.sort((a,b)=>a.dist-b.dist);save()}
  openOb(4);
}
function obClose(){
  const m=P().measures;
  if(m.length===2&&m[0].dist===18&&Math.round(m[0].mm)===11&&m[1].dist===30&&Math.round(m[1].mm)===25){P().measures=[];save()}
  $('ob').classList.remove('on');lsSet('bb_onb','1');toast(tx('ready'));go('calc');
}
function openLegal(){
  const l=$('lg');
  l.innerHTML='<div class="obi"><h2>'+tx('lt')+'</h2>'+tx('l').map(s=>'<h3>'+s[0]+'</h3><p>'+s[1]+'</p>').join('')+'<h3>'+tx('ed')+'</h3><p>'+infoLines().join('<br>')+'</p><div class="obf"><button class="btn" data-a="lgclose">'+tx('close')+'</button></div></div>';
  l.classList.add('on');l.scrollTop=0;
}
function renderHelp(){
  const c=$('helpCard');if(!c)return;
  c.innerHTML='<h2>'+tx('help')+'</h2><p style="font-size:.85rem;color:var(--muted);margin-bottom:12px">'+tx('ver')+' '+INFO.version+(upd?' — '+tx('newv')+' : '+upd.version:'')+'</p>'+(upd?'<button class="btn" style="margin-bottom:8px" data-a="doupd">'+tx('doupd')+'</button>':'')+'<button class="btn sec" data-a="guide">'+tx('guide')+'</button>'+(isStandalone()?'<div style="font-size:.82rem;color:var(--ok);margin:10px 0">'+tx('instd')+'</div>':'<button class="btn sec" data-a="install">'+tx('inst')+'</button>')+'<button class="btn sec" data-a="again">'+tx('again')+'</button><button class="btn sec" data-a="legal">'+tx('legal')+'</button><button class="btn sec" data-a="check">'+tx('check')+'</button>';
}
function act(a,v){
  if(a==='lang'){if(v!==LG){lsSet('bb_lang',v);lsSet('bb_obstep','1');location.reload()}else openOb(1)}
  else if(a==='skipall'){obSkip=true;openOb(1)}
  else if(a==='accept'){lsSet('bb_ack',INFO.version+'|'+new Date().toISOString().slice(0,10));if(obSkip)obClose();else openOb(2)}
  else if(a==='legal')openLegal();
  else if(a==='guide')openGuide();
  else if(a==='gset')go('cfg');
  else if(a==='install')doInstall();
  else if(a==='instno'){lsSet('bb_instno','1');renderInstBar()}
  else if(a==='lgclose')$('lg').classList.remove('on');
  else if(a==='save')obSave();
  else if(a==='meas')obMeas();
  else if(a==='step')openOb(parseInt(v));
  else if(a==='finish')obClose();
  else if(a==='again'){obSkip=false;openOb(0)}
  else if(a==='check')checkUpdate(true);
  else if(a==='doupd')doUpdate();
  else if(a==='later')closeUpd();
}
/* Mises à jour : compare INFO.version au fichier version.json du site */
const vNum=v=>String(v).split('.').map(n=>parseInt(n)||0);
function vGt(a,b){a=vNum(a);b=vNum(b);for(let i=0;i<3;i++){const p=a[i]||0,q=b[i]||0;if(p!==q)return p>q}return false}
async function checkUpdate(manual){
  try{
    const r=await fetch('version.json?'+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;const j=await r.json();
    if(vGt(j.version,INFO.version)){upd=j;if(manual||lsGet('bb_ign')!==String(j.version))showUpd()}
    else{upd=null;if(manual)toast(tx('uptodate'))}
    renderHelp();
  }catch(e){if(manual)toast(tx('upfail'))}
}
function showUpd(){
  const u=$('upd'),n=((upd.notes&&upd.notes[LG])||'').replace(/</g,'&lt;');
  u.innerHTML='<button class="x2" data-a="later" aria-label="'+tx('later')+'">×</button><b>'+tx('newv')+'</b><p>'+tx('updtxt').replace('{n}',upd.version).replace('{o}',INFO.version)+(n?'<br>'+n:'')+'</p><button class="btn" data-a="doupd">'+tx('doupd')+'</button><button class="btn sec" data-a="later">'+tx('later')+'</button>';
  u.classList.add('on');
}
function closeUpd(){if(upd)lsSet('bb_ign',String(upd.version));$('upd').classList.remove('on');renderHelp()}
async function doUpdate(){
  try{const rs=await navigator.serviceWorker.getRegistrations();rs.forEach(r=>r.update())}catch(e){}
  try{const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}catch(e){}
  location.reload();
}
/* Gant : les repères sont les doigts 1 à 4, comptés à partir du zéro (avant le doigt 1) ;
   entre le zéro et le doigt 1 : doigt 1 ; entre le doigt 1 et le doigt 2 : doigt 2 ; etc. */
const FN={fr:['Doigt 1','Doigt 2','Doigt 3','Doigt 4'],en:['Finger 1','Finger 2','Finger 3','Finger 4']};
function isGlove(){return P().prot==='glove'}
function fingers(){const f=P().fingers||[],a=[];for(let i=0;i<4;i++){const v=f[i];if(v!==null&&v!==undefined&&v!==''&&!isNaN(v))a.push({n:FN[LG][i],mm:Math.round(+v)})}return a}
function gOk(f){let gap=false,prev=-1,n=0;for(let i=0;i<4;i++){const v=f[i];if(v===null||v===undefined||v===''||isNaN(v)){gap=true;continue}if(gap||Math.round(+v)<=prev)return false;prev=Math.round(+v);n++}return n>=2}
function gValid(){return gOk(P().fingers||[])}
function gLabel(mm){
  const F=fingers(),out=LG==='fr'?' (hors gant)':' (off glove)';
  if(F.length<2||isNaN(mm))return '—';
  const v=Math.round(mm);
  if(v<0)return F[0].n+out;
  for(let i=0;i<F.length;i++){if(v<=F[i].mm)return F[i].n}
  return F[F.length-1].n+out;
}
function gMarks(){return fingers().map(f=>({n:f.n,half:false,mm:f.mm,label:f.n}))}
function mk(mm){return isGlove()?cNum(mm):'Couture '+cNum(mm)}
function unitStep(mm){return isGlove()?1:Math.abs(step())/2}
function gBox(v,y,X){
  const lb=cNum(v).replace(' (hors gant)','!').replace(' (off glove)','!');
  return '<rect x="'+(X-134)+'" y="'+(y-20)+'" width="98" height="40" rx="12" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.4"/>'
    +'<text x="'+(X-126)+'" y="'+(y-3)+'" style="fill:var(--accent);font-size:'+(lb.length>9?11:14)+'px;font-weight:700">'+lb+'</text>'
    +'<text x="'+(X-126)+'" y="'+(y+13)+'" style="fill:var(--muted);font-size:10px">'+fm(v)+' mm</text>';
}
function renderGlove(){
  const c=$('cardGlove');if(!c)return;const p=P(),N=FN[LG],f=p.fingers||[];
  c.innerHTML='<h2>'+tx('gcard')+'</h2><div class="help">'+tx('gh')+'</div>'
    +N.map((n,i)=>'<div class="fg"><label>'+n+' (mm)</label><input type="number" id="gD'+i+'" step="1" min="0" inputmode="numeric" onchange="saveGlove()"></div>').join('')
    +'<div class="fg"><label>'+tx('gdl')+'</label><select id="gDir" onchange="saveGlove()"><option value="down">'+tx('gdn')+'</option><option value="up">'+tx('gdu')+'</option></select></div>'
    +'<div id="gPrev" style="font-size:.8rem;color:var(--accent)"></div><svg id="palCfgG" class="pal" viewBox="0 0 300 250" style="margin-top:12px"></svg>';
  N.forEach((n,i)=>{$('gD'+i).value=(f[i]!==null&&f[i]!==undefined)?Math.round(f[i]):''});
  $('gDir').value=p.direction||'down';gPrev();drawPal($('palCfgG'),null,null);
}
function gPrev(){
  const F=fingers(),e=$('gPrev');if(!e)return;
  e.style.color=gValid()?'var(--accent)':'var(--warn)';
  e.textContent=gValid()?F.map(x=>x.n+' : '+fm(x.mm)+' mm').join(' · '):tx('errG');
}
function saveGlove(){
  const p=P();p.fingers=[0,1,2,3].map(i=>{const v=parseFloat($('gD'+i).value);return isNaN(v)?null:Math.round(v)});p.direction=$('gDir').value;
  const F=fingers();if(F.length>1){p.first=0;p.last=Math.max(...F.map(x=>x.mm));p.count=F.length}
  save();gPrev();drawPal($('palCfgG'),null,null);
}
function guideSecs(){const g=tx('g').slice();if(isGlove())tx('gg').forEach((q,k)=>{g[1+k]=q});return g}
function obGloveInit(){
  const o=$('ob'),rows=o.querySelectorAll('.obi > .row');if(!rows.length)return;
  const w=document.createElement('div');w.id='obSt';rows[0].before(w);rows.forEach(r=>w.appendChild(r));
  const g=document.createElement('div');g.id='obGl';g.style.display='none';
  g.innerHTML='<div class="help">'+tx('gh')+'</div>'+FN[LG].map((n,i)=>'<div class="fg"><label>'+n+' (mm)</label><input id="obG'+i+'" type="number" step="1" min="0" inputmode="numeric"></div>').join('')+'<div class="fg"><label>'+tx('gdl')+'</label><select id="obGD"><option value="down">'+tx('gdn')+'</option><option value="up">'+tx('gdu')+'</option></select></div>';
  w.after(g);
  const f=P().fingers||[];FN[LG].forEach((n,i)=>{$('obG'+i).value=(f[i]!==null&&f[i]!==undefined)?Math.round(f[i]):''});$('obGD').value=P().direction||'down';
  const sw=()=>{const gl=$('obP').value==='glove';w.style.display=gl?'none':'';g.style.display=gl?'':'none'};
  $('obP').onchange=sw;sw();
}
/* Protection des doigts : palette ou gant (par profil) */
function protName(){const g=P().prot==='glove';return LG==='fr'?(g?'Gant':'Palette'):(g?'Glove':'Tab')}
function applyProt(){
  const n=protName(),b=$('n-pal'),h=document.querySelector('#v-pal h2');
  if(b&&b.textContent!==n)b.textContent=n;
  const gl=isGlove(),cs=$('cardStitch'),cg=$('cardGlove');
  if(cs)cs.style.display=gl?'none':'';if(cg)cg.style.display=gl?'':'none';
  const lu=$('cfgU'),ld=$('cfgDn');if(lu&&lu.previousElementSibling&&ld&&ld.previousElementSibling){lu.previousElementSibling.textContent=tx(gl?'adjUpG':'adjUpS');ld.previousElementSibling.textContent=tx(gl?'adjDnG':'adjDnS')}
  const sb=document.querySelectorAll('#v-calib .stepper button');if(sb.length===2){sb[0].textContent=tx(gl?'nmG':'nmS');sb[1].textContent=tx(gl?'npG':'npS')}
  $('rMk').style.fontSize=gl?'1.9rem':'';$('fMk').style.fontSize=gl?'2rem':'3rem';
  if(h){const t=n+' \u2014 '+(LG==='fr'?'aperçu des distances':'distances overview');if(h.textContent!==t)h.textContent=t}
}
function saveProt(){P().prot=$('pProt').value;save();refresh()}
/* Guide d'utilisation et installation (PWA) */
function lgShow(t,h){const l=$('lg');l.innerHTML='<div class="obi"><h2>'+t+'</h2>'+h+'<div class="obf"><button class="btn" data-a="lgclose">'+tx('close')+'</button></div></div>';l.classList.add('on');l.scrollTop=0}
const GSVG='<svg class="pal" viewBox="0 0 300 150" aria-hidden="true"><line x1="170" y1="10" x2="170" y2="140" stroke="var(--accent)" stroke-width="1.5"/>'+[0,1,2,3,4].map(i=>{const y=132-i*28;return '<line x1="158" y1="'+y+'" x2="182" y2="'+y+'" stroke="var(--muted)"/><text x="192" y="'+(y+3)+'">'+(i+1)+'</text>'}).join('')+'<line x1="120" y1="132" x2="120" y2="20" stroke="var(--text)"/><line x1="112" y1="132" x2="128" y2="132" stroke="var(--text)"/><line x1="112" y1="20" x2="128" y2="20" stroke="var(--text)"/><text x="108" y="136" text-anchor="end">0 mm</text><text x="108" y="24" text-anchor="end">? mm</text></svg>';
function openGuide(){lgShow(tx('gt'),guideSecs().map((q,i)=>'<h3>'+q[0]+'</h3><p>'+q[1].replace('{P}',protName())+'</p>'+(i===1&&!isGlove()?GSVG:'')).join(''))}
let dip=null;
function isStandalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}
function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function renderInstBar(){
  const b=$('instBar');if(!b)return;
  if(isStandalone()||lsGet('bb_instno')){b.style.display='none';return}
  b.innerHTML='<span>'+tx('instbar')+'</span><span style="display:flex;gap:6px;align-items:center;flex:none"><button class="btn" style="width:auto;padding:8px 14px" data-a="install">'+tx('instbtn')+'</button><button class="x" style="color:var(--muted);font-size:1.2rem" data-a="instno" aria-label="'+tx('close')+'">×</button></span>';
  b.style.display='flex';
}
async function doInstall(){
  if(dip){const e=dip;dip=null;e.prompt();try{await e.userChoice}catch(x){}renderInstBar();return}
  const o=isIOS()?['instI','instA']:['instA','instI'];
  lgShow(tx('instt'),o.map(k=>'<p>'+tx(k)+'</p>').join('')+'<p style="color:var(--muted)">'+tx('instNote')+'</p>');
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e});
window.addEventListener('appinstalled',()=>{dip=null;renderInstBar();renderHelp();toast(tx('instd'))});
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-a]');if(t)act(t.dataset.a,t.dataset.v)});
(function(){
  const st=parseInt(lsGet('bb_obstep')||'');lsSet('bb_obstep',null);
  if(!lsGet('bb_ack')){
    const old=!!(lsGet('bb_state')||lsGet('bb_measures'));
    if(old&&isNaN(st)){obSkip=true;openOb(1)}else openOb(isNaN(st)?0:st);
  }
  renderInstBar();
  window.addEventListener('online',()=>checkUpdate());
  setTimeout(checkUpdate,3500);
})();
/* PWA */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){try{navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}}
refresh('calc');
