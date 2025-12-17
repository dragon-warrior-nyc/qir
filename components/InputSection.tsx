import React, { useState } from 'react';
import { ProductDetails } from '../types';
import { extractProductDetailsFromUrl } from '../services/geminiService';
import { Search, ShoppingBag, Tag, FileText, DollarSign, Link, ArrowDownCircle, Loader2, Layers, Palette, Ruler, User, Award, Zap } from 'lucide-react';

interface InputSectionProps {
  query: string;
  setQuery: (q: string) => void;
  product: ProductDetails;
  setProduct: (p: ProductDetails) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  apiKey?: string;
  useSmartRouter: boolean;
  setUseSmartRouter: (val: boolean) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  query,
  setQuery,
  product,
  setProduct,
  onAnalyze,
  isAnalyzing,
  apiKey,
  useSmartRouter,
  setUseSmartRouter
}) => {
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleExtract = async () => {
    if (!url.trim()) return;
    
    // Check for API key before attempting
    if (!process.env.API_KEY && !apiKey) {
      setExtractionError("Please set your API Key in Settings first.");
      return;
    }
    
    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      const details = await extractProductDetailsFromUrl(url, apiKey);
      setProduct(details);
    } catch (err: any) {
      setExtractionError(err.message || "Could not extract details automatically. Please enter manually.");
    } finally {
      setIsExtracting(false);
    }
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
              className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={useSmartRouter} 
                onChange={(e) => setUseSmartRouter(e.target.checked)} 
                className="sr-only peer" 
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
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste product page URL..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
            <button
              onClick={handleExtract}
              disabled={isExtracting || !url}
              className={`px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors flex items-center gap-2 ${
                isExtracting || !url 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isExtracting ? (
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
              placeholder="e.g., Brooks Adrenaline GTS 22"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                placeholder="e.g., Footwear"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                placeholder="e.g., Brooks"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                placeholder="e.g., $140.00"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                placeholder="e.g., Women"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                placeholder="e.g., Best Seller"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                placeholder="e.g., Red, Black"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                placeholder="e.g., 8, 9, 10"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
              rows={4}
              placeholder="Paste product description here..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={isAnalyzing || !query || !product.name}
        className={`w-full py-4 rounded-lg font-semibold text-white shadow-lg transition-all transform active:scale-[0.98] ${
          isAnalyzing || !query || !product.name
            ? 'bg-slate-400 cursor-not-allowed shadow-none'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'
        }`}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing Relevance...
          </span>
        ) : (
          "Analyze Relevance"
        )}
      </button>
    </div>
  );
};