import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AIRWISE_STORAGE_KEY,
  clearPersistedState,
  isValidPageId,
  loadPersistedState,
  parseHashPage,
  parsePersistedStateJson,
  resolveInitialPage,
  savePersistedState,
} from './storage.ts';

test('parsePersistedStateJson validates schema, rejects oversized payloads, malformed JSON, and prototype pollution', () => {
  assert.deepEqual(parsePersistedStateJson(null), {});
  assert.deepEqual(parsePersistedStateJson(''), {});
  assert.deepEqual(parsePersistedStateJson('{bad-json'), {});
  assert.deepEqual(parsePersistedStateJson('x'.repeat(64 * 1024 + 10)), {});

  const protoPayload = '{"__proto__":{"polluted":true},"locationId":"delhi-in"}';
  assert.deepEqual(parsePersistedStateJson(protoPayload), {});

  const invalidSchemaPayload = JSON.stringify({
    profile: { householdSize: 999 },
  });
  assert.deepEqual(parsePersistedStateJson(invalidSchemaPayload), {});

  const validPayload = JSON.stringify({
    locationId: 'tokyo-jp',
    completedTaskIds: ['bed-1'],
    joinedChallengeIds: ['chal-transit'],
  });
  assert.deepEqual(parsePersistedStateJson(validPayload), {
    locationId: 'tokyo-jp',
    completedTaskIds: ['bed-1'],
    joinedChallengeIds: ['chal-transit'],
  });
});

test('isValidPageId, parseHashPage, and resolveInitialPage resolve routes safely', () => {
  assert.equal(isValidPageId('dashboard'), true);
  assert.equal(isValidPageId('calculator'), true);
  assert.equal(isValidPageId('not-a-page'), false);

  assert.equal(parseHashPage('#calculator'), 'calculator');
  assert.equal(parseHashPage('#unknown-page'), null);
  assert.equal(parseHashPage(''), null);

  assert.equal(resolveInitialPage('?autostart=1', '#settings'), 'dashboard');
  assert.equal(resolveInitialPage('', '#calculator'), 'calculator');
  assert.equal(resolveInitialPage('', '#invalid'), 'landing');
  assert.equal(resolveInitialPage('', ''), 'landing');
});

test('loadPersistedState, savePersistedState, and clearPersistedState safely handle storage', () => {
  const store = new Map<string, string>();
  const prevStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => {
        store.set(key, val);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });

  try {
    savePersistedState({ locationId: 'pune-in', readAlertIds: ['a1'] });
    assert.ok(store.has(AIRWISE_STORAGE_KEY));
    assert.deepEqual(loadPersistedState(), { locationId: 'pune-in', readAlertIds: ['a1'] });

    clearPersistedState();
    assert.equal(store.has(AIRWISE_STORAGE_KEY), false);
    assert.deepEqual(loadPersistedState(), {});
  } finally {
    if (prevStorage) {
      Object.defineProperty(globalThis, 'localStorage', prevStorage);
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    }
  }
});
