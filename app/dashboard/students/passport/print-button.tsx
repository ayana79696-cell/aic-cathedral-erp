'use client'
import{useEffect}from'react'
import{createClient}from'../../../../lib/supabase/client'

export default function PassportPrintButton(){
 useEffect(()=>{
  let style:HTMLStyleElement|undefined
  const load=async()=>{
   let official=''
   try{const sb=createClient();const{data}=await sb.from('school_settings').select('logo_url').maybeSingle();official=data?.logo_url||''}catch{}
   const fixLogo=()=>document.querySelectorAll<HTMLImageElement>('img').forEach(img=>{const alt=(img.getAttribute('alt')||'').toLowerCase();if(alt.includes('aic cathedral')||alt.includes('school logo')){if(official){img.src=official;img.style.objectFit='contain';img.style.objectPosition='center';img.style.display='block'}else{img.removeAttribute('src');img.style.objectFit='contain';img.style.objectPosition='center';img.style.display='block';img.style.background='#fff';img.style.border='1px dashed #d3a62a'}}})
   fixLogo()
   style=document.createElement('style');style.id='passport-mobile-style';style.textContent=`
   @media(max-width:600px){
    .learner-passport{width:100%!important;max-width:100%!important;box-sizing:border-box!important;padding-left:10px!important;padding-right:10px!important;overflow-x:hidden!important}
    .learner-passport .lp-hero{padding:16px!important;border-radius:18px!important}
    .learner-passport .lp-brand{gap:10px!important;align-items:flex-start!important}
    .learner-passport .lp-brand img{width:64px!important;height:64px!important;flex:0 0 64px!important;padding:5px!important}
    .learner-passport .lp-brand h2{font-size:18px!important;word-break:break-word!important}
    .learner-passport .lp-brand p{font-size:10px!important;overflow-wrap:anywhere!important}
    .learner-passport .lp-tag{font-size:8px!important;margin-top:12px!important;padding:7px 10px!important}
    .learner-passport .lp-card{padding:14px!important;border-radius:18px!important}
    .learner-passport .lp-photo{width:min(150px,100%)!important;margin:0 auto!important}
    .learner-passport .lp-name{font-size:25px!important;overflow-wrap:anywhere!important}
    .learner-passport .lp-code{font-size:9px!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important}
    .learner-passport .lp-section{margin-top:18px!important;padding-top:15px!important}
    .learner-passport .lp-section h2{font-size:17px!important}
    .learner-passport .print-id-sheet{display:none!important}
   }
   @media print{
    @page{size:A4 portrait;margin:10mm}
    html,body{background:#fff!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    body *{visibility:hidden!important}
    .learner-passport,.learner-passport *{visibility:visible!important}
    .learner-passport{position:static!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:#fff!important}
    .learner-passport .lp-top,.learner-passport .lp-layout>aside,.learner-passport .lp-actions,.learner-passport .print-id-sheet,.learner-passport .passport-print,.learner-passport button{display:none!important}
    .learner-passport .lp-layout{display:block!important;margin:0!important}
    .learner-passport .lp-layout>section{display:block!important;width:100%!important}
    .learner-passport .lp-hero{display:block!important;margin:0 0 6mm!important;border-radius:5mm!important;box-shadow:none!important;break-inside:avoid!important}
    .learner-passport .lp-card{display:block!important;margin:0!important;width:100%!important;box-sizing:border-box!important;border:1px solid #d9e0e8!important;border-radius:5mm!important;box-shadow:none!important;break-inside:auto!important}
    .learner-passport .lp-profile{break-inside:avoid!important}
    .learner-passport .lp-section{break-inside:avoid!important}
    .learner-passport .lp-signature{break-inside:avoid!important}
   }
   `;document.head.appendChild(style)
   const observer=new MutationObserver(fixLogo);observer.observe(document.body,{subtree:true,childList:true})
   return()=>{observer.disconnect();style?.remove()}
  }
  load()
 },[])
 return <button type="button" className="passport-print" onClick={()=>window.print()}>🖨 Print / Download Digital Passport</button>
}
