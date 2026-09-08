'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function Login(){const router=useRouter();const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(false)
async function submit(e:FormEvent){e.preventDefault();setLoading(true);setError('');const {error}=await createClient().auth.signInWithPassword({email,password});if(error)setError(error.message);else router.replace('/dashboard');setLoading(false)}
return <main className="login-shell"><section className="login-card"><div className="brand"><div className="logo">AIC</div><div><strong>AIC Cathedral</strong><div className="muted">Primary School ERP</div></div></div><h1>Welcome back</h1><p className="muted">Sign in to the school management system.</p><form onSubmit={submit}><label>Email address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/>{error&&<p style={{color:'#b42318',fontSize:13}}>{error}</p>}<button className="btn" disabled={loading}>{loading?'Signing in…':'Sign in'}</button></form></section></main>}
