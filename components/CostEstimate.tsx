import React from 'react';
import { Calculator } from 'lucide-react';
import { CostBreakdown } from '../types';

interface CostEstimateProps {
  breakdown: CostBreakdown;
}

export const CostEstimate: React.FC<CostEstimateProps> = ({ breakdown }) => {
  const formatCost = (cost: number) => {
    if (cost < 0.01 && cost > 0) return '<$0.01';
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className="bg-slate-800 text-slate-200 rounded-lg p-4 text-xs mt-4 border border-slate-700">
      <h4 className="font-semibold text-slate-100 flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4" /> Estimated API Cost
      </h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
            <span>Context Search (Flash + Grounding)</span>
            <span className="font-mono text-slate-300">{formatCost(breakdown.contextCost)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
            <span>Product Extraction (Optional)</span>
            <span className="font-mono text-slate-300">{formatCost(breakdown.extractionCost)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
            <span>Deep Analysis (Pro + Thinking)</span>
            <span className="font-mono text-slate-300">{formatCost(breakdown.analysisCost)}</span>
        </div>
        <div className="flex justify-between items-center pt-1 font-bold text-white text-sm">
            <span>Total Estimated Cost</span>
            <span className="text-emerald-400">{formatCost(breakdown.totalCost)}</span>
        </div>
      </div>
      <div className="mt-3 text-[10px] text-slate-500 italic">
        * Estimates based on list pricing for Search Grounding ($35/1k), Gemini Flash, and Gemini Pro. Actual billing may vary.
      </div>
    </div>
  );
};