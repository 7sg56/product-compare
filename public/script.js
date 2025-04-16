document.addEventListener('DOMContentLoaded', () => {
    const product1Input = document.getElementById('product1');
    const product2Input = document.getElementById('product2');
    const compareBtn = document.getElementById('compareBtn');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');

    function extractASIN(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const asinMatch = pathname.match(/\/dp\/([A-Z0-9]{10})/);
            if (asinMatch) return asinMatch[1];
            
            const params = new URLSearchParams(urlObj.search);
            if (params.has('asin')) return params.get('asin');
            
            throw new Error('Could not find ASIN in URL');
        } catch (error) {
            throw new Error('Invalid Amazon URL');
        }
    }

    async function fetchProductData(asin) {
        
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/product?asin=${asin}&_t=${timestamp}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to fetch product data: ${errorData.error || response.statusText}`);
        }
        return await response.json();
    }

    function formatFeatureValue(value, key) {
        if (!value) return 'N/A';
        
        switch (key) {
            case 'customers_say':
                return typeof value === 'string' ? `<p class="text-gray-700">${value}</p>` : 'No customer reviews available';
            case 'customer_sentiments':
                return Array.isArray(value) && value.length > 0 ? 
                    `<ul class="list-disc pl-5 space-y-1">${value.map(item => 
                        `<li class="${item.sentiment === 'POSITIVE' ? 'text-green-600' : item.sentiment === 'NEGATIVE' ? 'text-red-600' : 'text-yellow-600'}">
                            <span class="font-medium">${item.title}:</span> ${item.sentiment}
                        </li>`
                    ).join('')}</ul>` : 'No sentiment data available';
            default:
                return value.toString();
        }
    }

    function formatFullReviews(reviews) {
        if (!Array.isArray(reviews) || reviews.length === 0) return 'N/A';
        
        return `<div class="space-y-4">
            ${reviews.slice(0, 3).map((review, index) => `
                <div class="review-item border-b border-gray-200 pb-4">
                    <div class="flex justify-between items-start">
                        <div class="font-medium text-lg">${review.title || 'No Title'}</div>
                        <div class="${review.rating >= 4 ? 'text-green-600' : review.rating <= 2 ? 'text-red-600' : 'text-yellow-600'} font-semibold">
                            ${review.rating}/5
                        </div>
                    </div>
                    <div class="text-gray-600 mt-2 review-content hidden">${review.review || 'No review text available'}</div>
                    <button class="text-blue-600 hover:text-blue-800 text-sm mt-2 toggle-review" data-index="${index}">
                        Show more
                    </button>
                </div>
            `).join('')}
            ${reviews.length > 3 ? `
                <div class="text-center">
                    <button class="text-blue-600 hover:text-blue-800 font-medium load-more-reviews">
                        Load more reviews (${reviews.length - 3} more)
                    </button>
                </div>
            ` : ''}
        </div>`;
    }
    
    function findCommonFeatures(product1, product2) {

        const product1Info = product1.product_information || {};
        const product2Info = product2.product_information || {};
        
        console.log('Product 1 Info Keys:', Object.keys(product1Info));
        console.log('Product 2 Info Keys:', Object.keys(product2Info));

        const normalizeKey = (key) => key.toLowerCase().replace(/[\s_-]+/g, '');
        
        const product1KeyMap = {};
        const product2KeyMap = {};
        
        Object.keys(product1Info).forEach(key => {
            const normalizedKey = normalizeKey(key);
            product1KeyMap[normalizedKey] = key;
        });
        
        Object.keys(product2Info).forEach(key => {
            const normalizedKey = normalizeKey(key);
            product2KeyMap[normalizedKey] = key;
        });
        
        const commonFeatures = [];
        
        Object.keys(product1KeyMap).forEach(normalizedKey => {
            if (product2KeyMap[normalizedKey]) {

                commonFeatures.push({
                    product1Key: product1KeyMap[normalizedKey],
                    product2Key: product2KeyMap[normalizedKey],
                    normalizedKey: normalizedKey
                });
            }
        });
        
        console.log(`Found ${commonFeatures.length} common features`);
        
        return commonFeatures;
    }
    
    function createFeatureComparisonTable(commonFeatures, product1, product2) {
        if (!Array.isArray(commonFeatures) || commonFeatures.length === 0) {
            console.log('No common features to display');
            return '<p class="text-center text-gray-500 my-4">No common features found between these products</p>';
        }
    
        const product1Info = product1.product_information || {};
        const product2Info = product2.product_information || {};

        const filteredFeatures = commonFeatures.filter(feature => 
            !feature.product1Key.includes('Customer Reviews')
        );

        filteredFeatures.sort((a, b) => {
            return a.product1Key.localeCompare(b.product1Key);
        });
    
        return `
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="py-3 px-4 text-left text-gray-700 font-semibold">Feature</th>
                        <th class="py-3 px-4 text-left text-gray-700 font-semibold">${product1.title ? product1.title.split(' - ')[0] : 'Product 1'}</th>
                        <th class="py-3 px-4 text-left text-gray-700 font-semibold">${product2.title ? product2.title.split(' - ')[0] : 'Product 2'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredFeatures.map(feature => {
                        const value1 = product1Info[feature.product1Key];
                        const value2 = product2Info[feature.product2Key];
                        return `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="py-3 px-4 font-medium">${feature.product1Key}</td>
                            <td class="py-3 px-4">${value1 || 'N/A'}</td>
                            <td class="py-3 px-4">${value2 || 'N/A'}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }

    function addToggleReviewEventListeners() {
        document.querySelectorAll('.toggle-review:not([data-event-added])').forEach(button => {
            button.setAttribute('data-event-added', 'true');
            button.addEventListener('click', function() {
                const reviewContent = this.previousElementSibling;
                const isHidden = reviewContent.classList.contains('hidden');
                reviewContent.classList.toggle('hidden');
                this.textContent = isHidden ? 'Show less' : 'Show more';
            });
        });
    }
    
    function displayResults(product1, product2) {
        console.log("Displaying results for products:", product1.title, product2.title);

        console.log("Product 1 info keys:", Object.keys(product1.product_information || {}));
        console.log("Product 2 info keys:", Object.keys(product2.product_information || {}));
        

        const existingReviewsSection = resultsDiv.querySelector('.reviews-section');
        if (existingReviewsSection) {
            existingReviewsSection.remove();
        }
        
        const existingFeaturesSection = resultsDiv.querySelector('.features-section');
        if (existingFeaturesSection) {
            existingFeaturesSection.remove();
        }

        document.getElementById('product1-name').innerHTML = product1.title || 'N/A';
        document.getElementById('product2-name').innerHTML = product2.title || 'N/A';
        document.getElementById('product1-price').innerHTML = product1.price || 'N/A';
        document.getElementById('product2-price').innerHTML = product2.price || 'N/A';
        document.getElementById('product1-rating').innerHTML = product1.average_rating || 'N/A';
        document.getElementById('product2-rating').innerHTML = product2.average_rating || 'N/A';
        document.getElementById('product1-reviews').innerHTML = product1.total_reviews || 'N/A';
        document.getElementById('product2-reviews').innerHTML = product2.total_reviews || 'N/A';
        document.getElementById('product1-customers-say').innerHTML = formatFeatureValue(product1.customers_say, 'customers_say');
        document.getElementById('product2-customers-say').innerHTML = formatFeatureValue(product2.customers_say, 'customers_say');
        document.getElementById('product1-sentiments').innerHTML = formatFeatureValue(product1.customer_sentiments, 'customer_sentiments');
        document.getElementById('product2-sentiments').innerHTML = formatFeatureValue(product2.customer_sentiments, 'customer_sentiments');
        
        const commonFeatures = findCommonFeatures(product1, product2);
        console.log("Common features found:", commonFeatures.length);
        
        const featuresSection = document.createElement('div');
        featuresSection.className = 'mt-8 features-section';
        featuresSection.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-2xl font-bold mb-6">Product Features Comparison</h2>
                ${createFeatureComparisonTable(commonFeatures, product1, product2)}
            </div>
        `;
        resultsDiv.appendChild(featuresSection);
        
        const fullReviewsSection = document.createElement('div');
        fullReviewsSection.className = 'mt-8 reviews-section';
        fullReviewsSection.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-2xl font-bold mb-6">Customer Reviews</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="text-xl font-semibold mb-4">${product1.title}</h3>
                        ${formatFullReviews(product1.customer_reviews)}
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold mb-4">${product2.title}</h3>
                        ${formatFullReviews(product2.customer_reviews)}
                    </div>
                </div>
            </div>
        `;
        resultsDiv.appendChild(fullReviewsSection);
        resultsDiv.classList.remove('hidden');

        addToggleReviewEventListeners();

        document.querySelectorAll('.load-more-reviews').forEach(button => {
            button.addEventListener('click', function() {
                const reviewsContainer = this.closest('.space-y-4');
                const productIndex = this.closest('.grid').children[0].contains(this) ? 0 : 1;
                const product = productIndex === 0 ? product1 : product2;
                const currentReviews = reviewsContainer.querySelectorAll('.review-item').length;
                
                if (currentReviews < product.customer_reviews.length) {
                    const nextReviews = product.customer_reviews.slice(currentReviews, currentReviews + 3);
                    const newReviewsHtml = nextReviews.map((review, index) => `
                        <div class="review-item border-b border-gray-200 pb-4">
                            <div class="flex justify-between items-start">
                                <div class="font-medium text-lg">${review.title || 'No Title'}</div>
                                <div class="${review.rating >= 4 ? 'text-green-600' : review.rating <= 2 ? 'text-red-600' : 'text-yellow-600'} font-semibold">
                                    ${review.rating}/5
                                </div>
                            </div>
                            <div class="text-gray-600 mt-2 review-content hidden">${review.review || 'No review text available'}</div>
                            <button class="text-blue-600 hover:text-blue-800 text-sm mt-2 toggle-review" data-index="${currentReviews + index}">
                                Show more
                            </button>
                        </div>
                    `).join('');
                    
                    const loadMoreContainer = this.closest('.text-center');
                    loadMoreContainer.insertAdjacentHTML('beforebegin', newReviewsHtml);
                    
                    addToggleReviewEventListeners();
                    
                    const remainingReviews = product.customer_reviews.length - (currentReviews + nextReviews.length);
                    if (remainingReviews > 0) {
                        this.textContent = `Load more reviews (${remainingReviews} more)`;
                    } else {
                        loadMoreContainer.remove();
                    }
                }
            });
        });
    }

    compareBtn.addEventListener('click', async () => {
        const url1 = product1Input.value.trim();
        const url2 = product2Input.value.trim();

        if (!url1 || !url2) {
            errorDiv.textContent = 'Please enter both product URLs';
            errorDiv.classList.remove('hidden');
            return;
        }

        try {
            loadingDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            resultsDiv.classList.add('hidden');
            
            const asin1 = extractASIN(url1);
            const asin2 = extractASIN(url2);
            
            const product1Data = await fetchProductData(asin1);
            const product2Data = await fetchProductData(asin2);
        
            if (product1Data.category_id !== product2Data.category_id || 
                !product1Data.category_id || 
                !product2Data.category_id) {
                console.warn(
                    'Products may be in different categories. ' +
                    `Product 1 category: ${product1Data.category_id || 'Unknown'}, ` +
                    `Product 2 category: ${product2Data.category_id || 'Unknown'}`
                );
            }
            
            displayResults(product1Data, product2Data);
        } catch (error) {
            console.error('Error occurred:', error);
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
            resultsDiv.classList.add('hidden');
        } finally {
            loadingDiv.classList.add('hidden');
        }
    });
});