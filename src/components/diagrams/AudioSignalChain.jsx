import { useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { audioChain } from '../../data/config'

const NODE_COLORS = {
  source:   '#1e3a5f',
  preamp:   '#1a2a3a',
  dac:      '#1e3a2f',
  amp:      '#3a2a1e',
  streamer: '#2a1e2a',
  tape:     '#2a2a1e',
  cd:       '#1e2a3a',
  output:   '#2a1e3a',
  sub:      '#2a1a2a',
}

function AudioNode({ data }) {
  return (
    <div
      className="px-3 py-2 rounded-lg border text-xs font-mono cursor-pointer select-none min-w-[130px]"
      style={{
        background: NODE_COLORS[data.type] ?? 'var(--bg-surface-2)',
        borderColor: 'var(--border-accent)',
        color: 'var(--text-primary)',
      }}
      onClick={() => data.onSelect(data)}
    >
      <Handle type="target" position={Position.Left} />
      <div className="font-semibold leading-snug" style={{ color: 'var(--accent)' }}>
        {data.label}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', marginTop: 2 }}>
        {data.room} · {data.type?.toUpperCase()}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { audioNode: AudioNode }

function buildNodes(chain, onSelect) {
  return chain.nodes.map((n) => ({
    id: n.id,
    type: 'audioNode',
    position: n.position,
    data: { label: n.label, type: n.type, room: n.room, specs: n.specs, onSelect },
  }))
}

const edgeStyle = { stroke: '#065f46', strokeWidth: 2 }

function buildEdges(chain) {
  return chain.edges.map((e) => ({
    ...e,
    animated: true,
    style: edgeStyle,
  }))
}

function SpecPanel({ node, onClose }) {
  if (!node) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ duration: 0.2 }}
        className="absolute top-3 right-3 z-20 w-60 rounded-xl border-subtle p-4"
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
                <td className="font-mono-data pr-3 pb-1 align-top" style={{ color: 'var(--text-muted)' }}>{k}</td>
                <td className="font-mono-data pb-1" style={{ color: 'var(--text-primary)' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </AnimatePresence>
  )
}

function FlowSection({ title, chain }) {
  const [selected, setSelected] = useState(null)
  const [nodes, , onNodesChange] = useNodesState(buildNodes(chain, setSelected))
  const [edges, , onEdgesChange] = useEdgesState(buildEdges(chain))

  return (
    <div className="mb-10">
      <h3
        className="font-mono-data text-xs tracking-widest uppercase mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {title}
      </h3>

      {/* Desktop */}
      <div
        className="relative hidden sm:block rounded-xl border-subtle overflow-hidden"
        style={{ height: '220px', background: 'var(--bg-surface-1)' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          proOptions={{ hideAttribution: true }}
          panOnDrag
          zoomOnScroll={false}
          nodesDraggable={false}
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
        <div className="flex flex-col gap-1">
          {chain.nodes.map((n) => (
            <div key={n.id} className="font-mono-data flex gap-2 text-xs">
              <span style={{ color: 'var(--accent)' }}>{n.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>— {n.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AudioSignalChain({ sectionId }) {
  return (
    <section id={sectionId} className="relative z-10 px-6 py-10 sm:px-10 md:px-16 lg:px-24">
      <motion.h2
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="font-mono-data tracking-widest uppercase mb-1"
        style={{ color: 'var(--accent)' }}
      >
        Audio Signal Chains
      </motion.h2>
      <p className="font-mono-data mb-8" style={{ color: 'var(--text-muted)' }}>
        Click any node for specs
      </p>

      {audioChain.rooms.map((room) => (
        <FlowSection key={room.id} title={room.label} chain={room} />
      ))}
    </section>
  )
}
