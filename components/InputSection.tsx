import React, { useState } from 'react';
import { ProductDetails } from '../types';
import { extractProductDetailsFromUrl } from '../services/geminiService';
import { Search, ShoppingBag, Tag, FileText, DollarSign, Link, ArrowDownCircle, Loader2, Layers, Palette, Ruler, User, Award, Zap, Sparkles, Square } from 'lucide-react';

interface InputSectionProps {
  query: string;
  setQuery: (q: string) => void;
  product: ProductDetails;
  setProduct: (p: ProductDetails) => void;
  onAnalyze: (productOverride?: ProductDetails, urlToExtract?: string) => void;
  onStop: () => void;
  isAnalyzing: boolean;
  useSmartRouter: boolean;
  setUseSmartRouter: (val: boolean) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  query,
  setQuery,
  product,
  setProduct,
  onAnalyze,
  onStop,
  isAnalyzing,
  useSmartRouter,
  setUseSmartRouter
}) => {
  const [url, setUrl] = useState('https://www.walmart.com/ip/Lawry-s-Herb-Garlic-With-Lemon-Marinade-12-fl-oz-Bottle/10319655');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  // Standalone extraction (Just fill the form)
  const handleExtract = async () => {
    if (!url.trim()) return;
    
    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      // Pass query if available to allow for task-specific extraction
      const details = await extractProductDetailsFromUrl(url, query);
      setProduct(details);
    } catch (err: any) {
      setExtractionError(err.message || "Could not extract details automatically. Please enter manually.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Parallel Workflow Trigger
  const handleExtractAndAnalyze = async () => {
    if (!url.trim()) return;
    if (!query.trim()) {
      setExtractionError("Please enter a customer query first.");
      return;
    }

    setExtractionError(null);
    // We pass the URL to onAnalyze so App.tsx can run extraction in parallel with the Router/Context flow
    onAnalyze(undefined, url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" />
          Customer Query
        </h2>
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'best running shoes for flat feet'"
              disabled={isAnalyzing}
              className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${useSmartRouter ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">Smart Router Optimization</span>
                <span className="text-xs text-slate-500">
                  {useSmartRouter 
                    ? "Skip Search for generic queries to save cost." 
                    : "Always use Google Search Grounding (Higher cost)."}
                </span>
              </div>
            </div>
            <label className={`relative inline-flex items-center cursor-pointer ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
              <input 
                type="checkbox" 
                checked={useSmartRouter} 
                onChange={(e) => setUseSmartRouter(e.target.checked)} 
                className="sr-only peer" 
                disabled={isAnalyzing}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-600" />
          Product Details
        </h2>

        {/* URL Input Section */}
        <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <Link className="w-3 h-3" /> Import from URL (Optional)
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste product page URL..."
              disabled={isAnalyzing || isExtracting}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            />
            <div className="flex gap-2">
              <button
                onClick={handleExtract}
                disabled={isExtracting || isAnalyzing || !url}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-xs md:text-sm text-slate-700 border border-slate-300 transition-colors flex items-center justify-center gap-2 ${
                  isExtracting || isAnalyzing || !url 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {isExtracting && !isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="w-4 h-4" />
                    Auto-fill
                  </>
                )}
              </button>
              
              <button
                onClick={handleExtractAndAnalyze}
                disabled={isExtracting || isAnalyzing || !url || !query}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-xs md:text-sm text-white transition-colors flex items-center justify-center gap-2 ${
                  isExtracting || isAnalyzing || !url || !query
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md'
                }`}
                title={!query ? "Enter query first" : "Extract details and run analysis immediately"}
              >
                 {(isAnalyzing) && url && query ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" />
                     Processing...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-4 h-4" />
                     Auto-fill {'&'} Analyze
                   </>
                 )}
              </button>
            </div>
          </div>
          {extractionError && (
            <p className="mt-2 text-xs text-red-600">{extractionError}</p>
          )}
        </div>
        
        {/* Manual Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Product Name</label>
            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleChange}
              disabled={isAnalyzing}
              placeholder="e.g., Brooks Adrenaline GTS 22"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Category
              </label>
              <input
                type="text"
                name="category"
                value={product.category}
                onChange={handleChange}
                disabled={isAnalyzing}
                placeholder="e.g., Footwear"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Brand
              </label>
              <input
                type="text"
                name="brand"
                value={product.brand}
                onChange={handleChange}
                disabled={isAnalyzing}
                placeholder="e.g., Brooks"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Price
              </label>
              <input
                type="text"
                name="price"
                value={product.price}
                onChange={handleChange}
                disabled={isAnalyzing}
                placeholder="e.g., $140.00"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Gender
              </label>
              <input
                type="text"
                name="gender"
                value={product.gender}
                onChange={handleChange}
                disabled={isAnalyzing}
                placeholder="e.g., Women"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Award className="w-3 h-3" /> Badge
              </label>
              <input
                type="text"
                name="badge"
                value={product.badge}
                onChange={handleChange}
                disabled={isAnalyzing}
                placeholder="e.g., Best Seller"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Palette className="w-3 h-3" /> Colors
              </label>
              <input
                type="text"
                name="color"
                value={product.color}
                onChange={handleChange}
                disabled={isAnalyzing}
                placeholder="e.g., Red, Black"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Sizes
              </label>
              <input
                type="text"
                name="size"
                value={product.size}
                onChange={handleChange}
                disabled={isAnalyzing}
                placeholder="e.g., 8, 9, 10"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Description
            </label>
            <textarea
              name="description"
              value={product.description}
              onChange={handleChange}
              disabled={isAnalyzing}
              rows={4}
              placeholder="Paste product description here..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {isAnalyzing ? (
        <button
          onClick={onStop}
          className="w-full py-4 rounded-lg font-semibold text-white shadow-lg bg-rose-500 hover:bg-rose-600 hover:shadow-rose-500/30 transition-all transform active:scale-[0.98] animate-pulse"
        >
          <span className="flex items-center justify-center gap-2">
            <Square className="h-5 w-5 fill-current" />
            Stop Analysis
          </span>
        </button>
      ) : (
        <button
          onClick={() => onAnalyze()}
          disabled={!query || !product.name}
          className={`w-full py-4 rounded-lg font-semibold text-white shadow-lg transition-all transform active:scale-[0.98] ${
            !query || !product.name
              ? 'bg-slate-400 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'
          }`}
        >
          Analyze Relevance
        </button>
      )}
    </div>
  );
};