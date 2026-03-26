"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const router = useRouter()
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from("checkins")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        setCheckins(data || [])
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-widest" style={{ color: "#F5A623" }}>MY SHOWS</h2>
            <p className="text-zinc-500 text-sm mt-1">{user?.email || "Your concert history"}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={() => router.push("/")} className="text-zinc-500 text-sm hover:text-white transition">Home</button>
            {user && <button onClick={handleSignOut} className="text-zinc-600 text-xs hover:text-red-400 transition">Sign out</button>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <p className="text-2xl font-bold" style={{ color: "#F5A623" }}>{checkins.length}</p>
            <p className="text-zinc-500 text-xs mt-1">Shows</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <p className="text-2xl font-bold" style={{ color: "#F5A623" }}>0</p>
            <p className="text-zinc-500 text-xs mt-1">Songs Logged</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <p className="text-2xl font-bold" style={{ color: "#F5A623" }}>0</p>
            <p className="text-zinc-500 text-xs mt-1">Photos</p>
          </div>
        </div>
        {loading ? (
          <p className="text-zinc-500 text-center py-16">Loading your shows...</p>
        ) : checkins.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">No shows yet</p>
            <p className="text-zinc-700 text-sm mt-2">Check in to your first show to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checkins.map((show) => (
              <div key={show.id} onClick={() => router.push(`/show/${show.id}`)} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 hover:border-amber-400 transition cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{show.artist}</h3>
                    <p className="text-zinc-400 text-sm">{show.venue}{show.city ? ` · ${show.city}` : ""}</p>
                    <p className="text-sm mt-2" style={{ color: "#F5A623" }}>{formatDate(show.date)}</p>
                  </div>
                  <span className="text-zinc-600 text-xs mt-1">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => router.push("/search")} className="w-full mt-10 py-4 rounded-full font-semibold border-2 transition" style={{ borderColor: "#F5A623", color: "#F5A623" }}>
          + Check In to a Show
        </button>
      </div>
    </main>
  )
}