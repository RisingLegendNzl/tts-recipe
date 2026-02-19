# 🧑‍🍳 Voice Cooking — ElevenLabs v3 TTS Recipe App

A minimal, focused recipe app with real-time voice cooking powered by ElevenLabs Conversational AI v3.

## Directory Structure

```
tts-recipe-app/
├── .env.local                    # Local env vars (not committed)
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Recipe card (main page)
│   │   ├── globals.css           # Global styles & animations
│   │   └── voice/
│   │       └── page.tsx          # Voice cooking tab
│   ├── components/
│   │   ├── RecipeCard.tsx        # Recipe card with Voice Cooking button
│   │   ├── ChefHat.tsx           # Animated purple chef hat icon
│   │   └── VoiceCooking.tsx      # Voice interaction UI
│   ├── hooks/
│   │   └── useElevenLabsConversation.ts  # ElevenLabs v3 streaming hook
│   └── lib/
│       └── recipe.ts             # Recipe data
└── vercel.json                   # Vercel config (optional)
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and add your ElevenLabs credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` — Your ElevenLabs Conversational AI Agent ID
- `ELEVENLABS_API_KEY` — Your ElevenLabs API key (server-side only)

### 3. ElevenLabs Agent Setup

1. Go to [ElevenLabs](https://elevenlabs.io) → Conversational AI → Create Agent
2. Configure the agent with the system prompt found in `src/lib/recipe.ts`
3. Copy the Agent ID into your `.env.local`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Vercel Deployment

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)

| Variable | Type | Description |
|---|---|---|
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Public | ElevenLabs Conversational AI Agent ID |
| `ELEVENLABS_API_KEY` | Secret | ElevenLabs API key for signed URLs |

### Deploy

```bash
vercel --prod
```

## How It Works

1. **Recipe Card** — Displays a 3-step recipe with a "Voice Cooking" button
2. **Voice Cooking Tab** — Opens in a new tab; ElevenLabs v3 greets the user
3. **Streaming TTS** — Uses WebSocket streaming for zero-gap audio playback
4. **Natural Conversation** — User speaks naturally; the agent responds continuously
5. **Chef Hat Animation** — Purple chef hat pulses and shakes during TTS playback
