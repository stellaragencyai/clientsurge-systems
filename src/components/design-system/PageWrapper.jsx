/**
 * PageWrapper — standard layout shell for all sub-pages (legal, about, FAQ, etc.)
 * Enforces: consistent max-width, responsive padding, and safe-area awareness.
 * Children render inside a semantic <main> with standard spacing.
 */
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";

export default function PageWrapper({ children, className = "" }) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <Navbar />
      <main
        className="px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: "calc(var(--cs-nav-height) + 2rem)" }}
      >
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}