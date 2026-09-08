'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Student = {
  id: string
  first_name: string
  last_name: string
  class_id: string | null
  stream_id: string | null
  classes?: { name?: string } | null
  streams?: { name?: string } | null
  student_parents?: Array<{ parent_id: string; parents?: Parent | null }>
}

type Parent = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

type Recipient = Parent & {
  student: string
  grade: string
  stream: string
}

type ApiConfig = {
  api_base_url: string
  sender_name: string
  sender_id: string
  enabled: boolean
}

export default function Broadcast() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [classId, setClassId] = useState('')
  const [streamId, setStreamId] = useState('')
  const [channel, setChannel] = useState('whatsapp')
  const [status, setStatus] = useState('')
  const [showApi, setShowApi] = useState(false)
  const [api, setApi] = useState<ApiConfig>({
    api_base_url: 'https://graph.facebook.com/v23.0',
    sender_name: 'AIC Cathedral',
    sender_id: '',
    enabled: false,
  })

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('students')
        .select('id,first_name,last_name,class_id,stream_id,classes(name),streams(name),student_parents(parent_id,parents(id,name,phone,email))')
        .eq('status', 'active')
        .order('first_name')

      if (error) setStatus(error.message)
      else setStudents((data as Student[]) || [])

      const { data: settings } = await supabase
        .from('communication_settings')
        .select('api_base_url,sender_name,sender_id,enabled')
        .eq('provider', 'whatsapp')
        .maybeSingle()

      if (settings) setApi(settings as ApiConfig)
    }

    void load()
  }, [supabase])

  const classes = useMemo(() => {
    const map = new Map<string, string>()
    students.forEach((student) => {
      if (student.class_id && student.classes?.name) map.set(student.class_id, student.classes.name)
    })
    return Array.from(map.entries())
  }, [students])

  const streams = useMemo(() => {
    const map = new Map<string, string>()
    students.forEach((student) => {
      if (student.stream_id && student.streams?.name) map.set(student.stream_id, student.streams.name)
    })
    return Array.from(map.entries())
  }, [students])

  const recipients = useMemo<Recipient[]>(() => {
    return students
      .filter((student) => (!classId || student.class_id === classId) && (!streamId || student.stream_id === streamId))
      .flatMap((student) =>
        (student.student_parents || [])
          .map((link) => {
            const parent = link.parents
            if (!parent) return null
            return {
              ...parent,
              student: `${student.first_name} ${student.last_name}`,
              grade: student.classes?.name || '',
              stream: student.streams?.name || '',
            }
          })
          .filter((value): value is Recipient => value !== null),
      )
  }, [students, classId, streamId])

  function whatsappLink(parent: Parent) {
    const phone = (parent.phone || '').replace(/^0/, '254').replace(/\D/g, '')
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  async function broadcast() {
    if (!message.trim()) {
      setStatus('Enter a message first.')
      return
    }
    if (!recipients.length) {
      setStatus('No parent contacts match the selected filters.')
      return
    }

    const { data: user } = await supabase.auth.getUser()
    const { data: broadcastRecord, error } = await supabase
      .from('message_broadcasts')
      .insert({
        title: title || 'Parent broadcast',
        message,
        channel,
        audience: 'parents',
        class_id: classId || null,
        stream_id: streamId || null,
        status: 'ready',
        created_by: user.user?.id || null,
      })
      .select('id')
      .single()

    if (error || !broadcastRecord) {
      setStatus(error?.message || 'Could not create broadcast.')
      return
    }

    const { error: recipientError } = await supabase.from('message_recipients').insert(
      recipients.map((parent) => ({
        broadcast_id: broadcastRecord.id,
        parent_id: parent.id,
        phone: parent.phone || null,
        email: parent.email || null,
        channel,
        status: 'pending',
      })),
    )

    if (recipientError) {
      setStatus(recipientError.message)
      return
    }

    if (channel === 'whatsapp' && api.enabled) {
      const { data: result, error: functionError } = await supabase.functions.invoke('send-whatsapp-broadcast', {
        body: { broadcast_id: broadcastRecord.id },
      })
      if (functionError || result?.error) {
        setStatus(functionError?.message || result?.error || 'WhatsApp API could not send. Use the WhatsApp buttons below.')
        return
      }
      setStatus(`WhatsApp broadcast sent: ${result?.sent || 0} sent, ${result?.failed || 0} failed.`)
      return
    }

    setStatus(`Broadcast created for ${recipients.length} parent contact(s).`)
  }

  async function saveApi() {
    const { error } = await supabase
      .from('communication_settings')
      .upsert({ ...api, provider: 'whatsapp' }, { onConflict: 'provider' })
    setStatus(error?.message || 'WhatsApp API configuration saved.')
    if (!error) setShowApi(false)
  }

  return (
    <>
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2>Parent Broadcast</h2>
            <p className="muted">Send mass messages to parents through WhatsApp, with SMS, email and in-app channels ready for future integrations.</p>
          </div>
          <button className="btn secondary" onClick={() => setShowApi((value) => !value)}>API Configuration</button>
        </div>

        {showApi && (
          <div className="card" style={{ marginTop: 15 }}>
            <h3>WhatsApp API</h3>
            <p className="muted">Configure the Meta WhatsApp Cloud API connection. Keep access tokens in secure Supabase Edge Function secrets.</p>
            <div className="grid-form">
              <div><label>API base URL</label><input value={api.api_base_url} onChange={(e) => setApi({ ...api, api_base_url: e.target.value })} /></div>
              <div><label>Sender name</label><input value={api.sender_name} onChange={(e) => setApi({ ...api, sender_name: e.target.value })} /></div>
              <div><label>Phone number ID</label><input value={api.sender_id} onChange={(e) => setApi({ ...api, sender_id: e.target.value })} /></div>
              <div><label>API enabled</label><select value={api.enabled ? 'true' : 'false'} onChange={(e) => setApi({ ...api, enabled: e.target.value === 'true' })}><option value="false">No</option><option value="true">Yes</option></select></div>
            </div>
            <button className="btn" onClick={saveApi}>Save API configuration</button>
          </div>
        )}

        <div className="grid-form">
          <div><label>Broadcast title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fees reminder" /></div>
          <div><label>Channel</label><select value={channel} onChange={(e) => setChannel(e.target.value)}><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option><option value="in_app">In-app</option></select></div>
          <div><label>Grade / Class</label><select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">All grades</option>{classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
          <div><label>Stream</label><select value={streamId} onChange={(e) => setStreamId(e.target.value)}><option value="">East + West</option>{streams.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
        </div>

        <label>Message</label>
        <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type message to parents..." style={{ width: '100%', resize: 'vertical' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 10 }}>
          <strong>{recipients.length} parent contact(s)</strong>
          <button className="btn" onClick={broadcast}>Send Broadcast</button>
        </div>
        {status && <p>{status}</p>}
      </section>

      <section className="card">
        <h2>Recipients</h2>
        <p className="muted">WhatsApp manual sending is available immediately. Automatic API sending works when secure WhatsApp credentials are configured.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Parent</th><th>Learner</th><th>Grade</th><th>Stream</th><th>Phone</th><th>Send</th></tr></thead>
            <tbody>
              {recipients.map((parent, index) => (
                <tr key={`${parent.id}-${index}`}>
                  <td>{parent.name}</td><td>{parent.student}</td><td>{parent.grade}</td><td>{parent.stream}</td><td>{parent.phone || '—'}</td>
                  <td>{channel === 'whatsapp' && parent.phone ? <a className="btn" href={whatsappLink(parent)} target="_blank" rel="noreferrer">Send WhatsApp</a> : <span className="muted">API ready</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
