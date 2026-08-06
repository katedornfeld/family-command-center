import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing ANTHROPIC_API_KEY. Add it to .env.local — see README.md. " +
      "This key is server-only and must never be exposed to the browser.",
  );
}

// Server-only Anthropic client. Never import this file from a Client
// Component or anything that ships to the browser.
export const anthropic = new Anthropic({ apiKey });
