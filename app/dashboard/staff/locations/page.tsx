'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../../lib/supabase/client'

export default function Locations() {
  const s = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [f, setF] = useState({ name: 'School Main Gate', latitude: '', longitude: '', radius_meters: '100' })
  const [msg, setMsg] = useState('')
  async function load() { const { data } = await s.from('checkin_locations').select('*').order('created_at', { ascending: false }); setRows(data || []) }
  useEffect(() => { load() }, [])
  async function add(e: React.FormEvent) { e.preventDefault(); setMsg(''); const { error } = await s.from('checkin_locations').insert({ name: f.name, latitude: Number(f.latitude), longitude: Number(f.longitude), radius_meters: Number(f.radius_meters), active: true }); setMsg(error ? error.message : 'Location saved.'); if (!error) { setF({ name: 'School Main Gate', latitude: '', longitude: '', radius_meters: '100' }); load() } }
  function useLive() { if (!navigator.geolocation) { setMsg('Live location is not supported on this device.'); return } navigator.geolocation.getCurrentPosition(p => setF(x => ({ ...x, latitude: String(p.coords.latitude), longitude: String(p.coords.longitude) })), () => setMsg('Allow location permission to use live location.'), { enableHighAccuracy: true, timeout: 10000 }) }
  async function toggle(id: string, active: boolean) { await s.from('checkin_locations').update({ active: !active }).eq('id', id); load() }
  return <main className="main"><header className="top"><div><h1>Teacher Check-in Locations</h1><p className="muted">Super Admin controls approved live-location points and allowed meter radius.</p></div></header><section className="card"><h2>Add approved location</h2><form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Location name" /><input required type="number" step="any" value={f.latitude} onChange={e => setF({ ...f, latitude: e.target.value })} placeholder="Latitude" /><input required type="number" step="any" value={f.longitude} onChange={e => setF({ ...f, longitude: e.target.value })} placeholder="Longitude" /><input required type="number" min="10" max="5000" value={f.radius_meters} onChange={e => setF({ ...f, radius_meters: e.target.value })} placeholder="Allowed meters" /><button type="button" className="btn" onClick={useLive}>📍 Use my live location</button><button className="btn">Save location</button></form>{msg && <p style={{ marginTop: 12 }}>{msg}</p>}</section><section className="card" style={{ marginTop: 16 }}><h2>Approved locations</h2><div style={{ overflowX: 'auto' }}><table style={{ width: '100%' }}><thead><tr><th>Name</th><th>Coordinates</th><th>Radius</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.name}</td><td>{Number(r.latitude).toFixed(6)}, {Number(r.longitude).toFixed(6)}</td><td>{r.radius_meters} m</td><td>{r.active ? 'Active' : 'Disabled'}</td><td><button className="btn" onClick={() => toggle(r.id, r.active)}>{r.active ? 'Disable' : 'Enable'}</button></td></tr>)}{!rows.length && <tr><td colSpan={5} className="muted">No locations configured.</td></tr>}</tbody></table></div></section></main>
}
