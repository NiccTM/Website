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

function AudioNode({ data }) {
  return (
    <div
      className="px-3 py-2 rounded-xl cursor-pointer select-none min-w-[130px]"
      style={{
        background: 'var(--flow-node-bg)',
        backdropFilter: 'blur(16px) saturate(120%)',
        WebkitBackdropFilter: 'blur(16px) saturate(120%)',
        border: '1px solid var(--flow-node-border)',
        boxShadow: 'inset 0 0 10px var(--flow-node-inset), 0 4px 12px rgba(0,0,0,0.07)',
        color: 'var(--text-primary)',
      }}
      onClick={() => data.onSelect(data)}
    >
      <Handle type="target" position={Position.Left} />
      <div className="font-sans font-semibold leading-snug text-sm" style={{ color: 'var(--accent)' }}>
        {data.label}
      </div>
      <div className="font-sans mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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

const edgeStyle = {
  stroke: '#00E5FF',
  strokeWidth: 2,
  filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.8)) drop-shadow(0 0 2px #00E5FF)',
}

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
        className="absolute top-3 right-3 z-20 w-72 rounded-xl p-4"
        style={{
          background: 'var(--flow-panel-bg)',
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid var(--flow-panel-border)',
          boxShadow: 'inset 0 0 12px var(--flow-node-inset), 0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-sans text-sm font-medium" style={{ color: 'var(--accent)' }}>
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
                <td className="font-mono-data pr-4 pb-1.5 align-top whitespace-nowrap" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{k}</td>
                <td className="font-mono-data pb-1.5" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{v}</td>
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
        className="font-mono-data text-sm tracking-widest uppercase mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {title}
      </h3>

      {/* Desktop */}
      <div
        className="relative hidden sm:block rounded-xl overflow-hidden"
        style={{
          height: 'clamp(180px, 20vh, 320px)',
          background: 'var(--flow-bg)',
          backdropFilter: 'blur(16px) saturate(120%)',
          WebkitBackdropFilter: 'blur(16px) saturate(120%)',
          border: '1px solid var(--flow-bg-border)',
          boxShadow: 'inset 0 0 12px var(--flow-node-inset), 0 4px 16px rgba(0,0,0,0.06)',
        }}
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
            <div key={n.id} className="font-mono-data flex gap-2 text-sm">
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
    <section id={sectionId} className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
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
