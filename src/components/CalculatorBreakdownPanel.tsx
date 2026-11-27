import { Download, Table } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CarbonImpactResult } from '../lib/impact.ts';

export interface CarbonChartRow {
  name: string;
  Baseline: number;
  Alternative: number;
  Saved: number;
}

interface CalculatorBreakdownPanelProps {
  result: CarbonImpactResult;
  chartData: ReadonlyArray<CarbonChartRow>;
  showChartTable: boolean;
  onToggleChartTable: () => void;
  onExportCsv: () => void;
}

export function CalculatorBreakdownPanel({
  result,
  chartData,
  showChartTable,
  onToggleChartTable,
  onExportCsv,
}: CalculatorBreakdownPanelProps) {
  return (
    <section className="space-y-5 lg:col-span-7">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-[#102A43]">
              Baseline vs. Low-Emission Alternative (Weekly kg CO2e)
            </h2>
            <p className="text-xs text-slate-600">
              Formula: Estimated CO2e Savings = Baseline Emissions − Alternative Emissions (±
              {result.uncertaintyRangePercent}% uncertainty band)
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleChartTable}
            aria-expanded={showChartTable}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-[#102A43] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <Table className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{showChartTable ? 'Chart View' : 'Table View'}</span>
          </button>
        </div>

        {!showChartTable ? (
          <figure className="mt-4">
            <div
              className="h-64 w-full"
              role="img"
              aria-label={`Bar chart comparing weekly baseline emissions (${result.weeklyBaselineKg} kg CO2e) against low-emission alternatives (${result.weeklyAlternativeKg} kg CO2e).`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...chartData]}
                  margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" interval={0} tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} unit=" kg" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Baseline" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Alternative" fill="#20C997" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="sr-only">
              Weekly emissions across 6 household categories totaling{' '}
              {result.weeklySavingsKg.toFixed(2)} kg CO2e saved per week.
            </figcaption>
          </figure>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">
                Comparison of baseline and alternative weekly CO2e emissions by category
              </caption>
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    Baseline (kg)
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    Alternative (kg)
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    Net Saved (kg)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData.map((item) => (
                  <tr key={item.name}>
                    <th scope="row" className="px-3 py-2 font-medium text-[#102A43]">
                      {item.name}
                    </th>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{item.Baseline}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {item.Alternative}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                      {item.Saved}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Breakdown Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-[#102A43]">
            Transparent Factor Breakdown (Weekly kg CO2e)
          </h3>
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#102A43] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              Transparent CO2e emission factor breakdown by household habit category
            </caption>
            <thead className="border-b border-slate-200 text-slate-600">
              <tr>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Category
                </th>
                <th scope="col" className="py-2 px-2 text-right font-semibold">
                  Baseline
                </th>
                <th scope="col" className="py-2 px-2 text-right font-semibold">
                  Alternative
                </th>
                <th scope="col" className="py-2 pl-2 text-right font-semibold">
                  Net Saved
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.breakdown.map((row) => (
                <tr key={row.id}>
                  <th scope="row" className="py-2 pr-3 font-normal text-left">
                    <div className="font-medium text-[#102A43]">{row.label}</div>
                    <div className="text-[11px] text-slate-600">{row.factorSummary}</div>
                  </th>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">
                    {row.baselineKgPerWeek}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">
                    {row.alternativeKgPerWeek}
                  </td>
                  <td className="py-2 pl-2 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                    {row.savingsKgPerWeek}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
