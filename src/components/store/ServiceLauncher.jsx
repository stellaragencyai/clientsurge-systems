import { useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { PUBLIC_STORE_PRODUCTS, CANONICAL_SERVICE_PRODUCTS } from "@/lib/salesCatalog";
import { base44 } from "@/api/base44Client";

export default function ServiceLauncher({ onClose }) {
  const [selectedServices, setSelectedServices] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    business_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleService = (productId) => {
    setSelectedServices((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLaunch = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!formData.customer_name || !formData.customer_email || !formData.business_name) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (selectedServices.length === 0) {
      setError("Please select at least one service.");
      setLoading(false);
      return;
    }

    try {
      // Check if running in iframe
      if (window.self !== window.top) {
        setError("Checkout must be completed from the published app, not from a preview.");
        setLoading(false);
        return;
      }

      // Call createCheckoutSession with deploy_immediately: true
      const response = await base44.functions.invoke("createCheckoutSession", {
        product_ids: selectedServices,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        business_name: formData.business_name,
        deploy_immediately: true, // Fast-track flag
      });

      if (response?.data?.url) {
        window.location.href = response.data.url;
      } else {
        setError("Failed to create checkout session. Please try again.");
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProductDetails = selectedServices
    .map((id) => CANONICAL_SERVICE_PRODUCTS.find((p) => p.product_id === id))
    .filter(Boolean);

  const totalSetup = selectedProductDetails.reduce((sum, p) => sum + p.setup_fee, 0);
  const totalMonthly = selectedProductDetails.reduce((sum, p) => sum + p.monthly_fee, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Deploy Your System</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose services and activate instantly</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Error State */}
          {error && (
            <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Service Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Select Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CANONICAL_SERVICE_PRODUCTS.map((product) => (
                <button
                  key={product.product_id}
                  onClick={() => toggleService(product.product_id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedServices.includes(product.product_id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{product.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                      <p className="text-sm font-bold text-primary mt-2">
                        ${product.setup_fee} setup + ${product.monthly_fee}/mo
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Your Information</h3>
            <form className="space-y-4">
              <input
                type="text"
                name="customer_name"
                placeholder="Full Name *"
                value={formData.customer_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="email"
                name="customer_email"
                placeholder="Email Address *"
                value={formData.customer_email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="tel"
                name="customer_phone"
                placeholder="Phone Number"
                value={formData.customer_phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                name="business_name"
                placeholder="Business Name *"
                value={formData.business_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>
          </div>

          {/* Pricing Summary */}
          {selectedServices.length > 0 && (
            <div className="bg-card p-4 rounded-xl border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Setup Fee:</span>
                <span className="font-semibold">${totalSetup.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly:</span>
                <span className="font-semibold">${totalMonthly.toLocaleString()}/mo</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-semibold text-foreground">Total Today:</span>
                <span className="font-bold text-primary text-lg">${totalSetup.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleLaunch}
            disabled={loading || selectedServices.length === 0}
            className="w-full h-12 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-bold flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creating Checkout...
              </>
            ) : (
              "Deploy System Now"
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            You'll be redirected to complete your secure payment. Your AI system will begin provisioning immediately upon payment confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}