'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function ParentPortal() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    const { data: email, error: lookupError } = await supabase.rpc('resolve_parent_portal_code', { p_code: code.trim() });
    if (lookupError || !email) {
      setMessage('The portal code was not found. Please contact the school office.');
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage('Sign in failed. Check your password or contact the school office.');
      setBusy(false);
      return;
    }

    router.push('/parent-portal/dashboard');
  }

  return <main className="portal-page"><div className="portal-shell"><Link href="/" className="back">← Back to school website</Link><div className="portal-card"><img src="/aic-cathedral-logo.svg" alt="AIC Cathedral Primary School"/><div className="eyebrow">SECURE PARENT PORTAL</div><h1>Welcome, parent.</h1><p>Sign in to securely view your child’s school information, results, attendance, fees and notices.</p><form onSubmit={submit}><label>Student / Parent Portal Code<input value={code} onChange={e=>setCode(e.target.value)} placeholder="AIC-2026-000001" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/></label><button className="primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to Parent Portal'}</button></form>{message&&<div className="notice">{message}</div>}<div className="help"><b>First time here?</b><span>Your school-issued portal code identifies your child. Your parent account password stays private.</span></div></div></div></main>;
}
