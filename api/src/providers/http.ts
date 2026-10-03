import { AppError } from "../http/errors.js";

export async function postJson(input: {
  url: string;
  token?: string | undefined;
  body: unknown;
  timeoutMs?: number;
}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(input.url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}),
      },
      body: JSON.stringify(input.body),
      signal: AbortSignal.timeout(input.timeoutMs ?? 45_000),
    });
  } catch (cause) {
    throw new AppError("INTERNAL", "Provider request failed", { cause });
  }

  if (!response.ok) {
    throw new AppError("INTERNAL", `Provider returned HTTP ${response.status}`);
  }

  try {
    return await response.json();
  } catch (cause) {
    throw new AppError("INTERNAL", "Provider returned invalid JSON", { cause });
  }
}
