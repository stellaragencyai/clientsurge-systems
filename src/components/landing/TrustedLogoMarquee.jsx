const LOGOS = [
  {
    name: "Google",
    src: "/logos/trusted-marquee/google.svg",
    heightClass: "h-12",
  },
  {
    name: "Apple",
    src: "/logos/trusted-marquee/apple.svg",
    heightClass: "h-12",
  },
  {
    name: "Microsoft",
    src: "/logos/trusted-marquee/microsoft.svg",
    heightClass: "h-12",
  },
  {
    name: "Meta",
    src: "/logos/trusted-marquee/meta.svg",
    heightClass: "h-16",
  },
  {
    name: "Netflix",
    src: "/logos/trusted-marquee/netflix.svg",
    heightClass: "h-20",
  },
  {
    name: "NVIDIA",
    src: "/logos/trusted-marquee/nvidia.svg",
    heightClass: "h-12",
  },
  {
    name: "Spotify",
    src: "/logos/trusted-marquee/spotify.svg",
    heightClass: "h-12",
  },
  {
    name: "Canva",
    src: "/logos/trusted-marquee/Canva.svg",
    heightClass: "h-12",
  },
  {
    name: "Salesforce",
    src: "/logos/trusted-marquee/salesforce.svg",
    heightClass: "h-20",
  },
  {
    name: "Notion",
    src: "/logos/trusted-marquee/notion.svg",
    heightClass: "h-12",
  },
];

function LogoRow() {
  return (
    <div className="flex shrink-0 items-center">
      {LOGOS.map((logo) => (
        <div
          key={logo.name}
          className="mx-8 flex h-20 shrink-0 items-center justify-center"
        >
          <img
            src={logo.src}
            alt={logo.name}
            className={`${logo.heightClass} w-auto object-contain`}
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}

export default function TrustedLogoMarquee() {
  return (
    <div className="mt-10 text-center">
      <p className="mb-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Trusted by 1,000,000+ users including at
      </p>
      <div
        className="mx-auto max-w-2xl overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <div className="flex w-max animate-client-logo-scroll">
          <LogoRow />
          <LogoRow />
        </div>
      </div>

      <style>{`
        @keyframes client-logo-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-client-logo-scroll {
          animation: client-logo-scroll 22s linear infinite;
        }
      `}</style>
    </div>
  );
}
