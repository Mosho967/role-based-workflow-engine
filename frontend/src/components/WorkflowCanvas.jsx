import { useState, useEffect } from "react"
import ReactFlow, { Controls, Background, MarkerType, applyNodeChanges } from "reactflow"
import "reactflow/dist/style.css"

const ROLE_COLOR = { user: "#16a34a", reviewer: "#2563eb", admin: "#d97706" }
const NODE_W = 160
const NODE_H = 48
const H_GAP = 50
const V_GAP = 140

function computeLayout(states, transitions) {
  if (!states.length) return {}

  const initial = states.find((s) => s.is_initial) || states[0]
  const rank = { [initial.id]: 0 }
  const queue = [initial.id]
  const visited = new Set([initial.id])

  while (queue.length) {
    const id = queue.shift()
    transitions
      .filter((t) => t.from_state_id === id && !visited.has(t.to_state_id))
      .forEach((t) => {
        visited.add(t.to_state_id)
        rank[t.to_state_id] = rank[id] + 1
        queue.push(t.to_state_id)
      })
  }

  // Any disconnected states go below everything
  const maxRank = Math.max(0, ...Object.values(rank))
  states.forEach((s) => {
    if (rank[s.id] === undefined) rank[s.id] = maxRank + 1
  })

  // Group by rank
  const byRank = {}
  states.forEach((s) => {
    const r = rank[s.id]
    if (!byRank[r]) byRank[r] = []
    byRank[r].push(s.id)
  })

  // Center each rank horizontally
  const positions = {}
  Object.entries(byRank).forEach(([r, ids]) => {
    const totalW = ids.length * NODE_W + (ids.length - 1) * H_GAP
    const startX = -totalW / 2
    ids.forEach((id, i) => {
      positions[id] = {
        x: startX + i * (NODE_W + H_GAP),
        y: parseInt(r) * V_GAP,
      }
    })
  })

  return positions
}

function buildGraph(states, transitions) {
  if (!states.length) return { nodes: [], edges: [] }

  const positions = computeLayout(states, transitions)

  const nodes = states.map((s) => ({
    id: s.id,
    position: positions[s.id] || { x: 0, y: 0 },
    data: { label: s.name, is_initial: s.is_initial, is_final: s.is_final },
    style: {
      border: s.is_initial
        ? "2px solid #16a34a"
        : s.is_final
        ? "2px solid #dc2626"
        : "1.5px solid #d1d5db",
      borderRadius: 8,
      background: s.is_initial ? "#16a34a" : s.is_final ? "#dc2626" : "#fff",
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 600,
      color: s.is_initial || s.is_final ? "#fff" : "#111827",
      width: NODE_W,
      textAlign: "center",
    },
  }))

  const edges = transitions.map((t) => {
    const color = ROLE_COLOR[t.required_role] ?? "#9ca3af"
    return {
      id: t.id,
      source: t.from_state_id,
      target: t.to_state_id,
      type: "smoothstep",
      style: { stroke: color, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    }
  })

  return { nodes, edges }
}

export default function WorkflowCanvas({ states, transitions }) {
  const { nodes: initialNodes, edges: baseEdges } = buildGraph(states, transitions)
  const [nodes, setNodes] = useState(initialNodes)
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    const { nodes: fresh } = buildGraph(states, transitions)
    setNodes(fresh)
  }, [states, transitions])

  const edges = hoveredId
    ? baseEdges.map((e) => {
        const connected = e.source === hoveredId || e.target === hoveredId
        return {
          ...e,
          style: {
            ...e.style,
            opacity: connected ? 1 : 0.08,
            strokeWidth: connected ? 2.5 : 1,
          },
          markerEnd: connected
            ? e.markerEnd
            : { ...e.markerEnd, color: "#d1d5db" },
        }
      })
    : baseEdges

  const displayNodes = hoveredId
    ? nodes.map((n) => {
        const connected =
          n.id === hoveredId ||
          baseEdges.some(
            (e) =>
              (e.source === hoveredId && e.target === n.id) ||
              (e.target === hoveredId && e.source === n.id)
          )
        return {
          ...n,
          style: { ...n.style, opacity: connected ? 1 : 0.15 },
        }
      })
    : nodes

  if (!states.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400 border rounded-lg bg-gray-50">
        Add states to see the canvas
      </div>
    )
  }

  return (
    <div>
      <div style={{ height: 500 }} className="border rounded-lg overflow-hidden bg-gray-50">
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          onNodesChange={(changes) => setNodes((nds) => applyNodeChanges(changes, nds))}
          onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
          nodesConnectable={false}
          elementsSelectable={true}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="flex items-center gap-4 mt-2 px-1">
        {Object.entries(ROLE_COLOR).map(([role, color]) => (
          <div key={role} className="flex items-center gap-1.5">
            <div style={{ width: 24, height: 2, background: color, borderRadius: 1 }} />
            <span className="text-xs text-gray-500 capitalize">{role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
