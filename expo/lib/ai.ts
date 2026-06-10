/** Rork AI proxy constants — no dependency on the `ai` SDK package. */

export const TOOLKIT_URL = process.env["EXPO_PUBLIC_TOOLKIT_URL"] as string;
export const SECRET_KEY = process.env["EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY"] as string;

/**
 * Vision-capable language model used for bed analysis.
 *
 * openai/gpt-4.1-nano was chosen over the previous gpt-4.1-mini because:
 *   - 4x cheaper input ($0.10/M vs $0.40/M tokens)
 *   - Faster (optimised for high-throughput classification / simple instruction tasks)
 *   - Vision-capable — accepts image_url content parts via chat completions
 *   - Released June 2025; well-established in the gateway
 *
 * Rejected alternatives:
 *   - google/gemini-2.5-flash-lite (same price, less structured JSON output)
 *   - openai/gpt-4o-mini (50% more expensive, overkill for bed scoring)
 */
export const VISION_MODEL = "openai/gpt-4.1-nano";

/** Timeout for the AI analysis call — generous enough for image upload + inference */
export const AI_TIMEOUT_MS = 45_000;
