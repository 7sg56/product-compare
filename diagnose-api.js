// Diagnostic script to identify API issues
const axios = require('axios');
require('dotenv').config();

// Sample ASINs for testing
const testAsins = [
    'B07ZPKN6YR', // Example ASIN 1
    'B07ZPKBL9V'  // Example ASIN 2
];

// Function to fetch product data with detailed logging
async function fetchProductData(asin) {
    try {
        console.log(`\n=== FETCHING DATA FOR ASIN: ${asin} ===`);
        
        // First, check if our server is running and accessible
        console.log('Checking server status...');
        const serverResponse = await axios.get('http://localhost:3000/');
        console.log(`Server is running. Status: ${serverResponse.status}`);
        
        // Now make the API request to our server
        console.log(`Making request to: http://localhost:3000/api/product?asin=${asin}`);
        const startTime = Date.now();
        const response = await axios.get(`http://localhost:3000/api/product?asin=${asin}`);
        const endTime = Date.now();
        
        console.log(`Response time: ${endTime - startTime}ms`);
        console.log(`Response status: ${response.status}`);
        
        // Check if the response data has the expected structure
        const data = response.data;
        console.log(`Response data structure:`, Object.keys(data));
        
        // Check for specific fields
        const importantFields = ['title', 'price', 'average_rating', 'total_reviews', 'images'];
        importantFields.forEach(field => {
            console.log(`Field '${field}': ${data[field] ? 'Present' : 'Missing or null'}`);
            if (data[field]) {
                console.log(`  Value: ${typeof data[field] === 'object' ? JSON.stringify(data[field]) : data[field]}`);
            }
        });
        
        return data;
    } catch (error) {
        console.error(`\n=== ERROR FETCHING DATA FOR ASIN: ${asin} ===`);
        console.error(`Error message: ${error.message}`);
        
        if (error.response) {
            console.error(`Response status: ${error.response.status}`);
            console.error(`Response data:`, error.response.data);
        } else if (error.request) {
            console.error(`No response received. Request details:`, error.request);
        }
        
        throw error;
    }
}

// Function to directly test the ScrapingDog API
async function testScrapingDogAPI(asin) {
    try {
        console.log(`\n=== TESTING SCRAPINGDOG API DIRECTLY FOR ASIN: ${asin} ===`);
        
        const apiKey = process.env.API_KEY;
        console.log(`Using API key: ${apiKey ? 'Present' : 'Missing'}`);
        
        const url = 'https://api.scrapingdog.com/amazon/product';
        const params = {
            api_key: apiKey,
            asin: asin,
            domain: 'com',
            country: 'us'
        };
        
        console.log(`Making request to ScrapingDog API with params:`, params);
        const startTime = Date.now();
        const response = await axios.get(url, { params });
        const endTime = Date.now();
        
        console.log(`Response time: ${endTime - startTime}ms`);
        console.log(`Response status: ${response.status}`);
        
        // Check if the response data has the expected structure
        const data = response.data;
        console.log(`Response data structure:`, Object.keys(data));
        
        // Check for specific fields
        const importantFields = ['title', 'price', 'average_rating', 'total_reviews', 'images'];
        importantFields.forEach(field => {
            console.log(`Field '${field}': ${data[field] ? 'Present' : 'Missing or null'}`);
            if (data[field]) {
                console.log(`  Value: ${typeof data[field] === 'object' ? JSON.stringify(data[field]) : data[field]}`);
            }
        });
        
        return data;
    } catch (error) {
        console.error(`\n=== ERROR TESTING SCRAPINGDOG API FOR ASIN: ${asin} ===`);
        console.error(`Error message: ${error.message}`);
        
        if (error.response) {
            console.error(`Response status: ${error.response.status}`);
            console.error(`Response data:`, error.response.data);
        } else if (error.request) {
            console.error(`No response received. Request details:`, error.request);
        }
        
        throw error;
    }
}

// Main function to run diagnostics
async function runDiagnostics() {
    console.log('=== API DIAGNOSTIC TOOL ===');
    console.log(`API Key: ${process.env.API_KEY ? 'Present' : 'Missing'}`);
    
    try {
        // Test first ASIN through our server
        console.log('\n=== TESTING FIRST ASIN THROUGH OUR SERVER ===');
        await fetchProductData(testAsins[0]);
        
        // Test second ASIN through our server
        console.log('\n=== TESTING SECOND ASIN THROUGH OUR SERVER ===');
        await fetchProductData(testAsins[1]);
        
        // Test first ASIN directly with ScrapingDog API
        console.log('\n=== TESTING FIRST ASIN DIRECTLY WITH SCRAPINGDOG API ===');
        await testScrapingDogAPI(testAsins[0]);
        
        // Test second ASIN directly with ScrapingDog API
        console.log('\n=== TESTING SECOND ASIN DIRECTLY WITH SCRAPINGDOG API ===');
        await testScrapingDogAPI(testAsins[1]);
        
        console.log('\n=== DIAGNOSTIC COMPLETED ===');
    } catch (error) {
        console.error('\n=== DIAGNOSTIC FAILED ===');
        console.error(`Error: ${error.message}`);
    }
}

// Run the diagnostics
runDiagnostics(); 