'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

interface Memory { id: string; type: 'photo' | 'note'; content: string; caption: string; created_at: string; image_url?: string }

function MemoriesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkinId = searchParams.get('checkinId')
  const [memories, setMemories] = useState<Memory[]>([])
  const [note, setNote] = useState('')
  const [caption, setCaption] = useState('')
  const [activeTab, setActiveTab] = useState<'photo' | 'note'>('note')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoCaption, setPhotoCaption] = useState('')

  // Load existing memories
  useEffect(() => {
    if (!checkinId) { setLoading(false); return }
    const load = async () => {
      const { data } = await supabase.from('memories').select('*').eq('checkin_id', checkinId).order('created_at', { ascending: true })
      setMemories(data || [])
      setLoading(false)
    }
    load()
  }, [checkinId])

  const addNote = async () => {
    if (!note.trim() || !checkinId) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('memories').insert({
        checkin_id: checkinId, user_id: user.id, type: 'note',
        content: note.trim(), caption: caption.trim()
      }).select().single()
      if (data) setMemories(prev => [...prev, data])
      setNote(''); setCaption('')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const savePhoto = async () => {
    if (!photoFile || !checkinId) return
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Resize image before upload
      const resized = await resizeImage(photoFile, 1200)

      // Upload to storage
      const fileName = `${user.id}/${checkinId}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage.from('memories').upload(fileName, resized, { contentType: 'image/jpeg' })
      if (uploadError) { console.error('Upload error:', uploadError); setUploading(false); return }

      // Get public URL
      const { data: urlData } = supabase.storage.from('memories').getPublicUrl(fileName)
      const imageUrl = urlData?.publicUrl

      // Save to database
      const { data } = await supabase.from('memories').insert({
        checkin_id: checkinId, user_id: user.id, type: 'photo',
        content: '', caption: photoCaption.trim(), image_url: imageUrl
      }).select().single()
      if (data) setMemories(prev => [...prev, data])
      setPhotoPreview(null); setPhotoFile(null); setPhotoCaption('')
    } catch (e) { console.error(e) }
    setUploading(false)
  }

  const removeMemory = async (id: string) => {
    try {
      await supabase.from('memories').delete().eq('id', id)
      setMemories(prev => prev.filter(m => m.id !== id))
    } catch (e) { console.error(e) }
  }

  const resizeImage = (file: File, maxWidth: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const formatTime = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
    catch { return '' }
  }

  const tabActive: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }
  const tabInactive: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', backgroundColor: 'transparent', color: '#8BA5C0', border: '1.5px solid #8BA5C0', cursor: 'pointer' }

  if (!checkinId) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px', textAlign: 'center' }}>
        <p style={{ color: '#8BA5C0' }}>No show selected. Go to a show to add memories.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Show" backPath={`/show/${checkinId}`} />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 120px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '4px', marginTop: 0 }}>MEMORIES</h2>
        <p style={{ color: '#8BA5C0', fontSize: '14px', marginBottom: '32px', marginTop: 0 }}>Capture the night</p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', backgroundColor: '#EDE8DF', borderRadius: '999px', padding: '4px' }}>
          <button onClick={() => setActiveTab('note')} style={activeTab === 'note' ? tabActive : tabInactive}>✍️ Write a Note</button>
          <button onClick={() => setActiveTab('photo')} style={activeTab === 'photo' ? tabActive : tabInactive}>📸 Add Photo</button>
        </div>

        {/* Note input */}
        {activeTab === 'note' && (
          <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1.5px solid #8BA5C0', marginBottom: '24px' }}>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was the moment that got you? Write it down..."
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'transparent', color: '#2C4A6E', fontSize: '16px', outline: 'none', resize: 'none', height: '144px', marginBottom: '12px', border: 'none', fontFamily: 'inherit' }} />
            <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a title (optional)"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'transparent', color: '#5C7A9E', fontSize: '14px', outline: 'none', paddingTop: '12px', marginBottom: '16px', border: 'none', borderTop: '1px solid #8BA5C0' }} />
            <button onClick={addNote} disabled={saving || !note.trim()}
              style={{ width: '100%', padding: '14px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer', opacity: saving || !note.trim() ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        )}

        {/* Photo input */}
        {activeTab === 'photo' && (
          <div style={{ marginBottom: '24px' }}>
            {!photoPreview ? (
              <label style={{ display: 'block', cursor: 'pointer' }}>
                <div style={{ backgroundColor: '#EDE8DF', border: '2px dashed #8BA5C0', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontSize: '40px', marginBottom: '12px', marginTop: 0 }}>📷</p>
                  <p style={{ color: '#8BA5C0', fontSize: '14px', margin: 0 }}>Tap to upload a photo from the show</p>
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>
            ) : (
              <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #8BA5C0' }}>
                <img src={photoPreview} alt="Preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '300px', display: 'block' }} />
                <div style={{ padding: '16px' }}>
                  <input type="text" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="Add a caption (optional)"
                    style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'transparent', color: '#5C7A9E', fontSize: '14px', outline: 'none', marginBottom: '16px', border: 'none', borderBottom: '1px solid #8BA5C0', paddingBottom: '12px' }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); setPhotoCaption('') }}
                      style={{ flex: 1, padding: '14px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={savePhoto} disabled={uploading}
                      style={{ flex: 1, padding: '14px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                      {uploading ? 'Saving…' : 'Save Photo'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved memories */}
        {loading ? (
          <p style={{ color: '#8BA5C0', textAlign: 'center', padding: '32px 0' }}>Loading memories...</p>
        ) : memories.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', marginBottom: '16px' }}>Show Memories</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {memories.map((memory) => (
                <div key={memory.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #8BA5C0', position: 'relative' }}>
                  <button onClick={() => removeMemory(memory.id)}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(237,232,223,0.85)', border: 'none', color: '#8BA5C0', fontSize: '14px', cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                    ✕
                  </button>
                  {memory.type === 'photo' ? (
                    <div>
                      <img src={memory.image_url} alt="concert memory" style={{ width: '100%', objectFit: 'cover', maxHeight: '400px', display: 'block' }} />
                      {memory.caption && (
                        <div style={{ padding: '12px 16px' }}>
                          <p style={{ color: '#2C4A6E', fontSize: '14px', margin: 0 }}>{memory.caption}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '20px' }}>
                      {memory.caption && <p style={{ fontWeight: 600, color: '#2C4A6E', fontSize: '14px', marginBottom: '8px', marginTop: 0 }}>{memory.caption}</p>}
                      <p style={{ color: '#2C4A6E', lineHeight: 1.6, fontSize: '16px', margin: 0 }}>{memory.content}</p>
                      <p style={{ color: '#8BA5C0', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>{formatTime(memory.created_at)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MemoriesPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }} />}><MemoriesContent /></Suspense>
}
