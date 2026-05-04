import { useState, useRef, useEffect } from "react";
import { DIAGRAM_NODES, DIAGRAM_CONNECTIONS } from "@/lib/systemDiagramData";
import DiagramNode from "./DiagramNode";
import NodeDetailPanel from "./NodeDetailPanel";

// Compute pixel position from percent-based x/y on the canvas
function pxPos(node, width, height) {
  return {
    cx: (node.x / 100) * width,
    cy: (node.y / 100) * height,
  };
}

function AnimatedConnector({ from, to, width, height, color, delay = 0 }) {
  const { cx: x1, cy: y1 } = pxPos(from, width, height);
  const { cx: x2, cy: y2 } = pxPos(to, width, height);

  // Slightly curved path
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 12;
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;

  const pathId = `path-${from.id}-${to.id}`;

  return (
    <g>
      {/* Base line */}
      <path
        d={d}
        fill="none"
        stroke={color + "30"}
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      {/* Animated glow line */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="6 100"
        strokeLinecap="round"
        opacity="0.7"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="106"
          to="-106"
          dur="2.2s"
          begin={`${delay}s`}
          repeatCount="indefinite"
          calcMode="linear"
        />
      </path>
    </g>
  );
}

export default function DiagramCanvas() {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 900, height: 500 });
  const [activeNode, setActiveNode] = useState(null);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDims({ width: rect.width, height: rect.height });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const nodeMap = Object.fromEntries(DIAGRAM_NODES.map((n) => [n.id, n]));

  const getConnectedIds = (nodeId) => {
    const ids = new Set();
    DIAGRAM_CONNECTIONS.forEach((c) => {
      if (c.from === nodeId) ids.add(c.to);
      if (c.to === nodeId) ids.add(c.from);
    });
    return ids;
  };

  const connected = activeNode ? getConnectedIds(activeNode.id) : new Set();

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "500px",
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,174,239,0.04) 0%, transparent 70%), #f8faff",
        borderRadius: "24px",
        border: "1px solid rgba(0,174,239,0.12)",
        overflow: "hidden",
      }}
    >
      {/* SVG connector layer */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        preserveAspectRatio="none"
      >
        {DIAGRAM_CONNECTIONS.map((conn, i) => {
          const fromNode = nodeMap[conn.from];
          const toNode = nodeMap[conn.to];
          if (!fromNode || !toNode) return null;
          const isRelated =
            !activeNode ||
            conn.from === activeNode.id ||
            conn.to === activeNode.id;
          return (
            <AnimatedConnector
              key={`${conn.from}-${conn.to}`}
              from={fromNode}
              to={toNode}
              width={dims.width}
              height={dims.height}
              color={isRelated ? fromNode.color : "#ccc"}
              delay={i * 0.18}
            />
          );
        })}
      </svg>

      {/* Node layer */}
      {DIAGRAM_NODES.map((node) => {
        const { cx, cy } = pxPos(node, dims.width, dims.height);
        const nodeW = node.type === "service" ? 88 : 80;
        const nodeH = node.type === "service" ? 110 : 100;
        return (
          <DiagramNode
            key={node.id}
            node={node}
            isActive={activeNode?.id === node.id}
            isHighlighted={connected.has(node.id)}
            onClick={(n) => setActiveNode(activeNode?.id === n.id ? null : n)}
            style={{
              left: `${cx - nodeW / 2}px`,
              top: `${cy - nodeH / 2}px`,
            }}
          />
        );
      })}

      {/* Detail panel */}
      <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} />

      {/* Click hint */}
      {!activeNode && (
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "10px",
            fontWeight: "600",
            color: "rgba(0,174,239,0.6)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          Click any node to explore
        </div>
      )}

      <style>{`
        @keyframes diagramPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}