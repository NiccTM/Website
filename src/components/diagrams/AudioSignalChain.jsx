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
import { audioChain } from '../../data/config'

function AudioNode({ data }) {
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
      <div className="font-sans font-semibold leading-snug text-sm" style={{ color: 'var(--text-primary)' }}>
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
  stroke: 'var(--flow-edge)',
  strokeWidth: 2,
}

function buildEdges(chain) {
  return chain.edges.map((e) => ({
    ...e,
    animated: true,
    style: edgeStyle,
  }))
}

function FlowSection({ id, title, chain }) {
  const [selected, setSelected] = useState(null)
  const [nodes, , onNodesChange] = useNodesState(buildNodes(chain, setSelected))
  const [edges, , onEdgesChange] = useEdgesState(buildEdges(chain))

  return (
    <div className="mb-10">
      <h3 className="legend legend-rule mb-3" style={{ color: 'var(--text-muted)' }}>
        {title}
      </h3>

      {/* Desktop */}
      <div
        className="panel-recessed relative hidden sm:block overflow-hidden"
        style={{ height: 'clamp(180px, 20vh, 320px)' }}
      >
        {/* id must be unique per instance, and there are several: one
            FlowSection per room here, plus SystemArchitecture on the same page.
            React Flow derives DOM ids from it and numbers every instance "1" by
            default, so leaving it unset emitted duplicate
            #react-flow__aria-live-1 live regions and duplicate
            #react-flow__node-desc-1 targets -- the aria-describedby on one
            diagram's nodes then resolved to another diagram's description. */}
        <ReactFlow
          id={`audio-${id}`}
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
          /* Edges are decoration here -- the affordance is "click any NODE for
             specs", and an edge does nothing when activated. React Flow still
             makes every edge focusable by default, which put a ~185x10 control
             in the a11y tree: an undersized target (WCAG 2.2 AA 2.5.8) and a
             tab stop that leads nowhere. Turning off edge focus/selection
             removes them as controls without changing how the diagram looks. */
          edgesFocusable={false}
          edgesUpdatable={false}
        >
          {/* Background builds its SVG <pattern> id as `pattern-${rfId}${id}`,
              which is literally "pattern-1undefined" when neither is set. */}
          {/* Graphite dots: readable on both the beige and the night chassis. */}
          <Background id="dots" color="#8F8778" gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Spec panel -- below the diagram, slides in when a node is selected */}

        {selected && (
          <div className="panel hidden sm:flex items-start gap-6 mt-2 px-4 py-3">
            <span className="font-sans text-sm font-semibold shrink-0 pt-0.5" style={{ color: 'var(--text-primary)', minWidth: '160px' }}>
              {selected.label}
            </span>
            <div className="flex flex-wrap gap-x-8 gap-y-1 flex-1">
              {Object.entries(selected.specs).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-mono-data whitespace-nowrap" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{k}</span>
                  <span className="font-mono-data" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)} className="key key-sm" aria-label="Close">
              <span aria-hidden="true" className="material-symbols-rounded text-sm">close</span>
            </button>
          </div>
        )}

      {/* Mobile fallback */}
      <div className="sm:hidden panel-recessed p-4">
        <div className="flex flex-col gap-1">
          {chain.nodes.map((n) => (
            <div key={n.id} className="font-mono-data flex gap-2 text-sm">
              <span style={{ color: 'var(--text-primary)' }}>{n.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>· {n.type}</span>
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
      <h2
        className="legend mb-1 legend-module"
      >
        Audio Signal Chains
      </h2>
      <p className="font-mono-data mb-8" style={{ color: 'var(--text-muted)' }}>
        Click any node for specs
      </p>

      {audioChain.rooms.map((room) => (
        <FlowSection key={room.id} id={room.id} title={room.label} chain={room} />
      ))}
    </section>
  )
}
