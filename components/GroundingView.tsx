import React from 'react';
import { SearchContextResult } from '../types';
import { Globe, ExternalLink, Brain } from 'lucide-react';

interface GroundingViewProps {
  context: SearchContextResult | null;
}

export const GroundingView: React.FC<GroundingViewProps> = ({ context }) => {
  if (!context) return null;

  const isSearch = context.source === 'SEARCH';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${isSearch ? 'bg-blue-100' : 'bg-purple-100'}`}>
          {isSearch ? (
            <Globe className="w-5 h-5 text-blue-600" />
          ) : (
            <Brain className="w-5 h-5 text-purple-600" />
          )}
        </div>
        <div>
          <h3 className="font-bold text-slate-800">
            {isSearch ? 'Search Context' : 'Intent Context'}
          </h3>
          <p className="text-xs text-slate-500">
            {isSearch ? 'Powered by Google Search Grounding' : 'Generated from Internal Knowledge (LLM Router Optimization)'}
          </p>
        </div>
      </div>
      
      <p className="text-slate-600 text-sm leading-relaxed mb-4">
        {context.overview}
      </p>

      {isSearch && context.groundingChunks && context.groundingChunks.length > 0 && (
        <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sources</h4>
            <div className="flex flex-wrap gap-2">
                {context.groundingChunks.map((chunk, idx) => {
                    if (!chunk.web?.uri) return null;
                    return (
                        <a 
                            key={idx}
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-blue-600 hover:bg-slate-100 hover:border-blue-200 transition-colors truncate max-w-[200px]"
                            title={chunk.web.title}
                        >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                        </a>
                    );
                })}
            </div>
        </div>
      )}
      
      {!isSearch && (
         <div className="text-xs text-slate-400 italic">
           * Router determined search was not required for this query, saving ~${0.035} per request.
         </div>
      )}
    </div>
  );
};