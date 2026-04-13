'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function GoContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url') || ''
  const label = searchParams.get('label') || 'external site'

  useEffect(() => {
    if (url) {
      const timer = setTimeout(() => {
        window.location.replace(url)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [url])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      {/* Branded top bar — 44px, always visible */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '44px',
        backgroundColor: '#2C4A6E',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0 2px 8px rgba(44,74,110,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/ticket.png" alt="" style={{ height: '22px', width: 'auto' }} />
          <span style={{ color: '#F5F0E8', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>TOURBUSTIX</span>
        </div>
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'none', border: '1px solid rgba(245,240,232,0.4)',
            borderRadius: '999px', padding: '4px 14px',
            color: '#F5F0E8', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.02em',
          }}
        >
          ← Back to Shows
        </button>
      </div>

      {/* Redirect message */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '14px', color: '#8BA5C0', marginBottom: '12px' }}>
          Opening {label}...
        </p>
        <a
          href={url}
          style={{
            display: 'inline-block', padding: '16px 32px',
            borderRadius: '999px', fontWeight: 700, fontSize: '16px',
            backgroundColor: '#2C4A6E', color: '#F5F0E8',
            textDecoration: 'none',
          }}
        >
          Go to {label} →
        </a>
        <p style={{ fontSize: '12px', color: '#8BA5C0', marginTop: '24px' }}>
          Redirecting automatically in a moment...
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '32px', background: 'none', border: 'none',
            color: '#5C7A9E', fontSize: '14px', cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          ← Go back to Tourbustix
        </button>
      </div>
    </div>
  )
}

export default function GoPage() {
  return <Suspense><GoContent /></Suspense>
}
