"use client";

import { recipe } from "@/lib/recipe";

/**
 * Recipe card displayed on the main page.
 * Contains the 3-step recipe and a "Voice Cooking" button
 * that opens the voice interaction in a new tab.
 */
export default function RecipeCard() {
  const handleVoiceCooking = () => {
    window.open("/voice", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative w-full max-w-lg">
      {/* Card */}
      <div
        className="relative bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 1px 2px rgba(26,22,17,0.04), 0 4px 12px rgba(26,22,17,0.06), 0 20px 48px rgba(26,22,17,0.08)",
        }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-terracotta via-plum to-sage" />

        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <p className="font-body text-xs font-medium tracking-[0.2em] uppercase text-terracotta/80 mb-2">
            Quick &amp; Easy
          </p>
          <h1 className="font-display text-3xl text-warmblack leading-tight">
            {recipe.title}
          </h1>
          <p className="font-body text-warmblack/50 mt-1.5 text-sm">
            {recipe.subtitle}
          </p>

          {/* Meta */}
          <div className="flex gap-6 mt-5 pb-5 border-b border-warmblack/8">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-sage"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
              <span className="font-body text-sm text-warmblack/60">
                {recipe.totalTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-sage"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  d="M16 7a4 4 0 01-8 0M12 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-body text-sm text-warmblack/60">
                {recipe.servings}
              </span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="px-8 pb-6">
          {recipe.steps.map((step, index) => (
            <div
              key={step.number}
              className={`py-5 ${
                index < recipe.steps.length - 1
                  ? "border-b border-warmblack/5"
                  : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-warmblack/5 flex items-center justify-center">
                  <span className="font-display text-sm text-warmblack/70">
                    {step.number}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-display text-lg text-warmblack">
                      {step.title}
                    </h3>
                    <span className="font-body text-xs text-warmblack/35 ml-3 flex-shrink-0">
                      {step.duration}
                    </span>
                  </div>
                  <p className="font-body text-sm text-warmblack/55 leading-relaxed">
                    {step.instruction}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Voice Cooking button */}
        <div className="px-8 pb-8">
          <button
            onClick={handleVoiceCooking}
            className="w-full group relative overflow-hidden rounded-xl py-4 px-6 transition-all duration-300 hover:scale-[1.015] active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(135deg, #6B2FA0 0%, #8348BC 50%, #6B2FA0 100%)",
              boxShadow:
                "0 4px 16px rgba(107,47,160,0.3), 0 1px 3px rgba(107,47,160,0.2)",
            }}
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transition: 'transform 0.8s ease, opacity 0.3s ease' }} />

            <div className="relative flex items-center justify-center gap-3">
              {/* Mini chef hat icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
              >
                <ellipse cx="12" cy="9" rx="7" ry="6" fill="white" opacity="0.9" />
                <circle cx="7" cy="10" r="3" fill="white" opacity="0.8" />
                <circle cx="17" cy="10" r="3" fill="white" opacity="0.8" />
                <circle cx="12" cy="5" r="3.5" fill="white" opacity="0.95" />
                <rect x="7" y="13" width="10" height="3" rx="0.5" fill="white" opacity="0.7" />
              </svg>
              <span className="font-body font-medium text-white tracking-wide">
                Voice Cooking
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
