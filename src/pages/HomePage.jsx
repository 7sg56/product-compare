import { useState } from 'react';
import axios from 'axios';
import ComparisonTable from '../components/ComparisonTable';
import ReviewsSection from '../components/ReviewsSection';

const HomePage = () => {
  const [product1Url, setProduct1Url] = useState('');
  const [product2Url, setProduct2Url] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract ASIN directly in the component
  const extractASIN = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Check for dp pattern (most common)
      const dpMatch = pathname.match(/\/dp\/([A-Z0-9]{10})/);
      if (dpMatch) return dpMatch[1];

      // Check for product pattern
      const productMatch = pathname.match(/\/product\/([A-Z0-9]{10})/);
      if (productMatch) return productMatch[1];

      // Check for gp/product pattern
      const gpMatch = pathname.match(/\/gp\/product\/([A-Z0-9]{10})/);
      if (gpMatch) return gpMatch[1];

      // Check if ASIN is in URL params
      const params = new URLSearchParams(urlObj.search);
      if (params.has("asin")) return params.get("asin");

      // Fallback: try to find any 10-character alphanumeric string in the URL path
      const fallbackMatch = pathname.match(/[A-Z0-9]{10}/);
      if (fallbackMatch) return fallbackMatch[0];

      throw new Error("Could not find ASIN in URL");
    } catch (error) {
      if (error.message === "Could not find ASIN in URL") {
        throw error;
      }
      throw new Error("Invalid Amazon URL");
    }
  };

  // Fetch product data directly in the component
  const fetchProductData = async (asin) => {
    try {
      const timestamp = new Date().getTime();
      const apiUrl = `/api/product?asin=${encodeURIComponent(asin)}&_t=${timestamp}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      const data = response.data;
      if (!data || !data.title) {
        throw new Error("Invalid product data received");
      }

      return data;
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(
          `Failed to fetch product data: ${errorData.error || error.response.statusText}`
        );
      }
      throw error;
    }
  };

  const handleCompare = async () => {
    const url1 = product1Url.trim();
    const url2 = product2Url.trim();

    if (!url1 || !url2) {
      setError("Please enter both product URLs");
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      // Extract ASINs from URLs
      const asin1 = extractASIN(url1);
      const asin2 = extractASIN(url2);

      // Fetch product data in parallel
      const [product1Data, product2Data] = await Promise.all([
        fetchProductData(asin1),
        fetchProductData(asin2),
      ]);

      // Safety check the data
      if (!product1Data?.title || !product2Data?.title) {
        throw new Error("Invalid product data received. Please check the URLs and try again.");
      }

      // Set results
      setResults({ 
        product1: product1Data, 
        product2: product2Data 
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Error occurred:", error);
      setError(error.message || "An error occurred while comparing products");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Hero Section - Clean without logo */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center">
        {/* Background with subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          {/* Main Heading - No logo here */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tight leading-none">
            compare everything
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
            Amazon products, specifications, prices, reviews, and much more
          </p>

          {/* Search Interface */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-200">First Product URL</label>
                  <input
                    type="text"
                    value={product1Url}
                    onChange={(e) => setProduct1Url(e.target.value)}
                    placeholder="https://www.amazon.com/dp/XXXXXXXXXX"
                    className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-xl border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-lg"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-200">Second Product URL</label>
                  <input
                    type="text"
                    value={product2Url}
                    onChange={(e) => setProduct2Url(e.target.value)}
                    placeholder="https://www.amazon.com/dp/XXXXXXXXXX"
                    className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-xl border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-lg"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleCompare}
                  disabled={loading || !product1Url.trim() || !product2Url.trim()}
                  className="px-12 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3 shadow-xl"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Comparing...</span>
                    </>
                  ) : (
                    <>
                      <span>Compare</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl text-center backdrop-blur-sm">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Wavy Transition Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        {/* Wavy Top that extends FROM the hero */}
        <div className="absolute top-0 left-0 w-full overflow-hidden">
          <svg className="relative block w-full h-20 transform rotate-180" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity="0.3" fill="currentColor" className="text-gray-800"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity="0.5" fill="currentColor" className="text-gray-800"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor" className="text-gray-800"></path>
          </svg>
        </div>
        
        {/* Content section with theme background */}
        <div className="relative bg-gray-800 pt-20">
          {/* Results Section */}
          {results && (
            <div className="py-16 px-4">
              <div className="max-w-7xl mx-auto">
                <ComparisonTable product1={results.product1} product2={results.product2} />
                <ReviewsSection product1={results.product1} product2={results.product2} />
                
                {/* AI Features Coming Soon - Show after results */}
                <div className="mt-12">
                  <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                          <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">AI Comparison Assistant</h3>
                      <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
                        🚀 <strong>Coming Soon:</strong> Our AI will analyze your comparison and provide personalized recommendations, 
                        explaining which product is better for your specific needs and why you should or shouldn't choose each option.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-white font-medium">Smart Recommendations</span>
                          </div>
                          <p className="text-purple-200">AI will tell you which product to choose based on your needs</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-white font-medium">Chat with AI</span>
                          </div>
                          <p className="text-purple-200">Ask specific questions about your comparison needs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* About Section - Combined with How It Works */}
          <section id="about" className="py-20 px-4">
            <div className="max-w-6xl mx-auto">
              {/* About CompareIt */}
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6 text-white">
                  About CompareIt
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  CompareIt is a free, powerful tool designed to help you make smarter shopping decisions. 
                  We analyze Amazon products side-by-side, extracting specifications, prices, ratings, and reviews 
                  to give you a comprehensive comparison in seconds.
                </p>
              </div>

              {/* AI Coming Soon Section - Show when no results */}
              {!results && (
                <div className="mb-20">
                  <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                          <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                            SOON
                          </div>
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">AI-Powered Comparison Assistant</h3>
                      <p className="text-xl text-purple-200 mb-8 max-w-3xl mx-auto">
                        We're developing an intelligent AI assistant that will revolutionize how you compare products. 
                        Get personalized recommendations and chat with AI about your specific needs.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold mb-3 text-white">Smart Recommendations</h4>
                        <p className="text-purple-200 text-sm leading-relaxed">
                          AI will analyze both products and tell you exactly which one to choose based on your specific needs, 
                          budget, and preferences.
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold mb-3 text-white">Interactive Chat</h4>
                        <p className="text-purple-200 text-sm leading-relaxed">
                          Chat directly with our AI assistant to ask specific questions about features, compatibility, 
                          and get detailed explanations.
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold mb-3 text-white">Instant Analysis</h4>
                        <p className="text-purple-200 text-sm leading-relaxed">
                          Get instant pros and cons analysis, helping you understand why you should or shouldn't 
                          choose each product.
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-center mt-8">
                      <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white font-medium">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Coming in the next update
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Lightning Fast</h3>
                  <p className="text-gray-300 text-sm">Get comparisons in seconds, not minutes</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">100% Free</h3>
                  <p className="text-gray-300 text-sm">No subscriptions, no hidden fees</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">AI-Powered</h3>
                  <p className="text-gray-300 text-sm">Smart analysis of reviews and specs</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">User-Friendly</h3>
                  <p className="text-gray-300 text-sm">Simple interface, powerful results</p>
                </div>
              </div>

              {/* How It Works Section */}
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4 text-white">
                  How It Works
                </h2>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  Simple, fast, and completely free product comparison
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Paste URLs</h3>
                  <p className="text-gray-300 leading-relaxed">Copy Amazon product URLs and paste them into our comparison tool.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Get Analysis</h3>
                  <p className="text-gray-300 leading-relaxed">Our AI analyzes specifications, prices, ratings, and reviews automatically.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Make Decision</h3>
                  <p className="text-gray-300 leading-relaxed">Compare side-by-side and choose the best product for your needs.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer - Minimal */}
          <footer className="py-12 px-4 bg-gray-900 text-white">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="font-bold">CompareIt</span>
              </div>
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} CompareIt. Not affiliated with Amazon.
              </p>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};

export default HomePage;