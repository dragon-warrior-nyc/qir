import React, { useState } from 'react';
import { SearchContextResult } from '../types';
import { Globe, ExternalLink, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import Markdown from 'react-markdown';

interface GroundingViewProps {
  context: SearchContextResult | null;
}

export const GroundingView: React.FC<GroundingViewProps> = ({ context }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!context) return null;

  const isSearch = context.source === 'SEARCH';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
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
                {isSearch ? 'Powered by Google Search Grounding' : 'Generated from Internal Knowledge'}
            </p>
            </div>
        </div>
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Markdown Rendered Content - Collapsible */}
      <div className={`relative markdown-content text-slate-600 text-sm transition-all duration-300 ease-in-out ${
          !isExpanded ? 'max-h-[72px] overflow-hidden' : ''
      }`}>
        <Markdown>{context.overview}</Markdown>
        
        {/* Fade overlay when collapsed */}
        {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      <div className="mt-2 flex justify-center">
         {!isExpanded && (
             <button 
                onClick={() => setIsExpanded(true)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-4 py-1.5 rounded-full transition-colors"
             >
                Show Full Context & Sources <ChevronDown className="w-3 h-3" />
             </button>
         )}
      </div>

      {/* Sources - Only visible when expanded */}
      {isExpanded && (
        <div className="animate-in fade-in duration-300 slide-in-from-top-2">
            {isSearch && context.groundingChunks && context.groundingChunks.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
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
                <div className="text-xs text-slate-400 italic mt-2 pt-2 border-t border-slate-100">
                * Router determined search was not required for this query.
                </div>
            )}

             <button 
                onClick={() => setIsExpanded(false)}
                className="w-full mt-4 text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 py-2 hover:bg-slate-50 rounded transition-colors"
             >
                Show Less <ChevronUp className="w-3 h-3" />
             </button>
        </div>
      )}
    </div>
  );
};