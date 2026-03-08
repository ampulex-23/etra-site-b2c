'use client'

import React from 'react'

export function CyberVoid() {
  return (
    <div className="cyber-void">
      <svg
        className="cyber-void__svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(56,189,248,0.12)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
          <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(129,140,248,0.10)" />
            <stop offset="100%" stopColor="rgba(129,140,248,0)" />
          </radialGradient>
          <radialGradient id="glow3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(192,132,252,0.08)" />
            <stop offset="100%" stopColor="rgba(192,132,252,0)" />
          </radialGradient>
          <filter id="neonBlur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <filter id="neonBlurWide">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Ambient glow orbs */}
        <ellipse cx="200" cy="300" rx="250" ry="200" fill="url(#glow1)" opacity="0.5">
          <animate attributeName="cx" values="200;260;200" dur="12s" repeatCount="indefinite" />
          <animate attributeName="cy" values="300;340;300" dur="15s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="900" cy="500" rx="300" ry="250" fill="url(#glow2)" opacity="0.4">
          <animate attributeName="cx" values="900;840;900" dur="14s" repeatCount="indefinite" />
          <animate attributeName="cy" values="500;440;500" dur="11s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="600" cy="200" rx="200" ry="180" fill="url(#glow3)" opacity="0.35">
          <animate attributeName="cx" values="600;650;600" dur="16s" repeatCount="indefinite" />
        </ellipse>

        {/* Geometric lines — hexagonal grid fragments */}
        <g stroke="rgba(56,189,248,0.06)" strokeWidth="1" fill="none" filter="url(#neonBlur)">
          {/* Large hexagon - left */}
          <polygon points="150,200 230,160 310,200 310,280 230,320 150,280" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="8s" repeatCount="indefinite" />
          </polygon>
          {/* Medium hexagon - center */}
          <polygon points="550,350 610,320 670,350 670,410 610,440 550,410" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="6s" repeatCount="indefinite" />
          </polygon>
          {/* Small hexagon - right */}
          <polygon points="900,180 940,160 980,180 980,220 940,240 900,220" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="10s" repeatCount="indefinite" />
          </polygon>
        </g>

        {/* Diamond shapes */}
        <g stroke="rgba(129,140,248,0.05)" strokeWidth="0.8" fill="none" filter="url(#neonBlur)">
          <polygon points="400,100 450,150 400,200 350,150" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="9s" repeatCount="indefinite" />
          </polygon>
          <polygon points="800,400 860,470 800,540 740,470" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.8;0.5" dur="7s" repeatCount="indefinite" />
          </polygon>
          <polygon points="1050,300 1090,340 1050,380 1010,340" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="11s" repeatCount="indefinite" />
          </polygon>
        </g>

        {/* Thin crossing lines */}
        <g stroke="rgba(56,189,248,0.04)" strokeWidth="0.5" filter="url(#neonBlur)">
          <line x1="0" y1="400" x2="1200" y2="350">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="10s" repeatCount="indefinite" />
          </line>
          <line x1="100" y1="0" x2="400" y2="800">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="13s" repeatCount="indefinite" />
          </line>
          <line x1="800" y1="0" x2="1100" y2="800">
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="9s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="600" x2="1200" y2="550">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="12s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Circles — orbital rings */}
        <g stroke="rgba(192,132,252,0.04)" strokeWidth="0.6" fill="none" filter="url(#neonBlur)">
          <circle cx="300" cy="500" r="120" opacity="0.5">
            <animate attributeName="r" values="120;130;120" dur="8s" repeatCount="indefinite" />
          </circle>
          <circle cx="300" cy="500" r="80" opacity="0.3" />
          <circle cx="850" cy="250" r="90" opacity="0.4">
            <animate attributeName="r" values="90;100;90" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle cx="850" cy="250" r="55" opacity="0.25" />
        </g>

        {/* Small dots — stars/particles */}
        <g fill="rgba(56,189,248,0.15)">
          <circle cx="120" cy="150" r="1.5">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="480" cy="250" r="1">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="750" cy="120" r="1.5">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx="1050" cy="450" r="1">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="350" cy="650" r="1.2">
            <animate attributeName="opacity" values="0.3;0.9;0.3" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="650" cy="700" r="1">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="4.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="950" cy="600" r="1.5">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="5.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="450" r="1">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="7s" repeatCount="indefinite" />
          </circle>
          <circle cx="1100" cy="150" r="1.2">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Triangle fragments */}
        <g stroke="rgba(56,189,248,0.035)" strokeWidth="0.6" fill="none" filter="url(#neonBlur)">
          <polygon points="500,500 560,430 620,500" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.3;0.6" dur="8s" repeatCount="indefinite" />
          </polygon>
          <polygon points="100,600 140,550 180,600" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="6s" repeatCount="indefinite" />
          </polygon>
          <polygon points="1000,550 1040,500 1080,550" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="9s" repeatCount="indefinite" />
          </polygon>
        </g>

        {/* Faint grid lines — perspective */}
        <g stroke="rgba(56,189,248,0.02)" strokeWidth="0.5">
          <line x1="0" y1="200" x2="1200" y2="200" />
          <line x1="0" y1="400" x2="1200" y2="400" />
          <line x1="0" y1="600" x2="1200" y2="600" />
          <line x1="300" y1="0" x2="300" y2="800" />
          <line x1="600" y1="0" x2="600" y2="800" />
          <line x1="900" y1="0" x2="900" y2="800" />
        </g>
      </svg>
    </div>
  )
}
