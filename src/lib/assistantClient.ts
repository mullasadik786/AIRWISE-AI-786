import type {
  AssistantStructuredReply,
  EnvironmentalSnapshot,
  FamilyProfile,
} from '../types/airwise.ts';
import { isPlainRecord, safeReadJsonRecord } from './http.ts';
import { AssistantOutputSchema } from './validation.ts';

export interface ChatExchange {
  id: string;
  question: string;
  reply: AssistantStructuredReply;
}

export type AssistantClientResult =
  | { ok: true; reply: AssistantStructuredReply }
  | { ok: false; error: string };

let exchangeSeq = 0;

/**
 * Generates a collision-resistant identifier using Web Crypto UUID when available,
 * falling back to a monotonic timestamp-sequence pair without Math.random().
 */
export function createExchangeId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  exchangeSeq += 1;
  return `exchange-${Date.now()}-${exchangeSeq}`;
}

/**
 * Formats a single assistant Q&A exchange as readable plain text / Markdown for clipboard or download.
 */
export function formatAssistantExchangeText(
  ex: ChatExchange,
  locationName: string
): string {
  return [
    `# AIRWISE AI Guidance (${locationName})`,
    `**Question:** ${ex.question}`,
    `**Summary:** ${ex.reply.summary}`,
    `**What Action to Take:** ${ex.reply.recommendation.what}`,
    `**Why It Matters:** ${ex.reply.recommendation.why}`,
    `**When to Act:** ${ex.reply.recommendation.when}`,
    `**Expected Benefits:** ${ex.reply.recommendation.expectedBenefits}`,
    `**Limitations:** ${ex.reply.recommendation.confidenceAndLimitations}`,
    `## Practical Next Steps\n${ex.reply.actionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
    `_${ex.reply.disclaimer}_`,
  ].join('\n\n');
}

function parseAssistantReply(raw: unknown): AssistantStructuredReply | null {
  const parsed = AssistantOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  const sourceRaw = isPlainRecord(raw) ? raw.source : undefined;
  const source: AssistantStructuredReply['source'] =
    sourceRaw === 'gemini-4-hydrogen' || sourceRaw === 'rule-engine-fallback'
      ? sourceRaw
      : 'rule-engine-fallback';

  return {
    ...parsed.data,
    source,
  };
}

/**
 * Sends a family air-quality question grounded in the active environmental snapshot
 * to the backend assistant route, returning a discriminated result with schema-validated reply.
 */
export async function askEnvironmentalAssistant(
  question: string,
  snapshot: EnvironmentalSnapshot,
  profile: FamilyProfile,
  signal?: AbortSignal
): Promise<AssistantClientResult> {
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      question,
      locationName: `${snapshot.location.name}, ${snapshot.location.country}`,
      countryCode: snapshot.location.countryCode,
      cpcbAqi: snapshot.cpcbAqi,
      cpcbCategory: snapshot.cpcbCategory,
      usAqi: snapshot.usAqi,
      pm25: snapshot.pollutants.pm25,
      pm10: snapshot.pollutants.pm10,
      no2: snapshot.pollutants.no2,
      o3: snapshot.pollutants.o3,
      temperatureC: snapshot.weather.temperatureC,
      humidityPercent: snapshot.weather.humidityPercent,
      windSpeedKmh: snapshot.weather.windSpeedKmh,
      dataStatus: snapshot.dataStatus,
      householdGroups: profile.groups,
    }),
  });

  const data = await safeReadJsonRecord(res);
  const reply = data ? parseAssistantReply(data.reply) : null;

  if (!res.ok || !reply) {
    const errorMessage =
      typeof data?.error === 'string'
        ? data.error
        : 'Could not generate advice right now. Please try again.';
    return { ok: false, error: errorMessage };
  }

  return { ok: true, reply };
}
