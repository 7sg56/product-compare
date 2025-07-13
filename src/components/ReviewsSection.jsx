import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

const ReviewsSection = ({ product1, product2 }) => {
  const [expandedReviews, setExpandedReviews] = useState({});
  const [visibleReviews, setVisibleReviews] = useState({
    product1: 10,
    product2: 10
  });

  // Safety check for missing data
  if (!product1 || !product2) {
    return null;
  }

  // Safe access function
  const safeGet = (obj, path, defaultValue = []) => {
    try {
      if (!obj) return defaultValue;
      return path.split('.').reduce((o, key) => o?.[key], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const toggleReview = (productKey, reviewIndex) => {
    const key = `${productKey}-${reviewIndex}`;
    setExpandedReviews(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const loadMoreReviews = (productKey) => {
    setVisibleReviews(prev => ({
      ...prev,
      [productKey]: prev[productKey] + 3
    }));
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const numRating = parseFloat(rating);
    if (isNaN(numRating)) return null;
    
    return (
      <div className="flex items-center mb-2">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(numRating)
                ? 'text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{numRating}</span>
      </div>
    );
  };

  const formatReviews = (reviews, productKey) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return (
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
          <div className="text-4xl mb-2">📝</div>
          <p>No reviews available</p>
        </div>
      );
    }

    const displayReviews = reviews.slice(0, visibleReviews[productKey]);
    const hasMore = reviews.length > visibleReviews[productKey];

    return (
      <div className="space-y-4">
        {displayReviews.map((review, index) => {
          const reviewKey = `${productKey}-${index}`;
          const isExpanded = expandedReviews[reviewKey];
          
          return (
            <div key={index} className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 transition-colors duration-200">
              {renderStars(review.rating)}
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white line-clamp-1">
                {review.title || 'Customer Review'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                {review.review || review.content || 'No review content available'}
              </p>
              <div className={`mt-3 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                productKey === 'product1' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
              }`}>
                Verified Purchase
              </div>
            </div>
          );
        })}
        
        {hasMore && (
          <div className="text-center">
            <button
              onClick={() => loadMoreReviews(productKey)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Load more reviews ({reviews.length - visibleReviews[productKey]} more)
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 transition-colors duration-200 border border-gray-700">
      <h2 className="text-3xl font-bold mb-8 text-white text-center">Customer Reviews</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center mb-6">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
            <h3 className="text-xl font-semibold text-white">
              {safeGet(product1, 'title', 'Product 1').substring(0, 50)}...
            </h3>
          </div>
          {formatReviews(product1.customer_reviews, "product1")}
        </div>
        
        <div>
          <div className="flex items-center mb-6">
            <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
            <h3 className="text-xl font-semibold text-white">
              {safeGet(product2, 'title', 'Product 2').substring(0, 50)}...
            </h3>
          </div>
          {formatReviews(product2.customer_reviews, "product2")}
        </div>
      </div>
    </div>
  );
};

export default ReviewsSection;