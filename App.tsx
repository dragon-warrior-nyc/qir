import React, { useState, useRef } from 'react';
import { InputSection } from './components/InputSection';
import { ResultCard } from './components/ResultCard';
import { GroundingView } from './components/GroundingView';
import { CostEstimate } from './components/CostEstimate';
import { LogicView } from './components/LogicView';
import { orchestrateParallelWorkflow } from './services/geminiService';
import { ProductDetails, AnalysisResult, SearchContextResult, CostBreakdown, RouterMode } from './types';
import { Sparkles, BarChart3, FileCode2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'logic'>('analyzer');
  const [query, setQuery] = useState('maggie');
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

  // State to control LLM Router Strategy (default: force-knowledge)
  const [routerMode, setRouterMode] = useState<RouterMode>('force-knowledge');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContextResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Track costs
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);

  // Abort Controller Ref
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsAnalyzing(false);
    }
  };

  // Upgraded handler supports optional URL for parallel extraction
  const handleAnalyze = async (productOverride?: ProductDetails, urlToExtract?: string) => {
    // 1. Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 2. Create new controller
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSearchContext(null);
    setCostBreakdown(null);
    setError(null);

    try {
      // Determine what product data to start with (Override > Current State)
      const initialProductState = productOverride || product;

      // 3. Execute Parallel Workflow
      const { 
        contextResult, 
        productResult, 
        analysisResult: finalAnalysis, 
      } = await orchestrateParallelWorkflow(
        query,
        urlToExtract || null,
        initialProductState,
        routerMode,
        signal
      );
      
      if (signal.aborted) return;

      // 4. Update State with Results
      setSearchContext(contextResult);
      setProduct(productResult); // Update UI with extracted data if applicable
      setAnalysisResult(finalAnalysis);

      // 5. Calculate Costs
      const extractionCost = productResult._meta?.cost || 0;
      const contextCost = contextResult._meta?.cost || 0;
      const analysisCost = finalAnalysis._meta?.cost || 0;
      
      setCostBreakdown({
        extractionCost,
        contextCost,
        analysisCost,
        criticCost: 0, // Critic removed
        totalCost: extractionCost + contextCost + analysisCost
      });
      
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'Aborted') {
        console.log('Analysis stopped by user');
        return; 
      }
      console.error(err);
      setError(err.message || "Analysis failed. Please try again later.");
    } finally {
      // Only turn off loading if we haven't started a NEW request
      if (abortControllerRef.current === controller) {
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Project <span className="text-indigo-600">Golden</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500 hidden sm:block">
               Gemini 3 Pro + Search
            </div>
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
                onStop={handleStop}
                isAnalyzing={isAnalyzing}
                routerMode={routerMode}
                setRouterMode={setRouterMode}
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
                 <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
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
                          <p className="text-sm text-slate-500">
                             Running Parallel Agents: <br/>
                             <span className="font-mono text-xs">Router → Context Agent</span> &amp; <span className="font-mono text-xs">Extraction Agent</span>
                          </p>
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