import { useState } from "react";
import { X, ShoppingCart, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StackBuilder({ isOpen, onClose, systems = {} }) {
  const [selectedStack, setSelectedStack] = useState({});
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const handleAddToStack = (systemId) => {
    setSelectedStack((prev) => ({
      ...prev,
      [systemId]: (prev[systemId] || 0) + 1,
    }));
  };

  const handleRemoveFromStack = (systemId) => {
    setSelectedStack((prev) => {
      const newStack = { ...prev };
      if (newStack[systemId] > 1) {
        newStack[systemId]--;
      } else {
        delete newStack[systemId];
      }
      return newStack;
    });
  };

  const handleToggleCompare = (systemId) => {
    setCompareIds((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : prev.length < 2
        ? [...prev, systemId]
        : [prev[1], systemId]
    );
  };

  const totalSetup = Object.entries(selectedStack).reduce(
    (sum, [id, qty]) => sum + (systems[id]?.setupCost || 0) * qty,
    0
  );
  const totalMonthly = Object.entries(selectedStack).reduce(
    (sum, [id, qty]) => sum + (systems[id]?.monthlyCost || 0) * qty,
    0
  );

  const compareSystemA = systems[compareIds[0]];
  const compareSystemB = systems[compareIds[1]];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: 500 }}
            animate={{ x: 0 }}
            exit={{ x: 500 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 border-b bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Build Your Stack
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setComparisonMode(false)}
                  className={`flex-1 py-2 rounded font-semibold text-sm transition ${
                    !comparisonMode
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Stack
                </button>
                <button
                  onClick={() => setComparisonMode(true)}
                  className={`flex-1 py-2 rounded font-semibold text-sm transition ${
                    comparisonMode
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Compare
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {!comparisonMode ? (
                <>
                  {/* Selected Stack */}
                  {Object.keys(selectedStack).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">
                        Click systems above to build your ideal stack
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(selectedStack).map(([systemId, qty]) => {
                        const system = systems[systemId];
                        if (!system) return null;
                        return (
                          <motion.div
                            key={systemId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-sm">
                                  {system.title}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  ${system.monthlyCost}/mo
                                </p>
                              </div>
                              <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded">
                                ×{qty}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRemoveFromStack(systemId)}
                                className="flex-1 py-2 px-3 bg-white border rounded text-sm hover:bg-gray-50 transition flex items-center justify-center gap-1"
                              >
                                <Minus className="w-3 h-3" /> Remove
                              </button>
                              <button
                                onClick={() => handleAddToStack(systemId)}
                                className="flex-1 py-2 px-3 bg-white border rounded text-sm hover:bg-gray-50 transition flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pricing Summary */}
                  {Object.keys(selectedStack).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t pt-4 space-y-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Setup Total:</span>
                        <span className="font-semibold">${totalSetup}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Monthly:</span>
                        <span className="text-primary">${totalMonthly}/mo</span>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <>
                  {/* Comparison Mode */}
                  {compareIds.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">
                        Select 2 systems to compare side-by-side
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[compareSystemA, compareSystemB].map(
                        (system, idx) =>
                          system && (
                            <motion.div
                              key={system.id}
                              initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white"
                            >
                              <h4 className="font-bold mb-3">{system.title}</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Setup:</span>
                                  <span className="font-semibold">
                                    ${system.setupCost}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Monthly:</span>
                                  <span className="font-semibold">
                                    ${system.monthlyCost}/mo
                                  </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                  <span className="text-gray-600">Timeline:</span>
                                  <span className="font-semibold">
                                    {system.timeline || "Confirmed after onboarding"}
                                  </span>
                                </div>
                                {system.features && (
                                  <div className="pt-2 border-t">
                                    <p className="text-gray-600 text-xs font-semibold mb-2">
                                      Key Features:
                                    </p>
                                    <ul className="space-y-1">
                                      {system.features.slice(0, 3).map((f, i) => (
                                        <li key={i} className="text-xs text-gray-600">
                                          • {f}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  handleToggleCompare(compareIds[idx])
                                }
                                className="mt-3 w-full py-2 text-sm font-semibold border rounded bg-white hover:bg-gray-50 transition"
                              >
                                Remove
                              </button>
                            </motion.div>
                          )
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
