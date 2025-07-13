import { useState } from 'react';

const ReviewsSection = ({ product1, product2 }) => {
  const [expandedReviews, setExpandedReviews] = useState({});
  const [visibleReviews, setVisibleReviews] = useState({
    product1: 10,
    product2: 10
  });

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

  const formatReviews = (reviews, productKey) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return <div className="text-gray-500">No reviews available</div>;
    }

    const displayReviews = reviews.slice(0, visibleReviews[productKey]);
    const hasMore = reviews.length > visibleReviews[productKey];

    return (
      <div className="space-y-4">
        {displayReviews.map((review, index) => {
          const reviewKey = `${productKey}-${index}`;
          const isExpanded = expandedReviews[reviewKey];
          
          return (
            <div key={index} className="review-item border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start">
                <div className="font-medium text-lg">{review.title || "No Title"}</div>
                <div className={`${
                  review.rating >= 4
                    ? "text-green-600"
                    : review.rating <= 2
                    ? "text-red-600"
                    : "text-yellow-600"
                } font-semibold`}>
                  {review.rating || "N/A"}/5
                </div>
              </div>
              <div className="text-gray-600 mt-2">
                <div className={isExpanded ? '' : 'line-clamp-3'}>
                  {review.review || "No review text available"}
                </div>
                {review.review && review.review.length > 150 && (
                  <button
                    onClick={() => toggleReview(productKey, index)}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
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
    <div className="mt-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">
              {product1.title ? product1.title.split(" - ")[0] : "Product 1"}
            </h3>
            {formatReviews(product1.customer_reviews, "product1")}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">
              {product2.title ? product2.title.split(" - ")[0] : "Product 2"}
            </h3>
            {formatReviews(product2.customer_reviews, "product2")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsSection;