import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'warden@dogsname.com'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )

  // Verify the requesting user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all profiles for usernames
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')

  const usernameMap: Record<string, string> = {}
  profiles?.forEach(p => {
    if (p.username) usernameMap[p.id] = p.username
  })

  // Get all checkins
  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .order('created_at', { ascending: false })

  // Get all setlists for song counts
  const { data: setlists } = await supabase
    .from('setlists')
    .select('checkin_id')

  const songCountByCheckin: Record<string, number> = {}
  setlists?.forEach(s => {
    songCountByCheckin[s.checkin_id] = (songCountByCheckin[s.checkin_id] || 0) + 1
  })

  // Group by user
  const userMap: Record<string, {
    userId: string
    email: string
    username: string
    totalShows: number
    totalSongs: number
    firstCheckin: string
    lastCheckin: string
    artists: string[]
    recentShows: any[]
  }> = {}

  checkins?.forEach(c => {
    if (!userMap[c.user_id]) {
      userMap[c.user_id] = {
        userId: c.user_id,
        email: '',
        username: usernameMap[c.user_id] || '',
        totalShows: 0,
        totalSongs: 0,
        firstCheckin: c.created_at,
        lastCheckin: c.created_at,
        artists: [],
        recentShows: []
      }
    }
    const u = userMap[c.user_id]
    u.totalShows++
    u.totalSongs += songCountByCheckin[c.id] || 0
    if (c.created_at < u.firstCheckin) u.firstCheckin = c.created_at
    if (c.created_at > u.lastCheckin) u.lastCheckin = c.created_at
    if (!u.artists.includes(c.artist)) u.artists.push(c.artist)
    if (u.recentShows.length < 5) {
      u.recentShows.push({
        artist: c.artist,
        venue: c.venue,
        city: c.city,
        date: c.date,
        createdAt: c.created_at
      })
    }
  })

  // Tag admin user
  if (userMap[user.id]) {
    userMap[user.id].email = ADMIN_EMAIL
  }

  const users = Object.values(userMap).sort((a, b) =>
    new Date(b.lastCheckin).getTime() - new Date(a.lastCheckin).getTime()
  )

  return NextResponse.json({
    totalUsers: users.length,
    totalCheckins: checkins?.length || 0,
    totalSongs: setlists?.length || 0,
    users
  })
}
