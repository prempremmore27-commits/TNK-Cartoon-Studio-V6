import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Sparkles, Image as ImageIcon, Clapperboard, Download, KeyRound, Film, Users, Smartphone, Save, RefreshCw } from 'lucide-react';
import './style.css';

const DEFAULT_STYLE = 'Traditional 2D Indian cartoon animation style, hand-drawn 2D look, clean bold outlines, cel shading, vibrant natural colors, expressive Indian cartoon characters, consistent face, age, body, clothes and props across every scene. One scene only, no collage, no text, no watermark, NOT 3D, NOT Pixar, NOT realistic.';
function App() {
  const [story,setStory] = useState(localStorage.getItem('tnk_story') || '');
  const [count,setCount] = useState(Number(localStorage.getItem('tnk_count') || 20));
  const [scenes,setScenes] = useState([]);
  const [characters,setCharacters] = useState([]);
  const [title,setTitle] = useState('आपकी कहानी');
  const [busy,setBusy] = useState('');
  const [status,setStatus] = useState('अपनी कहानी लिखकर शुरुआत करें।');
  const [configured,setConfigured] = useState(false);
  const [videoMessage,setVideoMessage] = useState('असली वीडियो इंजन अभी कनेक्ट नहीं है।');
  const [style,setStyle] = useState(DEFAULT_STYLE);
  const [ratio,setRatio] = useState(localStorage.getItem('tnk_ratio') || '16:9');
  const [duration,setDuration] = useState(10);
  useEffect(()=>{
    fetch('/api/health').then(r=>r.json()).then(d=>setConfigured(d.configured)).catch(()=>{});
    fetch('/api/video-status').then(r=>r.json()).then(d=>setVideoMessage(d.message)).catch(()=>{});
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
  },[]);
  useEffect(()=>{localStorage.setItem('tnk_story',story);localStorage.setItem('tnk_count',count);localStorage.setItem('tnk_ratio',ratio);},[story,count,ratio]);
  async function makeScenes(){
    if(!story.trim()){setStatus('पहले पूरी कहानी लिखें।');return;}
    setBusy('scenes');setStatus('AI कहानी को क्रमवार सीन में बाँट रहा है...');
    try{
      const r=await fetch('/api/scenes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({story,count,style})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'सीन नहीं बन पाए।');
      setTitle(d.title||'आपकी कहानी');setCharacters(d.characters||[]);
      setScenes((d.scenes||[]).map(s=>({...s,imageUrl:null,imageBusy:false})));
      setStatus(`${d.scenes?.length||0} सीन तैयार हैं। हर सीन को एडिट कर सकते हैं।`);
    }catch(e){setStatus(e.message);}finally{setBusy('');}
  }
  function updateScene(index,key,value){setScenes(old=>old.map((s,i)=>i===index?{...s,[key]:value}:s));}
  async function makeImage(index){
    const scene=scenes[index];if(!scene)return;
    updateScene(index,'imageBusy',true);setStatus(`सीन ${index+1} की इमेज बन रही है...`);
    try{
      const continuity=characters.map(c=>`${c.name}: ${c.visual_description}`).join('\n');
      const prompt=`${scene.image_prompt}\n\nCHARACTER CONTINUITY:\n${continuity}\n\nVISUAL STYLE: ${style}\nAspect ratio ${ratio}. Create exactly one standalone frame for scene ${index+1}.`;
      const r=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'इमेज नहीं बनी।');
      const url=`data:${d.mimeType};base64,${d.image}`;
      setScenes(old=>old.map((s,i)=>i===index?{...s,imageUrl:url,imageBusy:false}:s));setStatus(`सीन ${index+1} की इमेज तैयार है।`);
    }catch(e){updateScene(index,'imageBusy',false);setStatus(e.message);}
  }
  async function makeAllImages(){for(let i=0;i<scenes.length;i++){if(!scenes[i].imageUrl)await makeImage(i);}}
  function downloadImage(scene,i){if(!scene.imageUrl)return;const a=document.createElement('a');a.href=scene.imageUrl;a.download=`tnk-scene-${String(i+1).padStart(2,'0')}.png`;a.click();}
  function downloadStoryboard(){const blob=new Blob([JSON.stringify({title,ratio,duration,characters,scenes:scenes.map(({imageUrl,imageBusy,...s})=>s)},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tnk-storyboard.json';a.click();URL.revokeObjectURL(a.href);}
  return <div className="app">
    <header className="topbar"><div className="brand"><div className="logo">TNK</div><div><b>TNK CARTOON STUDIO</b><small>Android Edition · V6</small></div></div><div className={`api ${configured?'on':''}`}><span/>{configured?'AI API जुड़ा है':'API key बाकी'}</div></header>
    <main>
      <section className="hero"><div className="eyebrow"><Sparkles size={15}/> YOUR PERSONAL CARTOON MOVIE MAKER</div><h1>कहानी से बनेगी<br/><em>आपकी कार्टून फिल्म।</em></h1><p>हिंदी कहानी से storyboard, character references और अलग-अलग 2D scene images तैयार करें।</p><div className="badges"><span>🎨 Traditional 2D</span><span>🎙️ Hindi Voice Plan</span><span>📱 Android First</span></div></section>
      <section className="panel"><div className="section-title"><span className="icon"><Clapperboard size={19}/></span><div><h2>1. अपनी पूरी कहानी लिखें</h2><p>कहानी के जरूरी संवाद और घटनाएँ न छोड़ें।</p></div></div><textarea value={story} onChange={e=>setStory(e.target.value)} placeholder="यहाँ अपनी पूरी हिंदी कहानी लिखें..." rows="8"/><div className="controls"><label>सीन की संख्या <select value={count} onChange={e=>setCount(Number(e.target.value))}>{[10,15,20,25,30].map(n=><option key={n} value={n}>{n}</option>)}</select></label><button className="primary" onClick={makeScenes} disabled={!!busy}><Sparkles size={17}/>{busy==='scenes'?'सीन बन रहे हैं...':'कहानी से सीन बनाएं'}</button></div></section>
      <section className="panel"><div className="section-title"><span className="icon"><Smartphone size={19}/></span><div><h2>2. फिल्म सेटिंग</h2><p>लंबाई और स्क्रीन फॉर्मेट चुनें।</p></div></div><div className="settings-grid"><label>फिल्म की लंबाई<select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value="10">10 मिनट</option></select></label><label>वीडियो फॉर्मेट<select value={ratio} onChange={e=>setRatio(e.target.value)}><option>16:9</option><option>9:16</option></select></label></div><label className="field-label">2D Animation Style</label><textarea className="stylebox" value={style} onChange={e=>setStyle(e.target.value)} rows="3"/></section>
      {characters.length>0&&<section className="panel"><div className="section-title"><span className="icon"><Users size={19}/></span><div><h2>3. किरदारों की पहचान</h2><p>हर सीन में इन्हीं descriptions का उपयोग होगा।</p></div></div>{characters.map((c,i)=><div className="character" key={i}><b>{c.name}</b><p>{c.visual_description}</p></div>)}</section>}
      {scenes.length>0&&<section className="results"><div className="results-head"><div><div className="eyebrow">YOUR STORYBOARD</div><h2>{title}</h2><p>{scenes.length} सीन · {ratio} · {duration} मिनट लक्ष्य</p></div><div className="head-actions"><button className="secondary" onClick={downloadStoryboard}><Save size={16}/> Storyboard सेव</button><button className="primary" onClick={makeAllImages} disabled={!!busy}><ImageIcon size={17}/> सभी इमेज बनाएं</button></div></div>
        {scenes.map((s,i)=><article className="scene" key={i}><div className="scene-no">SCENE {String(i+1).padStart(2,'0')}</div><div className="scene-content"><input className="scene-heading" value={s.heading||''} onChange={e=>updateScene(i,'heading',e.target.value)} aria-label="Scene heading"/><label>दृश्य विवरण</label><textarea rows="3" value={s.visual||''} onChange={e=>updateScene(i,'visual',e.target.value)}/><label>किरदारों का संवाद</label><textarea rows="2" value={s.dialogue||''} onChange={e=>updateScene(i,'dialogue',e.target.value)}/><label>वॉइस ओवर</label><textarea rows="2" value={s.narration||''} onChange={e=>updateScene(i,'narration',e.target.value)}/><details><summary>इमेज प्रॉम्प्ट एडिट करें</summary><textarea rows="4" value={s.image_prompt||''} onChange={e=>updateScene(i,'image_prompt',e.target.value)}/></details></div><div className="scene-image">{s.imageUrl?<><img src={s.imageUrl} alt={`Scene ${i+1}`}/><button className="download" onClick={()=>downloadImage(s,i)}><Download size={15}/> डाउनलोड इमेज</button><button className="regen" onClick={()=>makeImage(i)}><RefreshCw size={14}/> दोबारा बनाएं</button></>:<div className="placeholder"><ImageIcon size={28}/><span>{s.imageBusy?'इमेज बन रही है...':'इमेज अभी नहीं बनी'}</span><button onClick={()=>makeImage(i)} disabled={s.imageBusy}>{s.imageBusy?'कृपया प्रतीक्षा करें':'इस सीन की इमेज बनाएं'}</button></div>}</div></article>)}
      </section>}
      <section className="panel video-panel"><div className="section-title"><span className="icon"><Film size={19}/></span><div><h2>4. पूरी कार्टून फिल्म बनाएं</h2><p>{videoMessage}</p></div></div><button className="disabled" disabled><Clapperboard size={17}/> AI वीडियो इंजन — अगला विकास चरण</button><small>यह बिल्ड अभी storyboard और scene images बनाता है। असली motion-video generation, अलग-अलग किरदारों की voice synthesis और final MP4 rendering जोड़ना बाकी है। 4K export तभी संभव होगा जब चुना गया video model और server उसे सपोर्ट करें।</small></section>
      <div className="notice"><KeyRound size={16}/><span>API key केवल सर्वर की <b>.env</b> फ़ाइल में रखें। इसे ऐप के किसी सार्वजनिक कोड में न डालें। Free quota और model availability provider के अनुसार बदलते हैं।</span></div>
      <footer>TNK CARTOON STUDIO V6 · Android PWA · Private project</footer>
    </main><div className="status">{status}</div>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
