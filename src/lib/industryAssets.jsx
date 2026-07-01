/**
 * Industry-specific SVG patterns and metadata
 * Extracted from Industries.jsx to keep the component focused on rendering logic
 */

export const industryPatterns = {
  "med-spa": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-medspa" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="16" cy="16" r="10" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="16" cy="16" r="4" fill="white"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-medspa)"/>
    </svg>
  ),
  "dental": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-dental" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
        <line x1="0" y1="14" x2="28" y2="14" stroke="white" strokeWidth="1"/>
        <line x1="14" y1="0" x2="14" y2="28" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-dental)"/>
    </svg>
  ),
  "chiro-pt": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-chiro" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <polygon points="20,4 36,36 4,36" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-chiro)"/>
    </svg>
  ),
  "hvac": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-hvac" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect x="4" y="4" width="16" height="16" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="9" y="9" width="6" height="6" fill="white"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-hvac)"/>
    </svg>
  ),
  "plumbing": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-plumbing" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M15 3 C22 12 25 17 25 22 A10 10 0 0 1 5 22 C5 17 8 12 15 3Z" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-plumbing)"/>
    </svg>
  ),
  "roofing": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-roofing" x="0" y="0" width="36" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,20 L18,0 L36,20" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-roofing)"/>
    </svg>
  ),
  "contractors": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-contractors" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="30" y2="30" stroke="white" strokeWidth="1"/>
        <line x1="30" y1="0" x2="0" y2="30" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-contractors)"/>
    </svg>
  ),
  "real-estate": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-realestate" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect x="6" y="16" width="28" height="20" fill="none" stroke="white" strokeWidth="1"/>
        <polygon points="4,16 20,4 36,16" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-realestate)"/>
    </svg>
  ),
  "personal-injury": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-law" x="0" y="0" width="34" height="34" patternUnits="userSpaceOnUse">
        <line x1="17" y1="2" x2="17" y2="32" stroke="white" strokeWidth="1"/>
        <line x1="6" y1="10" x2="28" y2="10" stroke="white" strokeWidth="1"/>
        <ellipse cx="17" cy="32" rx="8" ry="2" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-law)"/>
    </svg>
  ),
  "property-services": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-property" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect x="4" y="8" width="24" height="20" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="10" y="14" width="4" height="4" fill="white"/>
        <rect x="18" y="14" width="4" height="4" fill="white"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-property)"/>
    </svg>
  ),
  "veterinary": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-vet" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
        <circle cx="18" cy="12" r="4" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="10" cy="20" r="4" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="26" cy="20" r="4" fill="none" stroke="white" strokeWidth="1"/>
        <ellipse cx="18" cy="26" rx="5" ry="3" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-vet)"/>
    </svg>
  ),
};

export const FILTER_TAGS = [
  { id: "all", label: "All Industries" },
  { id: "health", label: "Health & Medical" },
  { id: "home", label: "Home Services" },
];

export const INDUSTRY_TAGS = {
  "med-spa": "health",
  dental: "health",
  "chiro-pt": "health",
  hvac: "home",
  roofing: "home",
  contractors: "home",
};
