import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { calculateCarbonImpact, type CarbonCalculatorInput } from '../lib/impact.ts';
import { buildCsvString, downloadTextFile } from '../lib/download.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { CalculatorInputsPanel } from '../components/CalculatorInputsPanel.tsx';
import {
  CalculatorBreakdownPanel,
  type CarbonChartRow,
} from '../components/CalculatorBreakdownPanel.tsx';

interface CalculatorPageProps {
  input: CarbonCalculatorInput;
  onChangeInput: (next: CarbonCalculatorInput) => void;
  onResetInput: () => void;
}

const SHORT_CATEGORY_NAMES: Record<string, string> = {
  transit: 'Transit',
  carpool: 'Carpool',
  active: 'Walk/Cycle',
  electricity: 'Power',
  led: 'LEDs',
  waste: 'Waste',
};

export function CalculatorPage({ input, onChangeInput, onResetInput }: CalculatorPageProps) {
  const [showChartTable, setShowChartTable] = useState(false);
  const result = useMemo(() => calculateCarbonImpact(input), [input]);

  const chartData = useMemo<CarbonChartRow[]>(
    () =>
      result.breakdown.map((b) => ({
        name: SHORT_CATEGORY_NAMES[b.id] ?? b.label,
        Baseline: b.baselineKgPerWeek,
        Alternative: b.alternativeKgPerWeek,
        Saved: b.savingsKgPerWeek,
      })),
    [result.breakdown]
  );

  function handleExportCsv() {
    const csv = buildCsvString(
      [
        'Category',
        'Emission Factor Summary',
        'Baseline (kg CO2e/wk)',
        'Alternative (kg CO2e/wk)',
        'Net Saved (kg CO2e/wk)',
      ],
      result.breakdown.map((row) => [
        row.label,
        row.factorSummary,
        row.baselineKgPerWeek,
        row.alternativeKgPerWeek,
        row.savingsKgPerWeek,
      ])
    );
    downloadTextFile(csv, 'airwise-carbon-impact-breakdown.csv', 'text/csv;charset=utf-8');
  }

  return (
    <div className="space-y-6">
      {/* HD Clean Energy & Transit Banner */}
      <section className="grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-12">
        <div className="h-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:col-span-4">
          <SafeImage
            src="/src/assets/images/hd_clean_energy_home_1795574770360.jpg"
            alt="Residential rooftop solar panels and clean neighborhood commute"
            fallbackTitle="Household Clean Energy & Carbon Model"
          />
        </div>
        <div className="sm:col-span-8">
          <h2 className="font-display text-sm font-bold text-[#102A43]">
            Household Carbon Impact & Co-Benefit Estimator
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Adjust weekly travel, electricity, lighting, and waste habits to inspect transparent
            baseline vs. low-emission CO2e savings across India CEA and IEA Global grid emission
            factors.
          </p>
        </div>
      </section>

      {/* Top KPI Grid */}
      <section
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-label="Calculated CO2e Savings"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-600">Daily Savings</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#102A43] tabular-nums">
            {result.dailySavingsKg.toFixed(2)} kg
          </p>
          <p className="mt-1 text-[11px] text-slate-600">CO2e / day</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-600">Weekly Savings</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {result.weeklySavingsKg.toFixed(2)} kg
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            Baseline {result.weeklyBaselineKg} − Alt {result.weeklyAlternativeKg}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-600">Monthly Savings</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#102A43] tabular-nums">
            {result.monthlySavingsKg.toFixed(1)} kg
          </p>
          <p className="mt-1 text-[11px] text-slate-600">30-day projection</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-600">Annual Household Impact</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#102A43] tabular-nums">
            {result.annualSavingsKg.toFixed(0)} kg
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            {result.perPersonAnnualSavingsKg.toFixed(0)} kg/member ·{' '}
            {result.community100HomesAnnualTonnes.toFixed(1)} t per 100 homes
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <CalculatorInputsPanel
          input={input}
          onChangeInput={onChangeInput}
          onResetInput={onResetInput}
        />
        <CalculatorBreakdownPanel
          result={result}
          chartData={chartData}
          showChartTable={showChartTable}
          onToggleChartTable={() => setShowChartTable((v) => !v)}
          onExportCsv={handleExportCsv}
        />
      </div>

      {/* Assumptions & Carbon vs Exposure Note */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-sm font-bold text-[#102A43]">
            Assumptions & Uncertainty Disclosure
          </h3>
          <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-xs text-slate-600">
            {result.assumptions.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-5 text-xs text-[#102A43]">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
            <div>
              <h3 className="font-display text-sm font-bold">
                Carbon Reduction vs. Personal Exposure Reduction
              </h3>
              <p className="mt-1.5 leading-relaxed text-slate-700">{result.exposureVsCarbonNote}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
