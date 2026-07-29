'use client'

import React from 'react'

// Automatically mapped partners from the public/partners folder
const PARTNERS = [
  { name: 'Polygon', logo: '/partners/polygon-logo.svg' },
  { name: 'Miami FC', logo: '/partners/cropped-logo_Miami-FC.webp' },
  { name: 'Brooklyn FC', logo: '/partners/cropped-Brooklyn-FC-crest.webp' },
  { name: 'San Antonio FC', logo: '/partners/cropped-SAFC_PrimaryLogo_FullColor_LBg_RGB.webp' },
  { name: 'OKC United', logo: '/partners/OKCUnitedLogo.webp' },
  { name: 'Corporate', logo: '/partners/Corporate-Abbrev-RGB.png' },
]

export default function FooterPartnerTicker() {
  // Loop partners array for smooth infinite marquee animation
  const loopedPartners = [
    ...PARTNERS,
    ...PARTNERS,
    ...PARTNERS,
    ...PARTNERS
  ]

  return (
    <footer className="w-full bg-black border-t border-[#1a1a1a] pt-6 pb-12 overflow-hidden flex flex-col items-center select-none">
      {/* Noah Bishop Production Credit */}
      <p className="text-[9px] font-mono font-bold tracking-widest text-[#555] uppercase mb-1">
        A NOAH BISHOP PRODUCTION
      </p>

      {/* Trusted By Title */}
      <h4 className="text-[10px] font-extrabold tracking-[0.25em] text-[#888] uppercase mb-4 flex items-center gap-2">
        <span className="w-4 h-[1px] bg-[#333]" />
        <span>TRUSTED BY</span>
        <span className="w-4 h-[1px] bg-[#333]" />
      </h4>

      {/* Infinite Scrolling Ticker (Flowing Left) */}
      <div 
        className="w-full relative overflow-hidden py-2"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
        }}
      >
        <div className="flex w-max animate-ticker items-center gap-10 sm:gap-16">
          {loopedPartners.map((partner, idx) => (
            <div
              key={`${partner.name}-${idx}`}
              className="flex items-center justify-center shrink-0 group cursor-pointer"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-6 sm:h-8 max-w-[130px] object-contain opacity-60 group-hover:opacity-100 transition-all duration-300 filter grayscale brightness-125 group-hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Animation Styles */}
      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker 22s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </footer>
  )
}
