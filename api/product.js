const axios = require('axios');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { asin } = req.query;
  if (!asin) return res.status(400).json({ error: 'ASIN is required' });

  try {
    console.log(`Fetching product data for ASIN: ${asin}`);

    const productResponse = await axios.get('https://api.scrapingdog.com/amazon/product', {
      params: {
        api_key: process.env.API_KEY,
        asin: asin,
        domain: 'com',
        country: 'us',
      }
    });

    console.log(`API response received for ${asin}`);
    console.log('Raw response data:', JSON.stringify(productResponse.data, null, 2));

    if (!productResponse.data?.title) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const categoryId = productResponse.data.category_id || null;

    // Handle customer reviews with more detailed checks
    let customerReviews = [];
    if (productResponse.data?.customer_reviews) {
      if (Array.isArray(productResponse.data.customer_reviews)) {
        customerReviews = productResponse.data.customer_reviews.map(review => ({
          title: review.review_title || review.title || 'Untitled Review',
          rating: review.rating ? 
            (typeof review.rating === 'string' ? 
              parseFloat(review.rating.split(' ')[0]) : 
              parseFloat(review.rating)) || 0 : 0,
          review: review.review_snippet || review.review || review.content || 'No review content'
        })).filter(review => review.rating > 0); // Only include reviews with valid ratings
      }
    }

    // Handle product information with more detailed checks
    let productInfo = {};
    if (productResponse.data.product_information) {
      if (Array.isArray(productResponse.data.product_information)) {
        productResponse.data.product_information.forEach(item => {
          if (item.key && item.value) {
            productInfo[item.key] = item.value;
          }
        });
      } else if (typeof productResponse.data.product_information === 'object') {
        productInfo = productResponse.data.product_information;
      }
    }

    // Handle customer sentiments with more detailed checks
    let customerSentiments = [];
    if (productResponse.data.customer_sentiments) {
      if (Array.isArray(productResponse.data.customer_sentiments)) {
        customerSentiments = productResponse.data.customer_sentiments.filter(
          sentiment => sentiment && (sentiment.title || sentiment.sentiment)
        );
      }
    }

    // Calculate average rating if total_reviews exists but average_rating doesn't
    let averageRating = productResponse.data.average_rating;
    if (!averageRating && customerReviews.length > 0) {
      const totalRating = customerReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      averageRating = (totalRating / customerReviews.length).toFixed(1);
    }

    // Format total reviews to a number if it's a string
    let totalReviews = productResponse.data.total_reviews;
    if (typeof totalReviews === 'string') {
      totalReviews = parseInt(totalReviews.replace(/,/g, '')) || 'N/A';
    }

    const productData = {
      title: productResponse.data.title || 'N/A',
      price: productResponse.data.price || 'Price not available',
      total_reviews: totalReviews || (customerReviews.length > 0 ? customerReviews.length : 'N/A'),
      average_rating: averageRating || (customerReviews.length > 0 ? 
        (customerReviews.reduce((sum, review) => sum + review.rating, 0) / customerReviews.length).toFixed(1) : 'N/A'),
      customers_say: productResponse.data.customers_say || 
        (customerReviews.length > 0 ? 'Based on customer reviews' : 'No customer feedback available'),
      customer_sentiments: customerSentiments.length > 0 ? customerSentiments : 
        (customerReviews.length > 0 ? [{
          title: 'Overall Sentiment',
          sentiment: averageRating >= 4 ? 'POSITIVE' : averageRating >= 3 ? 'MIXED' : 'NEGATIVE'
        }] : []),
      customer_reviews: customerReviews,
      category_id: categoryId,
      product_information: productInfo,
      images: Array.isArray(productResponse.data.images) ? productResponse.data.images : []
    };

    res.status(200).json(productData);
  } catch (error) {
    console.error('Error fetching product data:', error.message);

    if (error.response) {
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    res.status(500).json({
      error: 'Failed to fetch product data',
      details: error.response?.data || error.message
    });
  }
};
