import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('image') as File
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Determine media type
    let mediaType = 'image/jpeg'
    if (file.type) mediaType = file.type
    else if (file.name?.endsWith('.png')) mediaType = 'image/png'
    else if (file.name?.endsWith('.webp')) mediaType = 'image/webp'

    // Call Claude Vision API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `This is a photo of a concert ticket stub. Extract the following information from it:

1. Artist/Band name (the main performer)
2. Venue name
3. City and state
4. Date of the show (in YYYY-MM-DD format if possible, otherwise however it appears)
5. Year (4 digits)

Respond ONLY with a JSON object, no other text. Use these exact keys:
{"artist": "", "venue": "", "city": "", "date": "", "year": ""}

If you can't determine a field, use an empty string. Be precise with the artist name — use the well-known spelling.`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', response.status, errText)
      return NextResponse.json({ error: 'AI vision request failed' }, { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Parse JSON from response
    try {
      // Extract JSON from the response (Claude might wrap it in markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          artist: parsed.artist || '',
          venue: parsed.venue || '',
          city: parsed.city || '',
          date: parsed.date || '',
          year: parsed.year || '',
        })
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', text)
    }

    return NextResponse.json({ error: 'Could not parse ticket information', raw: text }, { status: 422 })
  } catch (err) {
    console.error('Scan stub error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
