"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import NavBar from "@/components/NavBar"

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
  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/") }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '4px', marginTop: 0 }}>MY SHOWS</h2>
            <p style={{ color: '#8BA5C0', fontSize: '14px', margin: 0 }}>{user?.email || 'Your concert history'}</p>
          </div>
          {user && <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '13px', cursor: 'pointer', padding: 0 }}>Sign out</button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '36px' }}>
          {[{ value: checkins.length, label: 'Shows' }, { value: 0, label: 'Songs Logged' }, { value: 0, label: 'Photos' }].map(({ value, label }) => (
            <div key={label} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '18px', textAlign: 'center', border: '1px solid #8BA5C0' }}>
              <p style={{ fontSize: '26px', fontWeight: 700, color: '#2C4A6E', margin: 0 }}>{value}</p>
              <p style={{ fontSize: '12px', color: '#8BA5C0', marginTop: '4px', marginBottom: 0 }}>{label}</p>
            </div>
          ))}
        </div>
        {loading ? (
          <p style={{ color: '#8BA5C0', textAlign: 'center', padding: '64px 0' }}>Loading your shows...</p>
        ) : checkins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#5C7A9E', fontSize: '18px', marginBottom: '8px' }}>No shows yet</p>
            <p style={{ color: '#8BA5C0', fontSize: '14px' }}>Check in to your first show to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checkins.map((show) => (
              <div key={show.id} onClick={() => router.push(`/show/${show.id}`)}
                style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2C4A6E')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#8BA5C0')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: '0 0 4px' }}>{show.artist}</h3>
                    <p style={{ fontSize: '14px', color: '#5C7A9E', margin: '0 0 8px' }}>{show.venue}{show.city ? ` · ${show.city}` : ""}</p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C4A6E', margin: 0 }}>{formatDate(show.date)}</p>
                  </div>
                  <span style={{ color: '#8BA5C0', fontSize: '18px' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => router.push("/search")} style={{ width: '100%', marginTop: '36px', padding: '18px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
          + Check In to a Show
        </button>
      </div>
    </div>
  )
}
