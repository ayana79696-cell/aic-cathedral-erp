'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ParentPortal() {
  const [code,setCode]=useState(''); const [password,setPassword]=useState(''); const [message,setMessage]=useState('');
  function submit(e:React.FormEvent){e.preventDefault();setMessage('Parent Portal authentication will connect to the school Supabase account system.');}
  return <main className="portal-page"><div className="portal-shell"><Link href="/" className="back">← Back to school website</Link><div className="portal-card"><img src="/aic-cathedral-logo.svg" alt="AIC Cathedral Primary School"/><div className="eyebrow">SECURE PARENT PORTAL</div><h1>Welcome, parent.</h1><p>Sign in to securely view your child’s school information, results, attendance, fees and notices.</p><form onSubmit={submit}><label>Student / Parent Portal Code<input value={code} onChange={e=>setCode(e.target.value)} placeholder="AIC-2026-000001" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/></label><button className="primary" type="submit">Sign in to Parent Portal</button></form>{message&&<div className="notice">{message}</div>}<div className="help"><b>First time here?</b><span>Your school-issued portal code identifies your child. Keep your password private.</span></div></div></div></main>;
}