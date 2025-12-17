import React, { useEffect, useState } from 'react';
import { BrainCircuit, Zap, Globe, Cpu, GitBranch, Database, Search, ChevronDown, ChevronUp } from 'lucide-react';
import mermaid from 'mermaid';

export const LogicView: React.FC = () => {
  const [svg, setSvg] = useState<string>('');
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(false);

  const chart = `
graph TD
    %% === Define Inputs ===
    subgraph Inputs [Initial Inputs]
        InputQuery[/"Input: Query"/]
        InputItemID[/"Input: Item ID"/]
    end

    %% === Path 1: Query Side Processing ===
    subgraph QuerySide [Query Context Generation Path]
        %% The decision agent
        QueryAgent{{Query Analysis Agent:\nIs internal knowledge sufficient?}}
        
        %% Path A: Simple/Internal
        GeminiInternal[Gemini Model:\nGenerate Context directly]
        
        %% Path B: Complex/External
        GGS[Google Grounded Search]
        SearchResult[/Search Results/]
        GeminiSummarize[Gemini Model:\nSummarize Search Results]
        
        %% Convergence Point for Query Side
        QueryContext[(Final Query Context)]
    end

    %% === Path 2: Item Side Processing ===
    subgraph ItemSide [Item Information Extraction Path]
        FetchPage[Fetch Item Page Data]
        ItemAgent[Item Attribute\nExtraction Agent]
        ItemInfo[(Structured Item Information)]
    end

    %% === Final Stage: Synthesis & Evaluation ===
    subgraph FinalStage [Adjudication]
        FinalGemini{{Final Gemini Model:\nRelevancy Evaluation Judge}}
        
        FinalOutput(["Final Structured Output:\nRelevance Score (0-100)\nReasoning & Matches\nHuman Review Flag"])
    end

    %% === Define Flows/Connections ===

    %% Query Path Flows
    InputQuery --> QueryAgent
    QueryAgent -- "Yes (Sufficient)" --> GeminiInternal
    QueryAgent -- "No (Complex Query)" --> GGS
    
    GGS --> SearchResult
    SearchResult --> GeminiSummarize
    
    GeminiInternal --> QueryContext
    GeminiSummarize --> QueryContext

    %% Item Path Flows
    InputItemID --> FetchPage
    FetchPage --> ItemAgent
    ItemAgent --> ItemInfo

    %% Convergence Flows into Final Evaluator
    InputQuery -.->|Pass Original Query| FinalGemini
    QueryContext -->|Pass Context| FinalGemini
    ItemInfo -->|Pass Item Attributes| FinalGemini

    %% Final Output Flow
    FinalGemini --> FinalOutput

    %% === Styling ===
    classDef inputNode fill:#E3F2FD,stroke:#1565C0,stroke-width:2px;
    classDef decision fill:#FFF9C4,stroke:#FBC02D,stroke-width:2px,stroke-dasharray: 5 5;
    classDef gemini fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px;
    classDef artifact fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px;
    classDef external fill:#ffeded,stroke:#d32f2f,stroke-width:2px;

    class InputQuery,InputItemID inputNode;
    class QueryAgent decision;
    class GeminiInternal,GeminiSummarize,ItemAgent,FinalGemini gemini;
    class QueryContext,ItemInfo,FinalOutput,SearchResult artifact;
    class GGS external;

    %% Link styling
    linkStyle 11 stroke-width:2px,fill:none,stroke:gray,stroke-dasharray: 5 5;
`;

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
    mermaid.render('architecture-diagram', chart).then(({ svg }) => {
      setSvg(svg);
    }).catch(err => console.error("Mermaid failed to render", err));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-indigo-600" />
          System Architecture & Logic
        </h2>
        <p className="text-slate-600 leading-relaxed text-lg">
          This application utilizes a <strong>Multi-Model Orchestrator Pattern</strong> to balance cost, latency, and reasoning depth. 
          It acts as an intelligent merchandising agent that behaves like a human expert reviewing search logs.
        </p>
      </div>

      {/* The Pipeline Visualization (Simplified Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="w-24 h-24" />
          </div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
            Intent Router
          </h3>
          <div className="text-sm font-semibold text-blue-600 mb-2">Gemini 2.5 Flash</div>
          <p className="text-slate-600 text-sm">
            Analyzes the raw query to determine ambiguity. Decides if external data (Search) is required or if internal knowledge is sufficient, optimizing costs ($0.035 vs Free).
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
            <Globe className="w-24 h-24" />
          </div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
            Context Grounding
          </h3>
          <div className="text-sm font-semibold text-purple-600 mb-2">Google Search Tool</div>
          <p className="text-slate-600 text-sm">
            If needed, performs a real-time Google Search to understand current market trends, slang, or specific product model numbers (e.g., "iPhone 15 vs 14").
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
            <Cpu className="w-24 h-24" />
          </div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
            Deep Reasoning
          </h3>
          <div className="text-sm font-semibold text-indigo-600 mb-2">Gemini 3 Pro + Thinking</div>
          <p className="text-slate-600 text-sm">
            Synthesizes the product data and search context. Uses a <strong>32k token thinking budget</strong> to simulate a merchandising expert's evaluation process.
          </p>
        </div>
      </div>

      {/* Detailed Documentation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-8 py-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Database className="w-4 h-4" /> Technical Specifications
            </h3>
        </div>
        <div className="p-8 space-y-8">
            
            <section>
                <h4 className="text-lg font-bold text-slate-900 mb-3">1. The Router (Cost Optimization)</h4>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 font-mono text-xs text-slate-600 mb-3 overflow-x-auto">
                    {`// services/geminiService.ts
const determineSearchNecessity = async (query) => {
  // Uses Gemini 2.5 Flash (Low Cost)
  // Heuristic: Is query specific/trending (Search) or generic (Knowledge)?
  return { needsSearch: boolean, reason: string };
}`}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                    We do not want to pay for a Google Search Grounding request (~$35/1k) for queries like "red socks". 
                    The router uses a fast, cheap model to classify the query complexity. If the query is "best gaming laptop 2024", 
                    it flags it as needing search because knowledge cutoffs might miss the latest models.
                </p>
            </section>

            <section>
                <h4 className="text-lg font-bold text-slate-900 mb-3">2. Search Grounding Strategy</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    When search is activated, we don't just ask for the product. We ask for <strong>User Intent</strong>.
                    The prompt explicitly requests: <em>"What are customers usually looking for when they search this?"</em>
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                    <li><strong>Feature Extraction:</strong> Finds that "running shoes for flat feet" implies a need for "arch support" and "stability rails".</li>
                    <li><strong>Brand Association:</strong> Identifies that "yoga pants" often implies intent for "Lululemon" or equivalent quality.</li>
                </ul>
            </section>

            <section>
                <h4 className="text-lg font-bold text-slate-900 mb-3">3. Scoring Algorithm (Gemini 3 Pro)</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    The final analysis uses <strong>Gemini 3 Pro</strong> with a high <code>thinkingBudget</code> (32,768 tokens). 
                    This allows the model to "think" before outputting the JSON score. It evaluates:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-green-100 bg-green-50/50 p-4 rounded-lg">
                        <div className="font-semibold text-green-800 mb-1">Excellent (80-100)</div>
                        <p className="text-xs text-green-700">Perfect match for primary intent. All constraints (size, color, gender) met.</p>
                    </div>
                    <div className="border border-lime-100 bg-lime-50/50 p-4 rounded-lg">
                        <div className="font-semibold text-lime-800 mb-1">Good (60-79)</div>
                        <p className="text-xs text-lime-700">Relevant, but maybe a minor attribute mismatch (e.g., wrong shade of blue) or a bundle vs single item.</p>
                    </div>
                    <div className="border border-amber-100 bg-amber-50/50 p-4 rounded-lg">
                        <div className="font-semibold text-amber-800 mb-1">Okay (40-59)</div>
                        <p className="text-xs text-amber-700">Accessory item (e.g., iPhone case for query "iPhone") or broad category match.</p>
                    </div>
                    <div className="border border-orange-100 bg-orange-50/50 p-4 rounded-lg">
                        <div className="font-semibold text-orange-800 mb-1">Bad (20-39)</div>
                        <p className="text-xs text-orange-700">Slightly relevant but unusable. Wrong gender, wrong category, or cross-category noise.</p>
                    </div>
                    <div className="border border-red-100 bg-red-50/50 p-4 rounded-lg sm:col-span-2">
                        <div className="font-semibold text-red-800 mb-1">Embarrassing (0-19)</div>
                        <p className="text-xs text-red-700">Completely Irrelevant. No connection between the product and the query; should not appear in results.</p>
                    </div>
                </div>
            </section>
        </div>
      </div>

      {/* Mermaid Diagram Section (Moved to Bottom & Collapsible) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <button 
          onClick={() => setIsDiagramExpanded(!isDiagramExpanded)}
          className="w-full flex justify-between items-center border-b border-slate-100 bg-slate-50 px-8 py-4 hover:bg-slate-100 transition-colors focus:outline-none"
        >
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> System Data Flow
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
               <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full" />
             ) : (
               <div className="flex items-center justify-center text-slate-400 gap-2 h-64">
                 <Zap className="w-5 h-5 animate-pulse" /> Generating Architecture Diagram...
               </div>
             )}
          </div>
        )}
      </div>

    </div>
  );
};