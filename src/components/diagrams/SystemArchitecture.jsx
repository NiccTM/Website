import { useState } from 'react'
import { useFlowNodeActivate } from '../../hooks/useFlowNodeActivate'
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { feeblePresenceArch } from '../../data/config'

function ArchNode({ data }) {
  /* React Flow's wrapper is already focusable and already claims
     role="button"; this is what makes Enter actually do something. */
  const ref = useFlowNodeActivate(() => data.onSelect(data))
  return (
    <div
      ref={ref}
      className="panel px-3 py-2 cursor-pointer select-none min-w-[130px]"
      style={{ color: 'var(--text-primary)' }}
      onClick={() => data.onSelect(data)}
    >
      <Handle type="target" position={Position.Left} />
      <div className="font-sans font-semibold leading-snug text-sm" style={{ color: 'var(--text-primary)' }}>{data.label}</div>
      <div className="font-sans mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        {data.type?.toUpperCase()}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { archNode: ArchNode }

const edgeStyle = {
  stroke: 'var(--flow-edge)',
  strokeWidth: 2,
}

const initialEdges = feeblePresenceArch.edges.map((e) => ({
  ...e,
  animated: true,
  style: edgeStyle,
}))

/* Rendered directly rather than through AnimatePresence, which used to fade the
   panel out on close. Returning null when there is no node is the same
   behaviour minus the exit transition. */
function SpecPanel({ node, onClose }) {
  if (!node) return null
  return (
        <div className="panel hidden sm:flex items-start gap-6 mt-2 px-4 py-3">
          <span className="font-sans text-sm font-semibold shrink-0 pt-0.5" style={{ color: 'var(--text-primary)', minWidth: '160px' }}>
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
          <button onClick={onClose} className="key key-sm" aria-label="Close">
            <span aria-hidden="true" className="material-symbols-rounded text-sm">close</span>
          </button>
        </div>
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
      <h2
        className="legend legend-rule mb-2 legend-module"
      >
        Feeble Presence · Architecture
      </h2>
      <p className="font-mono-data mb-5" style={{ color: 'var(--text-muted)' }}>
        MediaMonkey 5 → Discord Rich Presence data flow. Click nodes for details.
      </p>

      <div
        className="panel-recessed relative hidden sm:block overflow-hidden"
        style={{ height: '240px' }}
      >
        {/* See AudioSignalChain: both diagrams render on the home page, and an
            unset id makes React Flow number every instance "1". */}
        <ReactFlow
          id="system-arch"
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
          /* See AudioSignalChain: edges are decoration, but React Flow makes
             them focusable by default, which registers an undersized control
             and a dead tab stop. */
          edgesFocusable={false}
          edgesUpdatable={false}
        >
          {/* Graphite dots: readable on both the beige and the night chassis. */}
          <Background id="dots" color="#8F8778" gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <SpecPanel node={selected} onClose={() => setSelected(null)} />

      <div className="sm:hidden panel-recessed p-4">
        <p className="font-mono-data text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Architecture diagram available on desktop.
        </p>
      </div>
    </section>
  )
}
