'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

interface Memory { id: number; type: 'photo' | 'note'; content: string; caption: string; timestamp: string }

export default function MemoriesPage() {
  const router = useRouter()
  const [memories, setMemories] = useState<Memory[]>([])
  const [note, setNote] = useState('')
  const [caption, setCaption] = useState('')
  const [activeTab, setActiveTab] = useState<'photo' | 'note'>('note')

  const addNote = () => {
    if (!note.trim()) return
    setMemories([...memories, { id: Date.now(), type: 'note', content: note.trim(), caption: caption.trim(), timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }])
    setNote(''); setCaption('')
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setMemories(prev => [...prev, { id: Date.now(), type: 'photo', content: ev.target?.result as string, caption: '', timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }])
    reader.readAsDataURL(file)
  }

  const tabActive: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }
  const tabInactive: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', backgroundColor: 'transparent', color: '#8BA5C0', border: '1.5px solid #8BA5C0', cursor: 'pointer' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Show" backPath="/profile" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '4px', marginTop: 0 }}>MEMORIES</h2>
        <p style={{ color: '#8BA5C0', fontSize: '14px', marginBottom: '32px', marginTop: 0 }}>Capture the night</p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', backgroundColor: '#EDE8DF', borderRadius: '999px', padding: '4px' }}>
          <button onClick={() => setActiveTab('note')} style={activeTab === 'note' ? tabActive : tabInactive}>✍️ Write a Note</button>
          <button onClick={() => setActiveTab('photo')} style={activeTab === 'photo' ? tabActive : tabInactive}>📸 Add Photo</button>
        </div>
        {activeTab === 'note' && (
          <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1.5px solid #8BA5C0', marginBottom: '24px' }}>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was the moment that got you? Write it down..."
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'transparent', color: '#2C4A6E', fontSize: '16px', outline: 'none', resize: 'none', height: '144px', marginBottom: '12px', border: 'none' }} />
            <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a title (optional)"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'transparent', color: '#5C7A9E', fontSize: '14px', outline: 'none', paddingTop: '12px', marginBottom: '16px', border: 'none', borderTop: '1px solid #8BA5C0' }} />
            <button onClick={addNote} style={{ width: '100%', padding: '14px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>Save Note</button>
          </div>
        )}
        {activeTab === 'photo' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{ backgroundColor: '#EDE8DF', border: '2px dashed #8BA5C0', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>📷</p>
                <p style={{ color: '#8BA5C0', fontSize: '14px' }}>Tap to upload a photo from the show</p>
              </div>
              <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            </label>
          </div>
        )}
        {memories.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', marginBottom: '16px' }}>Tonight's Memories</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {memories.map((memory) => (
                <div key={memory.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #8BA5C0' }}>
                  {memory.type === 'photo' ? (
                    <img src={memory.content} alt="concert memory" style={{ width: '100%', objectFit: 'cover', maxHeight: '256px' }} />
                  ) : (
                    <div style={{ padding: '20px' }}>
                      {memory.caption && <p style={{ fontWeight: 600, color: '#2C4A6E', fontSize: '14px', marginBottom: '8px', marginTop: 0 }}>{memory.caption}</p>}
                      <p style={{ color: '#2C4A6E', lineHeight: 1.6, fontSize: '16px', margin: 0 }}>{memory.content}</p>
                      <p style={{ color: '#8BA5C0', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>{memory.timestamp}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {memories.length > 0 && (
          <button onClick={() => router.push('/profile')} style={{ width: '100%', marginTop: '32px', padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', border: '1.5px solid #2C4A6E', color: '#2C4A6E', background: 'transparent', cursor: 'pointer' }}>
            View My Concert History 👤
          </button>
        )}
      </div>
    </div>
  )
}
