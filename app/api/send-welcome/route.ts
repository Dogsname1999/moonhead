import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY

const welcomeHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
  <tr><td align="center" style="padding:0 0 32px;"><img src="https://www.tourbustix.com/ticket.png" alt="Tourbustix" width="100" height="100" style="display:block;width:100px;height:100px;" /></td></tr>
  <tr><td align="center" style="padding:0 0 12px;"><h1 style="margin:0;font-size:28px;font-weight:800;color:#2C4A6E;letter-spacing:0.05em;">WELCOME TO TOURBUSTIX</h1></td></tr>
  <tr><td align="center" style="padding:0 0 36px;"><p style="margin:0;font-size:16px;color:#5C7A9E;">The ticket stub. Evolved.</p></td></tr>
  <tr><td style="padding:0 0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDE8DF;border-radius:16px;border:1px solid #8BA5C0;">
      <tr><td style="padding:28px 28px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="36" valign="top" style="font-size:20px;padding-right:12px;">&#128247;</td><td style="font-size:16px;font-weight:600;color:#2C4A6E;padding-bottom:20px;border-bottom:1px solid rgba(139,165,192,0.3);">Scan your ticket stubs<br><span style="font-size:13px;font-weight:400;color:#5C7A9E;">Snap a photo of any stub &mdash; old or new &mdash; and our AI reads it instantly. Artist, venue, date, all pre-filled.</span></td></tr></table></td></tr>
      <tr><td style="padding:16px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="36" valign="top" style="font-size:20px;padding-right:12px;">&#127926;</td><td style="font-size:16px;font-weight:600;color:#2C4A6E;padding-bottom:20px;border-bottom:1px solid rgba(139,165,192,0.3);">Build your show history<br><span style="font-size:13px;font-weight:400;color:#5C7A9E;">Check in to past and present shows. Search by artist, venue, or add manually. Your full concert life in one place.</span></td></tr></table></td></tr>
      <tr><td style="padding:16px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="36" valign="top" style="font-size:20px;padding-right:12px;">&#127925;</td><td style="font-size:16px;font-weight:600;color:#2C4A6E;padding-bottom:20px;border-bottom:1px solid rgba(139,165,192,0.3);">Set lists for every show<br><span style="font-size:13px;font-weight:400;color:#5C7A9E;">See every song played, set by set, with cover credits and notes.</span></td></tr></table></td></tr>
      <tr><td style="padding:16px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="36" valign="top" style="font-size:20px;padding-right:12px;">&#127911;</td><td style="font-size:16px;font-weight:600;color:#2C4A6E;padding-bottom:20px;border-bottom:1px solid rgba(139,165,192,0.3);">Listen on Relisten &amp; Archive.org<br><span style="font-size:13px;font-weight:400;color:#5C7A9E;">Shows with live recordings get linked automatically. Hit play and relive the night.</span></td></tr></table></td></tr>
      <tr><td style="padding:16px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="36" valign="top" style="font-size:20px;padding-right:12px;">&#128248;</td><td style="font-size:16px;font-weight:600;color:#2C4A6E;padding-bottom:20px;border-bottom:1px solid rgba(139,165,192,0.3);">Save your memories<br><span style="font-size:13px;font-weight:400;color:#5C7A9E;">Upload photos, scanned stubs, and notes to any show. Your personal concert scrapbook.</span></td></tr></table></td></tr>
      <tr><td style="padding:16px 28px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="36" valign="top" style="font-size:20px;padding-right:12px;">&#127760;</td><td style="font-size:16px;font-weight:600;color:#2C4A6E;">Share your profile<br><span style="font-size:13px;font-weight:400;color:#5C7A9E;">Get your own public page at tourbustix.com/u/yourname. Show off your concert resume.</span></td></tr></table></td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:0 0 40px;"><a href="https://www.tourbustix.com/pastshow" style="display:inline-block;padding:16px 48px;border-radius:999px;font-size:18px;font-weight:700;color:#F5F0E8;background-color:#2C4A6E;text-decoration:none;letter-spacing:0.02em;">Start Scanning Stubs</a></td></tr>
  <tr><td style="padding:0 0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #5C7A9E;"><tr><td style="padding:0 0 0 20px;"><p style="margin:0 0 12px;font-size:15px;color:#2C4A6E;line-height:1.6;">Hey! Welcome to Tourbustix. I built this for people like us who live for live music. Dig out that shoebox of old stubs, scan them in, and watch your show history come to life. Set lists, live recordings, memories &mdash; it&#39;s all here.</p><p style="margin:0 0 12px;font-size:15px;color:#2C4A6E;line-height:1.6;">See you out there.</p><p style="margin:0;font-size:15px;font-weight:600;color:#2C4A6E;">&mdash; Luke</p></td></tr></table></td></tr>
  <tr><td align="center" style="padding:24px 0 0;border-top:1px solid #EDE8DF;"><p style="margin:0 0 8px;font-size:12px;color:#8BA5C0;"><a href="https://www.tourbustix.com" style="color:#5C7A9E;text-decoration:none;font-weight:600;">tourbustix.com</a></p><p style="margin:0;font-size:11px;color:#8BA5C0;">Brought to you by <a href="https://shoptourbus.com" style="color:#5C7A9E;text-decoration:none;">Tourbus</a></p></td></tr>
</table>
</td></tr></table>
</body></html>`

export async function POST(request: NextRequest) {
  const { email, sendAll, adminKey } = await request.json()

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  // For bulk send, require admin key to prevent abuse
  if (sendAll) {
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all users from Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: users } = await supabase.auth.admin.listUsers()
    if (!users?.users?.length) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    const results = []
    for (const user of users.users) {
      if (!user.email) continue
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Luke at Tourbustix <hello@tourbustix.com>',
            to: [user.email],
            subject: 'Welcome to Tourbustix 🎶',
            html: welcomeHtml,
          }),
        })
        const data = await res.json()
        results.push({ email: user.email, success: res.ok, id: data.id })
      } catch (err) {
        results.push({ email: user.email, success: false })
      }
    }
    return NextResponse.json({ sent: results.length, results })
  }

  // Single email send (for new signups)
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Luke at Tourbustix <hello@tourbustix.com>',
        to: [email],
        subject: 'Welcome to Tourbustix 🎶',
        html: welcomeHtml,
      }),
    })
    const data = await res.json()
    return NextResponse.json({ success: res.ok, id: data.id })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
