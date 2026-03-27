'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const mockAttendees = [
  { id: 1, name: 'Sarah M.', location: 'Brooklyn, NY', shows: 47, mutualArtists: ['Radiohead', 'Phoebe Bridgers'], connected: false },
  { id: 2, name: 'Jake T.', location: 'Manhattan, NY', shows: 23, mutualArtists: ['The Dead', 'Wilco'], connected: false },
  { id: 3, name: 'Rosa L.', location: 'Hoboken, NJ', shows: 61, mutualArtists: ['Radiohead', 'Bon Iver', 'The National'], connected: false },
  { id: 4, name: 'Marcus W.', location: 'Queens, NY', shows: 12, mutualArtists: ['The Dead'], connected: false },
]

export default function WhoHerePage() {
  const router = useRouter()
  const [attendees, setAttendees] = useState(mockAttendees)

  const toggleConnect = (id: number) => {
    setAttendees(attendees.map(a => a.id === id ? { ...a, connected: !a.connected } : a))
  }

  return (
    <main className="min-h-screen px-6 py-12" style={{ backgroundColor: '#F5F0E8' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '14px', cursor: 'pointer', marginBottom: '32px', padding: 0 }}>← Back</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h2 className="text-3xl font-bold tracking-widest" style={{ color: '#2C4A6E' }}>WHO'S HERE</h2>
          <span className="text-sm" style={{ color: '#8BA5C0', marginTop: '8px' }}>{attendees.length} fans</span>
        </div>
        <p className="text-sm" style={{ color: '#5C7A9E', marginBottom: '32px' }}>Other Moonhead users at this show</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {attendees.map((person) => (
            <div key={person.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 className="font-bold text-lg" style={{ color: '#2C4A6E' }}>{person.name}</h3>
                  <p className="text-xs" style={{ color: '#8BA5C0', marginTop: '4px' }}>{person.location} · {person.shows} shows</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {person.mutualArtists.map((artist) => (
                      <span key={artist} style={{
                        fontSize: '12px', padding: '4px 12px', borderRadius: '999px',
                        border: '1.5px solid #5C7A9E', color: '#5C7A9E',
                      }}>{artist}</span>
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: '#8BA5C0', marginTop: '8px' }}>
                    {person.mutualArtists.length} artist{person.mutualArtists.length > 1 ? 's' : ''} in common
                  </p>
                </div>
                <button onClick={() => toggleConnect(person.id)} style={{
                  marginLeft: '16px', padding: '8px 16px', borderRadius: '999px',
                  fontSize: '14px', fontWeight: 600, flexShrink: 0, cursor: 'pointer',
                  backgroundColor: person.connected ? '#2C4A6E' : 'transparent',
                  color: person.connected ? '#F5F0E8' : '#2C4A6E',
                  border: person.connected ? 'none' : '1.5px solid #2C4A6E',
                  transition: 'all 0.2s',
                }}>
                  {person.connected ? 'Connected ✓' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px', backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0', textAlign: 'center' }}>
          <p style={{ color: '#5C7A9E', fontSize: '14px' }}>More fans check in as the show goes on</p>
          <p className="text-xs" style={{ color: '#8BA5C0', marginTop: '4px' }}>Connections are based on shared artists</p>
        </div>
      </div>
    </main>
  )
}
