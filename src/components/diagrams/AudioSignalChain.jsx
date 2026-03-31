import { useState, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { audioChain } from '../../data/config'

// ─── Node type → colour mapping ───────────────────────────────────────────────
const NODE_COLORS = {
  source: '#1e3a5f',
  dac:    '#1e3a2f',
  amp:    '#3a2a1e',
  output: '#2a1e3a',
}

// ─── Custom node ──────────────────────────────────────────────────────────────
function AudioNode({ data }) {
  return (
    <div
      className="px-3 py-2 rounded-lg border text-xs font-mono cursor-pointer select-none min-w-[120px]"
      style={{
        background: NODE_COLORS[data.type] ?? 'var(--bg-surface-2)',
        borderColor: 'var(--border-accent)',
        color: 'var(--text-primary)',
      }}
      onClick={() => data.onSelect(data)}
    >
      <div className="font-semibold" style={{ color: 'var(--accent)' }}>{data.label}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{data.type?.toUpperCase()}</div>
    </div>
  )
}

const nodeTypes = { audioNode: AudioNode }

// Build RF nodes from config
const initialNodes = audioChain.nodes.map((n) => ({
  id: n.id,
  type: 'audioNode',
  position: n.position,
  data: { label: n.label, type: n.type, specs: n.specs, onSelect: () => {} },
}))

const initialEdges = audioChain.edges.map((e) => ({
  ...e,
  animated: true,
  style: { stroke: '#065f46', strokeWidth: 2 },
}))

// ─── Spec panel ───────────────────────────────────────────────────────────────
function SpecPanel({ node, onClose }) {
  if (!node) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ duration: 0.2 }}
        className="absolute top-3 right-3 z-20 w-56 rounded-xl border-subtle p-4"
        style={{ background: 'var(--bg-surface-2)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-sans text-xs font-medium" style={{ color: 'var(--accent)' }}>
            {node.label}
          </span>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <span className="material-symbols-rounded text-sm">close</span>
          </button>
        </div>
        <table className="w-full">
          <tbody>
            {Object.entries(node.specs).map(([k, v]) => (
              <tr key={k}>
                <td className="font-mono-data pr-3 pb-1" style={{ color: 'var(--text-muted)' }}>{k}</td>
                <td className="font-mono-data pb-1" style={{ color: 'var(--text-primary)' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AudioSignalChain() {
  const [selected, setSelected] = useState(null)

  const nodesWithHandler = initialNodes.map((n) => ({
    ...n,
    data: { ...n.data, onSelect: setSelected },
  }))

  const [nodes, , onNodesChange] = useNodesState(nodesWithHandler)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <section className="relative z-10 px-6 py-10 sm:px-10 md:px-16 lg:px-24">
      <motion.h2
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="font-mono-data tracking-widest uppercase mb-2"
        style={{ color: 'var(--accent)' }}
      >
        Audio Signal Chain
      </motion.h2>
      <p className="font-mono-data mb-5" style={{ color: 'var(--text-muted)' }}>
        Click any node for specs
      </p>

      {/* Hide on mobile — flow UX is poor on small touch screens */}
      <div
        className="relative hidden sm:block rounded-xl border-subtle overflow-hidden"
        style={{ height: '280px', background: 'var(--bg-surface-1)' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          panOnDrag
          zoomOnScroll={false}
        >
          <Background color="#1f2937" gap={24} />
          <Controls
            showInteractive={false}
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
          />
        </ReactFlow>

        <SpecPanel node={selected} onClose={() => setSelected(null)} />
      </div>

      {/* Mobile fallback */}
      <div className="sm:hidden rounded-xl border-subtle p-4" style={{ background: 'var(--bg-surface-1)' }}>
        <p className="font-mono-data text-center" style={{ color: 'var(--text-muted)' }}>
          Signal chain diagram available on desktop.
        </p>
        <div className="mt-3 flex flex-col gap-1">
          {audioChain.nodes.map((n) => (
            <div key={n.id} className="font-mono-data flex gap-2">
              <span style={{ color: 'var(--accent)' }}>{n.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>— {n.type}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
