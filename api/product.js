const axios = require('axios');

export default async function handler(req, res) {
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
    
    if (!productResponse.data?.title) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Process the data as in your original code
    const categoryId = productResponse.data.category_id || null;

    let customerReviews = [];
    if (productResponse.data?.customer_reviews && Array.isArray(productResponse.data.customer_reviews)) {
      customerReviews = productResponse.data.customer_reviews.map(review => ({
        title: review.review_title || '',
        rating: review.rating ? parseFloat(review.rating.split(' ')[0]) : 'N/A',
        review: review.review_snippet || ''
      }));
    }

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

    const productData = {
      title: productResponse.data.title || 'N/A',
      price: productResponse.data.price || 'N/A',
      total_reviews: productResponse.data.total_reviews || 'N/A',
      average_rating: productResponse.data.average_rating || 'N/A',
      customers_say: productResponse.data.customers_say || 'N/A',
      customer_sentiments: productResponse.data.customer_sentiments || [],
      customer_reviews: customerReviews,
      category_id: categoryId,
      product_information: productInfo
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
}