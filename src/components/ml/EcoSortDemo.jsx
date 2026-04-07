import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

const ACCEPTED_TYPES  = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES       = 4 * 1024 * 1024  // 4 MB

const MODEL_ID        = 'yolov8-trash-detections-kgnug'
const MODEL_VERSION   = 11
const CONF_THRESHOLD  = 0.65   // display filter (production default)
const INFER_CONF      = 65     // sent to Roboflow
const INFER_OVERLAP   = 30     // sent to Roboflow

// â”€â”€ Smart-crop preprocessing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Center-square crops the upload (uses the shorter dimension), resizes to 640Ã—640,
// then returns both the encoded frame AND the crop parameters needed to back-map
// Roboflow's coordinate space onto the original displayed image.
function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload  = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload  = () => {
        const SIZE     = 640
        const shortSide = Math.min(img.width, img.height)
        const cropSx    = (img.width  - shortSide) / 2
        const cropSy    = (img.height - shortSide) / 2

        const canvas   = document.createElement('canvas')
        canvas.width   = SIZE
        canvas.height  = SIZE
        canvas.getContext('2d').drawImage(img, cropSx, cropSy, shortSide, shortSide, 0, 0, SIZE, SIZE)

        resolve({
          base64:   canvas.toDataURL('image/jpeg', 0.95).split(',')[1],
          origW:    img.width,
          origH:    img.height,
          cropSx,
          cropSy,
          cropSize: shortSide,
        })
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// â”€â”€ Coordinate back-mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Roboflow returns pixel coords in the 640Ã—640 cropped frame.
// This maps them back through the crop to the original image, then scales to
// however wide the <img> element is rendered in the browser.
//
//   RF (640 space) â†’ crop-origin offset â†’ original pixel â†’ display pixel
//
function mapBox(pred, crop, imgEl) {
  const { origW, origH, cropSx, cropSy, cropSize } = crop
  const scaleX = imgEl.clientWidth  / origW
  const scaleY = imgEl.clientHeight / origH

  const left   = ((pred.x - pred.width  / 2) / 640 * cropSize + cropSx) * scaleX
  const top    = ((pred.y - pred.height / 2) / 640 * cropSize + cropSy) * scaleY
  const width  =  (pred.width  / 640 * cropSize) * scaleX
  const height =  (pred.height / 640 * cropSize) * scaleY

  return { left, top, width, height }
}

// â”€â”€ Individual bounding box â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BoundingBox({ pred, crop, imgEl, confThreshold }) {
  if (!imgEl) return null
  const { left, top, width, height } = mapBox(pred, crop, imgEl)
  const above       = pred.confidence >= confThreshold
  const borderColor = above ? '#58b8e0' : 'rgba(255,59,48,0.70)'
  const labelBg     = above ? 'rgba(58,144,184,0.92)' : 'rgba(140,20,15,0.88)'
  // If the box is too close to the top, flip the label inside instead of above
  const labelAbove  = top > 22

  return (
    <div
      style={{
        position:  'absolute',
        left:      `${left}px`,
        top:       `${top}px`,
        width:     `${width}px`,
        height:    `${height}px`,
        border:    `2px solid ${borderColor}`,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      {/* Label chip */}
      <div
        style={{
          position:   'absolute',
          left:       0,
          top:        labelAbove ? '-20px' : '0px',
          height:     '20px',
          background: labelBg,
          display:    'flex',
          alignItems: 'center',
          padding:    '0 5px',
          whiteSpace: 'nowrap',
          maxWidth:   `${width + 60}px`,
        }}
      >
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#f9fafb' }}>
          {pred.class}&nbsp;&nbsp;{(pred.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

// â”€â”€ Terminal-style spinner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SPINNER_FRAMES = [
  '[ PROCESSING DATA...   ]',
  '[ PROCESSING DATA..  . ]',
  '[ PROCESSING DATA.  .. ]',
  '[ PROCESSING DATA   ... ]',
]

function TerminalSpinner() {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 180)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-subtle"
      style={{ height: '220px', background: 'var(--bg-surface-1)' }}>
      <span className="font-mono-data text-sm tabular-nums"
        style={{ color: 'var(--accent)', letterSpacing: '0.05em' }}>
        {SPINNER_FRAMES[frame]}
      </span>
      <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>
        Running Roboflow inference Â· model v{MODEL_VERSION}
      </span>
    </div>
  )
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function EcoSortDemo({ sectionId }) {
  const [status, setStatus]         = useState('idle')  // idle | loading | done | error
  const [errorMsg, setErrorMsg]     = useState('')
  const [previewSrc, setPreviewSrc] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [rawData, setRawData]       = useState(null)
  const [cropParams, setCropParams] = useState(null)   // origW/H + crop offset/size
  const [imgLoaded, setImgLoaded]   = useState(false)  // true once <img> fires onLoad
  const [debugMode, setDebugMode]       = useState(false)
  const [confThreshold, setConfThreshold] = useState(CONF_THRESHOLD)

  const imgRef  = useRef(null)
  const inputRef = useRef(null)

  const pushHistory = useAppStore((s) => s.pushHistory)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMsg('Unsupported format â€” use JPG, PNG, or WebP.')
      setStatus('error'); return
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg('File exceeds 4 MB limit.')
      setStatus('error'); return
    }

    setStatus('loading')
    setErrorMsg('')
    setPredictions([])
    setCropParams(null)
    setImgLoaded(false)
    setRawData(null)
    setPreviewSrc(URL.createObjectURL(file))

    try {
      const { base64, origW, origH, cropSx, cropSy, cropSize } = await preprocessImage(file)
      setCropParams({ origW, origH, cropSx, cropSy, cropSize })

      const res = await fetch('/api/classify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: base64, confidence: INFER_CONF, overlap: INFER_OVERLAP }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          body.error ??
          (res.status === 429 ? 'Rate limit reached â€” try again later.' : `Server error ${res.status}`)
        )
      }

      const data  = await res.json()
      const preds = data.predictions ?? []
      setPredictions(preds)
      setRawData(data)
      setStatus('done')

      // â”€â”€ Always log inference to the terminal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const latencyMs    = data.time != null ? (data.time * 1000).toFixed(0) : '?'
      const aboveThresh  = preds.filter((p) => p.confidence >= confThreshold)
      const topLines     = aboveThresh.slice(0, 4).map(
        (p) => `  ${p.class.padEnd(14)} ${(p.confidence * 100).toFixed(0)}%`
      )
      pushHistory({
        cmd: 'inspect ecosort --inference',
        output: [
          `[ INFERENCE: ${preds.length} object(s) found | Latency: ${latencyMs}ms ]`,
          ...(topLines.length > 0
            ? topLines
            : [`  â†’ 0 detections above ${(confThreshold * 100).toFixed(0)}% Â· enable Debug Mode`]),
        ],
      })
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }, [pushHistory, confThreshold])

  const onDrop     = useCallback((e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }, [handleFile])
  const onDragOver = (e) => e.preventDefault()

  const reset = () => {
    setStatus('idle')
    setPreviewSrc(null)
    setPredictions([])
    setErrorMsg('')
    setRawData(null)
    setCropParams(null)
    setImgLoaded(false)
    setDebugMode(false)
    setConfThreshold(CONF_THRESHOLD)
    if (inputRef.current) inputRef.current.value = ''
  }

  // Predictions visible in the current mode
  const visiblePreds   = debugMode
    ? predictions
    : predictions.filter((p) => p.confidence >= confThreshold)
  const subThreshCount = predictions.filter((p) => p.confidence < confThreshold).length

  return (
    <motion.section
      id={sectionId}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <h2 className="font-mono-data text-lg tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          EcoSort â€” Waste Classifier
        </h2>
        {status === 'done' && (
          <div className="flex flex-wrap items-center gap-3">
            {debugMode && (
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>
                  thresh
                </span>
                <input
                  type="range"
                  min={0.10}
                  max={0.90}
                  step={0.01}
                  value={confThreshold}
                  onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--accent)', width: '100px' }}
                />
                <span
                  className="font-mono-data text-sm tabular-nums"
                  style={{ color: 'var(--accent)', minWidth: '2.5rem' }}
                >
                  {(confThreshold * 100).toFixed(0)}%
                </span>
              </div>
            )}
            <button
              onClick={() => {
                setDebugMode((d) => !d)
                if (debugMode) setConfThreshold(CONF_THRESHOLD)
              }}
              className="font-mono-data text-sm px-2.5 py-1 rounded-md border-subtle flex items-center gap-1.5 transition-colors duration-150"
              style={{
                color:      debugMode ? 'var(--accent)'      : 'var(--text-muted)',
                background: debugMode ? 'rgba(58,144,184,0.18)' : 'var(--bg-surface-2)',
              }}
              aria-pressed={debugMode}
            >
              <span aria-hidden="true" className="material-symbols-rounded text-sm">bug_report</span>
              {debugMode ? 'Debug ON' : 'Debug Mode'}
            </button>
          </div>
        )}
      </div>

      <p className="font-mono-data text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Roboflow object detection Â· CMPE246 Â· model&nbsp;
        <span style={{ color: 'var(--accent)' }}>{MODEL_ID} v{MODEL_VERSION}</span>
        &nbsp;Â· conf&nbsp;<span style={{ color: 'var(--accent)' }}>{INFER_CONF}%</span>
        &nbsp;Â· overlap&nbsp;<span style={{ color: 'var(--accent)' }}>{INFER_OVERLAP}%</span>
        &nbsp;Â· threshold&nbsp;<span style={{ color: 'var(--accent)' }}>{(confThreshold * 100).toFixed(0)}%</span>
        &nbsp;Â· center-crop&nbsp;<span style={{ color: 'var(--accent)' }}>640Ã—640</span>
      </p>

      <AnimatePresence mode="wait">

        {/* â”€â”€ Drop zone â”€â”€ */}
        {status === 'idle' && (
          <motion.div key="drop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onDrop={onDrop} onDragOver={onDragOver}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer"
            style={{ height: '220px', borderColor: 'var(--border)', background: 'var(--bg-surface-1)' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-4xl" style={{ color: 'var(--text-muted)' }}>upload_file</span>
            <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>Drop image or click to browse</span>
            <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>JPG Â· PNG Â· WebP Â· max 4 MB</span>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </motion.div>
        )}

        {/* â”€â”€ Loading â”€â”€ */}
        {status === 'loading' && (
          <motion.div key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TerminalSpinner />
          </motion.div>
        )}

        {/* â”€â”€ Error â”€â”€ */}
        {status === 'error' && (
          <motion.div key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl border-subtle p-4 flex items-center justify-between gap-3"
            style={{ background: 'var(--bg-surface-1)', borderColor: '#7f1d1d' }}
          >
            <span className="font-mono-data text-sm text-red-400">{errorMsg}</span>
            <button onClick={reset} className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>
              Retry
            </button>
          </motion.div>
        )}

        {/* â”€â”€ Result â”€â”€ */}
        {status === 'done' && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            {/* â”€â”€ Image + CSS bounding boxes â”€â”€ */}
            {/* The image renders at its natural aspect ratio (w-full h-auto).
                Boxes are absolute-positioned within the same container.
                Coordinates are mapped from RF 640-space through the crop
                back to the original image, then scaled to displayed size. */}
            <div
              className="relative rounded-xl border-subtle overflow-hidden"
              style={{ background: 'var(--bg-surface-1)' }}
            >
              <img
                ref={imgRef}
                src={previewSrc}
                alt="Classification input"
                className="w-full h-auto block"
                onLoad={() => setImgLoaded(true)}
              />

              {/* Render boxes only once the <img> has its layout dimensions */}
              {imgLoaded && cropParams && imgRef.current && visiblePreds.map((p, i) => (
                <BoundingBox
                  key={i}
                  pred={p}
                  crop={cropParams}
                  imgEl={imgRef.current}
                  confThreshold={confThreshold}
                />
              ))}
            </div>

            {/* â”€â”€ Prediction table â”€â”€ */}
            {visiblePreds.length > 0 ? (
              <div className="rounded-xl border-subtle p-4" style={{ background: 'var(--bg-surface-1)' }}>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="font-mono-data text-sm text-left pb-2" style={{ color: 'var(--text-muted)' }}>Class</th>
                      <th className="font-mono-data text-sm text-left pb-2" style={{ color: 'var(--text-muted)' }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePreds.map((p, i) => {
                      const above = p.confidence >= confThreshold
                      return (
                        <tr key={i}>
                          <td className="font-mono-data text-sm py-1"
                            style={{ color: above ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {p.class}
                          </td>
                          <td className="font-mono-data text-sm py-1 tabular-nums"
                            style={{ color: above ? 'var(--accent)' : 'rgba(88,184,224,0.4)' }}>
                            {(p.confidence * 100).toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {debugMode && subThreshCount > 0 && (
                  <p className="font-mono-data text-sm mt-2" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                    â†‘ {subThreshCount} sub-threshold detection(s) shown (amber boxes)
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border-subtle p-4" style={{ background: 'var(--bg-surface-1)' }}>
                <p className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>
                  No objects detected above {(confThreshold * 100).toFixed(0)}% confidence.
                  {subThreshCount > 0 && (
                    <> Enable <strong>Debug Mode</strong> to see {subThreshCount} low-confidence detection(s).</>
                  )}
                </p>
                {rawData && (
                  <pre className="font-mono-data mt-3 overflow-x-auto"
                    style={{ color: 'rgba(110,231,183,0.40)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    {JSON.stringify({ predictions: rawData.predictions ?? [], time: rawData.time }, null, 2)}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={reset}
              className="self-start font-mono-data text-sm flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <span aria-hidden="true" className="material-symbols-rounded text-sm">refresh</span>
              Classify another
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.section>
  )
}
