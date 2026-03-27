'use client'
import { useRef, useState } from 'react'

interface ShareCardProps {
  artist: string
  venue: string
  city?: string
  date: string
}

export default function ShareCard({ artist, venue, city, date }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const formatDate = (d: string) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    } catch { return d }
  }

  const generateCard = async () => {
    setGenerating(true)
    const canvas = canvasRef.current
    if (!canvas) return

    // Instagram Stories size
    const W = 1080
    const H = 1920
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#2C4A6E')
    bg.addColorStop(0.4, '#1a3352')
    bg.addColorStop(1, '#0f1f33')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Subtle star field
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W
      const y = Math.random() * H * 0.6
      const r = Math.random() * 2 + 0.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Moon glow
    const moonX = W / 2
    const moonY = 520
    const moonR = 140
    const glow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 3)
    glow.addColorStop(0, 'rgba(255,223,100,0.25)')
    glow.addColorStop(1, 'rgba(255,223,100,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // Moon circle
    const moonGrad = ctx.createRadialGradient(moonX - 30, moonY - 30, 10, moonX, moonY, moonR)
    moonGrad.addColorStop(0, '#ffe566')
    moonGrad.addColorStop(0.7, '#ffcc33')
    moonGrad.addColorStop(1, '#e6a800')
    ctx.fillStyle = moonGrad
    ctx.beginPath()
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2)
    ctx.fill()

    // Moon craters (subtle)
    ctx.fillStyle = 'rgba(200,160,50,0.3)'
    ctx.beginPath(); ctx.arc(moonX - 40, moonY - 20, 25, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(moonX + 50, moonY + 30, 18, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(moonX + 10, moonY - 50, 12, 0, Math.PI * 2); ctx.fill()

    // "I WAS THERE" label
    ctx.textAlign = 'center'
    ctx.fillStyle = '#8BA5C0'
    ctx.font = '600 32px system-ui, -apple-system, sans-serif'
    ctx.letterSpacing = '8px'
    ctx.fillText('I WAS THERE', W / 2, 780)

    // Artist name (large, bold)
    ctx.fillStyle = '#F5F0E8'
    ctx.font = '800 84px system-ui, -apple-system, sans-serif'
    ctx.letterSpacing = '0px'

    // Word wrap artist name
    const words = artist.split(' ')
    const maxWidth = W - 160
    let lines: string[] = []
    let currentLine = ''
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)

    // If text is too big, shrink font
    let fontSize = 84
    while (lines.length > 3 && fontSize > 48) {
      fontSize -= 8
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`
      lines = []
      currentLine = ''
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      lines.push(currentLine)
    }

    const lineHeight = fontSize * 1.15
    const textStartY = 880
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, textStartY + i * lineHeight)
    })

    // Venue + city
    const venueY = textStartY + lines.length * lineHeight + 40
    ctx.fillStyle = '#8BA5C0'
    ctx.font = '500 40px system-ui, -apple-system, sans-serif'
    const venueText = city ? `${venue} · ${city}` : venue
    ctx.fillText(venueText, W / 2, venueY)

    // Date
    ctx.fillStyle = '#5C7A9E'
    ctx.font = '500 36px system-ui, -apple-system, sans-serif'
    ctx.fillText(formatDate(date), W / 2, venueY + 60)

    // Divider line
    const divY = venueY + 120
    ctx.strokeStyle = 'rgba(139,165,192,0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(W / 2 - 100, divY)
    ctx.lineTo(W / 2 + 100, divY)
    ctx.stroke()

    // Moonhead branding at bottom
    ctx.fillStyle = '#5C7A9E'
    ctx.font = '600 30px system-ui, -apple-system, sans-serif'
    ctx.letterSpacing = '6px'
    ctx.fillText('MOONHEAD', W / 2, H - 200)

    ctx.fillStyle = '#4a6a8e'
    ctx.font = '400 24px system-ui, -apple-system, sans-serif'
    ctx.letterSpacing = '2px'
    ctx.fillText('moonhead.vercel.app', W / 2, H - 155)

    // Generate preview
    const url = canvas.toDataURL('image/png')
    setPreviewUrl(url)
    setShowPreview(true)
    setGenerating(false)
  }

  const downloadCard = () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.download = `moonhead-${artist.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = previewUrl
    link.click()
  }

  const closePreview = () => {
    setShowPreview(false)
    setPreviewUrl('')
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <button
        onClick={generateCard}
        disabled={generating}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '16px',
          border: '1.5px solid #8BA5C0',
          color: '#5C7A9E',
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        {generating ? 'Creating...' : 'Share to Instagram 📸'}
      </button>

      {/* Full-screen preview overlay */}
      {showPreview && (
        <div
          onClick={closePreview}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,31,51,0.95)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '320px', width: '100%' }}>
            {/* Card preview */}
            <img
              src={previewUrl}
              alt="Share card"
              style={{ width: '100%', borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            />

            {/* Action buttons */}
            <button
              onClick={downloadCard}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '16px',
                backgroundColor: '#F5F0E8',
                color: '#2C4A6E',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Save Image 💾
            </button>
            <p style={{ color: '#8BA5C0', fontSize: '13px', textAlign: 'center', margin: 0 }}>
              Save the image, then share it to your Instagram Story or feed
            </p>
            <button
              onClick={closePreview}
              style={{
                background: 'none',
                border: 'none',
                color: '#5C7A9E',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
