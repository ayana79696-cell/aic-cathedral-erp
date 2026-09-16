'use client'

import {useEffect,useRef,useState} from 'react'

export default function LeaveSignature({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
 const canvasRef=useRef<HTMLCanvasElement|null>(null)
 const drawing=useRef(false)
 const [mode,setMode]=useState<'draw'|'type'>('draw')
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return
  const rect=canvas.getBoundingClientRect();const ratio=window.devicePixelRatio||1
  canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.round(130*ratio)
  const ctx=canvas.getContext('2d');if(!ctx)return
  ctx.scale(ratio,ratio);ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#172033'
  if(value.startsWith('data:image/')){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,rect.width,130);img.src=value}
 },[value])
 const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
 const start=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(mode!=='draw')return;drawing.current=true;e.currentTarget.setPointerCapture(e.pointerId);const p=point(e);const ctx=e.currentTarget.getContext('2d');ctx?.beginPath();ctx?.moveTo(p.x,p.y)}
 const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!drawing.current||mode!=='draw')return;const p=point(e);const ctx=e.currentTarget.getContext('2d');if(!ctx)return;ctx.lineTo(p.x,p.y);ctx.stroke()}
 const finish=()=>{if(!drawing.current)return;drawing.current=false;const c=canvasRef.current;if(c)onChange(c.toDataURL('image/png'))}
 const clear=()=>{const c=canvasRef.current;if(c){const ctx=c.getContext('2d');ctx?.clearRect(0,0,c.width,c.height)}onChange('')}
 return <div className="signature-field"><div className="signature-head"><strong>{label}</strong><div><button type="button" className={mode==='draw'?'sig-tab active':'sig-tab'} onClick={()=>setMode('draw')}>Draw</button><button type="button" className={mode==='type'?'sig-tab active':'sig-tab'} onClick={()=>setMode('type')}>Type name</button></div></div>{mode==='draw'?<><canvas ref={canvasRef} className="signature-canvas" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}/><button type="button" className="signature-clear" onClick={clear}>Clear</button></>:<input className="signature-typed" value={value.startsWith('data:image/')?'':value} onChange={e=>onChange(e.target.value)} placeholder="Enter your name as signature"/>}</div>
}
