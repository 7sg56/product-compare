import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ComparisonTable from './ComparisonTable';
import ReviewsSection from './ReviewsSection';

const ProductComparison = () => {
  const [product1Input, setProduct1Input] = useState('');
  const [product2Input, setProduct2Input] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const input1Ref = useRef(null);

  useEffect(() => {
    input1Ref.current?.focus();
  }, []);

  const extractASIN = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const dpMatch = pathname.match(/\/dp\/([A-Z0-9]{10})/);
      if (dpMatch) return dpMatch[1];
      const productMatch = pathname.match(/\/product\/([A-Z0-9]{10})/);
      if (productMatch) return productMatch[1];
      const gpMatch = pathname.match(/\/gp\/product\/([A-Z0-9]{10})/);
      if (gpMatch) return gpMatch[1];
      const params = new URLSearchParams(urlObj.search);
      if (params.has("asin")) return params.get("asin");
      const fallbackMatch = pathname.match(/[A-Z0-9]{10}/);
      if (fallbackMatch) return fallbackMatch[0];
      throw new Error("Could not find ASIN in URL");
    } catch (error) {
      if (error.message === "Could not find ASIN in URL") throw error;
      throw new Error("Invalid Amazon URL");
    }
  };

  const fetchProductData = async (asin) => {
    try {
      const timestamp = new Date().getTime();
      const apiUrl = `/api/product?asin=${encodeURIComponent(asin)}&_t=${timestamp}`;
      const response = await axios.get(apiUrl, {
        headers: { Accept: "application/json" },
      });
      const data = response.data;
      if (!data || !data.title) {
        throw new Error("Invalid product data received");
      }
      return data;
    } catch (error) {
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
    setError('');
    setResults(null);

    if (!product1Input.trim() || !product2Input.trim()) {
      setError("Please enter both product URLs.");
      return;
    }
    if (product1Input.trim() === product2Input.trim()) {
      setError("Please enter two different product URLs.");
      return;
    }

    setLoading(true);
    try {
      const asin1 = extractASIN(product1Input.trim());
      const asin2 = extractASIN(product2Input.trim());
      const [product1Data, product2Data] = await Promise.all([
        fetchProductData(asin1),
        fetchProductData(asin2),
      ]);
      setResults({ product1: product1Data, product2: product2Data });
    } catch (error) {
      setError(error.message || "An error occurred while comparing products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-container p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Amazon Product Comparison</h1>
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product1" className="block text-sm font-medium text-gray-700 mb-1">
                Product 1 URL
              </label>
              <input
                ref={input1Ref}
                type="text"
                id="product1"
                value={product1Input}
                onChange={(e) => setProduct1Input(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="https://www.amazon.com/dp/XXXXXXXXXX"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="product2" className="block text-sm font-medium text-gray-700 mb-1">
                Product 2 URL
              </label>
              <input
                type="text"
                id="product2"
                value={product2Input}
                onChange={(e) => setProduct2Input(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="https://www.amazon.com/dp/XXXXXXXXXX"
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="mt-3 text-center">
            <button
              onClick={handleCompare}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center mx-auto"
            >
              {loading && (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
              )}
              {loading ? 'Comparing...' : 'Compare Products'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm text-center">
            {error}
          </div>
        )}

        {!results && !loading && !error && (
          <div className="text-center text-gray-500 mt-8">
            Enter two Amazon product URLs above and click <b>Compare Products</b> to begin.
          </div>
        )}

        {results && (
          <>
            <ComparisonTable product1={results.product1} product2={results.product2} />
            <ReviewsSection product1={results.product1} product2={results.product2} />
          </>
        )}
      </div>
    </div>
  );
};

export default ProductComparison;