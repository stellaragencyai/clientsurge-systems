import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { DIAGRAM_NODES } from "@/lib/systemDiagramData";
import { useNavigate } from "react-router-dom";

export default function MobileFlowList() {
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const ordered = [
    ...DIAGRAM_NODES.filter((n) => n.type === "trigger"),
    ...DIAGRAM_NODES.filter((n) => n.type === "system"),
    ...DIAGRAM_NODES.filter((n) => n.type === "service"),
    ...DIAGRAM_NODES.filter((n) => n.type === "outcome"),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {ordered.map((node, i) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <button
            onClick={() => setExpanded(expanded === node.id ? null : node.id)}
            style={{
              width: "100%",
              textAlign: "left",
              background: expanded === node.id ? `${node.color}10` : "rgba(255,255,255,0.9)",
              border: `1.5px solid ${expanded === node.id ? node.color + "55" : "rgba(0,0,0,0.08)"}`,
              borderRadius: "14px",
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: `${node.color}18`,
                border: `1.5px solid ${node.color}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              {node.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "#0f1428", margin: 0 }}>
                {node.label}
              </p>
              {node.stat && (
                <p style={{ fontSize: "10px", color: node.color, margin: "1px 0 0", fontWeight: "600" }}>
                  {node.stat}
                </p>
              )}
            </div>
            <ChevronDown
              style={{
                width: "14px",
                height: "14px",
                color: "#999",
                transform: expanded === node.id ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          <AnimatePresence>
            {expanded === node.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    background: `${node.color}08`,
                    borderRadius: "0 0 14px 14px",
                    borderLeft: `3px solid ${node.color}44`,
                    marginTop: "-4px",
                  }}
                >
                  <p style={{ fontSize: "12px", color: "rgba(15,20,40,0.65)", lineHeight: 1.6, margin: 0 }}>
                    {node.description}
                  </p>
                  {node.type === "service" && node.slug && (
                    <button
                      onClick={() => navigate(`/services/${node.slug}`)}
                      style={{
                        marginTop: "10px",
                        padding: "6px 14px",
                        borderRadius: "999px",
                        background: node.color,
                        border: "none",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      See Full Details →
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}