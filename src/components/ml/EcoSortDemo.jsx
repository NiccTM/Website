import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024  // 4MB

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Draw bounding boxes from Roboflow predictions onto a canvas overlay */
function drawPredictions(canvas, img, predictions) {
  const ctx = canvas.getContext('2d')
  canvas.width  = img.naturalWidth
  canvas.height = img.naturalHeight

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  predictions.forEach(({ x, y, width, height, class: cls, confidence }) => {
    const x0 = x - width / 2
    const y0 = y - height / 2

    ctx.strokeStyle = '#6ee7b7'
    ctx.lineWidth   = 2
    ctx.strokeRect(x0, y0, width, height)

    ctx.fillStyle = 'rgba(6,95,70,0.75)'
    ctx.fillRect(x0, y0 - 18, width, 18)

    ctx.fillStyle = '#f9fafb'
    ctx.font = '12px JetBrains Mono, monospace'
    ctx.fillText(`${cls} ${(confidence * 100).toFixed(0)}%`, x0 + 4, y0 - 4)
  })
}

export default function EcoSortDemo({ sectionId }) {
  const [status, setStatus]         = useState('idle')   // idle | loading | done | error
  const [errorMsg, setErrorMsg]     = useState('')
  const [previewSrc, setPreviewSrc] = useState(null)
  const [predictions, setPredictions] = useState([])

  const imgRef    = useRef(null)
  const canvasRef = useRef(null)
  const inputRef  = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMsg('Unsupported format. Use JPG, PNG, or WebP.')
      setStatus('error')
      return
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg('File exceeds 4MB limit.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')
    setPredictions([])

    // Preview
    const objectURL = URL.createObjectURL(file)
    setPreviewSrc(objectURL)

    try {
      const base64 = await toBase64(file)

      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Classification failed.')
      }

      const data = await res.json()
      const preds = data.predictions ?? []
      setPredictions(preds)
      setStatus('done')

      // Draw boxes after the img element loads
      requestAnimationFrame(() => {
        if (imgRef.current && canvasRef.current && preds.length) {
          drawPredictions(canvasRef.current, imgRef.current, preds)
        }
      })
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const onDragOver = (e) => e.preventDefault()

  const reset = () => {
    setStatus('idle')
    setPreviewSrc(null)
    setPredictions([])
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <motion.section
      id={sectionId}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-6 py-10 sm:px-10 md:px-16 lg:px-24"
    >
      <h2
        className="font-mono-data tracking-widest uppercase mb-2"
        style={{ color: 'var(--accent)' }}
      >
        EcoSort — Waste Classifier
      </h2>
      <p className="font-mono-data mb-5" style={{ color: 'var(--text-muted)' }}>
        Roboflow object detection · CMPE246 project · Drop an image to classify
      </p>

      {/* Drop zone */}
      {status === 'idle' && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-200 hover:border-accent/50"
          style={{ height: '200px', borderColor: 'var(--border)', background: 'var(--bg-surface-1)' }}
        >
          <span className="material-symbols-rounded text-4xl" style={{ color: 'var(--text-muted)' }}>
            upload_file
          </span>
          <span className="font-mono-data" style={{ color: 'var(--text-muted)' }}>
            Drop image or click to browse
          </span>
          <span className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
            JPG · PNG · WebP · max 4MB
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div
          className="flex items-center justify-center gap-3 rounded-xl border-subtle"
          style={{ height: '200px', background: 'var(--bg-surface-1)' }}
        >
          <span className="material-symbols-rounded animate-spin text-2xl" style={{ color: 'var(--accent)' }}>
            autorenew
          </span>
          <span className="font-mono-data" style={{ color: 'var(--text-secondary)' }}>
            Running inference…
          </span>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="rounded-xl border-subtle p-4 flex items-center justify-between gap-3"
          style={{ background: 'var(--bg-surface-1)', borderColor: '#7f1d1d' }}>
          <span className="font-mono-data text-red-400">{errorMsg}</span>
          <button onClick={reset} className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
            Retry
          </button>
        </div>
      )}

      {/* Result */}
      {(status === 'done' || (status !== 'idle' && previewSrc)) && status !== 'loading' && status !== 'error' && (
        <div className="flex flex-col gap-4">
          <div className="relative rounded-xl border-subtle overflow-hidden"
            style={{ background: 'var(--bg-surface-1)' }}>
            <img
              ref={imgRef}
              src={previewSrc}
              alt="Classification input"
              className="w-full max-h-[400px] object-contain"
              onLoad={() => {
                if (canvasRef.current && imgRef.current && predictions.length) {
                  drawPredictions(canvasRef.current, imgRef.current, predictions)
                }
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          </div>

          {/* Prediction table */}
          {predictions.length > 0 && (
            <div className="rounded-xl border-subtle p-4" style={{ background: 'var(--bg-surface-1)' }}>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="font-mono-data text-left pb-2" style={{ color: 'var(--text-muted)' }}>Class</th>
                    <th className="font-mono-data text-left pb-2" style={{ color: 'var(--text-muted)' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p, i) => (
                    <tr key={i}>
                      <td className="font-mono-data py-1" style={{ color: 'var(--text-primary)' }}>{p.class}</td>
                      <td className="font-mono-data py-1" style={{ color: 'var(--accent)' }}>
                        {(p.confidence * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {predictions.length === 0 && (
            <div className="font-mono-data text-center py-3" style={{ color: 'var(--text-muted)' }}>
              No objects detected.
            </div>
          )}

          <button
            onClick={reset}
            className="self-start font-mono-data text-xs flex items-center gap-1.5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <span className="material-symbols-rounded text-sm">refresh</span>
            Classify another
          </button>
        </div>
      )}
    </motion.section>
  )
}
