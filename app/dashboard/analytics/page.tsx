import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

type Row = Record<string, any>

const money = (n: number) => `KES ${Math.round(n).toLocaleString('en-KE')}`
const pct = (n: number) => `${Math.round(Math.max(0, Math.min(100, n)))}%`

function Bar({ label, value }: { label: string; value: number }) {
  const safe = Math.max(0, Math.min(100, value))
  return <div style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}><span>{label}</span><strong>{pct(safe)}</strong></div><div style={{ height: 9, background: '#e8edf4', borderRadius: 999, overflow: 'hidden' }}><div style={{ width: `${safe}%`, height: '100%', background: '#0757a6', borderRadius: 999 }} /></div></div>
}

function Stat({ title, value, note }: { title: string; value: string | number; note: string }) {
  return <div className="card"><div className="muted">{title}</div><div className="number" style={{ fontSize: 25 }}>{value}</div><div className="muted" style={{ marginTop: 6 }}>{note}</div></div>
}

export default async function AnalyticsPage() {
  const s = await createClient()
  const [studentsRes, classesRes, staffRes, feesRes, paymentsRes, marksRes, attendanceRes, yearsRes] = await Promise.all([
    s.from('students').select('id,class_id,status,admission_date,created_at'),
    s.from('classes').select('id,name').eq('status', 'active').order('name'),
    s.from('staff').select('id,status'),
    s.from('fee_accounts').select('id,academic_year_id,amount_due,amount_paid'),
    s.from('fee_payments').select('id,amount,paid_at,created_at'),
    s.from('marks').select('id,class_id,marks,max_marks,status'),
    s.from('attendance_records').select('id,status'),
    s.from('academic_years').select('id,year,status,is_current').order('year', { ascending: false })
  ])

  const students = (studentsRes.data ?? []) as Row[]
  const classes = (classesRes.data ?? []) as Row[]
  const staff = (staffRes.data ?? []) as Row[]
  const fees = (feesRes.data ?? []) as Row[]
  const payments = (paymentsRes.data ?? []) as Row[]
  const marks = (marksRes.data ?? []) as Row[]
  const attendance = (attendanceRes.data ?? []) as Row[]
  const years = (yearsRes.data ?? []) as Row[]

  const currentYear = years.find(x => x.is_current) ?? years.find(x => x.status === 'active') ?? years[0]
  const activeStudents = students.filter(x => x.status === 'active')
  const activeStaff = staff.filter(x => x.status === 'active')
  const currentFees = currentYear?.id ? fees.filter(x => x.academic_year_id === currentYear.id) : fees
  const expected = currentFees.reduce((sum, x) => sum + Number(x.amount_due ?? 0), 0)
  const collectedFromAccounts = currentFees.reduce((sum, x) => sum + Number(x.amount_paid ?? 0), 0)
  const collected = collectedFromAccounts || payments.reduce((sum, x) => sum + Number(x.amount ?? 0), 0)
  const outstanding = Math.max(expected - collected, 0)
  const collectionRate = expected ? (collected / expected) * 100 : 0

  const validMarks = marks.filter(x => x.status !== 'draft' && Number(x.max_marks ?? 0) > 0)
  const academicAverage = validMarks.length ? validMarks.reduce((sum, x) => sum + Number(x.marks ?? 0) / Number(x.max_marks) * 100, 0) / validMarks.length : 0
  const present = attendance.filter(x => ['present', 'late'].includes(String(x.status ?? '').toLowerCase())).length
  const attendanceRate = attendance.length ? present / attendance.length * 100 : 0

  const healthValues = [expected ? collectionRate : null, validMarks.length ? academicAverage : null, attendance.length ? attendanceRate : null].filter((x): x is number => x !== null)
  const healthScore = healthValues.length ? Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 0
  const healthLabel = healthScore >= 80 ? 'Strong' : healthScore >= 60 ? 'Stable' : healthScore >= 40 ? 'Needs attention' : 'Insufficient data'

  const classMap = new Map(classes.map(x => [x.id, x.name]))
  const classTotals = new Map<string, { marks: number; max: number }>()
  validMarks.forEach(x => { const key = String(x.class_id ?? 'unassigned'); const row = classTotals.get(key) ?? { marks: 0, max: 0 }; row.marks += Number(x.marks ?? 0); row.max += Number(x.max_marks ?? 0); classTotals.set(key, row) })
  const classRows = Array.from(classTotals.entries()).map(([id, x]) => ({ name: classMap.get(id) ?? 'Unassigned', score: x.max ? x.marks / x.max * 100 : 0 })).sort((a, b) => b.score - a.score).slice(0, 8)

  const enrollment = new Map<string, number>()
  activeStudents.forEach(x => { const key = String(x.class_id ?? 'unassigned'); enrollment.set(key, (enrollment.get(key) ?? 0) + 1) })
  const enrollmentRows = Array.from(enrollment.entries()).map(([id, count]) => ({ name: classMap.get(id) ?? 'Unassigned', count })).sort((a, b) => b.count - a.count).slice(0, 8)

  return <main className="main">
    <header className="top"><div><h1>School Intelligence & Analysis</h1><p className="muted">Live management analysis. Current academic year: {currentYear?.year ?? 'Not set'}.</p></div><Link href="/dashboard/reports" className="side-item" style={{ background: '#fff', color: '#0757a6', border: '1px solid #d9e3ef', textDecoration: 'none' }}>Open Reports</Link></header>

    <section className="cards">
      <Stat title="Active learners" value={activeStudents.length} note="Current enrollment" />
      <Stat title="Active staff" value={activeStaff.length} note="Current workforce" />
      <Stat title="Fees expected" value={money(expected)} note="Current academic year" />
      <Stat title="Fees collected" value={money(collected)} note={`${pct(collectionRate)} collection rate`} />
      <Stat title="Outstanding fees" value={money(outstanding)} note="Expected less recorded payments" />
      <Stat title="Academic average" value={validMarks.length ? pct(academicAverage) : 'No data'} note={validMarks.length ? `${validMarks.length} marks analysed` : 'No published marks yet'} />
      <Stat title="Attendance rate" value={attendance.length ? pct(attendanceRate) : 'No data'} note={attendance.length ? `${attendance.length} records analysed` : 'No attendance records yet'} />
      <Stat title="School health" value={healthScore ? `${healthScore}/100` : '—'} note={healthLabel} />
    </section>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16, marginTop: 16 }}>
      <section className="card"><h2 style={{ marginTop: 0 }}>Financial analysis</h2><p className="muted">Recorded fee position for the current academic year.</p><Bar label="Fee collection rate" value={collectionRate} /><p className="muted">Expected: <strong>{money(expected)}</strong> · Collected: <strong>{money(collected)}</strong> · Outstanding: <strong>{money(outstanding)}</strong></p></section>
      <section className="card"><h2 style={{ marginTop: 0 }}>Academic analysis</h2><p className="muted">Performance by class using non-draft marks.</p>{classRows.length ? classRows.map(x => <Bar key={x.name} label={x.name} value={x.score} />) : <p className="muted">No published marks are available yet.</p>}</section>
      <section className="card"><h2 style={{ marginTop: 0 }}>Attendance & intervention</h2><Bar label="Overall attendance" value={attendanceRate} /><p>{attendance.length ? attendanceRate < 85 ? 'Attention: attendance is below the 85% management target. Review repeated absences.' : 'Attendance is at or above the 85% management target.' : 'Enter attendance records to identify intervention needs.'}</p></section>
      <section className="card"><h2 style={{ marginTop: 0 }}>Enrollment by class</h2>{enrollmentRows.length ? enrollmentRows.map(x => <div key={x.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #edf0f4' }}><span>{x.name}</span><strong>{x.count}</strong></div>) : <p className="muted">No active learners are assigned to classes.</p>}</section>
    </div>

    <section className="card" style={{ marginTop: 16 }}><h2 style={{ marginTop: 0 }}>Management signals</h2><p className="muted">Financial: {expected ? `${pct(collectionRate)} collected with ${money(outstanding)} outstanding.` : 'No fee accounts recorded.'}</p><p className="muted">Academic: {validMarks.length ? `Recorded average is ${pct(academicAverage)}.` : 'No published marks available.'}</p><p className="muted" style={{ marginBottom: 0 }}>The health indicator is informational only and should support, not replace, school management decisions.</p></section>
  </main>
}
