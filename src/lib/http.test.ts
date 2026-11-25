import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoFallbackSnapshot, PRESET_CITIES } from '../data/presets.ts';
import { DEFAULT_PROFILE } from '../hooks/useAirwiseState.ts';
import { askEnvironmentalAssistant } from './assistantClient.ts';
import { isPlainRecord, safeReadJsonRecord } from './http.ts';

test('isPlainRecord and safeReadJsonRecord handle valid, empty, primitive, and HTML error bodies safely', async () => {
  assert.equal(isPlainRecord({ ok: true }), true);
  assert.equal(isPlainRecord(null), false);
  assert.equal(isPlainRecord(['a', 'b']), false);
  assert.equal(isPlainRecord('text'), false);

  assert.deepEqual(
    await safeReadJsonRecord(new Response('{"status":"ok","count":2}', { status: 200 })),
    { status: 'ok', count: 2 }
  );
  assert.equal(await safeReadJsonRecord(new Response(null, { status: 204 })), null);
  assert.equal(await safeReadJsonRecord(new Response('', { status: 200 })), null);
  assert.equal(await safeReadJsonRecord(new Response('[1,2,3]', { status: 200 })), null);
  assert.equal(
    await safeReadJsonRecord(new Response('<html>502 Bad Gateway</html>', { status: 502 })),
    null
  );
});

test('askEnvironmentalAssistant returns discriminated ok/error results with schema validation', async () => {
  const delhi = buildDemoFallbackSnapshot(PRESET_CITIES[0]);
  const originalFetch = globalThis.fetch;

  const validReply = {
    summary: 'Outdoor PM2.5 is high; keep children indoors today.',
    measuredFacts: ['PM2.5 is 140 µg/m³ (CPCB Poor/Very Poor).'],
    contextualEstimates: ['Running HEPA indoors reduces bedroom particulate load.'],
    recommendation: {
      what: 'Keep vigorous exercise indoors and close exterior windows.',
      why: 'Deep breathing during play raises inhaled PM2.5 dose substantially.',
      when: 'Throughout today until AQI drops below 150.',
      expectedBenefits: 'Lower respiratory irritation for children.',
      estimatedImpact: 'Substantial reduction in daily inhaled particulates.',
      confidenceAndLimitations: 'Depends on indoor sealing and filtration.',
    },
    actionSteps: ['Move outdoor play indoors', 'Run HEPA purifier on medium speed'],
    disclaimer: 'Environmental decision support only; not medical advice.',
    source: 'rule-engine-fallback',
  };

  try {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ reply: validReply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch;

    const okResult = await askEnvironmentalAssistant(
      'Is outdoor play safe today?',
      delhi,
      DEFAULT_PROFILE
    );
    assert.equal(okResult.ok, true);
    if (okResult.ok) {
      assert.equal(okResult.reply.summary, validReply.summary);
      assert.equal(okResult.reply.source, 'rule-engine-fallback');
    }

    // Non-JSON proxy 502 response must return ok: false without throwing SyntaxError
    globalThis.fetch = (async () =>
      new Response('<html>502 Bad Gateway</html>', { status: 502 })) as typeof fetch;

    const htmlErrResult = await askEnvironmentalAssistant(
      'Is outdoor play safe today?',
      delhi,
      DEFAULT_PROFILE
    );
    assert.equal(htmlErrResult.ok, false);
    if (!htmlErrResult.ok) {
      assert.ok(htmlErrResult.error.length > 5);
    }

    // Incomplete/malformed reply payload fails schema guard cleanly
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ reply: { summary: 'short' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch;

    const badSchemaResult = await askEnvironmentalAssistant(
      'Is outdoor play safe today?',
      delhi,
      DEFAULT_PROFILE
    );
    assert.equal(badSchemaResult.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
