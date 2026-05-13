export default function BrandScene() {
  return (
    <div className="relative mx-auto flex h-[440px] w-full max-w-[520px] items-center justify-center overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-br from-[#10214f] via-[#1E3A8A] to-[#0f172a] p-6 shadow-[0_40px_120px_rgba(15,23,42,0.45)]">
      <div className="absolute -top-8 right-10 h-40 w-40 rounded-full bg-[#FACC15]/25 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#FF9933]/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,153,51,0.18),transparent_30%)]" />

      <svg viewBox="0 0 560 460" className="relative z-10 h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="bg-book" x1="145" y1="258" x2="400" y2="405" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7ED" />
            <stop offset="1" stopColor="#FACC15" />
          </linearGradient>
          <linearGradient id="robe" x1="236" y1="116" x2="348" y2="309" gradientUnits="userSpaceOnUse">
            <stop stopColor="#152a63" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="glow" x1="280" y1="95" x2="280" y2="290" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FACC15" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FACC15" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx="280" cy="124" r="64" stroke="#FACC15" strokeWidth="7" opacity="0.9" />
        <circle cx="280" cy="124" r="32" fill="#f8fafc" opacity="0.08" />
        <path d="M280 44l10 21.5L312 76l-22 9.5L280 108l-10-22.5L248 76l22-10.5L280 44z" fill="#FACC15" />
        <ellipse cx="280" cy="227" rx="104" ry="116" fill="url(#glow)" opacity="0.9" />

        <circle cx="280" cy="144" r="31" fill="#f6d2ad" />
        <path d="M232 220c5-42 27-69 48-69 21 0 43 27 48 69" stroke="#f6d2ad" strokeWidth="13" strokeLinecap="round" opacity="0.95" />
        <path d="M225 236c20-10 39-15 55-15 16 0 35 5 55 15l-15 75H240l-15-75z" fill="url(#robe)" />
        <path d="M210 321c36-26 82-39 136-39" stroke="#FF9933" strokeWidth="8" strokeLinecap="round" opacity="0.85" />
        <path d="M349 321c-36-26-82-39-136-39" stroke="#FF9933" strokeWidth="8" strokeLinecap="round" opacity="0.85" />

        <path d="M104 272c58-25 119-38 176-38v144c-66-39-129-53-176-46V272z" fill="url(#bg-book)" stroke="#F59E0B" strokeWidth="5" strokeLinejoin="round" />
        <path d="M456 272c-58-25-119-38-176-38v144c66-39 129-53 176-46V272z" fill="url(#bg-book)" stroke="#F59E0B" strokeWidth="5" strokeLinejoin="round" />
        <path d="M280 238v136" stroke="#1E3A8A" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
        <path d="M150 318c39-14 81-22 130-24m130 24c-39-14-81-22-130-24" stroke="#1E3A8A" strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />

        <path d="M122 385c35 20 74 30 116 30h84c42 0 81-10 116-30" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
        <path d="M76 406c137 14 271 14 408 0" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" opacity="0.18" />
      </svg>
    </div>
  );
}