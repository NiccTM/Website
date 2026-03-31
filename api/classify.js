/**
 * Vercel Serverless Function — /api/classify
 *
 * Proxies image classification requests to the Roboflow API.
 * The ROBOFLOW_API_KEY env var is set in the Vercel dashboard —
 * it is NEVER exposed to client-side code.
 *
 * Expected request: POST, multipart/form-data with field "image" (base64 string)
 * Returns: { predictions: [...] } from Roboflow
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey    = process.env.ROBOFLOW_API_KEY
  const modelId   = process.env.ROBOFLOW_MODEL_ID   ?? 'ecosort/1'
  const endpoint  = `https://detect.roboflow.com/${modelId}?api_key=${apiKey}`

  if (!apiKey) {
    return res.status(500).json({ error: 'ROBOFLOW_API_KEY not configured.' })
  }

  try {
    const { image } = req.body   // base64-encoded image string

    if (!image) {
      return res.status(400).json({ error: 'Missing "image" field in request body.' })
    }

    const roboflowRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: image,
    })

    if (!roboflowRes.ok) {
      const text = await roboflowRes.text()
      return res.status(roboflowRes.status).json({ error: text })
    }

    const data = await roboflowRes.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('[/api/classify]', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
