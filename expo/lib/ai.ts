/** Rork AI proxy constants — no dependency on the `ai` SDK package. */
export const TOOLKIT_URL = process.env["EXPO_PUBLIC_TOOLKIT_URL"] as string;
export const SECRET_KEY = process.env["EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY"] as string;

/** Vision-capable language model used for bed analysis. */
export const VISION_MODEL = "openai/gpt-4.1-mini";
