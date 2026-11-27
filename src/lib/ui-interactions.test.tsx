import test, { after, afterEach, before } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import type * as TestingLibraryReact from '@testing-library/react';
import type { ReactNode } from 'react';
import { buildDemoFallbackSnapshot, PRESET_CITIES } from '../data/presets.ts';
import { buildSmartAlerts, getInitialIndoorChecklist } from './recommendations.ts';
import { DEFAULT_ALERT_PREFS, DEFAULT_CALC_INPUT, DEFAULT_PROFILE } from './storage.ts';
import { ExposureSimulatorCard } from '../components/ExposureSimulatorCard.tsx';
import { CalculatorPage } from '../pages/CalculatorPage.tsx';
import { SettingsPage } from '../pages/SettingsPage.tsx';
import { NotificationsPage } from '../pages/NotificationsPage.tsx';
import { IndoorPage } from '../pages/IndoorPage.tsx';
import { CommunityPage } from '../pages/CommunityPage.tsx';
import { AirQualityMap } from '../components/AirQualityMap.tsx';
import { ErrorBoundary } from '../components/ErrorBoundary.tsx';
import { LocationSelector } from '../components/LocationSelector.tsx';
import { WorkspaceLayout } from '../components/WorkspaceLayout.tsx';
import { AssistantPage } from '../pages/AssistantPage.tsx';
import { useAirwiseState } from '../hooks/useAirwiseState.ts';
import type { FamilyProfile } from '../types/airwise.ts';

let happyWindow: Window | null = null;
let origFetch: typeof globalThis.fetch;
let rtl!: typeof TestingLibraryReact;
const savedDescriptors = new Map<string, PropertyDescriptor | undefined>();

const DOM_GLOBAL_KEYS = [
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'localStorage',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLSelectElement',
  'HTMLButtonElement',
  'Element',
  'Node',
  'Event',
  'CustomEvent',
  'KeyboardEvent',
  'MouseEvent',
  'File',
  'DOMException',
  'getComputedStyle',
  'ResizeObserver',
] as const;

before(async () => {
  origFetch = globalThis.fetch;
  happyWindow = new Window({ url: 'http://localhost:3000/' });
  for (const key of DOM_GLOBAL_KEYS) {
    savedDescriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    const value = (happyWindow as unknown as Record<string, unknown>)[key];
    if (value !== undefined) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value,
      });
    }
  }
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    writable: true,
    value: () => undefined,
  });
  rtl = await import('@testing-library/react');
});

afterEach(() => {
  rtl.cleanup();
  globalThis.fetch = origFetch;
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

after(async () => {
  for (const key of DOM_GLOBAL_KEYS) {
    const prev = savedDescriptors.get(key);
    if (prev) {
      Object.defineProperty(globalThis, key, prev);
    } else {
      Reflect.deleteProperty(globalThis, key);
    }
  }
  await happyWindow?.close();
  happyWindow = null;
});

test('ExposureSimulatorCard updates dose metrics interactively and resets state', () => {
  const { fireEvent, render, screen } = rtl;
  render(
    <ExposureSimulatorCard locationName="New Delhi" outdoorPm25={120} defaultHepaActive={true} />
  );

  const slider = screen.getByLabelText(/Daily Outdoor Exposure Duration/i) as HTMLInputElement;
  assert.equal(slider.value, '2');

  const respiratorSelect = screen.getByLabelText(/Outdoor Respirator/i) as HTMLSelectElement;
  fireEvent.change(respiratorSelect, { target: { value: 'none' } });
  fireEvent.change(slider, { target: { value: '8' } });
  assert.equal(respiratorSelect.value, 'none');
  assert.equal(slider.value, '8');

  const hepaCheckbox = screen.getByRole('checkbox', { name: /Indoor True-HEPA Purifier/i });
  fireEvent.click(hepaCheckbox);
  assert.ok(screen.getByText(/Baseline Vulnerability/i));

  fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
  assert.equal(respiratorSelect.value, 'n95_ffp2');
  assert.equal(slider.value, '2');
  assert.ok(screen.getByText(/Daily PM2.5 exposure simulator reset to default settings/i));
});

test('CalculatorPage toggles table view, recalculates KPIs on input changes, and resets', () => {
  const { fireEvent, render, screen } = rtl;
  let latestInput = { ...DEFAULT_CALC_INPUT };
  let resetCalled = false;

  const { rerender } = render(
    <CalculatorPage
      input={latestInput}
      onChangeInput={(next) => {
        latestInput = next;
      }}
      onResetInput={() => {
        resetCalled = true;
      }}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /Table View/i }));
  assert.ok(
    screen.getByRole('table', {
      name: /Comparison of baseline and alternative weekly CO2e emissions/i,
    })
  );

  const ledInput = screen.getByLabelText(/LED bulbs upgraded/i);
  fireEvent.change(ledInput, { target: { value: '12' } });
  assert.equal(latestInput.ledBulbsReplacedCount, 12);

  rerender(
    <CalculatorPage
      input={latestInput}
      onChangeInput={(next) => {
        latestInput = next;
      }}
      onResetInput={() => {
        resetCalled = true;
      }}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
  assert.equal(resetCalled, true);
});

test('SettingsPage handles household toggles, two-step clear confirmation, and JSON import validation', async () => {
  const { fireEvent, render, screen, waitFor } = rtl;
  let currentProfile: FamilyProfile = { ...DEFAULT_PROFILE };
  let cleared = false;
  let importedCount = 0;

  const { rerender } = render(
    <SettingsPage
      profile={currentProfile}
      calcInput={DEFAULT_CALC_INPUT}
      alertPrefs={DEFAULT_ALERT_PREFS}
      onUpdateProfile={(next) => {
        currentProfile = next;
      }}
      onImportPreferences={() => {
        importedCount += 1;
      }}
      onClearAllData={() => {
        cleared = true;
      }}
    />
  );

  const olderAdultsBox = screen.getByRole('checkbox', { name: /Older adults/i });
  fireEvent.click(olderAdultsBox);
  assert.ok(currentProfile.groups.includes('olderAdults'));

  // Two-step clear flow: Cancel then Confirm Reset
  fireEvent.click(screen.getByRole('button', { name: /Clear Local Data/i }));
  fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
  assert.equal(cleared, false);

  fireEvent.click(screen.getByRole('button', { name: /Clear Local Data/i }));
  fireEvent.click(screen.getByRole('button', { name: /Confirm Reset/i }));
  assert.equal(cleared, true);
  assert.ok(screen.getByRole('status').textContent?.includes('reset to defaults'));

  // File import validation: invalid JSON -> alert, valid JSON -> status
  const fileInput = screen.getByLabelText(
    /Import AIRWISE preferences JSON file/i
  ) as HTMLInputElement;
  const badFile = new File(['{broken-json'], 'bad.json', { type: 'application/json' });
  fireEvent.change(fileInput, { target: { files: [badFile] } });
  await waitFor(() => {
    assert.ok(screen.getByRole('alert').textContent?.includes('Could not parse'));
  });

  const protoFile = new File(
    [
      '{"__proto__":{"x":1},"profile":{"householdSize":2,"groups":["adults"],"preferredStandard":"CPCB","hasPurifier":true,"gridRegion":"INDIA"}}',
    ],
    'proto.json',
    { type: 'application/json' }
  );
  fireEvent.change(fileInput, { target: { files: [protoFile] } });
  await waitFor(() => {
    assert.ok(screen.getByRole('alert').textContent?.includes('unsafe object keys'));
  });

  const validFile = new File(
    [JSON.stringify({ profile: { ...DEFAULT_PROFILE, householdSize: 5 } })],
    'valid.json',
    { type: 'application/json' }
  );
  fireEvent.change(fileInput, { target: { files: [validFile] } });
  await waitFor(() => {
    assert.equal(importedCount, 1);
  });

  rerender(
    <SettingsPage
      profile={currentProfile}
      calcInput={DEFAULT_CALC_INPUT}
      alertPrefs={DEFAULT_ALERT_PREFS}
      onUpdateProfile={(next) => {
        currentProfile = next;
      }}
      onImportPreferences={() => {
        importedCount += 1;
      }}
      onClearAllData={() => {
        cleared = true;
      }}
    />
  );
});

test('NotificationsPage marks alerts read and toggles alert preference rules', () => {
  const { fireEvent, render, screen } = rtl;
  const delhiSnap = buildDemoFallbackSnapshot(PRESET_CITIES[0]);
  const alerts = buildSmartAlerts(delhiSnap);
  const readIds: string[] = [];
  let markAllCalled = false;
  let prefs = { ...DEFAULT_ALERT_PREFS };
  let navTarget: string | null = null;

  render(
    <NotificationsPage
      alerts={alerts}
      preferences={prefs}
      onMarkRead={(id) => readIds.push(id)}
      onMarkAllRead={() => {
        markAllCalled = true;
      }}
      onUpdatePreferences={(next) => {
        prefs = next;
      }}
      onNavigate={(page) => {
        navTarget = page;
      }}
    />
  );

  const markReadButtons = screen.getAllByRole('button', { name: 'Mark Read' });
  fireEvent.click(markReadButtons[0]);
  assert.equal(readIds.length, 1);

  fireEvent.click(screen.getByRole('button', { name: /Mark All Read/i }));
  assert.equal(markAllCalled, true);

  const toggleRule = screen.getByRole('checkbox', {
    name: /Severe & Poor AQI Threshold Alerts/i,
  });
  fireEvent.click(toggleRule);
  assert.equal(prefs.severeAqi, false);

  const actionButton = screen.getByRole('button', { name: alerts[0].actionLabel });
  fireEvent.click(actionButton);
  assert.equal(navTarget, alerts[0].targetPage);
});

test('IndoorPage and CommunityPage support keyboard arrow navigation on tablists and task toggling', () => {
  const { fireEvent, render, screen } = rtl;
  const delhiSnap = buildDemoFallbackSnapshot(PRESET_CITIES[0]);
  const tasks = getInitialIndoorChecklist();
  const toggledTasks: string[] = [];

  render(
    <IndoorPage snapshot={delhiSnap} tasks={tasks} onToggleTask={(id) => toggledTasks.push(id)} />
  );

  const allTab = screen.getByRole('tab', { name: 'All' });
  fireEvent.keyDown(allTab, { key: 'ArrowRight' });
  const bedroomTab = screen.getByRole('tab', { name: 'Bedroom' });
  assert.equal(bedroomTab.getAttribute('aria-selected'), 'true');

  fireEvent.keyDown(bedroomTab, { key: 'End' });
  const workspaceTab = screen.getByRole('tab', { name: 'Workspace' });
  assert.equal(workspaceTab.getAttribute('aria-selected'), 'true');

  fireEvent.keyDown(workspaceTab, { key: 'Home' });
  assert.equal(allTab.getAttribute('aria-selected'), 'true');

  const firstTaskToggle = screen.getByRole('button', { name: `Toggle ${tasks[0].title}` });
  fireEvent.click(firstTaskToggle);
  assert.deepEqual(toggledTasks, [tasks[0].id]);

  const toggledChallenges: string[] = [];
  render(
    <CommunityPage
      snapshot={delhiSnap}
      joinedChallengeIds={['chal-transit']}
      onToggleJoinChallenge={(id) => toggledChallenges.push(id)}
    />
  );

  const transportTab = screen.getByRole('tab', { name: 'Transport' });
  fireEvent.click(transportTab);
  assert.equal(transportTab.getAttribute('aria-selected'), 'true');

  const joinButtons = screen.getAllByRole('button', { name: /Joined Challenge|Join Challenge/i });
  fireEvent.click(joinButtons[0]);
  assert.equal(toggledChallenges.length, 1);
});

test('AirQualityMap switches between India and Global grid views and selects stations', () => {
  const { fireEvent, render, screen } = rtl;
  const selectedIds: string[] = [];
  render(
    <AirQualityMap
      currentLocation={PRESET_CITIES[0]}
      cpcbAqi={285}
      cpcbCategory="Poor"
      onSelectLocation={(loc) => selectedIds.push(loc.id)}
    />
  );

  const globalTab = screen.getByRole('tab', { name: 'Global View' });
  fireEvent.click(globalTab);
  assert.equal(globalTab.getAttribute('aria-selected'), 'true');

  const tokyoBtn = screen.getByRole('button', { name: /Select Tokyo, Japan/i });
  fireEvent.click(tokyoBtn);
  assert.equal(selectedIds[0], 'tokyo-jp');
});

test('ErrorBoundary catches render failures and recovers via Return to Dashboard', () => {
  const { fireEvent, render, screen } = rtl;
  let shouldThrow = true;
  let resetInvoked = false;

  function Thrower(): ReactNode {
    if (shouldThrow) {
      throw new Error('Synthetic render failure');
    }
    return <div>Recovered content</div>;
  }

  const origConsoleError = console.error;
  console.error = () => undefined;
  try {
    render(
      <ErrorBoundary
        onReset={() => {
          shouldThrow = false;
          resetInvoked = true;
        }}
      >
        <Thrower />
      </ErrorBoundary>
    );

    assert.ok(screen.getByRole('alert'));
    assert.ok(screen.getByText(/Unable to render this view/i));
    fireEvent.click(screen.getByRole('button', { name: /Return to Dashboard/i }));
    assert.equal(resetInvoked, true);
    assert.ok(screen.getByText('Recovered content'));
  } finally {
    console.error = origConsoleError;
  }
});

test('LocationSelector validates short search input and selects mocked city search results', async () => {
  const { fireEvent, render, screen } = rtl;
  let chosenName = '';
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        results: [
          {
            id: 'pune-search',
            name: 'Pune',
            area: 'Pune, Maharashtra',
            region: 'Maharashtra',
            country: 'India',
            countryCode: 'IN',
            latitude: 18.52,
            longitude: 73.86,
            timezone: 'Asia/Kolkata',
            isIndia: true,
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )) as typeof globalThis.fetch;

  render(
    <LocationSelector
      currentLocation={PRESET_CITIES[0]}
      onSelectLocation={(loc) => {
        chosenName = loc.name;
      }}
    />
  );

  const searchInput = screen.getByPlaceholderText(/Search city/i);
  fireEvent.change(searchInput, { target: { value: 'a' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  assert.ok(screen.getByRole('status').textContent?.includes('at least 2 characters'));

  fireEvent.change(searchInput, { target: { value: 'Pune' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  const puneBtn = await screen.findByRole('button', { name: /Pune Maharashtra, India/i });
  fireEvent.click(puneBtn);
  assert.equal(chosenName, 'Pune');
});

test('useAirwiseState manages navigation, profile sync, checklists, alerts, and reset lifecycle', async () => {
  const { render, screen, waitFor } = rtl;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: 'offline test fallback' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof globalThis.fetch;

  let hookApi: ReturnType<typeof useAirwiseState> | null = null;

  function Harness() {
    const state = useAirwiseState();
    hookApi = state;
    return <div data-testid="page">{state.activePage}</div>;
  }

  render(<Harness />);
  await waitFor(() => {
    assert.ok(hookApi !== null);
    assert.equal(hookApi.loadingFeed, false);
  });

  hookApi!.navigate('calculator');
  await waitFor(() => {
    assert.equal(screen.getByTestId('page').textContent, 'calculator');
  });

  hookApi!.updateProfile({
    ...DEFAULT_PROFILE,
    householdSize: 5,
    gridRegion: 'GLOBAL',
  });
  await waitFor(() => {
    assert.equal(hookApi!.calcInput.householdSize, 5);
    assert.equal(hookApi!.calcInput.gridRegion, 'GLOBAL');
  });

  hookApi!.toggleIndoorTask('bed-1');
  hookApi!.toggleAdoptedHabit('alt-led');
  hookApi!.toggleJoinChallenge('chal-waste');
  hookApi!.toggleRoutinePeriod('Morning');
  hookApi!.markAllAlertsRead();

  await waitFor(() => {
    assert.ok(hookApi!.indoorProgressPercent > 0);
    assert.equal(hookApi!.unreadAlertsCount, 0);
  });

  hookApi!.handleClearAllData();
  await waitFor(() => {
    assert.equal(hookApi!.joinedChallenges.length, 0);
    assert.equal(hookApi!.profile.householdSize, DEFAULT_PROFILE.householdSize);
  });
});

test('AssistantPage validates short queries, submits mocked guidance, and clears exchanges', async () => {
  const { fireEvent, render, screen, waitFor } = rtl;
  const delhiSnap = buildDemoFallbackSnapshot(PRESET_CITIES[0]);

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        reply: {
          summary: 'Keep children indoors while CPCB AQI exceeds 250.',
          measuredFacts: ['CPCB AQI is 285 (Poor)'],
          contextualEstimates: ['HEPA filtration reduces indoor fine particles.'],
          recommendation: {
            what: 'Shift playground activity indoors today.',
            why: 'High PM2.5 irritates airways.',
            when: 'Through tonight.',
            expectedBenefits: 'Lower particulate dose.',
            estimatedImpact: 'High exposure reduction.',
            confidenceAndLimitations: 'Based on regional monitor grid.',
          },
          actionSteps: ['Seal bedroom windows', 'Run true-HEPA purifier'],
          disclaimer: 'Environmental guidance only.',
          source: 'rule-engine-fallback',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )) as typeof globalThis.fetch;

  render(<AssistantPage snapshot={delhiSnap} profile={DEFAULT_PROFILE} />);

  const input = screen.getByLabelText(/Ask an air quality or family protection question/i);
  fireEvent.change(input, { target: { value: 'hi' } });
  fireEvent.submit(input.closest('form')!);
  assert.ok(screen.getByText(/at least 3 characters/i));

  const quickPrompt = screen.getByRole('button', {
    name: /Is it safe for my children to play outside today\?/i,
  });
  fireEvent.click(quickPrompt);

  await screen.findByText(/Keep children indoors while CPCB AQI exceeds 250/i);

  fireEvent.click(screen.getByRole('button', { name: /Clear Conversation/i }));
  await waitFor(() => {
    assert.equal(screen.queryByText(/Keep children indoors while CPCB AQI exceeds 250/i), null);
  });
});

test('WorkspaceLayout toggles mobile drawer with button/Escape and invokes sidebar navigation', () => {
  const { fireEvent, render, screen } = rtl;
  const navigated: string[] = [];

  render(
    <WorkspaceLayout
      activePage="dashboard"
      onNavigate={(page) => navigated.push(page)}
      location={PRESET_CITIES[0]}
      unreadAlertsCount={2}
    >
      <div>Workspace child content</div>
    </WorkspaceLayout>
  );

  fireEvent.click(screen.getByRole('button', { name: /Open navigation menu/i }));
  assert.ok(screen.getByRole('dialog', { name: /Mobile Navigation/i }));

  fireEvent.keyDown(window, { key: 'Escape' });
  assert.equal(screen.queryByRole('dialog', { name: /Mobile Navigation/i }), null);

  fireEvent.click(screen.getAllByRole('button', { name: /Carbon Calculator/i })[0]);
  assert.equal(navigated[0], 'calculator');
});
