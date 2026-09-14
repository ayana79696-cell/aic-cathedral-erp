'use client'
import {useEffect} from 'react'

export default function PassportPrintButton(){
 useEffect(()=>{
  const official='/aic-cathedral-official-logo.svg'
  document.querySelectorAll<HTMLImageElement>('img').forEach(img=>{
   if(img.src.includes('cloudinary.com') || img.alt.toLowerCase().includes('aic cathedral school logo')){
    img.src=official
    img.style.objectFit='contain'
    img.style.objectPosition='center'
   }
  })
 },[])
 return <button type="button" className="passport-print" onClick={()=>window.print()}>🖨 Print / Save as PDF</button>
}
