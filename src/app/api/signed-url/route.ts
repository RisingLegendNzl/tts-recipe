import { NextResponse } from "next/server";

/**
 * Generates a signed URL for ElevenLabs Conversational AI.
 * This keeps the API key server-side and provides a short-lived
 * token the client can use to establish the WebSocket connection.
 */
export async function GET() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return NextResponse.json(
      { error: "Missing ElevenLabs configuration" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs signed URL error:", errorText);
      return NextResponse.json(
        { error: "Failed to get signed URL" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error("ElevenLabs signed URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
