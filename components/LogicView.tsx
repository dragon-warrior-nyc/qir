import React, { useEffect, useState } from 'react';
import { BrainCircuit, Zap, Globe, Cpu, GitBranch, Database, ChevronDown, ChevronUp, Layers, Code2 } from 'lucide-react';
import mermaid from 'mermaid';

export const LogicView: React.FC = () => {
  const [svg, setSvg] = useState<string>('');
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(true);

  // Simplified chart definition to avoid Mermaid parsing issues with special chars
  const chart = `
graph TD
    %% === Core Framework ===
    subgraph Core [Core Framework Layer]
        BaseAgent["BaseAgent Abstract Class"]
    end

    %% === Agent Layer ===
    subgraph Agents [Agent Implementation Layer]
        Router["RouterAgent (Gemini 2.5 Flash)"]
        Context["ContextAgent (Gemini 2.5 Flash + Tools)"]
        Extractor["ExtractionAgent (Gemini 2.5 Flash + Tools)"]
        Analyzer["AnalysisAgent (Gemini 3 Pro + Thinking)"]
    end

    %% === Orchestration Layer ===
    subgraph Workflow [Orchestration Flow]
        Start((Start))
        
        %% Step 1: Routing
        Start --> RouterCall{"RouterAgent: Need Search?"}
        
        %% Step 2: Context Gathering
        RouterCall -- "Yes (Complex)" --> SearchCtx["ContextAgent: Generate w/ Google Search"]
        RouterCall -- "No (Generic)" --> InternalCtx["ContextAgent: Generate w/ Internal Knowledge"]
        
        %% Parallel: Extraction
        Start -.-> ExtractorCall["ExtractionAgent: Extract Product Data"]
        
        %% Step 3: Analysis
        SearchCtx --> AnalysisStep
        InternalCtx --> AnalysisStep
        ExtractorCall -.-> AnalysisStep
        
        AnalysisStep["AnalysisAgent: Evaluate Relevance (CoT)"]
        
        AnalysisStep --> Result((Final JSON))
    end
    
    %% Inheritance Relationships
    Router -- extends --> BaseAgent
    Context -- extends --> BaseAgent
    Extractor -- extends --> BaseAgent
    Analyzer -- extends --> BaseAgent

    %% Styling
    classDef core fill:#eceff1,stroke:#455a64,stroke-width:2px;
    classDef agent fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px;
    classDef flow fill:#fff,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;
    
    class BaseAgent core;
    class Router,Context,Extractor,Analyzer agent;
`;

  useEffect(() => {
    try {
        mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
        mermaid.render('architecture-diagram', chart).then(({ svg }) => {
            setSvg(svg);
        }).catch(err => {
            console.error("Mermaid failed to render", err);
        });
    } catch (e) {
        console.error("Mermaid initialization error", e);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
          <Layers className="w-8 h-8 text-indigo-600" />
          Agentic Architecture (ADK Pattern)
        </h2>
        <p className="text-slate-600 leading-relaxed text-lg">
          This application implements Google's <strong>Agent Development Kit (ADK)</strong> principles. 
          It utilizes a standardized <code>BaseAgent</code> class for shared capabilities (auth, cost tracking) 
          and specialized agents for distinct tasks, orchestrated by a central service.
        </p>
      </div>

      {/* The Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Router Agent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">Router Agent</h3>
          </div>
          <p className="text-xs text-slate-500 font-mono mb-2">extends BaseAgent</p>
          <p className="text-slate-600 text-sm flex-grow">
            Evaluates query complexity to determine if expensive tools (Search) are needed.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-semibold text-blue-600">
            Model: Gemini 2.5 Flash
          </div>
        </div>

        {/* Context Agent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">Context Agent</h3>
          </div>
          <p className="text-xs text-slate-500 font-mono mb-2">extends BaseAgent</p>
          <p className="text-slate-600 text-sm flex-grow">
            Gathers intent data dynamically, switching between internal knowledge or external Search tools.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-semibold text-purple-600">
            Tool: Google Search
          </div>
        </div>

        {/* Extraction Agent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
           <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">Extraction Agent</h3>
          </div>
          <p className="text-xs text-slate-500 font-mono mb-2">extends BaseAgent</p>
          <p className="text-slate-600 text-sm flex-grow">
            Parses raw URLs into structured JSON schemas using search-augmented extraction.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-600">
            Output: Structured JSON
          </div>
        </div>

        {/* Analysis Agent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
           <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">Analysis Agent</h3>
          </div>
          <p className="text-xs text-slate-500 font-mono mb-2">extends BaseAgent</p>
          <p className="text-slate-600 text-sm flex-grow">
            The final judge. Uses deep reasoning ("Thinking Mode") to score relevance 0-100.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-semibold text-indigo-600">
            Model: Gemini 3 Pro
          </div>
        </div>
      </div>

      {/* Mermaid Diagram Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <button 
          onClick={() => setIsDiagramExpanded(!isDiagramExpanded)}
          className="w-full flex justify-between items-center border-b border-slate-100 bg-slate-50 px-8 py-4 hover:bg-slate-100 transition-colors focus:outline-none"
        >
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> Agentic Workflow Diagram
          </h3>
          {isDiagramExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
             <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
               <span>Click to view diagram</span>
               <ChevronDown className="w-5 h-5 text-indigo-600" />
             </div>
          )}
        </button>
        
        {isDiagramExpanded && (
          <div className="p-8 flex justify-center overflow-x-auto bg-white min-h-[400px] animate-in fade-in slide-in-from-top-2 duration-300">
             {svg ? (
               <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full max-w-2xl" />
             ) : (
               <div className="flex items-center justify-center text-slate-400 gap-2 h-64">
                 <Zap className="w-5 h-5 animate-pulse" /> Generating Architecture Diagram...
               </div>
             )}
          </div>
        )}
      </div>

      {/* Detailed Documentation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-8 py-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Database className="w-4 h-4" /> Implementation Details
            </h3>
        </div>
        <div className="p-8 space-y-8">
            
            <section>
                <h4 className="text-lg font-bold text-slate-900 mb-3">1. The BaseAgent Abstraction</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    All agents inherit from a <code>BaseAgent</code> abstract class. This ensures consistent error handling, 
                    API key management, and centralized cost calculation across the entire application.
                </p>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 font-mono text-xs text-slate-600 mb-3 overflow-x-auto">
                    {`// services/core/baseAgent.ts
export abstract class BaseAgent {
  protected ai: GoogleGenAI;
  
  constructor(config: AgentConfig) {
     this.ai = new GoogleGenAI({ apiKey: config.apiKey });
  }

  protected calculateCost(usage, hasSearch) { ... }
}`}
                </div>
            </section>

            <section>
                <h4 className="text-lg font-bold text-slate-900 mb-3">2. Separation of Prompts & Logic</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    Following ADK best practices, prompt templates are decoupled from the agent logic. 
                    This allows for rapid iteration on prompt engineering without modifying the core agent code.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="p-3 border border-slate-100 rounded bg-slate-50">
                        <div className="font-semibold text-slate-700 text-xs mb-1">services/prompts/*.ts</div>
                        <div className="text-xs text-slate-500">Contains pure string templates and interfaces.</div>
                     </div>
                     <div className="p-3 border border-slate-100 rounded bg-slate-50">
                        <div className="font-semibold text-slate-700 text-xs mb-1">services/agents/*.ts</div>
                        <div className="text-xs text-slate-500">Contains business logic, API calls, and data parsing.</div>
                     </div>
                </div>
            </section>
        </div>
      </div>

    </div>
  );
};
