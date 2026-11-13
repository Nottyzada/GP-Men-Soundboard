'use strict';
const $=id=>document.getElementById(id);
const ctx=new (window.AudioContext||window.webkitAudioContext)();
const master=ctx.createGain();master.connect(ctx.destination);

/* ---------- Armazenamento ---------- */
const DB=(()=>{let db;const open=()=>db?Promise.resolve(db):new Promise((res,rej)=>{
  const r=indexedDB.open('gp-men-soundboard',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('files');
  r.onsuccess=()=>res(db=r.result);r.onerror=()=>rej(r.error)});
  const tx=(m,fn)=>open().then(d=>new Promise((res,rej)=>{const s=d.transaction('files',m).objectStore('files');const q=fn(s);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}));
  return{put:(k,v)=>tx('readwrite',s=>s.put(v,k)),get:k=>tx('readonly',s=>s.get(k)),del:k=>tx('readwrite',s=>s.delete(k))}})();
const LS={get(k,d){try{const v=localStorage.getItem('gpm.'+k);return v===null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('gpm.'+k,JSON.stringify(v))}catch{}}};
const toast=(t)=>{const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2500)};
const fmt=s=>{if(!isFinite(s))s=0;return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0')};
const unlock=()=>{if(ctx.state!=='running')ctx.resume()};
document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);

/* ---------- Master ---------- */
const mv=LS.get('master',100);$('masterVol').value=mv;
const setMaster=v=>{master.gain.value=v/100;$('masterOut').textContent=v+'%'};setMaster(mv);
$('masterVol').oninput=e=>{setMaster(+e.target.value);LS.set('master',+e.target.value)};

/* ---------- Música ---------- */
const audio=new Audio();audio.preload='auto';
const musicGain=ctx.createGain();musicGain.connect(master);
ctx.createMediaElementSource(audio).connect(musicGain);
let musicUrl=null;
const mvol=LS.get('musicVol',70);$('musicVol').value=mvol;
const setMusicVol=v=>{musicGain.gain.value=v/100;$('musicOut').textContent=v+'%'};setMusicVol(mvol);
$('musicVol').oninput=e=>{setMusicVol(+e.target.value);LS.set('musicVol',+e.target.value)};
$('loop').checked=LS.get('loop',false);audio.loop=$('loop').checked;
$('loop').onchange=e=>{audio.loop=e.target.checked;LS.set('loop',e.target.checked)};

function setMusic(blob,name){
  if(musicUrl)URL.revokeObjectURL(musicUrl);
  musicUrl=URL.createObjectURL(blob);audio.src=musicUrl;audio.load();
  $('trackName').textContent=name;
  ['play','pause','stop','seek'].forEach(i=>$(i).disabled=false);
}
$('musicFile').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  await DB.put('music',{blob:f,name:f.name});setMusic(f,f.name);toast('Música carregada e salva');e.target.value='';
};
const playMusic=()=>{if(!audio.src)return;unlock();audio.play().catch(()=>toast('Não foi possível tocar a música'))};
const toggleMusic=()=>{if(!audio.src)return;audio.paused?playMusic():audio.pause()};
const stopMusic=()=>{audio.pause();if(audio.src)audio.currentTime=0};
$('play').onclick=playMusic;$('pause').onclick=()=>audio.pause();$('stop').onclick=stopMusic;
audio.onloadedmetadata=()=>$('dur').textContent=fmt(audio.duration);
let seeking=false;
audio.ontimeupdate=()=>{$('cur').textContent=fmt(audio.currentTime);if(!seeking&&audio.duration)$('seek').value=audio.currentTime/audio.duration*1000;updateStatus()};
$('seek').oninput=()=>{seeking=true;if(audio.duration)audio.currentTime=$('seek').value/1000*audio.duration};
$('seek').onchange=()=>seeking=false;
['play','pause','ended'].forEach(ev=>audio.addEventListener(ev,updateStatus));

/* ---------- Efeitos ---------- */
let fx=LS.get('fx',[]);          // [{id,label,vol}]
const buffers={};                // id -> AudioBuffer
const active={};                 // id -> Set de sources
const saveFx=()=>LS.set('fx',fx);

const streams={};                // arquivos longos: tocam por streaming (evita estourar a memória)
async function decode(id,blob){
  if(blob.size>8e6){
    const el=new Audio();el.preload='auto';el.src=URL.createObjectURL(blob);
    const g=ctx.createGain();ctx.createMediaElementSource(el).connect(g).connect(master);
    ['play','pause','ended'].forEach(ev=>el.addEventListener(ev,()=>{mark(id);updateStatus()}));
    streams[id]={el,g};return;
  }
  buffers[id]=await ctx.decodeAudioData(await blob.arrayBuffer());
}
async function addEffects(files){
  for(const f of files){
    const id='fx'+Date.now()+Math.random().toString(36).slice(2,6);
    try{await decode(id,f)}catch{toast('Arquivo não suportado: '+f.name);continue}
    await DB.put(id,{blob:f,name:f.name});
    fx.push({id,label:f.name.replace(/\.[^.]+$/,''),vol:100});
  }
  saveFx();render();
}
function playFx(id){
  const m=fx.find(x=>x.id===id),st=streams[id];if(!m)return;
  if(st){unlock();st.g.gain.value=m.vol/100;st.el.currentTime=0;st.el.play().catch(()=>{});return}
  const b=buffers[id];if(!b)return;
  unlock();stopFx(id);
  const src=ctx.createBufferSource(),g=ctx.createGain();
  src.buffer=b;src._g=g;g.gain.value=m.vol/100;src.connect(g).connect(master);
  (active[id]=active[id]||new Set()).add(src);
  src.onended=()=>{active[id]?.delete(src);mark(id);updateStatus()};
  src.start();mark(id);updateStatus();
}
function stopFx(id){const st=streams[id];if(st){st.el.pause();st.el.currentTime=0}
  active[id]?.forEach(s=>{try{s.onended=null;s.stop()}catch{}});if(active[id])active[id].clear();mark(id);updateStatus()}
const isPlayingFx=id=>streams[id]?(!streams[id].el.paused&&!streams[id].el.ended):(!!active[id]&&active[id].size>0);
function mark(id){const c=document.querySelector(`[data-id="${id}"]`);if(c)c.classList.toggle('playing',isPlayingFx(id))}

function render(){
  const grid=$('grid');grid.innerHTML='';
  $('empty').style.display=fx.length?'none':'block';
  fx.forEach((m,i)=>{
    const c=document.createElement('div');c.className='card';c.dataset.id=m.id;
    c.innerHTML=`<button class="trig"></button><input type="text" maxlength="40" aria-label="Nome do efeito">
    <label class="vol">Vol <input type="range" min="0" max="100"><output></output></label>
    <div class="mini"><button class="btn st">■ Parar</button><button class="btn x" title="Remover efeito">✕</button></div>`;
    const trig=c.querySelector('.trig'),txt=c.querySelector('input[type=text]'),rng=c.querySelector('input[type=range]'),out=c.querySelector('output');
    const label=()=>{trig.textContent=m.label||'Sem nome';if(i<9){const k=document.createElement('span');k.className='key';k.textContent=i+1;trig.appendChild(k)}};
    label();txt.value=m.label;rng.value=m.vol;out.textContent=m.vol+'%';
    trig.onclick=()=>playFx(m.id);
    txt.oninput=()=>{m.label=txt.value;label();saveFx()};
    rng.oninput=()=>{m.vol=+rng.value;out.textContent=m.vol+'%';saveFx();if(streams[m.id])streams[m.id].g.gain.value=m.vol/100;active[m.id]?.forEach(s=>s._g.gain.value=m.vol/100);};
    c.querySelector('.st').onclick=()=>stopFx(m.id);
    c.querySelector('.x').onclick=async()=>{if(!confirm('Remover "'+m.label+'"?'))return;stopFx(m.id);await DB.del(m.id);delete buffers[m.id];delete streams[m.id];fx=fx.filter(x=>x.id!==m.id);saveFx();render()};
    grid.appendChild(c);mark(m.id);
  });
}
$('fxFile').onchange=async e=>{await addEffects([...e.target.files]);e.target.value='';toast('Efeitos salvos')};

/* ---------- Geral ---------- */
function updateStatus(){
  const n=fx.filter(m=>isPlayingFx(m.id)).length,mus=!audio.paused&&!audio.ended;
  const on=n>0||mus;$('status').classList.toggle('on',on);
  $('statusText').textContent=on?'Tocando'+(n?` · ${n} efeito${n>1?'s':''}`:''):'Parado';
}
function stopAll(){stopMusic();fx.forEach(m=>stopFx(m.id));updateStatus()}
$('stopAll').onclick=stopAll;

document.addEventListener('keydown',e=>{
  const t=e.target,typing=t.isContentEditable||(t.tagName==='TEXTAREA')||(t.tagName==='INPUT'&&!['range','checkbox','file'].includes(t.type));
  if(typing||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)toggleMusic()}
  else if(e.key==='Escape'){e.preventDefault();stopAll()}
  else if(/^[1-9]$/.test(e.key)&&!e.repeat){const m=fx[+e.key-1];if(m)playFx(m.id)}
});

/* ---------- Inicialização ---------- */
/* ---------- Pré-carga (pasta sounds/) ---------- */
async function seed(){
  if(LS.get('seeded',0)>=1)return;
  if(fx.length||await DB.get('music')){LS.set('seeded',1);return}
  try{
    const p=await (await fetch('sounds/preset.json')).json();
    const get=async f=>{const r=await fetch('sounds/'+f);if(!r.ok)throw 0;return r.blob()};
    if(p.music)await DB.put('music',{blob:await get(p.music.file),name:p.music.name});
    for(const e of p.effects||[]){
      const id='fx'+Date.now()+Math.random().toString(36).slice(2,6);
      await DB.put(id,{blob:await get(e.file),name:e.label});
      fx.push({id,label:e.label,vol:100});
    }
    saveFx();LS.set('seeded',1);
  }catch{toast('Pré-carga falhou: abra uma vez com internet')}
}

(async()=>{
  try{
    await seed();
    const m=await DB.get('music');if(m)setMusic(m.blob,m.name);
    const keep=[];
    for(const x of fx){const r=await DB.get(x.id);if(r){try{await decode(x.id,r.blob);keep.push(x)}catch{}}}
    fx=keep;saveFx();
  }catch(err){toast('Erro ao ler arquivos salvos')}
  render();updateStatus();
  navigator.storage?.persist?.();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
