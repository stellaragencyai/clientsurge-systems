export default function SectionBreak() {
  return (
    <div className="bg-[#973535] py-24 opacity-100 rounded-none relative md:py-40 hidden"

    style={{
      background: "linear-gradient(to bottom, transparent 0%, rgba(0,136,204,0.02) 20%, rgba(0,136,204,0.05) 50%, rgba(0,136,204,0.02) 80%, transparent 100%)"
    }}>
      
      {/* Top soft fade-in from previous section */}
      <div
        className="absolute top-0 inset-x-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 50%, transparent 100%)"
        }} />
      

      {/* Center accent area with divider line and pulsing dot */}
      <div className="relative flex justify-center items-center h-16">
        {/* Horizontal line with glow shadow */}
        <div
          className="absolute w-2/3 max-w-[360px] h-px"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(0,136,204,0.18) 20%, rgba(0,174,239,0.28) 50%, rgba(0,136,204,0.18) 80%, transparent 100%)",
            boxShadow: "0 0 32px rgba(0,174,239,0.18), 0 0 8px rgba(0,136,204,0.15)"
          }} />
        

        {/* Pulsing accent dot in center */}
        <div
          className="relative w-2 h-2 rounded-full z-10"
          style={{
            background: "radial-gradient(circle, #00AEEF 0%, rgba(0,136,204,0.5) 70%)",
            boxShadow: "0 0 16px rgba(0,174,239,0.6), 0 0 32px rgba(0,136,204,0.3)",
            animation: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite"
          }} />
        
      </div>

      {/* Bottom soft fade-out into next section */}
      <div
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 50%, transparent 100%)"
        }} />
      
    </div>);

}
