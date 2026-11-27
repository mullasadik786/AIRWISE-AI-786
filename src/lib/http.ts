/**
 * Safe HTTP JSON response reading helpers without blind type assertions.
 */

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Parses a Fetch Response body as a plain JSON record, returning null when the
 * response body is empty, non-JSON (e.g., proxy HTML error page), or not an object.
 */
export async function safeReadJsonRecord(res: Response): Promise<Record<string, unknown> | null> {
  try {
    const raw = await res.text();
    if (!raw.trim()) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPlainRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
