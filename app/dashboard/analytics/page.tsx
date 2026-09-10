import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

type Row = Record<string, any>

const money = (n: number) => `KES ${Math.round(n).toLocaleString('en-KE')}`
const pct = (n: number) => `${Math.round(n)}%`
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n))

function Bar({ value, label }: { value: number; label: string }) {
  const v = clamp(value)
  return <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, marginBottom: 5 }}><span>{label}</span><strong>{pct(v)}</strong></div>
    <div style={{ height: 9, background: '#e8edf4', borderRadius: 999, overflow: 'hidden' }}><div style={{ width: `${v}%`, height: '100%', background: 'linear-gradient(90deg,#0757a6,#1674c9)', borderRadius: 999 }} /></div>
  </div>
}

function Stat({ title, value, note }: { title: string; value: string | number; note?: string }) {
  return <div className="card"><div className="muted">{title}</div><div className="number" style={{ fontSize: 25 }}>{value}</div>{note && <div className="muted" style={{ marginTop: 6 }}>{note}</div>}</div>
}

export default async function AnalyticsPage() {
  const s = await createClient()
  const [studentsRes, classesRes, streamsRes, staffRes, feesRes, paymentsRes, marksRes, attendanceRes, yearsRes] = await Promise.all([
    s.from('students').select('id,admission_number,first_name,last_name,class_id,stream_id,status,admission_date,created_at').order('created_at'),
    s.from('classes').select('id,name').eq('status','active').order('name'),
    s.from('streams').select('id,name,class_id').eq('status','active').order('name'),
    s.from('staff').select('id,created_at,status').order('created_at'),
    s.from('fee_accounts').select('id,student_id,academic_year_id,term_id,amount_due,amount_paid,created_at'),
    s.from('fee_payments').select('id,student_id,fee_account_id,amount,paid_at,created_at'),
    s.from('marks').select('id,student_id,class_id,learning_area_id,exam_id,marks,max_marks,status,created_at,exams(name,term_id,academic_year_id),learning_areas(name)'),
    s.from('attendance_records').select('id,student_id,attendance_date,status'),
    s.from('academic_years').select('id,year,status,is_current').order('year',{ascending:false})
  ])

  const students = (studentsRes.data || []) as Row[]
  const classes = (classesRes.data || []) as Row[]
  const streams = (streamsRes.data || []) as Row[]
  const staff = (staffRes.data || []) as Row[]
  const fees = (feesRes.data || []) as Row[]
  const payments = (paymentsRes.data || []) as Row[]
  const marks = (marksRes.data || []) as Row[]
  const attendance = (attendanceRes.data || []) as Row[]
  const years = (yearsRes.data || []) as Row[]

  const classMap = new Map(classes.map(x => [x.id, x.name]))
  const streamMap = new Map(streams.map(x => [x.id, x.name]))
  const currentYear = years.find(x => x.is_current) || years.find(x => x.status === 'active') || years[0]
  const currentYearId = currentYear?.id

  const activeStudents = students.filter(x => x.status === 'active')
  const activeStaff = staff.filter(x => x.status === 'active')
  const yearFees = fees.filter(x => !currentYearId || x.academic_year_id === currentYearId)
  const yearPayments = payments.filter(x => {
    if (!currentYear?.year) return true
    const d = new Date(x.paid_at || x.created_at)
    return d.getFullYear() === Number(currentYear.year)
  })
  const expected = yearFees.reduce((a,x) => a + Number(x.amount_due || 0), 0)
  const collected = yearPayments.reduce((a,x) => a + Number(x.amount || 0), 0)
  const outstanding = Math.max(expected - collected, 0)
  const collectionRate = expected ? clamp(collected / expected * 100) : 0

  const validMarks = marks.filter(x => Number(x.max_marks || 0) > 0 && x.status !== 'draft')
  const academicAverage = validMarks.length ? validMarks.reduce((a,x) => a + Number(x.marks || 0) / Number(x.max_marks) * 100, 0) / validMarks.length : 0

  const attendanceCount = attendance.length
  const presentCount = attendance.filter(x => ['present','late'].includes(String(x.status).toLowerCase())).length
  const attendanceRate = attendanceCount ? presentCount / attendanceCount * 100 : 0

  const availableScores = [expected > 0 ? collectionRate : null, validMarks.length ? academicAverage : null, attendanceCount ? attendanceRate : null].filter((x): x is number => x !== null)
  const healthScore = availableScores.length ? Math.round(availableScores.reduce((a,b)=>a+b,0) / availableScores.length) : 0
  const healthLabel = healthScore >= 80 ? 'Strong' : healthScore >= 60 ? 'Stable' : healthScore >= 40 ? 'Needs attention' : 'Insufficient data'

  const classPerformance = new Map<string, { total:number; max:number }>()
  validMarks.forEach(m => {
    const key = m.class_id || 'unassigned'
    const x = classPerformance.get(key) || { total:0, max:0 }
    x.total += Number(m.marks || 0); x.max += Number(m.max_marks || 0); classPerformance.set(key,x)
  })
  const classRows = Array.from(classPerformance.entries()).map(([id,x]) => ({ name: classMap.get(id) || 'Unassigned', score: x.max ? x.total/x.max*100 : 0 })).sort((a,b)=>b.score-a.score).slice(0,8)

  const areaPerformance = new Map<string, { total:number; max:number }>()
  validMarks.forEach(m => {
    const key = m.learning_area_id || 'unassigned'
    const x = areaPerformance.get(key) || { total:0, max:0 }
    x.total += Number(m.marks || 0); x.max += Number(m.max_marks || 0); areaPerformance.set(key,x)
  })
  const areaRows = Array.from(areaPerformance.entries()).map(([id,x]) => ({ name: (validMarks.find(m=>m.learning_area_id===id)?.learning_areas?.name) || 'Learning area', score: x.max ? x.total/x.max*100 : 0 })).sort((a,b)=>b.score-a.score).slice(0,8)

  const termPerformance = new Map<string,{total:number;max:number}>()
  validMarks.forEach(m => {
    const term = m.exams?.term_id || 'unknown'
    const x = termPerformance.get(term) || {total:0,max:0}
    x.total += Number(m.marks||0); x.max += Number(m.max_marks||0); termPerformance.set(term,x)
  })
  const termRows = Array.from(termPerformance.entries()).map(([term,x],i)=>({name:`Term ${i+1}`,score:x.max?x.total/x.max*100:0})).slice(0,6)

  const admissionsByYear = new Map<number,number>()
  students.forEach(x => { const d = new Date(x.admission_date || x.created_at); const y = d.getFullYear(); if (Number.isFinite(y)) admissionsByYear.set(y,(admissionsByYear.get(y)||0)+1) })
  const growthRows = Array.from(admissionsByYear.entries()).sort((a,b)=>a[0]-b[0]).slice(-8)
  const maxGrowth = Math.max(...growthRows.map(x=>x[1]),1)

  const classEnrollment = new Map<string,number>()
  activeStudents.forEach(x => { const key = x.class_id || 'unassigned'; classEnrollment.set(key,(classEnrollment.get(key)||0)+1) })
  const enrollmentRows = Array.from(classEnrollment.entries()).map(([id,count])=>({name:classMap.get(id)||'Unassigned',count})).sort((a,b)=>b.count-a.count).slice(0,8)

  const lastUpdated = new Date().toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})

  return <main className="main">
    <header className="top"><div><h1>School Intelligence & Analysis</h1><p className="muted">Live management analysis from the ERP records. Current academic year: {currentYear?.year || 'Not set'}.</p></div><Link href="/dashboard/reports" className="side-item" style={{background:'#fff',color:'#0757a6',border:'1px solid #d9e3ef',textDecoration:'none'}}>Open Reports</Link></header>

    <section className="cards">
      <Stat title="Active learners" value={activeStudents.length} note="Current enrollment" />
      <Stat title="Active staff" value={activeStaff.length} note="Current workforce" />
      <Stat title="Fees expected" value={money(expected)} note="Current academic year" />
      <Stat title="Fees collected" value={money(collected)} note={`${pct(collectionRate)} collection rate`} />
    </section>

    <section className="cards" style={{marginTop:16}}>
      <Stat title="Outstanding fees" value={money(outstanding)} note="Expected less recorded payments" />
      <Stat title="Academic average" value={validMarks.length ? pct(academicAverage) : 'No data'} note={validMarks.length ? `${validMarks.length} recorded marks analysed` : 'Enter published marks to activate'} />
      <Stat title="Attendance rate" value={attendanceCount ? pct(attendanceRate) : 'No data'} note={attendanceCount ? `${attendanceCount} attendance records` : 'Enter attendance records to activate'} />
      <Stat title="School health indicator" value={healthScore ? `${healthScore}/100` : '—'} note={healthLabel} />
    </section>

    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:16,marginTop:16}}>
      <section className="card"><h2 style={{marginTop:0}}>Financial analysis</h2><p className="muted">Shows the school's fee position using recorded fee accounts and payments.</p><Bar label="Fee collection rate" value={collectionRate}/><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:16}}><div><small className="muted">Expected</small><b>{money(expected)}</b></div><div><small className="muted">Collected</small><b>{money(collected)}</b></div><div><small className="muted">Outstanding</small><b>{money(outstanding)}</b></div></div></section>
      <section className="card"><h2 style={{marginTop:0}}>Academic analysis</h2><p className="muted">Performance by class and learning area, based on non-draft marks.</p>{classRows.length ? classRows.map(x=><Bar key={x.name} label={x.name} value={x.score}/>) : <p className="muted">No published marks are available yet.</p>}</section>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:16,marginTop:16}}>
      <section className="card"><h2 style={{marginTop:0}}>Learning-area performance</h2>{areaRows.length ? <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:8}}>Learning area</th><th style={{textAlign:'right',padding:8}}>Average</th></tr></thead><tbody>{areaRows.map(x=><tr key={x.name}><td style={{borderTop:'1px solid #edf0f4',padding:8}}>{x.name}</td><td style={{borderTop:'1px solid #edf0f4',padding:8,textAlign:'right',fontWeight:700}}>{pct(x.score)}</td></tr>)}</tbody></table> : <p className="muted">No learning-area analysis available yet.</p>}</section>
      <section className="card"><h2 style={{marginTop:0}}>Attendance & intervention</h2><Bar label="Overall attendance" value={attendanceRate}/><p style={{fontSize:13,lineHeight:1.6}}>{attendanceCount ? attendanceRate < 85 ? 'Attention: attendance is below the 85% management target. Review repeated absences and follow up with affected families.' : 'Attendance is currently at or above the 85% management target.' : 'Enter attendance records to identify absenteeism trends and intervention needs.'}</p></section>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:16,marginTop:16}}>
      <section className="card"><h2 style={{marginTop:0}}>School growth</h2><p className="muted">New admissions by year and current enrollment distribution.</p>{growthRows.length ? <div>{growthRows.map(([year,count])=><div key={year} style={{display:'grid',gridTemplateColumns:'55px 1fr 40px',gap:8,alignItems:'center',margin:'9px 0'}}><small>{year}</small><div style={{height:10,background:'#e8edf4',borderRadius:999}}><div style={{height:'100%',width:`${count/maxGrowth*100}%`,background:'#198754',borderRadius:999}}/></div><b style={{fontSize:12,textAlign:'right'}}>{count}</b></div>)}</div> : <p className="muted">No admission dates available for growth analysis.</p>}<h3>Enrollment by class</h3>{enrollmentRows.length ? enrollmentRows.map(x=><div key={x.name} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #edf0f4',fontSize:13}}><span>{x.name}</span><strong>{x.count}</strong></div>) : <p className="muted">No active learners assigned to classes.</p>}</section>
      <section className="card"><h2 style={{marginTop:0}}>Trends & management signals</h2><div style={{display:'grid',gap:12}}><div style={{padding:13,borderRadius:10,background:'#f5f8fc'}}><b>Financial signal</b><p className="muted" style={{marginBottom:0}}>{expected ? `${pct(collectionRate)} of recorded fees have been collected; ${money(outstanding)} remains outstanding.` : 'No fee accounts recorded for the current academic year.'}</p></div><div style={{padding:13,borderRadius:10,background:'#f5f8fc'}}><b>Academic signal</b><p className="muted" style={{marginBottom:0}}>{validMarks.length ? `Overall recorded average is ${pct(academicAverage)}.` : 'No published marks are available for trend analysis.'}</p></div><div style={{padding:13,borderRadius:10,background:'#f5f8fc'}}><b>Growth signal</b><p className="muted" style={{marginBottom:0}}>{growthRows.length >= 2 ? `The latest recorded admission year is ${growthRows[growthRows.length-1][0]} with ${growthRows[growthRows.length-1][1]} new admission(s).` : 'Add historical admission dates to build a reliable growth trend.'}</p></div><div style={{padding:13,borderRadius:10,background:'#f5f8fc'}}><b>Management action</b><p className="muted" style={{marginBottom:0}}>Use this page alongside Finance, Results and Attendance to identify areas requiring follow-up. The indicator is informational, not a statutory or academic grading score.</p></div></div></section>
    </div>

    <section className="card" style={{marginTop:16}}><h2 style={{marginTop:0}}>Data & trend notes</h2><p className="muted">Analysis is calculated from records currently stored in the ERP. Empty modules are reported as “No data” rather than being treated as zero performance. Refresh the page after entering new finance, marks or attendance records.</p><p className="muted" style={{marginBottom:0}}>Last generated: {lastUpdated}</p></section>

    <style jsx>{`@media(max-width:900px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.main>div[style*="repeat(2"]{grid-template-columns:1fr!important}}@media(max-width:600px){.cards{grid-template-columns:1fr}.main>div[style*="repeat(2"]{grid-template-columns:1fr!important}}`}</style>
  </main>
}
