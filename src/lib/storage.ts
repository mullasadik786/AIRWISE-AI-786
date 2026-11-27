import type {
  AlertPreferences,
  CityLocation,
  FamilyProfile,
  PageId,
  RoutineSlot,
} from '../types/airwise.ts';
import type { CarbonCalculatorInput } from './impact.ts';
import { hasUnsafeObjectKeys, PersistedStateSchema } from './validation.ts';

export const AIRWISE_STORAGE_KEY = 'airwise_ai_state_v1';

export const DEFAULT_PROFILE: FamilyProfile = {
  householdSize: 3,
  groups: ['adults', 'children', 'dailyCommuters'],
  preferredStandard: 'CPCB',
  hasPurifier: true,
  gridRegion: 'INDIA',
};

export const DEFAULT_CALC_INPUT: CarbonCalculatorInput = {
  carKmReplacedByTransitPerWeek: 30,
  carKmCarpoolPerWeek: 16,
  carKmReplacedByWalkCyclePerWeek: 8,
  electricitySavedKwhPerWeek: 10,
  ledBulbsReplacedCount: 4,
  wasteReducedKgPerWeek: 3,
  gridRegion: 'INDIA',
  householdSize: 3,
};

export const DEFAULT_ALERT_PREFS: AlertPreferences = {
  severeAqi: true,
  risingPm25: true,
  forecastAlerts: true,
  ventilationWindows: true,
  filterMaintenance: true,
  sustainabilityGoals: true,
};

const VALID_PAGES: readonly PageId[] = [
  'landing',
  'dashboard',
  'assistant',
  'routine',
  'indoor',
  'sustainability',
  'calculator',
  'insights',
  'community',
  'notifications',
  'settings',
];

export interface PersistedState {
  locationId?: string;
  customLocation?: CityLocation;
  profile?: FamilyProfile;
  completedTaskIds?: string[];
  completedRoutinePeriods?: Array<RoutineSlot['period']>;
  adoptedHabitIds?: string[];
  joinedChallengeIds?: string[];
  readAlertIds?: string[];
  calcInput?: CarbonCalculatorInput;
  alertPrefs?: AlertPreferences;
}

/**
 * Safely parses and validates serialized localStorage state, rejecting prototype-pollution keys.
 */
export function parsePersistedStateJson(raw: string | null): PersistedState {
  if (!raw || raw.length > 64 * 1024) return {};
  try {
    const json: unknown = JSON.parse(raw);
    if (hasUnsafeObjectKeys(json)) return {};
    const parsed = PersistedStateSchema.safeParse(json);
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function loadPersistedState(): PersistedState {
  try {
    return parsePersistedStateJson(localStorage.getItem(AIRWISE_STORAGE_KEY));
  } catch {
    return {};
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(AIRWISE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private-mode access errors
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(AIRWISE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function isValidPageId(value: string): value is PageId {
  return VALID_PAGES.some((page) => page === value);
}

export function parseHashPage(hash: string = window.location.hash): PageId | null {
  const cleaned = hash.replace(/^#/, '');
  return isValidPageId(cleaned) ? cleaned : null;
}

export function resolveInitialPage(
  search: string = window.location.search,
  hash: string = window.location.hash
): PageId {
  const params = new URLSearchParams(search);
  if (params.get('autostart') === '1') return 'dashboard';
  return parseHashPage(hash) ?? 'landing';
}
