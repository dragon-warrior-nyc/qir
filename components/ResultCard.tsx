import React from 'react';
import { AnalysisResult } from '../types';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle2, XCircle, AlertCircle, BrainCircuit, UserCheck, ShieldCheck } from 'lucide-react';

interface ResultCardProps {
  result: AnalysisResult | null;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  if (!result) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Emerald 500 (Excellent)
    if (score >= 60) return '#84cc16'; // Lime 500 (Good)
    if (score >= 40) return '#f59e0b'; // Amber 500 (Okay)
    if (score >= 20) return '#f97316'; // Orange 500 (Bad)
    return '#ef4444'; // Red 500 (Embarrassing)
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Okay';
    if (score >= 20) return 'Bad';
    return 'Embarrassing';
  };

  const scoreData = [
    {
      name: 'Relevance',
      value: result.relevanceScore,
      fill: getScoreColor(result.relevanceScore),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Human Review Section - Always Visible */}
      <div className={`mb-6 rounded-lg p-4 flex items-start gap-3 border ${
        result.humanReviewNeeded 
          ? 'bg-amber-50 border-amber-200' 
          : 'bg-indigo-50 border-indigo-200'
      }`}>
        <div className={`p-2 rounded-full flex-shrink-0 ${
          result.humanReviewNeeded ? 'bg-amber-100' : 'bg-indigo-100'
        }`}>
          {result.humanReviewNeeded ? (
            <UserCheck className="w-5 h-5 text-amber-700" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-indigo-700" />
          )}
        </div>
        <div>
          <h4 className={`font-bold text-sm ${
            result.humanReviewNeeded ? 'text-amber-900' : 'text-indigo-900'
          }`}>
            {result.humanReviewNeeded ? 'Human Review Recommended' : 'AI Confidence High'}
          </h4>
          <p className={`text-sm mt-1 ${
            result.humanReviewNeeded ? 'text-amber-800' : 'text-indigo-800'
          }`}>
            {result.reviewReason || (result.humanReviewNeeded 
              ? "The model detected ambiguity or borderline criteria that suggests a manual check is safer."
              : "The model is confident in this assessment. No manual review is required based on current guidelines."
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
        <div className="w-32 h-32 relative flex-shrink-0 mx-auto md:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              innerRadius="80%" 
              outerRadius="100%" 
              barSize={10} 
              data={scoreData} 
              startAngle={90} 
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={30} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-800">{result.relevanceScore}</span>
            <span 
              className="text-xs font-semibold uppercase tracking-wide mt-1"
              style={{ color: getScoreColor(result.relevanceScore) }}
            >
              {getScoreLabel(result.relevanceScore)}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-2">
             <BrainCircuit className="w-5 h-5 text-indigo-600" />
             <h3 className="text-lg font-bold text-slate-800">Thinking Mode Analysis</h3>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm">
            {result.reasoning}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-green-50 rounded-lg p-5 border border-green-100">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Matches User Intent
          </h4>
          <ul className="space-y-2">
            {result.keyMatches.length > 0 ? (
              result.keyMatches.map((match, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {match}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-400 italic">No direct matches found.</li>
            )}
          </ul>
        </div>

        <div className="bg-red-50 rounded-lg p-5 border border-red-100">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5" /> Missing / Friction Points
          </h4>
          <ul className="space-y-2">
            {result.missingFeatures.length > 0 ? (
              result.missingFeatures.map((missing, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {missing}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-400 italic">No significant gaps found.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-indigo-600" /> Customer Utility Assessment
        </h4>
        <p className="text-slate-700 text-sm leading-relaxed">
          {result.customerUtilityAssessment}
        </p>
      </div>
    </div>
  );
};