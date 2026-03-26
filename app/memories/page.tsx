'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Memory {
  id: number
  type: 'photo' | 'note'
  content: string
  caption: string
  timestamp: string
}

export default function MemoriesPage() {
  const router = useRouter()
  const [memories, setMemories] = useState<Memory[]>([])
  const [note, setNote] = useState('')
  const [caption, setCaption] = useState('')
  const [activeTab, setActiveTab] = useState<'photo' | 'note'>('note')
  const [saved, setSaved] = useState(false)

  const addNote = () => {
    if (!note.trim()) return
    const memory: Memory = {
      id: Date.now(),
      type: 'note',
      content: note.trim(),
      caption: caption.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    setMemories([...memories, memory])
    setNote('')
    setCaption('')
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const memory: Memory = {
        id: Date.now(),
        type: 'photo',
        content: ev.target?.result as string,
        caption: '',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setMemories([...memories, memory])
    }
    reader.readAsDataURL(file)
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-8 hover:text-white transition">
          ← Back
        </button>

        <h2 className="text-3xl font-bold tracking-widest mb-1" style={{ color: '#F5A623' }}>MEMORIES</h2>
        <p className="text-zinc-400 text-sm mb-8">Capture the night</p>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('note')}
            className="flex-1 py-3 rounded-full font-semibold text-sm transition"
            style={activeTab === 'note' ? { backgroundColor: '#F5A623', color: '#000' } : { border: '1px solid #3f3f46', color: '#a1a1aa' }}
          >
            ✍️ Write a Note
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            className="flex-1 py-3 rounded-full font-semibold text-sm transition"
            style={activeTab === 'photo' ? { backgroundColor: '#F5A623', color: '#000' } : { border: '1px solid #3f3f46', color: '#a1a1aa' }}
          >
            📸 Add Photo
          </button>
        </div>

        {/* Note input */}
        {activeTab === 'note' && (
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-6">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was the moment that got you? The song that wrecked you? Write it down..."
              className="w-full bg-transparent text-white text-base focus:outline-none resize-none h-36 mb-3"
            />
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a title (optional)"
              className="w-full bg-transparent text-zinc-400 text-sm focus:outline-none border-t border-zinc-800 pt-3 mb-4"
            />
            <button
              onClick={addNote}
              className="w-full py-3 rounded-full font-semibold transition"
              style={{ backgroundColor: '#F5A623', color: '#000' }}
            >
              Save Note
            </button>
          </div>
        )}

        {/* Photo input */}
        {activeTab === 'photo' && (
          <div className="mb-6">
            <label className="block w-full cursor-pointer">
              <div className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-2xl p-12 text-center hover:border-amber-400 transition">
                <p className="text-4xl mb-3">📷</p>
                <p className="text-zinc-400 text-sm">Tap to upload a photo from the show</p>
              </div>
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>
        )}

        {/* Memories list */}
        {memories.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-zinc-500 text-xs uppercase tracking-widest">Tonight's Memories</h3>
            {memories.map((memory) => (
              <div key={memory.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                {memory.type === 'photo' ? (
                  <img src={memory.content} alt="concert memory" className="w-full object-cover max-h-64" />
                ) : (
                  <div className="p-5">
                    {memory.caption && <p className="text-amber-400 text-sm font-semibold mb-2">{memory.caption}</p>}
                    <p className="text-white text-base leading-relaxed">{memory.content}</p>
                    <p className="text-zinc-600 text-xs mt-3">{memory.timestamp}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {memories.length > 0 && (
          <button
            onClick={() => router.push('/profile')}
            className="w-full mt-8 py-4 rounded-full font-semibold border-2 transition"
            style={{ borderColor: '#F5A623', color: '#F5A623' }}
          >
            View My Concert History 👤
          </button>
        )}
      </div>
    </main>
  )
}