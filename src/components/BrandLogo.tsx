import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTextLockup?: boolean;
  storeName?: string;
  customLogoUrl?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

/**
 * Exact vector reproduction of the Zain Fast Food circular emblem logo:
 * - Deep black circular crest
 * - Golden gradient chef's toque (hat) crowning the circular ring
 * - Bold golden script "Zain" with two red flame/leaf accents above the "i" and red swoosh underline
 * - Bold white "FAST FOOD"
 * - Golden script "— Fresh. Hot. Delivered. —"
 * - Crossed golden fork & knife at bottom
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTextLockup = true,
  storeName = 'Zain Fast Food',
  customLogoUrl,
  className = '',
}) => {
  const dimensionClass = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt={`${storeName} Logo`}
          referrerPolicy="no-referrer"
          className={`${dimensionClass} rounded-full object-cover bg-[#0A0A0A] border border-[#FFC928]/40 shrink-0 shadow-xs`}
        />
      ) : (
        <svg
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={`${storeName} — Fresh. Hot. Delivered.`}
          className={`${dimensionClass} rounded-full shrink-0 shadow-sm`}
        >
          <defs>
            <linearGradient id="zainGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF0A8" />
              <stop offset="35%" stopColor="#FFC928" />
              <stop offset="75%" stopColor="#E59312" />
              <stop offset="100%" stopColor="#C87108" />
            </linearGradient>
            <linearGradient id="zainRedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E61E2A" />
              <stop offset="100%" stopColor="#B8141E" />
            </linearGradient>
          </defs>

          {/* Deep Black Circular Emblem Backdrop */}
          <circle cx="120" cy="120" r="118" fill="#070708" />

          {/* Outer Golden Ring (Left, Right, Bottom Arcs) */}
          <path
            d="M 68 58 A 88 88 0 0 0 34 128"
            stroke="url(#zainGoldGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 172 58 A 88 88 0 0 1 206 116"
            stroke="url(#zainGoldGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 42 152 A 86 86 0 0 0 206 132"
            stroke="url(#zainGoldGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Golden Chef Hat (Toque) Crowning the Top */}
          <path
            d="M 88 64
               C 72 64, 66 44, 84 36
               C 84 22, 118 14, 136 30
               C 156 26, 170 46, 150 58
               L 150 74
               Q 120 66, 90 74
               Z"
            stroke="url(#zainGoldGrad)"
            strokeWidth="6"
            strokeLinejoin="round"
            fill="#070708"
          />
          {/* Chef Hat Headband */}
          <path
            d="M 90 70 Q 120 62, 150 70"
            stroke="url(#zainGoldGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Two Red Accent Leaves/Flames Above the 'i' */}
          <path
            d="M 157 86 C 157 74, 166 68, 173 69 C 170 77, 164 83, 157 86 Z"
            fill="url(#zainRedGrad)"
          />
          <path
            d="M 161 91 C 166 83, 175 80, 182 83 C 176 89, 169 91, 161 91 Z"
            fill="url(#zainRedGrad)"
          />

          {/* Bold Golden Script "Zain" */}
          <text
            x="118"
            y="128"
            textAnchor="middle"
            fill="url(#zainGoldGrad)"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="68"
            letterSpacing="-2"
          >
            Zain
          </text>

          {/* Red Swoosh Underline Beneath "Zain" */}
          <path
            d="M 86 139 Q 142 126, 192 144 Q 140 135, 86 139 Z"
            fill="url(#zainRedGrad)"
          />

          {/* Bold White "FAST FOOD" */}
          <text
            x="120"
            y="163"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="'Outfit', 'Plus Jakarta Sans', sans-serif"
            fontWeight="800"
            fontSize="21"
            letterSpacing="4.5"
          >
            FAST FOOD
          </text>

          {/* Golden Script Tagline "— Fresh. Hot. Delivered. —" */}
          <line
            x1="54"
            y1="178"
            x2="68"
            y2="178"
            stroke="url(#zainGoldGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <text
            x="120"
            y="182"
            textAnchor="middle"
            fill="url(#zainGoldGrad)"
            fontFamily="Georgia, serif"
            fontStyle="italic"
            fontWeight="600"
            fontSize="13.5"
          >
            Fresh. Hot. Delivered.
          </text>
          <line
            x1="172"
            y1="178"
            x2="186"
            y2="178"
            stroke="url(#zainGoldGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Crossed Golden Fork & Knife at Bottom */}
          <g stroke="url(#zainGoldGrad)" strokeWidth="2.8" strokeLinecap="round">
            {/* Fork */}
            <line x1="108" y1="191" x2="132" y2="209" />
            <line x1="104" y1="194" x2="109" y2="198" />
            <line x1="109" y1="189" x2="114" y2="193" />
            {/* Knife */}
            <line x1="132" y1="191" x2="108" y2="209" />
            <path
              d="M 132 191 C 136 194, 134 198, 125 200"
              fill="url(#zainGoldGrad)"
            />
          </g>
        </svg>
      )}

      {showTextLockup && (
        <span className="text-xl font-bold tracking-tight text-[#202124] font-display whitespace-nowrap">
          {storeName}
        </span>
      )}
    </div>
  );
};
