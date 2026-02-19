export interface RecipeStep {
  number: number;
  title: string;
  instruction: string;
  duration: string;
}

export interface Recipe {
  title: string;
  subtitle: string;
  servings: string;
  totalTime: string;
  steps: RecipeStep[];
}

export const recipe: Recipe = {
  title: "Lemon Garlic Butter Shrimp",
  subtitle: "Quick, bright, and impossibly buttery",
  servings: "2 servings",
  totalTime: "12 minutes",
  steps: [
    {
      number: 1,
      title: "Sear the Shrimp",
      instruction:
        "Heat 1 tablespoon of butter in a large skillet over high heat until it foams. Add 1/2 pound of peeled shrimp in a single layer. Sear for 90 seconds per side until golden pink. Remove to a plate.",
      duration: "4 min",
    },
    {
      number: 2,
      title: "Build the Sauce",
      instruction:
        "Reduce heat to medium. Add 3 minced garlic cloves and cook for 30 seconds until fragrant. Pour in the juice of one lemon and 2 tablespoons of butter. Swirl the pan until the butter melts into a glossy sauce.",
      duration: "3 min",
    },
    {
      number: 3,
      title: "Finish & Serve",
      instruction:
        "Return the shrimp to the pan and toss to coat in the sauce. Remove from heat. Sprinkle with fresh parsley and a pinch of red pepper flakes. Serve immediately over crusty bread or rice.",
      duration: "2 min",
    },
  ],
};

/**
 * The greeting the agent speaks immediately when the session connects.
 * This is injected via overrides.agent.firstMessage so the TTS plays
 * it automatically without waiting for dashboard configuration.
 */
export const agentFirstMessage =
  "Welcome! I'm here to walk you through making lemon garlic butter shrimp. It's quick, delicious, and only takes about 12 minutes. When you're ready, just say the word and we'll start cooking!";

/**
 * System prompt for the ElevenLabs Conversational AI Agent.
 * Injected via overrides.agent.prompt.prompt at session start so the
 * agent has full recipe context for natural conversation.
 */
export const agentSystemPrompt = `You are a warm, encouraging home cooking assistant. You are guiding someone through making Lemon Garlic Butter Shrimp.

Here is the full recipe:

LEMON GARLIC BUTTER SHRIMP (Serves 2, 12 minutes)

Step 1 — Sear the Shrimp (4 min):
Heat 1 tablespoon of butter in a large skillet over high heat until it foams. Add half a pound of peeled shrimp in a single layer. Sear for 90 seconds per side until golden pink. Remove to a plate.

Step 2 — Build the Sauce (3 min):
Reduce heat to medium. Add 3 minced garlic cloves and cook for 30 seconds until fragrant. Pour in the juice of one lemon and 2 tablespoons of butter. Swirl the pan until the butter melts into a glossy sauce.

Step 3 — Finish & Serve (2 min):
Return the shrimp to the pan and toss to coat in the sauce. Remove from heat. Sprinkle with fresh parsley and a pinch of red pepper flakes. Serve immediately over crusty bread or rice.

BEHAVIOR:
- You have already greeted the user. Wait for them to say they are ready before reading Step 1.
- When the user says "read the recipe", read all three steps in order, pausing briefly between each.
- When the user asks for a specific step (e.g. "read step 2", "go to step three"), read only that step.
- When the user asks "what's the next step?" or "next", read the step that follows the last one you read.
- Read each step naturally and conversationally — not robotically. Add small encouraging remarks.
- After reading each step, ask if they have questions or if they're ready to move on.
- If the user asks a question mid-step, answer helpfully and then offer to continue.
- Keep a natural, friendly pace. You're cooking alongside them, not lecturing.
- When the recipe is done, congratulate them warmly.
- Keep responses concise — you're in a kitchen, not writing an essay.`;
