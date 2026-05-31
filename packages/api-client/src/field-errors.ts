export function normalizeFieldErrors(
  raw?: Record<string, string | string[]>,
): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim()) {
      out[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === "string" && v.trim());
      if (first) out[key] = first;
    }
  }
  return out;
}

export async function parseFieldErrorsFromResponse(
  res: Response,
): Promise<Record<string, string>> {
  try {
    const body = (await res.json()) as { errors?: Record<string, string | string[]> };
    return normalizeFieldErrors(body.errors);
  } catch {
    return {};
  }
}
