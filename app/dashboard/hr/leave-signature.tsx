'use client'

import {useEffect,useRef,useState} from 'react'

type Props={label:string;value:string;onChange:(value:string)=>void}

export default function LeaveSignature({label,value,onChange}:Props){
 const canvasRef=useRef<HTMLCanvasElement|null>(null)
 const drawing=useRef(false)
 const [mode,setMode]=useState<'draw'|'type'>('draw')
 const size=()=>{const c=canvasRef.current;if(!c)return;const rect=c.getBoundingClientRect();const ratio=Math.max(1,window.devicePixelRatio||1);const ctx=c.getContext('2d');if(!ctx)return;c.width=Math.max(320,Math.round(rect.width*ratio));c.height=Math.round(150*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#172033';if(value.startsWith('data:image/')){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,rect.width,150);img.src=value}}
 useEffect(()=>{size();const fn=()=>size();window.addEventListener('resize',fn);return()=>window.removeEventListener('resize',fn)},[value])
 const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
 const start=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(mode!=='draw')return;e.preventDefault();drawing.current=true;e.currentTarget.setPointerCapture(e.pointerId);const p=point(e);const ctx=e.currentTarget.getContext('2d');if(ctx){ctx.beginPath();ctx.moveTo(p.x,p.y)}}
 const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!drawing.current||mode!=='draw')return;e.preventDefault();const p=point(e);const ctx=e.currentTarget.getContext('2d');if(ctx){ctx.lineTo(p.x,p.y);ctx.stroke()}}
 const finish=()=>{if(!drawing.current)return;drawing.current=false;const c=canvasRef.current;if(c)onChange(c.toDataURL('image/png'))}
 const clear=()=>{const c=canvasRef.current;if(c){const ctx=c.getContext('2d');if(ctx){ctx.clearRect(0,0,c.width,c.height);ctx.setTransform(1,0,0,1,0,0)}}onChange('')}
 return <div className="signature-field"><div className="signature-head"><strong>{label}</strong><div><button type="button" className={mode==='draw'?'sig-tab active':'sig-tab'} onClick={()=>setMode('draw')}>Draw</button><button type="button" className={mode==='type'?'sig-tab active':'sig-tab'} onClick={()=>setMode('type')}>Type name</button></div></div>{mode==='draw'?<><canvas ref={canvasRef} className="signature-canvas" style={{display:'block',width:'100%',height:150,minHeight:150,border:'2px solid #cbd5e1',borderRadius:10,background:'#fff',touchAction:'none',cursor:'crosshair'}} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onPointerLeave={finish}/><button type="button" className="signature-clear" onClick={clear}>Clear</button></>:<input className="signature-typed" value={value.startsWith('data:image/')?'':value} onChange={e=>onChange(e.target.value)} placeholder="Enter your name as signature"/>}</div>
}
