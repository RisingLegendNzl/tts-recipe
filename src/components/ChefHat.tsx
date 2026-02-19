"use client";

interface ChefHatProps {
  isSpeaking: boolean;
  size?: number;
}

/**
 * Purple chef hat icon that pulses and shakes when the agent is speaking.
 * Uses a hand-crafted SVG for a distinctive look.
 */
export default function ChefHat({ isSpeaking, size = 120 }: ChefHatProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow ring behind the hat — visible only while speaking */}
      {isSpeaking && (
        <>
          <div
            className="absolute rounded-full glow-ring"
            style={{
              width: size * 1.8,
              height: size * 1.8,
              background:
                "radial-gradient(circle, rgba(107,47,160,0.25) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute rounded-full glow-ring"
            style={{
              width: size * 2.4,
              height: size * 2.4,
              background:
                "radial-gradient(circle, rgba(155,95,208,0.1) 0%, transparent 70%)",
              animationDelay: "0.8s",
            }}
          />
        </>
      )}

      {/* Chef hat SVG */}
      <div
        className={`relative z-10 transition-all duration-300 ${
          isSpeaking ? "chef-speaking" : ""
        }`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
        >
          {/* Hat body — the tall puffy part */}
          <ellipse
            cx="60"
            cy="42"
            rx="34"
            ry="30"
            fill="url(#hatGradient)"
          />
          {/* Left puff */}
          <circle cx="32" cy="48" r="16" fill="url(#puffLeft)" />
          {/* Right puff */}
          <circle cx="88" cy="48" r="16" fill="url(#puffRight)" />
          {/* Center top puff */}
          <circle cx="60" cy="20" r="18" fill="url(#puffTop)" />
          {/* Left-center puff */}
          <circle cx="42" cy="26" r="14" fill="url(#puffLeftCenter)" />
          {/* Right-center puff */}
          <circle cx="78" cy="26" r="14" fill="url(#puffRightCenter)" />

          {/* Hat band */}
          <rect
            x="30"
            y="60"
            width="60"
            height="14"
            rx="2"
            fill="url(#bandGradient)"
          />
          {/* Band detail line */}
          <line
            x1="34"
            y1="67"
            x2="86"
            y2="67"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />

          {/* Face area (subtle) */}
          <ellipse
            cx="60"
            cy="88"
            rx="22"
            ry="16"
            fill="url(#faceGradient)"
          />

          {/* Eyes */}
          <ellipse cx="52" cy="85" rx="2.5" ry="3" fill="#2A1540" />
          <ellipse cx="68" cy="85" rx="2.5" ry="3" fill="#2A1540" />
          {/* Eye highlights */}
          <circle cx="53" cy="84" r="0.8" fill="rgba(255,255,255,0.6)" />
          <circle cx="69" cy="84" r="0.8" fill="rgba(255,255,255,0.6)" />

          {/* Smile — wider when speaking */}
          {isSpeaking ? (
            <ellipse
              cx="60"
              cy="93"
              rx="5"
              ry="3.5"
              fill="#4A1F70"
              opacity="0.7"
            />
          ) : (
            <path
              d="M54 92 Q60 97 66 92"
              stroke="#4A1F70"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
          )}

          {/* Gradients */}
          <defs>
            <linearGradient
              id="hatGradient"
              x1="26"
              y1="20"
              x2="94"
              y2="70"
            >
              <stop offset="0%" stopColor="#9B5FD0" />
              <stop offset="50%" stopColor="#7B3FB8" />
              <stop offset="100%" stopColor="#6B2FA0" />
            </linearGradient>
            <radialGradient id="puffLeft" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#B07CE0" />
              <stop offset="100%" stopColor="#8348BC" />
            </radialGradient>
            <radialGradient id="puffRight" cx="60%" cy="35%">
              <stop offset="0%" stopColor="#A66DD5" />
              <stop offset="100%" stopColor="#7B3FB8" />
            </radialGradient>
            <radialGradient id="puffTop" cx="50%" cy="30%">
              <stop offset="0%" stopColor="#C896EE" />
              <stop offset="100%" stopColor="#9B5FD0" />
            </radialGradient>
            <radialGradient id="puffLeftCenter" cx="45%" cy="30%">
              <stop offset="0%" stopColor="#B580E0" />
              <stop offset="100%" stopColor="#8B4FC5" />
            </radialGradient>
            <radialGradient id="puffRightCenter" cx="55%" cy="30%">
              <stop offset="0%" stopColor="#B580E0" />
              <stop offset="100%" stopColor="#8B4FC5" />
            </radialGradient>
            <linearGradient id="bandGradient" x1="30" y1="60" x2="30" y2="74">
              <stop offset="0%" stopColor="#4A1F70" />
              <stop offset="100%" stopColor="#3A1558" />
            </linearGradient>
            <radialGradient id="faceGradient" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#F5E6D3" />
              <stop offset="100%" stopColor="#E8D4BE" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
