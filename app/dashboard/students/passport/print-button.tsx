'use client'
import {useEffect} from 'react'

export default function PassportPrintButton(){
 useEffect(()=>{
  const official='https://res.cloudinary.com/c4bk5bio/image/upload/v1789404523/aic-cathedral/branding/aic-cathedral-official-logo.svg'
  const fixLogo=()=>{
   document.querySelectorAll<HTMLImageElement>('img').forEach(img=>{
    const src=img.getAttribute('src')||''
    const alt=(img.getAttribute('alt')||'').toLowerCase()
    if(src.includes('cloudinary.com') || alt.includes('aic cathedral school logo')){
     if(src!==official) img.src=official
     img.style.objectFit='contain'
     img.style.objectPosition='center'
     img.style.display='block'
     img.onerror=()=>{img.src=official}
    }
   })
  }
  fixLogo()
  const observer=new MutationObserver(fixLogo)
  observer.observe(document.body,{subtree:true,childList:true})
  return()=>observer.disconnect()
 },[])
 return <button type="button" className="passport-print" onClick={()=>window.print()}>🖨 Print / Save as PDF</button>
}
