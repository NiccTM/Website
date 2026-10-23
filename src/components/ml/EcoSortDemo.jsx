import { useState, useRef, useCallback, useEffect } from 'react'

const ACCEPTED_TYPES  = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES       = 4 * 1024 * 1024  // 4 MB

const MODEL_ID        = 'yolov8-trash-detections-kgnug'
const MODEL_VERSION   = 11
const CONF_THRESHOLD  = 0.65   // display filter (production default)
const INFER_CONF      = 65     // sent to Roboflow
const INFER_OVERLAP   = 30     // sent to Roboflow

// ── Smart-crop preprocessing ──────────────────────────────────────────────────
// Center-square crops the upload (uses the shorter dimension), resizes to 640×640,
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

// ── Coordinate back-mapping ───────────────────────────────────────────────────
// Roboflow returns pixel coords in the 640×640 cropped frame.
// This maps them back through the crop to the original image, then scales to
// however wide the <img> element is rendered in the browser.
//
//   RF (640 space) → crop-origin offset → original pixel → display pixel
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

// ── Individual bounding box ───────────────────────────────────────────────────
function BoundingBox({ pred, crop, imgEl, confThreshold }) {
  if (!imgEl) return null
  const { left, top, width, height } = mapBox(pred, crop, imgEl)
  const above       = pred.confidence >= confThreshold
  // Phosphor for detections that pass the threshold, amber for sub-threshold
  // ones (the debug caption below calls them "amber boxes"). The label is a
  // small display window so it reads on any photograph.
  const borderColor = above ? 'var(--display-phosphor)' : 'var(--display-amber)'
  const labelBg     = 'var(--display-bg)'
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
        <span className="font-readout" style={{ fontSize: '11px', color: borderColor }}>
          {pred.class}&nbsp;&nbsp;{(pred.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

// ── Processing indicator ──────────────────────────────────────────────────────
const SPINNER_FRAMES = [
  '[ PROCESSING DATA...   ]',
  '[ PROCESSING DATA..  . ]',
  '[ PROCESSING DATA.  .. ]',
  '[ PROCESSING DATA   ... ]',
]

function InferenceSpinner() {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 180)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="display display-crt flex flex-col items-center justify-center gap-3"
      style={{ height: '220px' }}>
      <span className="readout text-sm" style={{ letterSpacing: '0.05em' }}>
        {SPINNER_FRAMES[frame]}
      </span>
      <span className="font-mono-data text-sm" style={{ color: 'var(--display-dim)' }}>
        Running Roboflow inference · model v{MODEL_VERSION}
      </span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
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

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMsg('Unsupported format. Use JPG, PNG, or WebP.')
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
          (res.status === 429 ? 'Rate limit reached. Try again later.' : `Server error ${res.status}`)
        )
      }

      const data  = await res.json()
      const preds = data.predictions ?? []
      setPredictions(preds)
      setRawData(data)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }, [])

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
    <section
      id={sectionId}
      className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <h2 className="legend legend-module">
          EcoSort · Waste Classifier
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
                  className="display font-readout text-sm px-2 py-0.5 text-center"
                  style={{ color: 'var(--display-phosphor)', minWidth: '3.25rem' }}
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
              className="key key-sm"
              aria-pressed={debugMode}
            >
              <span aria-hidden="true" className="material-symbols-rounded text-sm">bug_report</span>
              {debugMode ? 'Debug ON' : 'Debug Mode'}
            </button>
          </div>
        )}
      </div>

      {/* The model's configuration, as a readout line: the values are the
          real constants above, shown in phosphor against dim labels. */}
      <p className="display font-mono-data text-sm px-3 py-2 mb-6" style={{ color: 'var(--display-dim)' }}>
        Roboflow object detection · CMPE 246 · model&nbsp;
        <span className="font-readout" style={{ color: 'var(--display-phosphor)' }}>{MODEL_ID} v{MODEL_VERSION}</span>
        &nbsp;· conf&nbsp;<span className="font-readout" style={{ color: 'var(--display-phosphor)' }}>{INFER_CONF}%</span>
        &nbsp;· overlap&nbsp;<span className="font-readout" style={{ color: 'var(--display-phosphor)' }}>{INFER_OVERLAP}%</span>
        &nbsp;· threshold&nbsp;<span className="font-readout" style={{ color: 'var(--display-phosphor)' }}>{(confThreshold * 100).toFixed(0)}%</span>
        &nbsp;· center-crop&nbsp;<span className="font-readout" style={{ color: 'var(--display-phosphor)' }}>640×640</span>
      </p>

        {/* ── Drop zone ── */}
        {status === 'idle' && (
          /* A <button>, with the file input as a SIBLING rather than a child.
             It was a clicking div, so the only way to upload was a mouse. The
             input cannot live inside the button -- interactive content is not
             allowed there -- and it does not need to: it is display:none and
             opened programmatically, which is the standard pattern. */
          <div key="drop">
            <button
              type="button"
              onDrop={onDrop} onDragOver={onDragOver}
              onClick={() => inputRef.current?.click()}
              className="panel-recessed flex flex-col items-center justify-center gap-3 cursor-pointer w-full"
              style={{ height: '220px', border: '2px dashed var(--control-edge)' }}
            >
              <span aria-hidden="true" className="material-symbols-rounded text-4xl" style={{ color: 'var(--text-muted)' }}>upload_file</span>
              <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>Drop image or click to browse</span>
              <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>JPG · PNG · WebP · max 4 MB</span>
            </button>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
              aria-label="Choose an image to classify"
              className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ── Loading ── */}
        {status === 'loading' && (
          <div key="loading"
           >
            <InferenceSpinner />
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div key="error"
            className="panel-recessed p-4 flex items-center justify-between gap-3"
            style={{ borderColor: 'var(--status-fault)' }}
          >
            <span className="font-mono-data text-sm flex items-center gap-2" style={{ color: 'var(--status-fault)' }}>
              <span aria-hidden="true" className="lamp lamp-fault" />
              {errorMsg}
            </span>
            <button onClick={reset} className="key key-sm">
              Retry
            </button>
          </div>
        )}

        {/* ── Result ── */}
        {status === 'done' && (
          <div key="result"
            className="flex flex-col gap-4"
          >
            {/* ── Image + CSS bounding boxes ── */}
            {/* The image renders at its natural aspect ratio (w-full h-auto).
                Boxes are absolute-positioned within the same container.
                Coordinates are mapped from RF 640-space through the crop
                back to the original image, then scaled to displayed size. */}
            {/* The relative box wraps the <img> directly, with no padding:
                the boxes are positioned against it. The recessed rim is the
                outer element. */}
            <div className="panel-recessed p-1">
            <div className="relative overflow-hidden">
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
            </div>

            {/* ── Prediction table ── */}
            {visiblePreds.length > 0 ? (
              <div className="display p-4">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="legend text-left pb-2" style={{ color: 'var(--display-dim)' }}>Class</th>
                      <th className="legend text-left pb-2" style={{ color: 'var(--display-dim)' }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePreds.map((p, i) => {
                      const above = p.confidence >= confThreshold
                      return (
                        <tr key={i}>
                          <td className="font-mono-data text-sm py-1"
                            style={{ color: above ? 'var(--display-text)' : 'var(--display-dim)' }}>
                            {p.class}
                          </td>
                          <td className="font-readout text-sm py-1"
                            style={{ color: above ? 'var(--display-phosphor)' : 'var(--display-amber)' }}>
                            {(p.confidence * 100).toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {debugMode && subThreshCount > 0 && (
                  <p className="font-mono-data text-sm mt-2" style={{ color: 'var(--display-dim)' }}>
                    ← {subThreshCount} sub-threshold detection(s) shown (amber boxes)
                  </p>
                )}
              </div>
            ) : (
              <div className="panel-recessed p-4">
                <p className="font-mono-data text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No objects detected above {(confThreshold * 100).toFixed(0)}% confidence.
                  {subThreshCount > 0 && (
                    <> Enable <strong>Debug Mode</strong> to see {subThreshCount} low-confidence detection(s).</>
                  )}
                </p>
                {rawData && (
                  <pre className="display font-readout mt-3 p-3 overflow-x-auto"
                    style={{ color: 'var(--display-dim)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    {JSON.stringify({ predictions: rawData.predictions ?? [], time: rawData.time }, null, 2)}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={reset}
              className="key key-sm self-start"
            >
              <span aria-hidden="true" className="material-symbols-rounded text-sm">refresh</span>
              Classify another
            </button>
          </div>
        )}

    </section>
  )
}
