import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { ResultCard } from './components/ResultCard';
import { GroundingView } from './components/GroundingView';
import { CostEstimate } from './components/CostEstimate';
import { LogicView } from './components/LogicView';
import { analyzeProductRelevance, getSearchQueryContext } from './services/geminiService';
import { ProductDetails, AnalysisResult, SearchContextResult, CostBreakdown } from './types';
import { Sparkles, Settings, X, Save, BarChart3, FileCode2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'logic'>('analyzer');
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<ProductDetails>({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    size: '',
    color: '',
    gender: '',
    badge: '',
  });

  // State to control LLM Router Optimization (default: true)
  const [useSmartRouter, setUseSmartRouter] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContextResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Settings & API Key State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  
  // Track costs
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);

  // Load API Key from local storage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      setApiKey(storedKey);
      setTempApiKey(storedKey);
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('GEMINI_API_KEY', tempApiKey);
    setApiKey(tempApiKey);
    setShowSettings(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSearchContext(null);
    setCostBreakdown(null);
    setError(null);

    // If no key in env and no key in settings, warn user
    if (!process.env.API_KEY && !apiKey) {
        setError("Missing API Key. Please configure your Gemini API Key in Settings.");
        setIsAnalyzing(false);
        return;
    }

    try {
      // 1. Context Search
      // Pass the negation of useSmartRouter as 'forceSearch'
      const contextData = await getSearchQueryContext(query, apiKey, !useSmartRouter);
      setSearchContext(contextData);

      // 2. Product Analysis
      const relevanceData = await analyzeProductRelevance(query, product, contextData.overview, apiKey);
      setAnalysisResult(relevanceData);

      // Calculate Costs
      const extractionCost = product._meta?.cost || 0;
      const contextCost = contextData._meta?.cost || 0;
      const analysisCost = relevanceData._meta?.cost || 0;
      
      setCostBreakdown({
        extractionCost,
        contextCost,
        analysisCost,
        totalCost: extractionCost + contextCost + analysisCost
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed. Please check your API key and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" /> Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Google Gemini API Key</label>
                <input 
                  type="password" 
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Your key is stored locally in your browser. It is used to access Gemini 3 Pro and Search Grounding.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Merch<span className="text-indigo-600">AI</span> Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500 hidden sm:block">
               Gemini 3 Pro + Search
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('analyzer')}
            className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'analyzer' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Relevance Analyzer
          </button>
          <button 
            onClick={() => setActiveTab('logic')}
            className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'logic' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileCode2 className="w-4 h-4" /> Logic & Architecture
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'logic' ? (
          <LogicView />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Column: Inputs */}
            <div className="w-full lg:w-1/3">
              <InputSection 
                query={query} 
                setQuery={setQuery} 
                product={product} 
                setProduct={setProduct}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                apiKey={apiKey}
                useSmartRouter={useSmartRouter}
                setUseSmartRouter={setUseSmartRouter}
              />
              {costBreakdown && <CostEstimate breakdown={costBreakdown} />}
            </div>

            {/* Right Column: Results */}
            <div className="w-full lg:w-2/3 space-y-6">
              {error && (
                 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   {error}
                 </div>
              )}

              {!isAnalyzing && !analysisResult && !error && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
                  <p className="font-medium">Ready to analyze</p>
                  <p className="text-sm">Enter a customer query and product details to begin.</p>
                </div>
              )}

              {searchContext && (
                  <GroundingView context={searchContext} />
              )}

              {analysisResult && (
                <ResultCard result={analysisResult} />
              )}
              
              {isAnalyzing && (
                 <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-6">
                   <div className="relative">
                     <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                     </div>
                   </div>
                   <div className="text-center space-y-2">
                      <p className="text-lg font-medium text-slate-700">Analyzing Complexity...</p>
                      {searchContext ? (
                          <p className="text-sm text-slate-500">Context Acquired. Evaluating Product Relevance...</p>
                      ) : (
                          <p className="text-sm text-slate-500">Gathering Search Context & Intent...</p>
                      )}
                   </div>
                 </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;