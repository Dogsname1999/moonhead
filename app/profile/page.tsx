"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const router = useRouter()
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from("checkins").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
        setCheckins(data || [])
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <main className="min-h-screen px-6 py-12" style={{ backgroundColor: '#F5F0E8' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h2 className="text-3xl font-bold tracking-widest" style={{ color: '#2C4A6E' }}>MY SHOWS</h2>
            <p className="text-sm" style={{ color: '#8BA5C0', marginTop: '4px' }}>{user?.email || 'Your concert history'}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button onClick={() => router.push("/")} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '14px', cursor: 'pointer' }}>Home</button>
            {user && <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '12px', cursor: 'pointer' }}>Sign out</button>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '40px' }}>
          {[
            { value: checkins.length, label: 'Shows' },
            { value: 0, label: 'Songs Logged' },
            { value: 0, label: 'Photos' },
          ].map(({ value, label }) => (
            <div key={label} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid #8BA5C0' }}>
              <p className="text-2xl font-bold" style={{ color: '#2C4A6E' }}>{value}</p>
              <p className="text-xs" style={{ color: '#8BA5C0', marginTop: '4px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Shows list */}
        {loading ? (
          <p className="text-center py-16" style={{ color: '#8BA5C0' }}>Loading your shows...</p>
        ) : checkins.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: '#5C7A9E', fontSize: '18px' }}>No shows yet</p>
            <p className="text-sm" style={{ color: '#8BA5C0', marginTop: '8px' }}>Check in to your first show to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checkins.map((show) => (
              <div key={show.id} onClick={() => router.push(`/show/${show.id}`)}
                style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2C4A6E')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#8BA5C0')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#2C4A6E' }}>{show.artist}</h3>
                    <p className="text-sm" style={{ color: '#5C7A9E' }}>{show.venue}{show.city ? ` · ${show.city}` : ""}</p>
                    <p className="text-sm font-medium" style={{ color: '#2C4A6E', marginTop: '8px' }}>{formatDate(show.date)}</p>
                  </div>
                  <span style={{ color: '#8BA5C0', fontSize: '16px', marginTop: '4px' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => router.push("/search")} style={{
          width: '100%', marginTop: '40px', padding: '16px', borderRadius: '999px',
          fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8',
          border: 'none', cursor: 'pointer',
        }}>
          + Check In to a Show
        </button>
      </div>
    </main>
  )
}
