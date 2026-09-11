import Link from 'next/link'

export type PrototypeKpi = { label: string; value: string | number; note?: string; tone?: 'navy'|'green'|'blue'|'red'|'yellow' }
export function PrototypePage({ title, subtitle, action, kpis = [], tabs = [], children }: { title:string; subtitle:string; action?:React.ReactNode; kpis?:PrototypeKpi[]; tabs?:[string,string][]; children:React.ReactNode }) {
 return <main className="main prototype-module">
  <header className="prototype-module-header"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>
  {kpis.length>0&&<section className="prototype-kpis">{kpis.map((k,i)=><div className={`prototype-kpi ${k.tone||(['navy','green','blue','yellow'][i%4])}`} key={k.label}><div className="prototype-kpi-icon">{i+1}</div><div><div className="prototype-kpi-label">{k.label}</div><div className="prototype-kpi-value">{k.value}</div>{k.note&&<div className="prototype-kpi-note">{k.note}</div>}</div></div>)}</section>}
  {tabs.length>0&&<nav className="prototype-tabs">{tabs.map(([href,label])=><a key={href} href={href} style={{textDecoration:'none'}}><button type="button">{label}</button></a>)}</nav>}
  {children}
 </main>
}
export function PrototypePanel({ title, children, note }: { title:string; children:React.ReactNode; note?:string }) { return <section className="prototype-panel"><div className="prototype-panel-head"><h2>{title}</h2></div>{note&&<div className="prototype-note" style={{margin:'12px 16px 0'}}>{note}</div>}<div className="prototype-panel-body">{children}</div></section> }
export function PrototypeTable({ headers, rows }: { headers:string[]; rows:React.ReactNode[][] }) { return <div className="prototype-table-wrap"><table className="prototype-table"><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>):<tr><td colSpan={headers.length} className="prototype-empty">No records available.</td></tr>}</tbody></table></div> }
export function PrototypeBadge({ children, tone='gray' }: { children:React.ReactNode; tone?:'green'|'red'|'yellow'|'blue'|'gray' }) { return <span className={`prototype-badge ${tone}`}>{children}</span> }
export function PrototypeAction({ href, children }: { href:string; children:React.ReactNode }) { return <Link href={href} className="prototype-primary-button">{children}</Link> }
