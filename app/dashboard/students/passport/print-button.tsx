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
    .learner-passport .print-id-sheet{display:block!important;margin-top:18px!important;width:100%!important;overflow:hidden!important}
    .learner-passport .print-sheet{width:100%!important;min-height:0!important;height:auto!important;display:flex!important;gap:14px!important;align-items:center!important;justify-content:flex-start!important;padding:0 2px 18px!important;box-sizing:border-box!important}
    .learner-passport .print-sheet .id-card{width:min(85.6mm,100%)!important;height:53.98mm!important;flex:0 0 auto!important;transform:none!important;box-shadow:0 8px 22px #12243d20!important}
    .learner-passport .mobile-id-title{display:block!important;text-align:center!important;font-size:12px!important;font-weight:900!important;color:#650b18!important;margin:0 0 10px!important}
   }
   @media(min-width:601px){.learner-passport .mobile-id-title{display:none!important}}
   @media print{.learner-passport .mobile-id-title{display:none!important}}
   `;document.head.appendChild(style)
   const observer=new MutationObserver(fixLogo);observer.observe(document.body,{subtree:true,childList:true})
   return()=>{observer.disconnect();style?.remove()}
  }
  load()
 },[])
 return <button type="button" className="passport-print" onClick={()=>window.print()}>🖨 Print / Save as PDF</button>
}
