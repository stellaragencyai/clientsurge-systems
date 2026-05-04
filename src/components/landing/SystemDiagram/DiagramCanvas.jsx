import { useState, useRef, useEffect, useCallback } from "react";
import { DIAGRAM_NODES, DIAGRAM_CONNECTIONS } from "@/lib/systemDiagramData";
import DiagramNode from "./DiagramNode";
import NodeDetailPanel from "./NodeDetailPanel";

const CANVAS_W = 1000; // virtual coordinate space
const CANVAS_H = 520;
const NODE_RADIUS = 42; // half-width of node circle for hit testing

function virtualToPercent(vx, vy) {
  return { px: (vx / CANVAS_W) * 100, py: (vy / CANVAS_H) * 100 };
}

// Convert node's percent x/y to virtual canvas coords
function nodeToVirtual(node) {
  return {
    vx: (node.x / 100) * CANVAS_W,
    vy: (node.y / 100) * CANVAS_H,
  };
}

function AnimatedConnector({ fromNode, toNode, isActive, dimmed }) {
  const { vx: x1, vy: y1 } = nodeToVirtual(fromNode);
  const { vx: x2, vy: y2 } = nodeToVirtual(toNode);

  // Quadratic bezier control point — pull toward center for fan-out lines
  const cpx = (x1 + x2) / 2;
  const cpy = Math.min(y1, y2) - 20;
  const d = `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;

  const color = dimmed ? "#d0d5e8" : fromNode.color;
  const opacity = dimmed ? 0.3 : isActive ? 1 : 0.55;

  // Approximate path length for dash animation
  const pathLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * 1.1;

  return (
    <g style={{ transition: "opacity 0.3s ease" }} opacity={opacity}>
      {/* Base dashed track */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 2 : 1.5}
        strokeDasharray="5 6"
        strokeLinecap="round"
      />
      {/* Traveling animated dot */}
      <circle r="3.5" fill={color} opacity={isActive ? 1 : 0.7}>
        <animateMotion
          dur={`${1.8 + Math.random() * 0.8}s`}
          repeatCount="indefinite"
          begin={`${Math.random() * 2}s`}
          calcMode="linear"
        >
          <mpath href={`#conn-path-${fromNode.id}-${toNode.id}`} />
        </animateMotion>
      </circle>
      {/* Hidden path for animateMotion reference */}
      <path
        id={`conn-path-${fromNode.id}-${toNode.id}`}
        d={d}
        fill="none"
        stroke="none"
      />
    </g>
  );
}

export default function DiagramCanvas() {
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(900);
  const [activeNode, setActiveNode] = useState(null);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerW(containerRef.current.getBoundingClientRect().width);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const nodeMap = Object.fromEntries(DIAGRAM_NODES.map((n) => [n.id, n]));

  const connectedIds = useCallback(
    (nodeId) => {
      const ids = new Set();
      DIAGRAM_CONNECTIONS.forEach((c) => {
        if (c.from === nodeId) ids.add(c.to);
        if (c.to === nodeId) ids.add(c.from);
      });
      return ids;
    },
    []
  );

  const connected = activeNode ? connectedIds(activeNode.id) : new Set();

  // Scale factor: virtual canvas → actual container
  const scaleX = containerW / CANVAS_W;
  // Keep aspect ratio for height
  const canvasH = CANVAS_H * scaleX;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: `${canvasH}px`,
        minHeight: "420px",
        maxHeight: "580px",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,174,239,0.05) 0%, transparent 70%), #f8faff",
        borderRadius: "24px",
        border: "1px solid rgba(0,174,239,0.12)",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* SVG connector layer — full virtual viewBox, scaled via CSS */}
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {DIAGRAM_CONNECTIONS.map((conn) => {
          const fromNode = nodeMap[conn.from];
          const toNode = nodeMap[conn.to];
          if (!fromNode || !toNode) return null;
          const isActiveConn =
            activeNode &&
            (conn.from === activeNode.id || conn.to === activeNode.id);
          const dimmed = activeNode && !isActiveConn;
          return (
            <AnimatedConnector
              key={`${conn.from}-${conn.to}`}
              fromNode={fromNode}
              toNode={toNode}
              isActive={!!isActiveConn}
              dimmed={!!dimmed}
            />
          );
        })}
      </svg>

      {/* Node layer — CSS positioned using same percent coords as SVG viewBox */}
      {DIAGRAM_NODES.map((node) => {
        const nodeW = 90;
        const nodeH = 115;
        // Map virtual coords to percentage of container
        const { vx, vy } = nodeToVirtual(node);
        const leftPct = (vx / CANVAS_W) * 100;
        const topPct = (vy / CANVAS_H) * 100;

        return (
          <DiagramNode
            key={node.id}
            node={node}
            isActive={activeNode?.id === node.id}
            isHighlighted={connected.has(node.id)}
            onClick={(n) => setActiveNode(activeNode?.id === n.id ? null : n)}
            style={{
              left: `calc(${leftPct}% - ${nodeW / 2}px)`,
              top: `calc(${topPct}% - ${nodeH / 2}px)`,
            }}
          />
        );
      })}

      {/* Detail panel */}
      {activeNode && (
        <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} />
      )}

      {/* Hint */}
      {!activeNode && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "10px",
            fontWeight: "600",
            color: "rgba(0,174,239,0.55)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          Click any node to explore ↑
        </div>
      )}

      <style>{`
        @keyframes diagramPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}