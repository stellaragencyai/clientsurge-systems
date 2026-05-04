import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NodeDetailPanel({ node, onClose }) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: 30, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "220px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.97)",
            border: `2px solid ${node.color}33`,
            boxShadow: `0 20px 50px rgba(0,0,0,0.14), 0 0 0 1px ${node.color}22`,
            padding: "18px",
            zIndex: 20,
            backdropFilter: "blur(14px)",
          }}
        >
          {/* Top bar accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              borderRadius: "18px 18px 0 0",
              background: `linear-gradient(90deg, transparent, ${node.color}, transparent)`,
            }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "rgba(0,0,0,0.06)",
              border: "none",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X style={{ width: "11px", height: "11px", color: "#666" }} />
          </button>

          {/* Icon + title */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
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
            <div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#0f1428",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {node.label}
              </p>
              {node.stat && (
                <p
                  style={{
                    fontSize: "9px",
                    fontWeight: "700",
                    color: node.color,
                    margin: "2px 0 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {node.stat}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: "11px",
              color: "rgba(15,20,40,0.65)",
              lineHeight: 1.6,
              margin: "0 0 12px",
            }}
          >
            {node.description}
          </p>

          {/* CTA — only for service nodes */}
          {node.type === "service" && node.slug && (
            <button
              onClick={() => navigate(`/services/${node.slug}`)}
              style={{
                width: "100%",
                borderRadius: "999px",
                padding: "8px 12px",
                background: `linear-gradient(135deg, ${node.color}dd, ${node.color}99)`,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                color: "#fff",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              See Full Details <ArrowRight style={{ width: "11px", height: "11px" }} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}