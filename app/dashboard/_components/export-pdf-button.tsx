'use client'

type ExportField = { label: string; value: unknown }

const esc = (v: unknown) => String(v ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string))

export default function ExportPdfButton({ title, fields, label = 'Export PDF' }: { title: string; fields: ExportField[]; label?: string }) {
  const exportPdf = () => {
    const w = window.open('', '_blank', 'width=900,height=900')
    if (!w) return
    const rows = fields.map(f => `<tr><th>${esc(f.label)}</th><td>${esc(f.value)}</td></tr>`).join('')
    w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:36px;color:#172033}h1{margin:0 0 8px;font-size:24px}p{color:#667085;margin:0 0 24px}table{width:100%;border-collapse:collapse}th,td{padding:11px;border:1px solid #d0d5dd;text-align:left}th{width:34%;background:#f5f7fa}@media print{body{padding:10mm}button{display:none}}</style></head><body><h1>${esc(title)}</h1><p>AIC Cathedral ERP • Generated ${esc(new Date().toLocaleString())}</p><table>${rows}</table><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`)
    w.document.close()
  }
  return <button type="button" className="btn secondary" onClick={exportPdf}>{label}</button>
}
