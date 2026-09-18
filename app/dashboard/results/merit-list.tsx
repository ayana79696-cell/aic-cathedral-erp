'use client'
import{useEffect,useMemo,useState}from'react';import{createClient}from'../../../lib/supabase/client';
type R=Record<string,any>;
const nm=(s:R)=>[s.first_name,s.middle_name,s.last_name].filter(Boolean).join(' ');
const gr=(p:number)=>p>=80?['EE',4]:p>=60?['ME',3]:p>=40?['AE',2]:['BE',1];
const classRemark=(n:string,l:string)=>({EE:`${n} has demonstrated excellent progress this term. Continue maintaining this high standard.`,ME:`${n} has made good progress this term. Continue working consistently.`,AE:`${n} is approaching expectations. Continued practice and support will help improve performance.`,BE:`${n} requires focused support and consistent effort to improve performance.`}[l]||'');
const headRemark=(n:string,l:string)=>({EE:`${n} has demonstrated excellent progress. Keep up the good work.`,ME:`${n} is making good progress. Continued effort is encouraged.`,AE:`${n} shows potential. Continued support and effort will help improve performance.`,BE:`${n} needs focused support and consistent effort to improve performance.`}[l]||'');

export default function MeritList({students,marks,exams,areas,classes,streams,role='',assignments=[]}:{students:R[];marks:R[];exams:R[];areas:R[];classes:R[];streams:R[];role?:string;assignments?:R[]}){
 const[exam,setExam]=useState(exams[0]?.id||''),[cls,setCls]=useState(''),[stream,setStream]=useState(''),[remarks,setRemarks]=useState<Record<string,R>>({}),[msg,setMsg]=useState(''),[view,setView]=useState<'merit'|'analysis'>('merit');
 const isClassTeacher=role==='class_teacher',s=createClient();
 const allowed=classes.filter(c=>!isClassTeacher||assignments.some(a=>a.class_id===c.id));
 const classSt=students.filter(x=>x.class_id===cls);
 const selectedExam=exams.find(e=>e.id===exam);
 const prevExam=useMemo(()=>{if(!selectedExam?.start_date)return null;return exams.filter(e=>e.id!==exam&&e.start_date&&new Date(e.start_date)<new Date(selectedExam.start_date)).sort((a,b)=>new Date(b.start_date).getTime()-new Date(a.start_date).getTime())[0]||null},[exams,exam,selectedExam]);

 const rows=useMemo(()=>classSt.map(st=>{const ms=marks.filter(m=>m.student_id===st.id&&m.exam_id===exam);const normal=ms.filter(m=>!['X','Y'].includes(m.achievement_level)&&m.marks!=null);const avg=normal.length?normal.reduce((a,m)=>a+Number(m.marks)/Number(m.max_marks||100)*100,0)/normal.length:null;const points=normal.reduce((a,m)=>a+Number(gr(Number(m.marks)/Number(m.max_marks||100)*100)[1]),0);const special=ms.find(m=>m.achievement_level==='X'||m.achievement_level==='Y');return{st,ms,avg,points,special}}),[classSt,marks,exam]);

 useEffect(()=>{if(!exam||!cls)return; s.from('result_remarks').select('*').eq('exam_id',exam).eq('class_id',cls).then(({data})=>setRemarks(Object.fromEntries((data||[]).map(x=>[x.student_id,x]))))},[exam,cls]);

 const ranked=rows.filter(r=>r.avg!==null&&!r.special).sort((a,b)=>(b.avg||0)-(a.avg||0)||b.points-a.points);
 const filteredRanked=ranked.filter(r=>!stream||r.st.stream_id===stream);
 const visible=filteredRanked;
 const cp=new Map(ranked.map((r,i)=>[r.st.id,i+1])),sp=new Map(filteredRanked.map((r,i)=>[r.st.id,i+1]));
 const positionFor=(id:string)=>stream?(sp.get(id)||'—'):(cp.get(id)||'—');

 const avgFor=(eid:string,cid:string,sid?:string)=>{const ids=students.filter(x=>x.class_id===cid&&(!sid||x.stream_id===sid)).map(x=>x.id);const vals=ids.map(id=>{const ms=marks.filter(m=>m.student_id===id&&m.exam_id===eid&&!['X','Y'].includes(m.achievement_level)&&m.marks!=null);return ms.length?ms.reduce((a,m)=>a+Number(m.marks)/Number(m.max_marks||100)*100,0)/ms.length:null}).filter((x):x is number=>x!==null);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null};

 const gradeAnalysis=useMemo(()=>allowed.map(c=>{const now=avgFor(exam,c.id),prev=prevExam?avgFor(prevExam.id,c.id):null;const learnerRows=students.filter(x=>x.class_id===c.id).map(st=>{const ms=marks.filter(m=>m.student_id===st.id&&m.exam_id===exam&&!['X','Y'].includes(m.achievement_level)&&m.marks!=null);return ms.length?ms.reduce((a,m)=>a+Number(m.marks)/Number(m.max_marks||100)*100,0)/ms.length:null}).filter((x):x is number=>x!==null);const levels=['EE','ME','AE','BE'].map(l=>learnerRows.filter(a=>gr(a)[0]===l).length);return{c,now,prev,change:now!==null&&prev!==null?now-prev:null,count:learnerRows.length,levels}}),[allowed,students,marks,exam,prevExam]);

 const schoolMean=useMemo(()=>{const vals=students.map(st=>{const ms=marks.filter(m=>m.student_id===st.id&&m.exam_id===exam&&!['X','Y'].includes(m.achievement_level)&&m.marks!=null);return ms.length?ms.reduce((a,m)=>a+Number(m.marks)/Number(m.max_marks||100)*100,0)/ms.length:null}).filter((x):x is number=>x!==null);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null},[students,marks,exam]);
 const distribution=useMemo(()=>{const out={EE:0,ME:0,AE:0,BE:0};students.forEach(st=>{const ms=marks.filter(m=>m.student_id===st.id&&m.exam_id===exam&&!['X','Y'].includes(m.achievement_level)&&m.marks!=null);if(ms.length){const a=ms.reduce((z,m)=>z+Number(m.marks)/Number(m.max_marks||100)*100,0)/ms.length;(out as any)[gr(a)[0]]++}});return out},[students,marks,exam]);
 const totalDistribution=distribution.EE+distribution.ME+distribution.AE+distribution.BE;
 const donutStops=(()=>{if(!totalDistribution)return 'conic-gradient(#e8dfda 0 100%)';const ee=distribution.EE/totalDistribution*100,me=distribution.ME/totalDistribution*100,ae=distribution.AE/totalDistribution*100;return `conic-gradient(#5b0f22 0 ${ee}%,#d9b45b ${ee}% ${ee+me}%,#8aa6b8 ${ee+me}% ${ee+me+ae}%,#d9d1cb ${ee+me+ae}% 100%)`})();
 const trendGrades=gradeAnalysis.filter(x=>x.change!==null).slice(0,5);
 const linePoints=(key:'now'|'prev')=>{const data=trendGrades.map(x=>x[key]).filter((x):x is number=>x!==null);if(!data.length)return '';const max=Math.max(100,...data),min=Math.min(0,...data);return data.map((v,i)=>`${(i/(Math.max(1,data.length-1)))*96+2},${140-((v-min)/Math.max(1,max-min))*120}`).join(' ')};
 const selectedAreaAnalysis=useMemo(()=>areas.map(a=>{const vals=classSt.map(st=>{const m=marks.find(x=>x.student_id===st.id&&x.exam_id===exam&&x.learning_area_id===a.id&&x.marks!=null&&!['X','Y'].includes(x.achievement_level));return m?Number(m.marks)/Number(m.max_marks||100)*100:null}).filter((x):x is number=>x!==null);return{id:a.id,name:a.name,avg:vals.length?vals.reduce((x,y)=>x+y,0)/vals.length:null}}).filter(x=>x.avg!==null).sort((a,b)=>(b.avg||0)-(a.avg||0)).slice(0,8),[areas,classSt,marks,exam]);
 const streamAnalysis=streams.filter(x=>x.class_id===cls).map(st=>({name:st.name,avg:avgFor(exam,cls,st.id),prev:prevExam?avgFor(prevExam.id,cls,st.id):null}));

 const generateRemarks=async()=>{if(!exam||!cls)return;setMsg('');const uid=(await s.auth.getUser()).data.user?.id;if(!uid)return;for(const r of visible){if(r.avg===null)continue;const l=String(gr(r.avg)[0]);const p={student_id:r.st.id,exam_id:exam,class_id:cls,stream_id:r.st.stream_id||null,class_teacher_remark:classRemark(nm(r.st),l),headteacher_remark:headRemark(nm(r.st),l),class_teacher_id:isClassTeacher?uid:null,updated_at:new Date().toISOString()};const existing=remarks[r.st.id];const q=existing?await s.from('result_remarks').update(p).eq('id',existing.id):await s.from('result_remarks').insert(p);if(q.error){setMsg(q.error.message);return}}setMsg('Class Teacher and Headteacher remarks generated automatically from each learner’s overall result.');const{data}=await s.from('result_remarks').select('*').eq('exam_id',exam).eq('class_id',cls);setRemarks(Object.fromEntries((data||[]).map(x=>[x.student_id,x])))};

 const levelTotal=(i:number)=>gradeAnalysis.reduce((a,x)=>a+x.levels[i],0);
 const pct=(n:number)=>totalDistribution?Math.round(n/totalDistribution*100):0;

 return <section className="card">
  <div className="no-print" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
   <h2 style={{marginRight:'auto'}}>Results, Remarks & Merit List</h2>
   <select value={exam} onChange={e=>setExam(e.target.value)}><option value="">Exam</option>{exams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
   <select value={cls} onChange={e=>{setCls(e.target.value);setStream('')}}><option value="">Grade/Class</option>{allowed.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
   <select value={stream} onChange={e=>setStream(e.target.value)}><option value="">All streams</option>{streams.filter(x=>x.class_id===cls).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
   <button className="btn" onClick={generateRemarks} disabled={!exam||!cls}>Generate remarks</button>
   <button className="btn" onClick={()=>window.print()} disabled={!exam||!cls}>Print class merit list</button>
   <button className="btn" onClick={()=>setView(view==='merit'?'analysis':'merit')}>{view==='merit'?'Whole school exam analysis':'Class merit list'}</button>
  </div>
  {msg&&<div className="notice" style={{marginTop:12}}>{msg}</div>}

  <div className="no-print analysis-shell" style={{display:view==='analysis'?'block':'none',marginTop:14}}>
   <div className="analysis-hero"><div><span className="eyebrow">AIC CATHEDRAL COMPREHENSIVE SCHOOL</span><h1>Merit List & Results Analysis</h1><p>{selectedExam?.name||'Select an examination'} {prevExam?<>vs <strong>{prevExam.name}</strong></>:<> · Academic performance overview</>}</p></div><div className="hero-ring"><span>{gradeAnalysis.length}</span><small>GRADES</small></div></div>

   <div className="stat-grid">
    {[['Total learners',students.length],['Assessed learners',totalDistribution],['School mean',schoolMean===null?'—':schoolMean.toFixed(1)+'%'],['Grades improved',gradeAnalysis.filter(x=>(x.change||0)>0).length],['Grades analysed',gradeAnalysis.length]].map(([l,v],i)=><div className="stat-card" key={i}><span>{l}</span><strong>{v}</strong></div>)}
   </div>

   <div className="analysis-grid">
    <div className="chart-card"><div className="chart-title"><h3>Grade Performance Overview</h3><span>Current vs previous mean</span></div><div className="bar-legend"><span><i/>Current</span><span><i className="previous"/>Previous</span></div>
     {gradeAnalysis.map(x=><div className="grouped-bar" key={x.c.id}><label>{x.c.name}</label><div className="dual-bars"><div className="mini-track"><div className="mini-fill current" style={{width:`${Math.min(100,Math.max(0,x.now||0))}%`}}/></div><div className="mini-track"><div className="mini-fill previous" style={{width:`${Math.min(100,Math.max(0,x.prev||0))}%`}}/></div></div><em>{x.change===null?'—':(x.change>0?'+':'')+x.change.toFixed(1)+'%'}</em></div>)}
    </div>
    <div className="chart-card"><div className="chart-title"><h3>CBC Performance Distribution</h3><span>All assessed learners</span></div><div className="donut-wrap"><div className="donut" style={{background:donutStops}}><div className="donut-center"><b>{totalDistribution}</b><span>Learners</span></div></div><div className="level-list">{['EE','ME','AE','BE'].map((l,i)=>{const n=levelTotal(i);return <div className={`level-row level-${l.toLowerCase()}`} key={l}><span className="level-dot"/><b>{l}</b><div className="track"><div className="fill" style={{width:pct(n)+'%'}}/></div><strong>{n}</strong></div>})}</div></div></div>
    <div className="chart-card growth-card"><div className="chart-title"><h3>Growth / Decrease by Grade</h3><span>Difference from previous examination</span></div><div className="growth-list">{gradeAnalysis.map(x=><div className="growth-item" key={x.c.id}><span className="grade">{x.c.name}</span><div className="growth-value"><strong className={x.change===null?'flat':x.change>0?'up':x.change<0?'down':'flat'}>{x.change===null?'—':(x.change>0?'↗ +':x.change<0?'↘ ':'→ ')+x.change.toFixed(1)+' pp'}</strong></div><small>{x.change===null?'No previous result available':x.change>0?'Increase in mean performance':x.change<0?'Decrease in mean performance':'No change in mean'}</small></div>)}</div></div>
    <div className="chart-card" style={{gridColumn:'1/-1'}}><div className="chart-title"><h3>Previous Exam Comparison</h3><span>Grade trend</span></div><div className="line-chart">{trendGrades.length?<><svg viewBox="0 0 100 150" preserveAspectRatio="none"><line className="line-grid" x1="2" y1="20" x2="98" y2="20"/><line className="line-grid" x1="2" y1="80" x2="98" y2="80"/><line className="line-grid" x1="2" y1="140" x2="98" y2="140"/><polyline className="line-previous" points={linePoints('prev')}/><polyline className="line-current" points={linePoints('now')}/>{trendGrades.map((x,i)=>{const y=140-(((x.now||0)-(Math.min(0,...trendGrades.map(z=>z.now||0))))/Math.max(1,Math.max(100,...trendGrades.map(z=>z.now||0))-Math.min(0,...trendGrades.map(z=>z.now||0))))*120;const xx=(i/(Math.max(1,trendGrades.length-1)))*96+2;return <circle className="line-point" key={x.c.id} cx={xx} cy={y} r="2.2"/>})}</svg><div className="line-labels">{trendGrades.map(x=><span key={x.c.id}>{x.c.name}</span>)}</div></>:<div className="muted" style={{padding:45,textAlign:'center'}}>A previous examination is required to draw the comparison trend.</div>}</div></div>
   </div>

   <div className="chart-card detail-card"><div className="chart-title"><h3>Grade-by-Grade Analysis</h3><span>Current, previous, change and CBC levels</span></div><div className="analysis-table-wrap"><table className="analysis-table"><thead><tr><th>Grade</th><th>Assessed</th><th>Current</th><th>Previous</th><th>Change</th><th>EE</th><th>ME</th><th>AE</th><th>BE</th><th>Trend</th></tr></thead><tbody>{gradeAnalysis.map(x=><tr key={x.c.id}><td><strong>{x.c.name}</strong></td><td>{x.count}</td><td>{x.now===null?'—':x.now.toFixed(1)+'%'}</td><td>{x.prev===null?'—':x.prev.toFixed(1)+'%'}</td><td>{x.change===null?'—':(x.change>0?'+':'')+x.change.toFixed(1)+' pp'}</td>{x.levels.map((n,i)=><td key={i}>{n}</td>)}<td><span className={`trend-pill ${x.change===null?'trend-flat':x.change>0?'trend-up':x.change<0?'trend-down':'trend-flat'}`}>{x.change===null?'—':x.change>0?'↗ Increase':x.change<0?'↘ Decrease':'→ Stable'}</span> <span className="spark">{[1,2,3,4,5].map((n,i)=><i key={i}/>)}</span></td></tr>)}</tbody></table></div></div>

   <div className="learning-grid">
    <div className="chart-card"><div className="chart-title"><h3>Learning Area Analysis</h3><span>{cls?classes.find(x=>x.id===cls)?.name:'Selected class'}</span></div><div className="area-bars">{selectedAreaAnalysis.length?selectedAreaAnalysis.map(x=><div className="area-row" key={x.id}><label>{x.name}</label><div className="track"><div className="fill" style={{width:`${Math.min(100,Math.max(0,x.avg||0))}%`}}/></div><b>{x.avg?.toFixed(1)}%</b></div>):<span className="muted">Select a grade/class to analyse learning areas.</span>}</div></div>
    <div className="chart-card"><div className="chart-title"><h3>Stream Analysis</h3><span>{cls?classes.find(x=>x.id===cls)?.name:'Selected class'}</span></div><div className="stream-grid">{streamAnalysis.length?streamAnalysis.map(x=><div className="stream-box" key={x.name}><h4>{x.name}</h4><div className="stream-mean">{x.avg===null?'—':x.avg.toFixed(1)+'%'}</div><small>{x.prev===null?'No previous result':`Previous: ${x.prev.toFixed(1)}%`}</small></div>):<span className="muted">Select a grade/class to compare streams.</span>}</div></div>
   </div>

   <div className="quick-actions"><button className="btn" onClick={()=>setView('merit')}>View Class Merit List</button><button className="btn" onClick={()=>window.print()} disabled={!exam||!cls}>Print Merit List</button><button className="btn" onClick={generateRemarks} disabled={!exam||!cls}>Generate Remarks</button></div>
  </div>

  <div style={{display:view==='analysis'?'none':'block'}}><div style={{overflowX:'auto',marginTop:12}}><table className="prototype-table"><thead><tr><th>Pos.</th><th>ADM NO</th><th>LEARNER</th>{areas.map(a=><th key={a.id}>{a.name}</th>)}<th>Points</th><th>Average</th><th>Level</th></tr></thead><tbody>{visible.length?visible.map(r=>{const l=r.special?.achievement_level??(r.avg===null?'—':String(gr(r.avg)[0]));return <tr key={r.st.id}><td>{r.special?'—':positionFor(r.st.id)}</td><td>{r.st.admission_number}</td><td><strong>{nm(r.st)}</strong></td>{areas.map(a=>{const m=r.ms.find(x=>x.learning_area_id===a.id);return <td key={a.id}>{m?.achievement_level==='X'||m?.achievement_level==='Y'?m.achievement_level:m?.marks??'—'}</td>})}<td>{r.special?'—':r.points}</td><td>{r.avg===null?'—':r.avg.toFixed(1)+'%'}</td><td>{l}</td></tr>}) : <tr><td colSpan={areas.length+7} className="muted" style={{padding:30,textAlign:'center'}}>Select an exam and grade/class.</td></tr>}</tbody></table></div></div>

  <div style={{marginTop:14}}>{visible.filter(r=>r.avg!==null).map(r=>{const l=String(gr(r.avg||0)[0]),rm=remarks[r.st.id];return <div key={r.st.id} style={{borderTop:'1px solid #e5e7eb',padding:'14px 0'}}><strong>{nm(r.st)}</strong><div className="muted"><b>Class Teacher:</b> {rm?.class_teacher_remark||classRemark(nm(r.st),l)}</div><div className="muted"><b>Headteacher:</b> {rm?.headteacher_remark||headRemark(nm(r.st),l)}</div></div>})}</div>
  <p className="muted" style={{marginTop:10}}>All remarks are generated from the learner’s actual performance and can be regenerated when results change.</p>
 </section>
}
