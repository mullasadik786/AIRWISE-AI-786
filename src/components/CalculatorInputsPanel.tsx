import { RotateCcw } from 'lucide-react';
import type { CarbonCalculatorInput } from '../lib/impact.ts';
import { clampFiniteInt, clampFiniteNumber, parseGridRegion } from '../lib/format.ts';

interface CalculatorInputsPanelProps {
  input: CarbonCalculatorInput;
  onChangeInput: (next: CarbonCalculatorInput) => void;
  onResetInput: () => void;
}

type SliderNumericKey =
  | 'carKmReplacedByTransitPerWeek'
  | 'carKmCarpoolPerWeek'
  | 'carKmReplacedByWalkCyclePerWeek'
  | 'electricitySavedKwhPerWeek';

interface SliderFieldConfig {
  id: string;
  key: SliderNumericKey;
  label: string;
  unit: string;
  unitDescription: string;
  min: number;
  max: number;
  step: number;
  accentClass: string;
}

const SLIDER_FIELDS: ReadonlyArray<SliderFieldConfig> = [
  {
    id: 'calc-transit',
    key: 'carKmReplacedByTransitPerWeek',
    label: 'Car km replaced by public transit / week',
    unit: 'km',
    unitDescription: 'kilometers per week',
    min: 0,
    max: 250,
    step: 2,
    accentClass: 'accent-[#102A43]',
  },
  {
    id: 'calc-carpool',
    key: 'carKmCarpoolPerWeek',
    label: 'Solo driving shifted to carpool / week',
    unit: 'km',
    unitDescription: 'kilometers per week',
    min: 0,
    max: 200,
    step: 2,
    accentClass: 'accent-[#102A43]',
  },
  {
    id: 'calc-active',
    key: 'carKmReplacedByWalkCyclePerWeek',
    label: 'Car km replaced by walking/cycling / week',
    unit: 'km',
    unitDescription: 'kilometers per week',
    min: 0,
    max: 100,
    step: 1,
    accentClass: 'accent-[#20C997]',
  },
  {
    id: 'calc-kwh',
    key: 'electricitySavedKwhPerWeek',
    label: 'Electricity consumption reduced / week',
    unit: 'kWh',
    unitDescription: 'kilowatt-hours per week',
    min: 0,
    max: 100,
    step: 1,
    accentClass: 'accent-[#38BDF8]',
  },
];

export function CalculatorInputsPanel({
  input,
  onChangeInput,
  onResetInput,
}: CalculatorInputsPanelProps) {
  function updateField<K extends keyof CarbonCalculatorInput>(
    key: K,
    value: CarbonCalculatorInput[K]
  ) {
    onChangeInput({ ...input, [key]: value });
  }

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-5"
      aria-label="Habit Inputs"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-display text-base font-bold text-[#102A43]">Weekly Habit Inputs</h2>
        <button
          type="button"
          onClick={onResetInput}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div className="mt-4 space-y-4 text-sm">
        {SLIDER_FIELDS.map((field) => {
          const value = input[field.key];
          return (
            <div key={field.id}>
              <label htmlFor={field.id} className="flex justify-between font-medium text-[#102A43]">
                <span>{field.label}</span>
                <span className="font-mono text-slate-700 tabular-nums">
                  {value} {field.unit}
                </span>
              </label>
              <input
                id={field.id}
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={value}
                aria-valuetext={`${value} ${field.unitDescription}`}
                onChange={(e) =>
                  updateField(
                    field.key,
                    clampFiniteNumber(Number(e.target.value), field.min, field.max, 0)
                  )
                }
                className={`mt-1.5 w-full ${field.accentClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]`}
              />
            </div>
          );
        })}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="calc-led" className="block text-xs font-semibold text-slate-600">
              LED bulbs upgraded
            </label>
            <input
              id="calc-led"
              type="number"
              min={0}
              max={200}
              value={input.ledBulbsReplacedCount}
              onChange={(e) => {
                updateField(
                  'ledBulbsReplacedCount',
                  clampFiniteNumber(Number(e.target.value), 0, 200, 0)
                );
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            />
          </div>

          <div>
            <label htmlFor="calc-waste" className="block text-xs font-semibold text-slate-600">
              Waste reduced (kg/wk)
            </label>
            <input
              id="calc-waste"
              type="number"
              min={0}
              max={500}
              value={input.wasteReducedKgPerWeek}
              onChange={(e) => {
                updateField(
                  'wasteReducedKgPerWeek',
                  clampFiniteNumber(Number(e.target.value), 0, 500, 0)
                );
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <div>
            <label htmlFor="calc-region" className="block text-xs font-semibold text-slate-600">
              Grid Emission Factor
            </label>
            <select
              id="calc-region"
              value={input.gridRegion}
              onChange={(e) =>
                updateField('gridRegion', parseGridRegion(e.target.value, input.gridRegion))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              <option value="INDIA">India CEA (0.716 kg/kWh)</option>
              <option value="GLOBAL">IEA Global (0.475 kg/kWh)</option>
            </select>
          </div>
          <div>
            <label htmlFor="calc-household" className="block text-xs font-semibold text-slate-600">
              Household Members
            </label>
            <input
              id="calc-household"
              type="number"
              min={1}
              max={20}
              value={input.householdSize}
              onChange={(e) => {
                updateField('householdSize', clampFiniteInt(Number(e.target.value), 1, 20, 1));
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
