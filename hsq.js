/* v96:全範圍考卷改成事先出好的「預製卷」(兩人考同一份、按了就能寫);客製化條件仍現場出題。
   v95:學測詞彙題(整張考卷一次寫完;標難題;依考卷回顧;重新練習;匯出考卷圖 / 批改詳解圖;錯題難題區獨立) */
(function(){
const HQ=window.HQ={u:'',ph:'setup',lvs:[1,2,3,4,5,6],lt:[],ps:[],cu:'',src:'all',qs:[],rsrc:'all',bank:{},st:{},log:[],unsent:[],dirty:{},pe:null,peer:'',tab:'wrong',who:'me',msg:'',busy:false,open:{},old:false,sheet:0,mode:'grade',fresh:false,draft:null,t0:0,pool:null,pid:'',nopool:false,synced:false};
const P=v=>{const a=String(v||'0.0.0.0').split('.').map(Number);return{f:a[0]|0,w:a[1]|0,r:a[2]|0,t:a[3]|0}};
const S=o=>[o.f,o.w,o.r,o.t].join('.');
const now=()=>Math.floor(Date.now()/60000);
const K=()=>'dw_hq_'+hsUser(), KD=()=>'dw_hqd_'+hsUser();
const blk=i=>Math.floor(i/10);
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const dperm=seed=>{ let s=(seed>>>0)||1; const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296, a=[0,1,2,3]; for(let i=3;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a };
const url=q=>{const c=cfg();return `${c.url}?token=${encodeURIComponent(c.token)}&sheet=hsq&user=${encodeURIComponent(hsUser())}${q||''}`};
const LOGMAX=80, L='ABCD';
function ensure(){ if(HQ.u===hsUser()) return; HQ.u=hsUser(); HQ.st={};HQ.log=[];HQ.unsent=[];HQ.dirty={};HQ.draft=null;
  try{const d=JSON.parse(localStorage.getItem(K())||'{}');HQ.st=d.st||{};HQ.log=d.log||[];HQ.unsent=d.unsent||[];HQ.dirty=d.dirty||{}}catch(e){}
  try{HQ.draft=JSON.parse(localStorage.getItem(KD())||'null')}catch(e){} }
function save(){ try{localStorage.setItem(K(),JSON.stringify({st:HQ.st,log:HQ.log.slice(0,LOGMAX),unsent:HQ.unsent,dirty:HQ.dirty}))}catch(e){} }
function saveDraft(){ try{ if(HQ.qs.length&&HQ.ph==='play'){ HQ.draft={t0:HQ.t0,src:HQ.rsrc,pid:HQ.pid||'',lvs:HQ.lvs.slice(),qs:HQ.qs.map(x=>({i:x.i,k:x.k,perm:x.perm,pick:x.pick}))}; localStorage.setItem(KD(),JSON.stringify(HQ.draft)) } }catch(e){} }
function clearDraft(){ HQ.draft=null; try{localStorage.removeItem(KD())}catch(e){} }
const qOf=(i,k)=>((HQ.bank[blk(i)]||{})[i]||[])[k];
async function sync(){ try{ const j=await (await fetch(url('&peer=1&pool=1'))).json(); if(!j||j.error||!j.me){HQ.old=true;return}
  HQ.old=false;HQ.peer=j.peer||'';HQ.pe=j.pe||null;HQ.pool=j.pool||null;HQ.nopool=!j.pool;
  Object.keys(j.me.st||{}).forEach(k=>{ if(!HQ.st[k]||P(j.me.st[k]).t>P(HQ.st[k]).t) HQ.st[k]=j.me.st[k] });
  const have=new Set(HQ.log.map(x=>x.ts)); (j.me.log||[]).forEach(x=>{ if(!have.has(x.ts)) HQ.log.push(x) }); HQ.log.sort((a,b)=>b.ts-a.ts);
  save(); push() }catch(e){HQ.old=true} }
async function push(){ const st={}; Object.keys(HQ.dirty||{}).forEach(k=>{ if(HQ.st[k]) st[k]=HQ.st[k] });
  if(!Object.keys(st).length&&!HQ.unsent.length) return;
  try{ const j=await post({action:'hsqSave',user:hsUser(),st,rd:HQ.unsent}); if(j&&j.error) throw 0; HQ.dirty={};HQ.unsent=[];save() }catch(e){} }
async function getBank(idxs){ const need=[...new Set(idxs.map(blk))].filter(b=>!HQ.bank[b]);
  for(let n=0;n<need.length;n+=12){ const part=need.slice(n,n+12), j=await (await fetch(url('&b='+part.join(',')))).json(); if(j.error) throw new Error(j.error); part.forEach(b=>{HQ.bank[b]=(j.bank&&j.bank[b])||{}}) } }
const ents=who=>{ const st=who==='me'?HQ.st:((HQ.pe&&HQ.pe.st)||{}); return Object.keys(st).map(k=>{const a=k.split('.').map(Number);return Object.assign({k,i:a[0],kk:a[1]},P(st[k]))}).sort((a,b)=>b.t-a.t) };
const wrongL=who=>ents(who).filter(e=>e.w>0&&e.r<2), hardL=who=>ents(who).filter(e=>e.f&1);
const logOf=who=>who==='me'?HQ.log:((HQ.pe&&HQ.pe.log)||[]);
const recOf=(who,ts)=>logOf(who).find(r=>r.ts===ts);
/* 一張考卷紀錄裡每題的資料(舊紀錄沒有選項順序 / 作答,用固定亂數補) */
function rq(rec,j){ const a=rec.res[j]||[], pm=/^[0-3]{4}$/.test(String(a[3]||''))?String(a[3]).split('').map(Number):dperm(rec.ts*31+j*7+(a[0]|0));
  const known=a[4]!==undefined&&a[4]!==null&&a[4]!=='', pk=known?Number(a[4]):(a[2]?pm.indexOf(0):null);
  return {i:a[0],k:a[1],ok:!!a[2],perm:pm,pick:pk,flag:!!a[5],key:a[0]+'.'+a[1]} }
const srcName=s=>({all:'全部字',new:'沒考過的',star:'收藏的字','錯題':'錯題練習','難題':'難題練習','重考':'重新練習','指定字':'指定單字','預製卷':'全範圍預製卷'}[s]||'');
const fmtT=ts=>{ const d=new Date(ts); return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` };
function poolOf(){
  const cu=HQ.cu.split(/[\s,;，、]+/).map(hsNorm).filter(Boolean);
  if(cu.length){ const set=new Set(cu); return HSX.list.filter(w=>w.acc.some(a=>set.has(a))) }
  let p=HSX.list.filter(w=>HQ.lvs.includes(w.lv)&&okPos(w));
  if(HQ.lt.length) p=p.filter(w=>HQ.lt.includes(w.L));
  if(HQ.ps.length) p=p.filter(w=>w.pos.split('/').some(x=>HQ.ps.includes(x.replace(/[()]/g,''))));
  if(HQ.src==='star') p=p.filter(w=>hsF(w.i)&1);
  else if(HQ.src==='new') p=p.filter(w=>!Object.keys(HQ.st).some(k=>k.split('.')[0]==w.i));
  return p }
const cntTxt=()=>{ const n=poolOf().length, cu=HQ.cu.trim(); return `符合 ${n} 字`+(!cu&&n<3?'(太少,請放寬條件)':cu&&!n?'(找不到,請檢查拼字)':'') };
const okPos=w=>w.pos.split('/').some(p=>/^\(?(n|v|adj|adv)\./.test(p));
/* ---------- 預製卷(v96):全範圍、兩人同一份,後端凌晨 + 背景先出好 ---------- */
const isDef=()=>!HQ.cu.trim()&&HQ.lvs.length===6&&!HQ.lt.length&&!HQ.ps.length&&HQ.src==='all';
const poolOn=()=>isDef()&&!!HQ.pool&&HQ.pool.mine>0;
const btnTxt=n=>HQ.busy?'準備中…':poolOn()?`⚡ 馬上開始(現成考卷 · 還有 ${HQ.pool.mine} 份)`:'出考卷('+Math.min(10,n)+' 題)';
function poolNote(){
  if(HQ.nopool&&isDef()) return '<br>⚠ 後端還沒更新到 v36(沒收到預製考卷資訊)。請在 Apps Script「部署 → 管理部署作業 → 編輯 → 新版本」重新部署,不是只存檔。';
  if(!HQ.pool&&isDef()&&!HQ.old) return '<br>⏳ 正在確認現成考卷…';
  if(!HQ.pool||!isDef()) return HQ.pool?'<br>🕒 客製化條件要現場請 AI 出題,約 15~40 秒。想馬上開始:全部不選(全範圍)就會用現成考卷。':'';
  const pe=HQ.peer?esc(HQ.peer):'對方';
  if(HQ.pool.mine>0) return `<br>⚡ 全範圍現成考卷:你還有 <b>${HQ.pool.mine}</b> 份沒考過 · ${pe} 還有 ${HQ.pool.peer} 份。${HQ.pool.pd?`下一份 ${pe} 已經考過了,寫完可以比成績。`:'兩個人考的是同一份卷。'}`;
  return '<br>⌛ 現成考卷用完了,這次要現場出題(約 15~40 秒);系統已在背景補卷。'
}
/* 沒作答就丟掉預製卷 → 退回去(別人 / 我之後還能考) */
function giveBack(d){ if(d&&d.pid&&d.qs&&d.qs.every(x=>x.pick<0)){ post({action:'hsqPaperBack',user:hsUser(),id:d.pid}).catch(()=>{}); if(HQ.pool) HQ.pool.mine++ } }
/* 領一份預製卷;沒有現成的 → false(呼叫端改成現場出題) */
async function takePaper(){
  HQ.busy=true;HQ.msg='正在拿現成考卷…';hsRender();
  try{
    const req=Date.now().toString(36)+Math.random().toString(36).slice(2,7), j=await post({action:'hsqPaper',user:hsUser(),req});
    if(j.error) throw new Error(j.error);
    if(j.empty){ if(HQ.pool){HQ.pool.mine=0;HQ.pool.peer=HQ.pool.peer||0} return false }
    Object.keys(j.bank||{}).forEach(b=>{ HQ.bank[b]=j.bank[b] });
    const qs=(j.paper.q||[]).filter(a=>qOf(a[0],a[1])&&!qOf(a[0],a[1]).bad).map(a=>({i:a[0],k:a[1],perm:shuf([0,1,2,3]),pick:-1}));
    if(qs.length<3) throw new Error('這份考卷的題目載入失敗,請再試一次');
    if(HQ.pool){ HQ.pool.mine=j.left; HQ.pool.peer=j.peerLeft; HQ.pool.pd=0 }
    beginPlay(qs,'預製卷',j.paper.id);
    HQ.busy=false;hsRender();scrollTo(0,0); return true;
  }catch(e){ HQ.busy=false;HQ.msg='⚠ '+e.message;hsRender(); return true }   // 出錯時不要偷偷改成現場出題(會多花額度),讓使用者看到訊息再決定
}
async function startBtn(){
  if(!HQ.pool&&isDef()&&!HQ.old){ HQ.busy=true;HQ.msg='正在確認現成考卷…';hsRender(); await sync(); HQ.busy=false;HQ.msg=''; }   // 還沒同步完就按 → 先等同步,不要直接現場出題
  if(poolOn()){
    if(HQ.draft&&!confirm('你有一張還沒寫完的考卷,開新的會把它丟掉。確定嗎?')) return;
    const d=HQ.draft; const ok=await takePaper();
    if(ok){ if(HQ.ph==='play') giveBack(d); return }   // 新卷領成功 → 舊草稿才退回
    HQ.msg='現成考卷剛好用完了,改成現場出題…'; return start(null,true);
  }
  start();
}
/* ---------- 出一張考卷 ---------- */
async function start(from,noAsk){
  const d0=HQ.draft;
  if(!noAsk&&HQ.draft&&!confirm('你有一張還沒寫完的考卷,重新出卷會把它丟掉。確定要出新的考卷嗎?')) return;
  HQ.busy=true;HQ.msg='正在準備考卷…';hsRender();
  try{
    let cand;
    if(from) cand=shuf(from).slice(0,10).map(e=>({i:e.i,k:e.kk}));
    else{ const pool=poolOf(); if(pool.length<(HQ.cu.trim()?1:3)) throw new Error('這個範圍的字太少,請放寬條件');
      cand=shuf(pool).slice(0,10).map(w=>({i:w.i,k:-1})) }
    await getBank(cand.map(c=>c.i));
    const gen=[];
    cand.forEach(c=>{ if(c.k>=0){ const q0=qOf(c.i,c.k); if(q0&&!q0.bad) return; c.k=-1 } const l=((HQ.bank[blk(c.i)]||{})[c.i])||[];
      const good=l.map((q,k)=>q.bad?-1:k).filter(k=>k>=0), un=good.filter(k=>!HQ.st[c.i+'.'+k]);
      if(un.length) c.k=un[Math.floor(Math.random()*un.length)];
      else if(good.length>=4) c.k=good[Math.floor(Math.random()*good.length)];
      else{ const w=HSX.list[c.i]; gen.push({i:c.i,w:w.raw,pos:w.pos,lv:w.lv,old:l.map(q=>q.s)}) } });
    if(gen.length){ HQ.msg=`AI 正在出 ${gen.length} 題新題目…(約 15~40 秒,出過的題目會存起來兩個人共用)`;hsRender();
      const j=await post({action:'hsqGen',user:hsUser(),items:gen}); if(j.error) throw new Error(j.error);
      Object.keys(j.qs||{}).forEach(i=>{ (HQ.bank[blk(+i)]=HQ.bank[blk(+i)]||{})[i]=j.qs[i]; cand.forEach(c=>{ if(c.i==i&&c.k<0) c.k=j.qs[i].length-1 }) }) }
    const qs=cand.filter(c=>c.k>=0&&qOf(c.i,c.k)&&!qOf(c.i,c.k).bad).map(c=>({i:c.i,k:c.k,perm:shuf([0,1,2,3]),pick:-1}));
    if(qs.length<Math.min(3,cand.length)) throw new Error('可用的題目太少,請再試一次');
    beginPlay(qs,from?(HQ.tab==='hard'?'難題':'錯題'):HQ.cu.trim()?'指定字':HQ.src); giveBack(d0);
  }catch(e){ HQ.msg='⚠ '+e.message;HQ.ph=from?'bank':'setup' }
  HQ.busy=false;hsRender();scrollTo(0,0);
}
function beginPlay(qs,src,pid){ HQ.pid=pid||'';HQ.qs=qs;HQ.rsrc=src;HQ.t0=Date.now();HQ.ph='play';HQ.msg='';clearDraft();saveDraft() }
/* 同一張考卷再寫一次(不顯示答案) */
async function retake(who,ts){
  const rec=recOf(who,ts); if(!rec) return;
  if(HQ.draft&&!confirm('你有一張還沒寫完的考卷,重新練習會把它丟掉。確定嗎?')) return;
  HQ.busy=true;HQ.msg='正在準備考卷…';hsRender();
  try{ await getBank(rec.res.map(a=>a[0]));
    const qs=rec.res.map((a,j)=>({i:a[0],k:a[1],j})).filter(c=>{ const q=qOf(c.i,c.k); return q&&!q.bad }).map(c=>{ const o=rq(rec,c.j); return {i:c.i,k:c.k,perm:/^[0-3]{4}$/.test(String((rec.res[c.j]||[])[3]||''))?o.perm:shuf([0,1,2,3]),pick:-1} });
    if(qs.length<Math.min(3,rec.res.length)) throw new Error('這張考卷可用的題目太少');
    beginPlay(qs,'重考');
  }catch(e){ HQ.msg='⚠ '+e.message;HQ.ph='sheet' }
  HQ.busy=false;hsRender();scrollTo(0,0);
}
/* ---------- 作答(整張一頁,選好繼續往下,繳交才批改)---------- */
function pick(j,d){ const x=HQ.qs[j]; if(!x||HQ.ph!=='play') return; x.pick=(x.pick===d?-1:d); saveDraft(); paintPlay(j) }
function flagQ(j){ const x=HQ.qs[j]; if(!x) return; const key=x.i+'.'+x.k, p=P(HQ.st[key]); p.f^=1; p.t=now(); HQ.st[key]=S(p); HQ.dirty[key]=1; save(); paintPlay(j) }
function paintPlay(j){ const el=document.getElementById('hq-q'+j); if(el){ el.outerHTML=qCardPlay(j) } navPaint() }
function navPaint(){ const nv=document.getElementById('hq-nav'); if(nv) nv.innerHTML=navHtml(); const c=document.getElementById('hq-cnt2'); if(c) c.textContent=playInfo(); const b=document.getElementById('hq-sub'); if(b) b.textContent=`繳交考卷(已作答 ${HQ.qs.filter(x=>x.pick>=0).length} / ${HQ.qs.length})` }
const playInfo=()=>{ const a=HQ.qs.filter(x=>x.pick>=0).length, f=HQ.qs.filter(x=>P(HQ.st[x.i+'.'+x.k]).f&1).length; return `已作答 ${a} / ${HQ.qs.length}`+(f?` · ⭐ ${f}`:'') };
function submit(){ if(HQ.ph!=='play') return;
  const un=HQ.qs.map((x,j)=>x.pick<0?j+1:0).filter(Boolean);
  if(un.length&&!confirm(`還有 ${un.length} 題沒作答(第 ${un.join('、')} 題),未作答會算答錯。\n確定要繳交嗎?`)) return;
  if(!un.length&&!confirm('確定要繳交考卷嗎?繳交後就會顯示答案與詳解。')) return;
  const res=HQ.qs.map(x=>{ const key=x.i+'.'+x.k, g=x.pick>=0&&x.perm[x.pick]===0, p=P(HQ.st[key]);
    if(g){p.r++}else{p.w++;p.r=0} p.t=now(); HQ.st[key]=S(p); HQ.dirty[key]=1;
    return [x.i,x.k,g?1:0,x.perm.join(''),x.pick,(p.f&1)?1:0] });
  const ok=res.filter(r=>r[2]).length, rd={ts:Date.now(),n:res.length,ok,src:HQ.rsrc||'all',lv:HQ.lvs.slice(),res}; if(HQ.pid) rd.pid=HQ.pid;
  HQ.log.unshift(rd);HQ.unsent.push(rd);save();clearDraft();HQ.pid='';push();
  HQ.sheet=rd.ts;HQ.who='me';HQ.mode='grade';HQ.fresh=true;HQ.open={};HQ.back='setup';HQ.ph='sheet';hsRender();scrollTo(0,0) }
function hard(key){ const p=P(HQ.st[key]); p.f^=1; p.t=now(); HQ.st[key]=S(p); HQ.dirty[key]=1; save(); push(); hsRender(); repaintW() }
/* ---------- 畫面 ---------- */
const blank=(s,w)=>esc(s).replace(/_{3,}/,w?`<b class="hq-fill">${esc(w)}</b>`:'<span class="hq-bl"></span>');
function head(t,back,lbl){ return `<div class="hq-top"><button class="ghost" onclick="${back}">‹ ${lbl||(back==='hqClose()'?'字表首頁':'返回')}</button><b>${t}</b></div>` }
function setupV(){
  const w=wrongL('me').length,h=hardL('me').length,lc=HQ.lvs.length,cu=HQ.cu.trim(), n=poolOf().length;
  const ch=(on,fn,t,c)=>`<button class="hs-chip ${c||''} ${on?'on':''}" onclick="${fn}">${t}</button>`;
  const lvs=[1,2,3,4,5,6].map(l=>ch(HQ.lvs.includes(l),`hqLv(${l})`,`第 ${l} 級`)).join('')+ch(0,'hqLv(0)',lc===6?'清空':'全選');
  const lts='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c=>ch(HQ.lt.includes(c),`hqLt('${c}')`,c,'hq-lt')).join('')+ch(0,"hqLt('')",'不限');
  const pss=[['n.','名詞'],['v.','動詞'],['adj.','形容詞'],['adv.','副詞']].map(p=>ch(HQ.ps.includes(p[0]),`hqPs('${p[0]}')`,p[1])).join('');
  const srcs=[['all','全部字'],['new','還沒考過的'],['star','⭐ 我收藏的']].map(x=>ch(HQ.src===x[0],`hqSrc('${x[0]}')`,x[1])).join('');
  const dr=HQ.draft&&HQ.draft.qs&&HQ.draft.qs.length?`<div class="card hq-draft"><b>✍️ 有一張還沒寫完的考卷</b><div class="meta" style="margin:4px 0 10px">已作答 ${HQ.draft.qs.filter(x=>x.pick>=0).length} / ${HQ.draft.qs.length} 題</div><div class="hs-act"><button onclick="hqResume()">繼續寫</button><button class="ghost" onclick="hqDrop()">丟掉</button></div></div>`:'';
  return `${head('📝 學測詞彙題','hqClose()')}${dr}<div class="hq-cols"><div class="card"><div class="hq-h">出一張新考卷</div><div class="hq-h" style="margin-top:0;font-weight:600">指定單字(選填:貼上想練的字,用空格或逗號分開;有填就只考這些字)</div><textarea class="hq-ta" placeholder="例:pose, address, draft, vacant" oninput="HQ.cu=this.value;hqCount()">${esc(HQ.cu)}</textarea>
    <div class="${cu?'hq-dim':''}"><div class="hq-h">級別(可複選)</div><div class="hs-chips">${lvs}</div>
    <div class="hq-h">字母開頭(可複選;不選 = 不限)</div><div class="hs-chips">${lts}</div>
    <div class="hq-h">詞性(可複選;不選 = 不限)</div><div class="hs-chips">${pss}</div>
    <div class="hq-h">字的來源</div><div class="hs-chips">${srcs}</div></div>
    <div class="meta" style="margin:12px 0 10px;line-height:1.7"><b id="hq-cnt">${cntTxt()}</b><br>一張考卷 10 題,學測第一大題風格:單句填空、四選一。整張寫完、繳交後才會顯示答案與詳解;寫的時候可以標記難題,之後再複習。<span id="hq-pn">${poolNote()}</span></div>
    <button style="width:100%;padding:13px" ${HQ.busy||n<(cu?1:3)?'disabled':''} onclick="hqStart()">${btnTxt(n)}</button>${HQ.msg?`<div class="meta" style="margin-top:10px;line-height:1.7">${esc(HQ.msg)}</div>`:''}</div>
    <div class="card"><div class="hq-h">複習回顧</div>
    <div class="hq-big2" onclick="hqSheets('me')"><div><b>🗂 考卷紀錄</b><div class="meta">一張一張點進去:看批改詳解、重新練習、下載考卷圖</div></div><span class="hs-go">${HQ.log.length} ›</span></div>
    <div class="hq-big2" onclick="hqBank('wrong')"><div><b>📌 錯題・難題區</b><div class="meta">跨考卷整理:錯 ${w} 題 · 難題 ${h} 題</div></div><span class="hs-go">›</span></div>
    <div class="meta" style="margin-top:10px;line-height:1.7">錯題:答錯後還沒連續答對 2 次的題目。難題:你在作答時按 ⭐ 標記的。題目有問題可以按 🚩 回報,那題之後不會再出。${HQ.peer?`<br>也可以看 ${esc(HQ.peer)} 的考卷與錯題、難題。`:''}</div>
    ${HQ.old?'<div class="meta" style="margin-top:8px;color:var(--danger)">後端還沒更新到 Code-v29,無法出題 / 同步。</div>':''}</div></div>`;
}
const navHtml=()=>HQ.qs.map((x,j)=>{ const f=P(HQ.st[x.i+'.'+x.k]).f&1; return `<button class="${x.pick>=0?'a':''} ${f?'f':''}" onclick="hqGoQ(${j})">${j+1}</button>` }).join('');
function qCardPlay(j){ const x=HQ.qs[j], q=qOf(x.i,x.k), key=x.i+'.'+x.k, f=P(HQ.st[key]).f&1;
  const opts=x.perm.map((o,d)=>`<button class="hq-o ${x.pick===d?'sel':''}" onclick="hqPick(${j},${d})"><span>${L[d]}</span>${esc(q.o[o])}</button>`).join('');
  return `<div class="card hq-pq ${x.pick>=0?'done':''}" id="hq-q${j}"><div class="hq-qh"><b>第 ${j+1} 題</b><button class="ghost hq-fl ${f?'on':''}" onclick="hqFlagQ(${j})">${f?'⭐ 已標記難題':'☆ 標記難題'}</button></div>
    <div class="hq-s">${blank(q.s,'')}</div><div class="hq-os">${opts}</div></div>` }
function playV(){ return `${head('作答中','hqQuit()','暫離')}<div class="hq-stk"><div class="hq-info"><span id="hq-cnt2">${playInfo()}</span><span class="meta">點題號跳題 · 可改答案</span></div><div class="hq-nav" id="hq-nav">${navHtml()}</div></div>
  <div class="hq-play">${HQ.qs.map((x,j)=>qCardPlay(j)).join('')}<button style="width:100%;padding:14px;margin-top:6px" id="hq-sub" onclick="hqSubmit()">繳交考卷(已作答 ${HQ.qs.filter(x=>x.pick>=0).length} / ${HQ.qs.length})</button><div class="meta" style="text-align:center;margin:8px 0 18px">繳交後才會顯示答案與詳解。中途離開會自動保留進度。</div></div>` }
/* 單題:批改版 / 空白版 */
function qGrade(rec,j,mine,mode){ const o=rq(rec,j), q=qOf(o.i,o.k); if(!q) return `<div class="card hq-gq"><div class="meta">第 ${j+1} 題載入中…</div></div>`;
  const blankM=mode==='blank', okd=o.perm.indexOf(0), unk=o.pick===null, skip=o.pick===-1;
  const opts=o.perm.map((p,d)=>{ let c='',tag=''; if(!blankM){ if(d===okd){c='ok';tag='<em>正確答案</em>'} else if(d===o.pick){c='bad';tag='<em>你選的</em>'} else c='dim'; if(d===okd&&d===o.pick) tag='<em>你選的・正確</em>' }
    return `<div class="hq-o ${c}"><span>${L[d]}</span>${esc(q.o[p])}${tag}</div>` }).join('');
  const hdr=blankM?`<b>第 ${j+1} 題</b>`:`<b>第 ${j+1} 題</b><span class="hq-vd ${o.ok?'ok':'bad'}">${o.ok?'✅ 答對':skip?'❌ 未作答':'❌ 答錯'}</span>`;
  const hd=P((mine?HQ.st:(HQ.pe&&HQ.pe.st)||{})[o.key]).f&1;
  const det=blankM?'':`${unk&&!o.ok?'<div class="meta" style="margin-top:6px">(這張是舊紀錄,沒有存下你當時選的答案)</div>':''}<div class="hq-ans"><span class="hs-lvp">${esc(q.type)}${q.sense?' · '+esc(q.sense):''}</span></div>${q.zh?`<div class="hq-zh">${esc(q.zh)}</div>`:''}<div class="hq-ex">${esc(q.ex)}</div>
    <div class="hs-act">${mine?`<button class="ghost ${hd?'on':''}" onclick="hqHard('${o.key}')">${hd?'⭐ 難題':'☆ 標為難題'}</button>`:`<span class="meta">${hd?'⭐ 對方標為難題':''}</span>`}<button class="ghost" onclick="hsDetail(${o.i})">看「${esc(HSX.list[o.i].disp)}」詳解</button><button class="ghost" ${q.bad?'disabled':''} onclick="hqFlag(${o.i},${o.k})">${q.bad?'🚩 已回報':'🚩 這題有問題'}</button></div>`;
  return `<div class="card hq-gq ${blankM?'':o.ok?'ok':'bad'}"><div class="hq-qh">${hdr}${!blankM&&(o.flag||hd)?'<span class="hs-lvp">⭐ 難題</span>':''}</div><div class="hq-s">${blank(q.s,blankM?'':q.o[0])}</div><div class="hq-os">${opts}</div>${det}</div>` }
function sheetV(){ const who=HQ.who, mine=who==='me', rec=recOf(who,HQ.sheet);
  if(!rec) return `${head('考卷','hqSheets(\''+who+'\')')}<div class="card meta">找不到這張考卷</div>`;
  const wait=rec.res.some(a=>!qOf(a[0],a[1])), tit=`${mine?'':esc(HQ.peer)+' 的'}考卷 · ${fmtT(rec.ts)}`;
  const twin=(()=>{ if(!rec.pid) return ''; const o=(mine?(HQ.pe&&HQ.pe.log):HQ.log)||[], t=o.find(x=>x.pid===rec.pid); return t?`<br>📄 同一份卷:${esc(mine?HQ.peer:'你')} 得 <b>${t.ok} / ${t.n}</b>`:'' })();
  const sc=`<div class="card" style="text-align:center"><div class="hq-big">${rec.ok}<small> / ${rec.n}</small></div><div class="meta">${HQ.fresh?(rec.ok===rec.n?'全對!':rec.ok>=rec.n*0.8?'很穩':rec.ok>=rec.n*0.6?'不錯,錯的看一下詳解':'錯題已收進「錯題・難題區」,可以回頭練'):esc(srcName(rec.src))+((rec.lv||[]).length&&(rec.lv||[]).length<6?' · 第 '+rec.lv.join('、')+' 級':'')}${twin}</div>
    <div class="hs-act"><button onclick="hqRetake('${who}',${rec.ts})">🔁 重新練習這張</button><button class="ghost" onclick="hqImg('${who}',${rec.ts},'paper')">📄 考卷圖</button><button class="ghost" onclick="hqImg('${who}',${rec.ts},'graded')">📝 批改詳解圖</button></div></div>`;
  const seg=`<div class="seg hq-seg"><button class="${HQ.mode==='grade'?'on':''}" onclick="hqMode('grade')">批改詳解</button><button class="${HQ.mode==='blank'?'on':''}" onclick="hqMode('blank')">只看題目(不含答案)</button></div>`;
  const nx=HQ.fresh?`<div class="hs-act" style="margin:10px 0"><button onclick="hqSetup()">再出一張</button><button class="ghost" onclick="hqSheets('me')">考卷紀錄</button><button class="ghost" onclick="hqBank('wrong')">錯題・難題區</button></div>`:'';
  return `${head(tit,HQ.fresh?'hqSetup()':'hqSheets(\''+who+'\')',HQ.fresh?'首頁':'考卷紀錄')}${HQ.msg?`<div class="meta" style="margin-bottom:8px">${esc(HQ.msg)}</div>`:''}${sc}${nx}${seg}${wait?'<div class="card meta">題目載入中…</div>':''}<div class="hq-list2">${rec.res.map((a,j)=>qGrade(rec,j,mine,HQ.mode)).join('')}</div>` }
function sheetsV(){ const who=HQ.who, mine=who==='me', log=logOf(who);
  const whoB=HQ.peer?`<div class="seg hq-seg"><button class="${mine?'on':''}" onclick="hqSheets('me')">我的</button><button class="${!mine?'on':''}" onclick="hqSheets('pe')">${esc(HQ.peer)} 的</button></div>`:'';
  const rows=log.length?log.map(r=>{ const hd=r.res.filter(a=>a[5]).length, bad=r.res.filter(a=>!a[2]).length;
    return `<div class="hq-r hq-sh" onclick="hqOpenSheet('${who}',${r.ts})"><div class="hq-rt"><b class="hq-sc">${r.ok} / ${r.n}</b><span class="meta">${fmtT(r.ts)} · ${esc(srcName(r.src))}${(r.lv||[]).length&&(r.lv||[]).length<6?' · 第 '+r.lv.join('、')+' 級':''}</span></div>
      <div class="hq-chips">${r.res.map((a,j)=>`<span class="${a[2]?'ok':'bad'}">${j+1}</span>`).join('')}</div><div class="meta" style="margin-top:6px">${bad?'錯 '+bad+' 題':'全對'}${hd?' · ⭐ 難題 '+hd:''} · 點進去看詳解 ›</div></div>` }).join(''):'<div class="card meta">還沒有考卷紀錄。出一張考卷、繳交後就會出現在這裡。</div>';
  return `${head('🗂 考卷紀錄','hqSetup()','首頁')}${whoB?`<div class="hq-seg2">${whoB}</div>`:''}<div class="hq-list">${rows}</div>` }
function qDetail(i,k,key,mine,noW){ const q=qOf(i,k); if(!q) return '<div class="meta">題目載入中…</div>'; const hd=P((mine?HQ.st:(HQ.pe&&HQ.pe.st)||{})[key]).f&1;
  return `<div class="hq-dt" onclick="event.stopPropagation()"><div class="hq-s sm">${blank(q.s,q.o[0])}</div><div class="hq-opts">${q.o.map((o,d)=>`<span class="${d===0?'ok':''}">${esc(o)}</span>`).join('')}</div>${q.zh?`<div class="hq-zh">${esc(q.zh)}</div>`:''}<div class="hq-ex">${esc(q.ex)}</div>
    <div class="hs-act"><span class="hs-lvp">${esc(q.type)}${q.sense?' · '+esc(q.sense):''}</span>${mine?`<button class="ghost ${hd?'on':''}" onclick="hqHard('${key}')">${hd?'⭐ 難題':'☆ 難題'}</button>`:''}${noW?'':`<button class="ghost" onclick="hsDetail(${i})">字詳解</button>`}<button class="ghost" ${q.bad?'disabled':''} onclick="hqFlag(${i},${k})">${q.bad?'🚩 已回報':'🚩 回報'}</button></div></div>` }
/* 錯題・難題區(跨考卷整理)*/
function bankV(){ const who=HQ.who, mine=who==='me', tab=HQ.tab;
  const seg=`<div class="seg hq-seg">${[['wrong','錯題'],['hard','難題']].map(t=>`<button class="${tab===t[0]?'on':''}" onclick="hqBank('${t[0]}')">${t[1]} ${(t[0]==='wrong'?wrongL:hardL)(who).length}</button>`).join('')}</div>`;
  const whoB=HQ.peer?`<div class="seg hq-seg"><button class="${mine?'on':''}" onclick="hqWho('me')">我的</button><button class="${!mine?'on':''}" onclick="hqWho('pe')">${esc(HQ.peer)} 的</button></div>`:'';
  const l=(tab==='wrong'?wrongL:hardL)(who);
  let body=l.length?l.map(e=>{ const q=qOf(e.i,e.kk), id=who+e.k; return `<div class="hq-r" onclick="hqTog('${id}')"><div class="hq-rt"><b>${esc(q?q.o[0]:(HSX.list[e.i]||{}).disp||'')}</b><span class="meta">${q?esc(q.type):''} · 錯 ${e.w} 次${e.r?' · 連對 '+e.r:''}</span></div>${q?`<div class="hq-snip">${blank(q.s,'')}</div>`:''}${HQ.open[id]?qDetail(e.i,e.kk,e.k,mine):''}</div>` }).join(''):`<div class="card meta">${tab==='wrong'?'沒有錯題 🎉':'還沒有標記難題'}</div>`;
  if(mine&&l.length) body=`<button style="width:100%;margin-bottom:10px" ${HQ.busy?'disabled':''} onclick="hqDrill()">把這些${tab==='wrong'?'錯題':'難題'}出成一張考卷(最多 10 題)</button>`+body;
  return `${head('📌 錯題・難題區','hqSetup()','首頁')}${HQ.msg?`<div class="meta" style="margin-bottom:8px">${esc(HQ.msg)}</div>`:''}<div class="meta" style="margin:0 2px 8px;line-height:1.7">這裡是跨考卷整理的題目;想照考卷一張一張看,請回首頁進「考卷紀錄」。</div><div class="hq-seg2">${seg}${whoB}</div><div class="hq-list">${body}</div>` }
const repaintW=()=>{ if(typeof HSX!=='undefined'&&HSX.cur>=0&&document.getElementById('hs-dt')) hsDetailPaint(false) };
window.hqWordHtml=function(i){ ensure(); const l=((HQ.bank[blk(i)]||{})[i])||[], w=HSX.list[i];
  const done=Object.keys(HQ.st).map(k=>k.split('.').map(Number)).filter(a=>a[0]===i).map(a=>({k:a[1],p:P(HQ.st[i+'.'+a[1]])})).sort((a,b)=>b.p.t-a.p.t);
  const rows=done.map(d=>{ const q=l[d.k]; if(!q) return ''; const id='w'+i+'.'+d.k, key=i+'.'+d.k, g=d.p.w===0||d.p.r>=2;
    return `<div class="hq-r ${g?'ok':'bad'}" onclick="hqWTog('${id}')"><div class="hq-rt"><span>${g?'✅':'❌'}</span><b>${esc(q.type)}${q.sense?' · '+esc(q.sense):''}</b><span class="meta">${d.p.w?'錯 '+d.p.w+' 次':'都答對'}${d.p.r?' · 連對 '+d.p.r:''}${d.p.f&1?' · ⭐':''}${q.bad?' · 🚩':''}</span></div><div class="hq-snip">${blank(q.s,q.o[0])}</div>${HQ.open[id]?qDetail(i,d.k,key,true,true):''}</div>` }).join('');
  const wait=!HQ.bank[blk(i)]&&Object.keys(HQ.st).some(k=>k.split('.')[0]==i);
  return `<div class="hs-card"><div class="hs-ch">📝 考過的題目<span class="meta"> · ${done.length}</span></div>${rows||(wait?'<div class="meta">載入中…</div>':'<div class="meta" style="margin-bottom:6px">這個字還沒考過。</div>')}<div class="hs-act"><button class="ghost" onclick="hqPractice(${i})">出題考這個字</button></div></div>` };
window.hqWordLoad=function(i){ ensure(); const todo=[];
  if(!HQ.bank[blk(i)]&&Object.keys(HQ.st).some(k=>k.split('.')[0]==i)) todo.push(getBank([i]).then(repaintW).catch(()=>{}));
  if(!HQ.synced){ HQ.synced=1; todo.push(sync().then(()=>getBank([i])).then(repaintW).catch(()=>{})) } };
window.hqView=function(){ ensure(); if(HQ.busy) return `${head('📝 學測詞彙題','hqClose()')}<div class="card hs-wait"><div class="hs-spin"></div><div style="font-weight:600;margin-top:10px">${esc(HQ.msg)}</div></div>`;
  return HQ.ph==='play'?playV():HQ.ph==='sheet'?sheetV():HQ.ph==='sheets'?sheetsV():HQ.ph==='bank'?bankV():setupV() };
window.hqCard=function(){ ensure(); const w=wrongL('me').length;
  return `<div class="hs-lc hq-card" onclick="hqOpen()"><div class="hs-lcn">📝</div><div class="hs-lci"><div class="hs-lct">學測詞彙題<span class="meta"> · 整張考卷</span></div><div class="meta">10 題一張 · 繳交後才給答案 · 考卷紀錄 · 錯題難題區${w?` · 錯題 ${w}`:''}</div></div><div class="hs-go">›</div></div>` };
/* ---------- 匯出圖片(考卷圖 / 批改詳解圖)---------- */
const FONT='"PingFang TC","Noto Sans TC","Microsoft JhengHei","Heiti TC",system-ui,sans-serif', SERIF='Georgia,"Times New Roman","Noto Serif TC",serif';
function tokenize(segs){ const out=[]; segs.forEach(s=>{ String(s.t).replace(/[A-Za-z0-9'’\-_.,;:!?()%"“”\/]+|\s+|[^\x00-\x7f]/g,m=>{ out.push(Object.assign({},s,{t:m})); return m }) }); return out }
const NOHEAD=new Set('，。、；：？！）」』”…,.;:!?)'.split(''));
function paintSheet(ctx,W,H,dry,rec,kind,mine){
  const pad=64, cw=W-pad*2; let y=pad;
  const font=(sz,b,serif)=>`${b?'bold ':''}${sz}px ${serif?SERIF:FONT}`;
  const txt=(segs,x,sz,lh,o)=>{ o=o||{}; const toks=tokenize(Array.isArray(segs)?segs:[{t:segs}]), maxW=o.w||cw-(x-pad); let lines=[[]],cur=0;
    toks.forEach(t=>{ ctx.font=font(sz,t.b||o.b,o.serif); const w=ctx.measureText(t.t).width, sp=/^\s+$/.test(t.t); if(sp&&!lines[lines.length-1].length) return;
      if(cur+w>maxW&&!sp&&!NOHEAD.has(t.t)&&lines[lines.length-1].length){ lines.push([]);cur=0 } lines[lines.length-1].push({t,w});cur+=w });
    lines.forEach((ln,li)=>{ let xx=x; ln.forEach(({t,w})=>{ if(!dry){ ctx.font=font(sz,t.b||o.b,o.serif); ctx.fillStyle=t.c||o.c||'#1d2130'; ctx.textBaseline='alphabetic'; ctx.fillText(t.t,xx,y+sz); if(t.u){ ctx.fillRect(xx,y+sz+4,w,2) } } xx+=w }); y+=lh });
    return lines.length };
  const bg=()=>{ if(!dry){ ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H) } };
  bg();
  txt('學測詞彙題・第一大題 單句填空',pad,40,52,{b:1,c:'#3c4994'});
  const who=mine?hsUser():(HQ.peer||''); y+=2;
  txt(kind==='graded'?`批改詳解   姓名:${who}   日期:${fmtT(rec.ts)}   得分:${rec.ok} / ${rec.n}`:`考卷   姓名:__________   日期:${fmtT(rec.ts)}   得分:______ / ${rec.n}`,pad,26,38,{c:'#555b6b'});
  if(!dry){ ctx.fillStyle='#3c4994'; ctx.fillRect(pad,y+4,cw,3) } y+=26;
  if(kind==='paper'){ txt('請依句意選出最適合填入空格的一個選項。',pad,24,34,{c:'#687083'}); y+=10 }
  rec.res.forEach((a,j)=>{ const o=rq(rec,j), q=qOf(o.i,o.k); if(!q) return; const okd=o.perm.indexOf(0), graded=kind==='graded';
    y+=14; if(!dry){ ctx.fillStyle='#e3e6ee'; ctx.fillRect(pad,y,cw,1) } y+=22;
    if(graded){ const st=o.ok?{t:'【對】',c:'#2f8a3a'}:{t:o.pick===-1?'【未作答】':'【錯】',c:'#d64550'}; const mine2=o.pick===null?'(未記錄)':o.pick===-1?'未作答':L[o.pick];
      txt([{t:`${j+1}.  `,b:1},Object.assign({b:1},st),{t:`   你的答案:${mine2}    正確答案:${L[okd]}`,c:'#555b6b'},...(o.flag?[{t:'   ★難題',c:'#c98a00',b:1}]:[])],pad,26,38) }
    const parts=String(q.s).split(/(_{3,})/), segs=[]; if(!graded) segs.push({t:`${j+1}.  `,b:1});
    parts.forEach(p=>{ if(/^_{3,}$/.test(p)) segs.push(graded?{t:q.o[0],b:1,c:'#2f8a3a',u:1}:{t:'__________'}); else if(p) segs.push({t:p}) });
    txt(segs,pad,30,46,{serif:1}); y+=4;
    o.perm.forEach((p,d)=>{ let c='#1d2130',b=0,tag=''; if(graded){ if(d===okd){c='#2f8a3a';b=1;tag=d===o.pick?'  ←你選的(正確)':'  ←正確答案'} else if(d===o.pick){c='#d64550';b=1;tag='  ←你選的'} else c='#8a90a0' }
      txt([{t:`(${L[d]})  ${q.o[p]}`,b,c},...(tag?[{t:tag,c,b:1}]:[])],pad+30,28,40) });
    if(graded){ y+=6; txt([{t:'題型:',b:1,c:'#687083'},{t:`${q.type}${q.sense?'・'+q.sense:''}`,c:'#687083'}],pad,24,34); if(q.zh){ txt([{t:'中譯:',b:1,c:'#3c4994'},{t:q.zh}],pad,26,38) } txt([{t:'詳解:',b:1,c:'#3c4994'},{t:q.ex}],pad,26,38) } });
  y+=26; txt(kind==='graded'?'— 批改詳解結束 —':'— 試題結束 —',pad,22,30,{c:'#a0a6b4'}); y+=pad-10; return y }
async function makeImg(who,ts,kind){ const rec=recOf(who,ts); if(!rec) return;
  HQ.msg='正在產生圖片…'; hsRender();
  try{ await getBank(rec.res.map(a=>a[0])); if(rec.res.some(a=>!qOf(a[0],a[1]))) throw new Error('題目還沒載入,請稍後再試');
    const W=1080, mine=who==='me', m=document.createElement('canvas').getContext('2d'); m.canvas.width=W; m.canvas.height=10;
    const H=Math.ceil(paintSheet(m,W,0,true,rec,kind,mine)); let sc=1; if(W*H>15e6) sc=Math.sqrt(15e6/(W*H));
    const cv=document.createElement('canvas'); cv.width=Math.floor(W*sc); cv.height=Math.floor(H*sc); const ctx=cv.getContext('2d'); ctx.scale(sc,sc);
    paintSheet(ctx,W,H,false,rec,kind,mine);
    const blob=await new Promise(r=>cv.toBlob(r,'image/png')); if(!blob) throw new Error('產生圖片失敗');
    showImg(blob,`${kind==='paper'?'考卷':'批改詳解'}_${fmtT(rec.ts).replace(/[\/: ]/g,'-')}.png`,kind==='paper'?'考卷圖':'批改詳解圖'); HQ.msg='';
  }catch(e){ HQ.msg='⚠ '+e.message } hsRender() }
function showImg(blob,name,title){ closeImg(); const u=URL.createObjectURL(blob), el=document.createElement('div'); el.id='hq-img'; el.className='hq-ov';
  const canShare=!!(navigator.canShare&&navigator.canShare({files:[new File([blob],name,{type:'image/png'})]}));
  el.innerHTML=`<div class="hq-ovb"><b>${title}</b><span style="flex:1"></span>${canShare?'<button class="ghost" id="hq-sh">分享 / 存到相簿</button>':''}<a class="hq-dl" href="${u}" download="${name}">⬇ 下載</a><button class="ghost" onclick="hqImgClose()">關閉</button></div><div class="hq-ovi"><img src="${u}" alt="${title}"><div class="meta" style="text-align:center;margin:10px 0 20px">下載沒反應的話,長按圖片選「儲存影像」</div></div>`;
  document.body.appendChild(el); el._u=u; document.body.style.overflow='hidden';
  const sh=document.getElementById('hq-sh'); if(sh) sh.onclick=()=>navigator.share({files:[new File([blob],name,{type:'image/png'})],title:name}).catch(()=>{}) }
function closeImg(){ const el=document.getElementById('hq-img'); if(el){ try{URL.revokeObjectURL(el._u)}catch(e){} el.remove() } if(!(document.getElementById('hs-dt')||{classList:{contains:()=>false}}).classList.contains('on')) document.body.style.overflow='' }
/* ---------- 操作(掛在 window 給 onclick 用)---------- */
function loadFor(ids,cb){ getBank(ids).then(()=>cb&&cb()).catch(()=>{}) }
Object.assign(window,{
  hqOpen(){ ensure();HSX.view='qz';HQ.ph='setup';HQ.msg='';HQ.fresh=false;hsRender();scrollTo(0,0);sync().then(()=>{ if(HSX.view==='qz') hsRender() }) },
  hqClose(){ HSX.view='';HQ.ph='setup';HQ.msg='';hsRender();scrollTo(0,0) },
  hqSetup(){ HQ.ph='setup';HQ.msg='';HQ.fresh=false;hsRender();scrollTo(0,0) },
  hqQuit(){ saveDraft();HQ.ph='setup';HQ.msg='';hsRender();scrollTo(0,0) },
  hqResume(){ const d=HQ.draft; if(!d) return; HQ.busy=true;HQ.msg='正在載入考卷…';hsRender();
    getBank(d.qs.map(x=>x.i)).then(()=>{ HQ.qs=d.qs.filter(x=>qOf(x.i,x.k)&&!qOf(x.i,x.k).bad);HQ.rsrc=d.src||'all';HQ.pid=d.pid||'';HQ.t0=d.t0||Date.now(); if(!HQ.qs.length) throw new Error('題目載入失敗'); HQ.ph='play';HQ.msg='';HQ.busy=false;hsRender();scrollTo(0,0) }).catch(e=>{ HQ.busy=false;HQ.msg='⚠ '+(e.message||'載入失敗,請確認網路');HQ.ph='setup';hsRender() }) },
  hqDrop(){ if(confirm('丟掉這張還沒寫完的考卷?')){ const d=HQ.draft; clearDraft();giveBack(d);hsRender() } },
  hqLv(l){ HQ.lvs=l===0?(HQ.lvs.length===6?[]:[1,2,3,4,5,6]):HQ.lvs.includes(l)?HQ.lvs.filter(x=>x!==l):HQ.lvs.concat(l).sort(); hsRender() },
  hqSrc(s){ HQ.src=s;hsRender() },
  hqStart(){ startBtn() }, hqPick:pick, hqFlagQ:flagQ, hqSubmit:submit,
  hqHard:hard,
  hqGoQ(j){ const e=document.getElementById('hq-q'+j); if(e){ const b=document.querySelector('.hq-stk'); e.style.scrollMarginTop=(b?b.offsetHeight+8:12)+'px'; e.scrollIntoView({behavior:'smooth',block:'start'}) } },
  hqSheets(w){ HQ.who=w||'me';HQ.ph='sheets';HQ.msg='';HQ.fresh=false;hsRender();scrollTo(0,0); if(HQ.who==='pe'&&!HQ.pe) sync().then(()=>{ if(HQ.ph==='sheets') hsRender() }) },
  hqOpenSheet(w,ts){ HQ.who=w;HQ.sheet=ts;HQ.mode='grade';HQ.fresh=false;HQ.open={};HQ.msg='';HQ.ph='sheet';hsRender();scrollTo(0,0); const rec=recOf(w,ts); if(rec) loadFor(rec.res.map(a=>a[0]),()=>{ if(HQ.ph==='sheet') hsRender() }) },
  hqMode(m){ HQ.mode=m;hsRender();scrollTo(0,0) },
  hqRetake(w,ts){ retake(w,ts) },
  hqImg(w,ts,k){ makeImg(w,ts,k) }, hqImgClose:closeImg,
  hqBank(t){ HQ.tab=t;HQ.ph='bank';HQ.msg='';HQ.open={};HQ.fresh=false;hsRender();scrollTo(0,0);
    getBank(ents(HQ.who).map(e=>e.i)).then(()=>{ if(HQ.ph==='bank') hsRender() }).catch(()=>{}) },
  hqWho(w){ HQ.who=w;HQ.open={};hsRender();getBank(ents(w).map(e=>e.i)).then(()=>{ if(HQ.ph==='bank') hsRender() }).catch(()=>{}); if(w==='pe'&&!HQ.pe) sync().then(()=>{ if(HQ.ph==='bank') hsRender() }) },
  hqTog(id){ HQ.open[id]=!HQ.open[id];hsRender() },
  hqWTog(id){ HQ.open[id]=!HQ.open[id]; repaintW() },
  hqPractice(i){ HQ.cu=HSX.list[i].base; HQ.ph='setup'; hsDetailClose(); hqOpen() },
  hqLt(c){ HQ.lt=c===''?[]:HQ.lt.includes(c)?HQ.lt.filter(x=>x!==c):HQ.lt.concat(c).sort(); hsRender() },
  hqPs(p){ HQ.ps=HQ.ps.includes(p)?HQ.ps.filter(x=>x!==p):HQ.ps.concat(p); hsRender() },
  hqCount(){ const e=document.getElementById('hq-cnt'); if(e) e.textContent=cntTxt(); const b=document.querySelector('.hq-cols .card button[onclick="hqStart()"]'); if(b){ const n=poolOf().length; b.disabled=HQ.busy||n<(HQ.cu.trim()?1:3); b.textContent=btnTxt(n); const pn=document.getElementById('hq-pn'); if(pn) pn.innerHTML=poolNote() } },
  async hqFlag(i,k){ const q=qOf(i,k); if(!q||q.bad) return; if(!confirm('回報這題有問題(例如有兩個答案都合理、答案錯誤、句子怪)?\n回報後這題不會再被抽到,之後會自動出新題補上。')) return;
    try{ const j=await post({action:'hsqFlag',user:hsUser(),i,k}); if(j&&j.error) throw new Error(j.error); q.bad=hsUser(); HQ.msg='已回報,謝謝!這題不會再出現。' }catch(e){ HQ.msg='回報失敗:'+e.message } hsRender(); repaintW() },
  hqDrill(){ start((HQ.tab==='hard'?hardL:wrongL)('me')) }
});
const st=document.createElement('style'); st.textContent=`
.hq-top{display:flex;align-items:center;gap:10px;margin:0 0 10px}.hq-top b{font-size:17px}.hq-h{font-size:13px;font-weight:700;color:var(--sub);margin:12px 0 8px}.hq-h:first-child{margin-top:0}
.hs-chip.on{background:color-mix(in srgb,var(--pri-solid) 18%,var(--card));color:var(--pri);border-color:color-mix(in srgb,var(--pri-solid) 55%,var(--line))}
.hq-big2{display:flex;align-items:center;gap:10px;background:var(--bg);border-radius:14px;padding:14px;margin-bottom:8px;cursor:pointer}.hq-big2>div{flex:1}.hq-big2 b{font-size:16px}.hq-big2 .hs-go{color:var(--pri);font-weight:700}
.hq-draft{border-color:var(--pri-solid);margin-bottom:12px}
.hq-play{max-width:760px;margin:10px auto 0}.hq-stk{position:sticky;top:0;z-index:6;background:var(--bg);margin:0 -16px 8px;padding:6px 16px 8px;border-bottom:1px solid var(--line)}
.hq-info{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-weight:700}
.hq-nav{display:flex;flex-wrap:nowrap;overflow-x:auto;gap:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:3px}.hq-nav::-webkit-scrollbar{display:none}.hq-nav button{flex:none;min-width:36px;height:34px;padding:0 6px;border-radius:10px;background:var(--card);color:var(--sub);border:1px solid var(--line);font-weight:700}.hq-nav .a{background:color-mix(in srgb,var(--pri-solid) 20%,var(--card));color:var(--pri);border-color:var(--pri-solid)}.hq-nav .f{box-shadow:inset 0 -3px 0 #e0a100}
.hq-pq,.hq-gq{padding:16px;margin-bottom:12px}.hq-pq.done{border-color:color-mix(in srgb,var(--pri-solid) 50%,var(--line))}
.hq-qh{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px}.hq-qh b{font-size:15px;color:var(--sub)}.hq-qh .hq-fl{margin-left:auto;padding:5px 10px;font-size:13px}.hq-fl.on{color:#c98a00;border-color:#c98a00}
.hq-vd{font-weight:800;font-size:14px}.hq-vd.ok{color:var(--ok)}.hq-vd.bad{color:var(--danger)}
.hq-gq.ok{border-left:4px solid var(--ok)}.hq-gq.bad{border-left:4px solid var(--danger)}
.hq-s{font-size:19px;line-height:1.75;font-family:Georgia,'Times New Roman',serif}.hq-s.sm{font-size:16px}
.hq-bl{display:inline-block;width:5.5em;border-bottom:2px solid var(--text);margin:0 2px}.hq-fill{color:var(--pri);border-bottom:2px solid var(--pri)}
.hq-os{display:grid;gap:8px;margin:12px 0 4px}.hq-o{display:flex;align-items:center;gap:12px;text-align:left;background:var(--card);color:var(--text);border:1px solid var(--line);padding:12px 14px;font-size:17px;border-radius:14px;font-weight:500;white-space:normal}
.hq-o span{flex:none;width:26px;height:26px;border-radius:50%;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--sub)}
.hq-o em{margin-left:auto;font-style:normal;font-size:12px;font-weight:700;opacity:.85;white-space:nowrap}
button.hq-o.sel{border-color:var(--pri-solid);background:color-mix(in srgb,var(--pri-solid) 16%,var(--card))}button.hq-o.sel span{background:var(--pri-solid);color:var(--chip-text);border-color:var(--pri-solid)}
div.hq-o.ok{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 16%,var(--card))}div.hq-o.bad{border-color:var(--danger);background:color-mix(in srgb,var(--danger) 14%,var(--card))}div.hq-o.dim{opacity:.6}
.hq-ans{margin-top:10px}.hq-zh{font-size:15px;color:var(--sub);margin:6px 0 8px;line-height:1.6}.hq-ex{font-size:15px;line-height:1.85}
.hq-big{font-size:54px;font-weight:800;color:var(--pri);line-height:1.1}.hq-big small{font-size:22px;color:var(--sub)}
.hq-r{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:11px 14px;margin-bottom:8px;cursor:pointer}.hq-r.bad{border-left:4px solid var(--danger)}.hq-r.ok{border-left:4px solid var(--ok)}
.hq-rt{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}.hq-rt b{font-size:17px}.hq-sc{font-size:22px!important;color:var(--pri)}.hq-snip{font-size:13px;color:var(--sub);margin-top:3px;font-family:Georgia,serif}.hq-snip .hq-bl{width:3em}
.hq-dt{margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);cursor:default}.hq-opts{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.hq-opts span,.hq-chips span{border:1px solid var(--line);border-radius:99px;padding:2px 11px;font-size:14px}.hq-opts .ok,.hq-chips .ok{border-color:var(--ok);color:var(--ok);font-weight:700}.hq-chips .bad{border-color:var(--danger);color:var(--danger)}.hq-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.hq-ta{height:64px;font:15px/1.5 inherit;font-family:inherit;margin:0 0 4px}.hq-lt{min-width:34px;padding:6px 0;text-align:center}.hq-dim{opacity:.4}.hq-seg{margin:0 0 8px}.hq-seg2{display:flex;flex-wrap:wrap;gap:0 12px}.hq-seg2 .hq-seg{flex:1 1 220px}
.hq-list2{max-width:760px;margin:8px auto 0}
.hq-ov{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.88);display:flex;flex-direction:column}.hq-ovb{display:flex;align-items:center;gap:8px;padding:10px 14px calc(8px) 14px;padding-top:calc(10px + env(safe-area-inset-top));color:#fff;background:rgba(0,0,0,.4)}.hq-ovb b{font-size:16px}.hq-ovb .ghost{color:#fff;border-color:rgba(255,255,255,.4)}
.hq-dl{background:var(--pri-solid);color:var(--chip-text);padding:9px 14px;border-radius:12px;font-weight:700;text-decoration:none;font-size:14px}.hq-ovi{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px}.hq-ovi img{display:block;max-width:100%;margin:0 auto;background:#fff;border-radius:6px}.hq-ovi .meta{color:#c8ccd8}
@media(min-width:900px){.hq-cols{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:16px;align-items:start}.hq-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:10px;align-items:start}.hq-list .hq-r{margin:0}.hq-s{font-size:21px}button.hq-o:hover:not(.sel){border-color:var(--pri-solid)}.hq-stk{margin:0 -32px 8px;padding:8px 32px}}`;
document.head.appendChild(st);
})();
