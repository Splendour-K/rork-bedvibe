import * as ImageManipulator from "expo-image-manipulator";

export async function resizeForUpload(
  uri: string,
  maxBytes: number = 3 * 1024 * 1024
): Promise<{ base64: string; mimeType: string }> {
  const steps = [
    { width: 1280, quality: 0.82 },
    { width: 1024, quality: 0.78 },
    { width: 832, quality: 0.74 },
    { width: 640, quality: 0.7 },
    { width: 512, quality: 0.65 },
  ];

  for (const step of steps) {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: step.width } }],
        {
          compress: step.quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulated.base64) continue;

      const base64 = stripDataUriPrefix(manipulated.base64);
      const byteLength = getByteLength(base64);

      if (byteLength <= maxBytes) {
        return { base64, mimeType: "image/jpeg" };
      }
    } catch {
      // continue to next step
    }
  }

  throw new Error("IMAGE_TOO_LARGE");
}

function stripDataUriPrefix(b64: string): string {
  if (!b64.startsWith("data:")) return b64;
  const comma = b64.indexOf(",");
  return comma === -1 ? b64 : b64.slice(comma + 1);
}

function getByteLength(base64: string): number {
  const len = base64.length;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (len * 3) / 4 - padding;
}
