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
import { feeblePresenceArch } from '../../data/config'

const NODE_COLORS = {
  app:    '#1e2a3a',
  plugin: '#1e3a2a',
  ipc:    '#3a3a1e',
  output: '#2a1e3a',
}

function ArchNode({ data }) {
  return (
    <div
      className="px-3 py-2 rounded-lg border text-sm font-mono cursor-pointer select-none min-w-[140px]"
      style={{
        background: NODE_COLORS[data.type] ?? 'var(--bg-surface-2)',
        borderColor: 'var(--border-accent)',
        color: 'var(--text-primary)',
      }}
      onClick={() => data.onSelect(data)}
    >
      <Handle type="target" position={Position.Left} />
      <div className="font-semibold" style={{ color: 'var(--accent)' }}>{data.label}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
        {data.type?.toUpperCase()}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { archNode: ArchNode }

const initialEdges = feeblePresenceArch.edges.map((e) => ({
  ...e,
  animated: true,
  style: { stroke: '#065f46', strokeWidth: 2 },
}))

function SpecPanel({ node, onClose }) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="hidden sm:flex items-start gap-6 mt-2 px-4 py-3 rounded-xl"
          style={{
            background: 'var(--flow-panel-bg)',
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '1px solid var(--flow-panel-border)',
          }}
        >
          <span className="font-sans text-sm font-medium shrink-0 pt-0.5" style={{ color: 'var(--accent)', minWidth: '160px' }}>
            {node.label}
          </span>
          <div className="flex flex-wrap gap-x-8 gap-y-1 flex-1">
            {Object.entries(node.specs).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="font-mono-data whitespace-nowrap" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{k}</span>
                <span className="font-mono-data" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <span className="material-symbols-rounded text-sm">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function SystemArchitecture() {
  const [selected, setSelected] = useState(null)

  const nodesWithHandler = feeblePresenceArch.nodes.map((n) => ({
    id: n.id,
    type: 'archNode',
    position: n.position,
    data: { label: n.label, type: n.type, specs: n.specs, onSelect: setSelected },
  }))

  const [nodes, , onNodesChange] = useNodesState(nodesWithHandler)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <section className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      <motion.h2
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="font-mono-data tracking-widest uppercase mb-2"
        style={{ color: 'var(--accent)' }}
      >
        Feeble Presence — Architecture
      </motion.h2>
      <p className="font-mono-data mb-5" style={{ color: 'var(--text-muted)' }}>
        MediaMonkey 5 → Discord Rich Presence data flow. Click nodes for details.
      </p>

      <div
        className="relative hidden sm:block rounded-xl border-subtle overflow-hidden"
        style={{ height: '240px', background: 'var(--bg-surface-1)' }}
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
      </div>

      <SpecPanel node={selected} onClose={() => setSelected(null)} />

      <div className="sm:hidden rounded-xl border-subtle p-4" style={{ background: 'var(--bg-surface-1)' }}>
        <p className="font-mono-data text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Architecture diagram available on desktop.
        </p>
      </div>
    </section>
  )
}
