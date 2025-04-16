const express = require('express');
const axios = require('axios');
const path = require('path');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
let api_key = process.env.API_KEY;


if (!api_key) {
  console.error('WARNING: API_KEY not found in environment variables');
}

if (api_key) {
  const maskedKey = `${api_key.substring(0, 4)}...${api_key.substring(api_key.length - 4)}`;
  console.log(`Using API key: ${maskedKey}`);
}

app.use(express.static('public'));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/api/product', async (req, res) => {
    const { asin } = req.query;
    if (!asin) return res.status(400).json({ error: 'ASIN is required' });

    if (!api_key) {
        return res.status(500).json({ 
            error: 'Server configuration error', 
            details: 'API key not configured'
        });
    }

    try {
        console.log(`Fetching product data for ASIN: ${asin}`);
        
        const productResponse = await axios.get('https://api.scrapingdog.com/amazon/product', {
            params: { 
                api_key: api_key, 
                asin: asin, 
                domain: 'com', 
                country: 'us',
            }
        });

        console.log(`API response received for ${asin}`);
        
        if (!productResponse.data?.title) {
            return res.status(404).json({ error: 'Product not found' });
        }

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

        console.log(`Product info keys: ${Object.keys(productInfo).length}`);

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

        res.json(productData);
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
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});