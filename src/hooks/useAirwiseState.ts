import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AlertPreferences,
  CityLocation,
  EnvironmentalSnapshot,
  FamilyProfile,
  IndoorRoomTask,
  LifestyleAlternative,
  PageId,
  RoutineSlot,
  SmartAlert,
} from '../types/airwise.ts';
import { buildDemoFallbackSnapshot, PRESET_CITIES } from '../data/presets.ts';
import {
  buildSmartAlerts,
  getInitialIndoorChecklist,
  getInitialLifestyleAlternatives,
} from '../lib/recommendations.ts';
import type { CarbonCalculatorInput } from '../lib/impact.ts';
import { calculateCarbonImpact } from '../lib/impact.ts';
import { fetchAirQualitySnapshot } from '../lib/airQualityClient.ts';
import {
  clearPersistedState,
  DEFAULT_ALERT_PREFS,
  DEFAULT_CALC_INPUT,
  DEFAULT_PROFILE,
  loadPersistedState,
  parseHashPage,
  parsePersistedStateJson,
  resolveInitialPage,
  savePersistedState,
  type PersistedState,
} from '../lib/storage.ts';

export { DEFAULT_ALERT_PREFS, DEFAULT_CALC_INPUT, DEFAULT_PROFILE, parsePersistedStateJson };

export function useAirwiseState() {
  const initialPersisted = useMemo(() => loadPersistedState(), []);

  const [activePage, setActivePage] = useState<PageId>(() => resolveInitialPage());

  const [feedRequest, setFeedRequest] = useState<{ location: CityLocation; nonce: number }>(() => {
    if (initialPersisted.customLocation) {
      return { location: initialPersisted.customLocation, nonce: 0 };
    }
    if (initialPersisted.locationId) {
      return {
        location:
          PRESET_CITIES.find((c) => c.id === initialPersisted.locationId) ?? PRESET_CITIES[0],
        nonce: 0,
      };
    }
    return { location: PRESET_CITIES[0], nonce: 0 };
  });
  const location = feedRequest.location;

  const [snapshot, setSnapshot] = useState<EnvironmentalSnapshot>(() =>
    buildDemoFallbackSnapshot(location, 'Connecting to live environmental telemetry...')
  );
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

  const [profile, setProfile] = useState<FamilyProfile>(
    initialPersisted.profile ?? DEFAULT_PROFILE
  );
  const [indoorTasks, setIndoorTasks] = useState<IndoorRoomTask[]>(() => {
    const doneSet = new Set(initialPersisted.completedTaskIds ?? []);
    return getInitialIndoorChecklist().map((t) => ({ ...t, completed: doneSet.has(t.id) }));
  });
  const [alternatives, setAlternatives] = useState<LifestyleAlternative[]>(() => {
    const adoptedSet = new Set(initialPersisted.adoptedHabitIds ?? ['alt-transit']);
    return getInitialLifestyleAlternatives().map((a) => ({ ...a, adopted: adoptedSet.has(a.id) }));
  });
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>(
    initialPersisted.joinedChallengeIds ?? ['chal-transit']
  );
  const [calcInput, setCalcInput] = useState<CarbonCalculatorInput>(
    initialPersisted.calcInput ?? DEFAULT_CALC_INPUT
  );
  const [alertPrefs, setAlertPrefs] = useState<AlertPreferences>(
    initialPersisted.alertPrefs ?? DEFAULT_ALERT_PREFS
  );
  const [completedRoutinePeriods, setCompletedRoutinePeriods] = useState<
    Array<RoutineSlot['period']>
  >(initialPersisted.completedRoutinePeriods ?? []);
  const [readAlertIds, setReadAlertIds] = useState<string[]>(initialPersisted.readAlertIds ?? []);

  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    const targetLocation = feedRequest.location;

    void (async () => {
      try {
        const nextSnapshot = await fetchAirQualitySnapshot(targetLocation, controller.signal);
        if (!controller.signal.aborted) {
          setSnapshot(nextSnapshot);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (!controller.signal.aborted) {
          setSnapshot(buildDemoFallbackSnapshot(targetLocation));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingFeed(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [feedRequest]);

  useEffect(() => {
    const onHashChange = () => {
      const next = parseHashPage();
      if (next) setActivePage(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const persistedPayload = useMemo<PersistedState>(
    () => ({
      locationId: location.id,
      customLocation: location,
      profile,
      completedTaskIds: indoorTasks.filter((t) => t.completed).map((t) => t.id),
      completedRoutinePeriods,
      adoptedHabitIds: alternatives.filter((a) => a.adopted).map((a) => a.id),
      joinedChallengeIds: joinedChallenges,
      readAlertIds,
      calcInput,
      alertPrefs,
    }),
    [
      location,
      profile,
      indoorTasks,
      completedRoutinePeriods,
      alternatives,
      joinedChallenges,
      readAlertIds,
      calcInput,
      alertPrefs,
    ]
  );

  const latestPayloadRef = useRef<PersistedState>(persistedPayload);
  useEffect(() => {
    latestPayloadRef.current = persistedPayload;
  }, [persistedPayload]);

  useEffect(() => {
    const timer = setTimeout(() => {
      savePersistedState(persistedPayload);
    }, 150);
    return () => {
      clearTimeout(timer);
    };
  }, [persistedPayload]);

  useEffect(() => {
    return () => {
      savePersistedState(latestPayloadRef.current);
    };
  }, []);

  const navigate = useCallback((page: PageId) => {
    setActivePage(page);
    const targetHash = page === 'landing' ? '' : `#${page}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(
        null,
        '',
        targetHash || window.location.pathname + window.location.search
      );
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const alerts: SmartAlert[] = useMemo(() => {
    const readSet = new Set(readAlertIds);
    return buildSmartAlerts(snapshot).map((a) => ({
      ...a,
      read: readSet.has(a.id),
    }));
  }, [snapshot, readAlertIds]);

  const unreadAlertsCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  const indoorProgressPercent = useMemo(() => {
    const done = indoorTasks.filter((t) => t.completed).length;
    return indoorTasks.length > 0 ? Math.round((done / indoorTasks.length) * 100) : 0;
  }, [indoorTasks]);

  const sustainabilityScore = useMemo(() => {
    const adopted = alternatives.filter((a) => a.adopted).length;
    return alternatives.length > 0 ? Math.round((adopted / alternatives.length) * 100) : 0;
  }, [alternatives]);

  const calcResult = useMemo(() => calculateCarbonImpact(calcInput), [calcInput]);

  const handleClearAllData = useCallback(() => {
    clearPersistedState();
    setLoadingFeed(true);
    setFeedRequest((prev) => ({ location: PRESET_CITIES[0], nonce: prev.nonce + 1 }));
    setProfile(DEFAULT_PROFILE);
    setIndoorTasks(getInitialIndoorChecklist());
    setCompletedRoutinePeriods([]);
    setAlternatives(getInitialLifestyleAlternatives());
    setJoinedChallenges([]);
    setCalcInput(DEFAULT_CALC_INPUT);
    setAlertPrefs(DEFAULT_ALERT_PREFS);
    setReadAlertIds([]);
  }, []);

  const updateProfile = useCallback((next: FamilyProfile) => {
    setProfile(next);
    setCalcInput((prev) => ({
      ...prev,
      gridRegion: next.gridRegion,
      householdSize: next.householdSize,
    }));
  }, []);

  const importPreferences = useCallback(
    (imported: {
      profile?: FamilyProfile;
      calcInput?: CarbonCalculatorInput;
      alertPrefs?: AlertPreferences;
    }) => {
      if (imported.profile) setProfile(imported.profile);
      if (imported.calcInput) setCalcInput(imported.calcInput);
      if (imported.alertPrefs) setAlertPrefs(imported.alertPrefs);
    },
    []
  );

  const refreshFeed = useCallback(() => {
    setLoadingFeed(true);
    setFeedRequest((prev) => ({ location: prev.location, nonce: prev.nonce + 1 }));
  }, []);

  const selectLocation = useCallback((nextLoc: CityLocation) => {
    setLoadingFeed(true);
    setFeedRequest((prev) => ({ location: nextLoc, nonce: prev.nonce + 1 }));
  }, []);

  const toggleIndoorTask = useCallback((id: string) => {
    setIndoorTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const toggleAdoptedHabit = useCallback((id: string) => {
    setAlternatives((prev) => prev.map((a) => (a.id === id ? { ...a, adopted: !a.adopted } : a)));
  }, []);

  const toggleJoinChallenge = useCallback((id: string) => {
    setJoinedChallenges((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const resetCalcInput = useCallback(() => setCalcInput(DEFAULT_CALC_INPUT), []);

  const toggleRoutinePeriod = useCallback((period: RoutineSlot['period']) => {
    setCompletedRoutinePeriods((prev) =>
      prev.includes(period) ? prev.filter((p) => p !== period) : [...prev, period]
    );
  }, []);

  const markAlertRead = useCallback((id: string) => {
    setReadAlertIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setReadAlertIds(alerts.map((a) => a.id));
  }, [alerts]);

  return {
    activePage,
    navigate,
    location,
    setLocation: selectLocation,
    snapshot,
    loadingFeed,
    refreshFeed,
    profile,
    updateProfile,
    indoorTasks,
    toggleIndoorTask,
    alternatives,
    toggleAdoptedHabit,
    joinedChallenges,
    toggleJoinChallenge,
    calcInput,
    setCalcInput,
    resetCalcInput,
    alertPrefs,
    setAlertPrefs,
    completedRoutinePeriods,
    toggleRoutinePeriod,
    alerts,
    unreadAlertsCount,
    markAlertRead,
    markAllAlertsRead,
    indoorProgressPercent,
    sustainabilityScore,
    weeklyCo2SavedKg: calcResult.weeklySavingsKg,
    importPreferences,
    handleClearAllData,
  };
}
