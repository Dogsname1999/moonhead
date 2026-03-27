'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

const mockAttendees = [
  { id: 1, name: 'Sarah M.', location: 'Brooklyn, NY', shows: 47, mutualArtists: ['Radiohead', 'Phoebe Bridgers'], connected: false },
  { id: 2, name: 'Jake T.', location: 'Manhattan, NY', shows: 23, mutualArtists: ['The Dead', 'Wilco'], connected: false },
  { id: 3, name: 'Rosa L.', location: 'Hoboken, NJ', shows: 61, mutualArtists: ['Radiohead', 'Bon Iver', 'The National'], connected: false },
  { id: 4, name: 'Marcus W.', location: 'Queens, NY', shows: 12, mutualArtists: ['The Dead'], connected: false },
]

export default function WhoHerePage() {
  const router = useRouter()
  const [attendees, setAttendees] = useState(mockAttendees)
  const toggleConnect = (id: number) => setAttendees(attendees.map(a => a.id === id ? { ...a, connected: !a.connected } : a))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Check In" backPath="/checkin" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', margin: 0 }}>WHO'S HERE</h2>
          <span style={{ color: '#8BA5C0', fontSize: '14px', marginTop: '8px' }}>{attendees.length} fans</span>
        </div>
        <p style={{ color: '#5C7A9E', fontSize: '15px', marginBottom: '32px', marginTop: '4px' }}>Other Moonhead users at this show</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {attendees.map((person) => (
            <div key={person.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: '0 0 4px' }}>{person.name}</h3>
                  <p style={{ color: '#8BA5C0', fontSize: '13px', margin: '0 0 12px' }}>{person.location} · {person.shows} shows</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {person.mutualArtists.map((artist) => (
                      <span key={artist} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', border: '1.5px solid #5C7A9E', color: '#5C7A9E' }}>{artist}</span>
                    ))}
                  </div>
                  <p style={{ color: '#8BA5C0', fontSize: '12px', marginTop: '8px', marginBottom: 0 }}>{person.mutualArtists.length} artist{person.mutualArtists.length > 1 ? 's' : ''} in common</p>
                </div>
                <button onClick={() => toggleConnect(person.id)} style={{ marginLeft: '16px', padding: '10px 18px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, flexShrink: 0, cursor: 'pointer', backgroundColor: person.connected ? '#2C4A6E' : 'transparent', color: person.connected ? '#F5F0E8' : '#2C4A6E', border: person.connected ? 'none' : '1.5px solid #2C4A6E' }}>
                  {person.connected ? 'Connected ✓' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '40px', backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0', textAlign: 'center' }}>
          <p style={{ color: '#5C7A9E', fontSize: '14px', margin: '0 0 4px' }}>More fans check in as the show goes on</p>
          <p style={{ color: '#8BA5C0', fontSize: '12px', margin: 0 }}>Connections are based on shared artists</p>
        </div>
      </div>
    </div>
  )
}
