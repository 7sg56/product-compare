document.addEventListener("DOMContentLoaded", () => {
  const product1Input = document.getElementById("product1");
  const product2Input = document.getElementById("product2");
  const compareBtn = document.getElementById("compareBtn");
  const loadingDiv = document.getElementById("loading");
  const errorDiv = document.getElementById("error");
  const resultsDiv = document.getElementById("results");

  function extractASIN(url) {
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
  }

  async function fetchProductData(asin) {
    try {
      const timestamp = new Date().getTime();
      const apiUrl = `/api/product?asin=${encodeURIComponent(
        asin
      )}&_t=${timestamp}`;

      console.log(`Fetching data from: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(
            `Failed to fetch product data: ${
              errorData.error || response.statusText
            }`
          );
        } else {
          throw new Error(
            `Failed to fetch product data: ${response.status} ${response.statusText}`
          );
        }
      }

      const data = await response.json();
      if (!data || !data.title) {
        throw new Error("Invalid product data received");
      }

      return data;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }

  function formatFeatureValue(value, key) {
    if (value === null || value === undefined) return "N/A";

    switch (key) {
      case "customers_say":
        return typeof value === "string"
          ? `<p class="text-gray-700">${value}</p>`
          : "No customer reviews available";
      case "customer_sentiments":
        return Array.isArray(value) && value.length > 0
          ? `<ul class="list-disc pl-5 space-y-1">${value
              .map(
                (item) =>
                  `<li class="${
                    item.sentiment === "POSITIVE"
                      ? "text-green-600"
                      : item.sentiment === "NEGATIVE"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }">
                            <span class="font-medium">${
                              item.title || "Unknown"
                            }:</span> ${item.sentiment || "Unknown"}
                        </li>`
              )
              .join("")}</ul>`
          : "No sentiment data available";
      default:
        return String(value);
    }
  }

  function formatFullReviews(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) return "N/A";

    // Take up to 10 reviews
    const displayReviews = reviews.slice(0, 10);

    return `<div class="space-y-4">
            ${displayReviews
              .map(
                (review, index) => `
                <div class="review-item border-b border-gray-200 pb-4" data-review-id="${index}">
                    <div class="flex justify-between items-start">
                        <div class="font-medium text-lg">${
                          review.title || "No Title"
                        }</div>
                        <div class="${
                          review.rating >= 4
                            ? "text-green-600"
                            : review.rating <= 2
                            ? "text-red-600"
                            : "text-yellow-600"
                        } font-semibold">
                            ${review.rating || "N/A"}/5
                        </div>
                    </div>
                    <div class="text-gray-600 mt-2 review-content-${index}">${
                  review.review || "No review text available"
                }</div>
                </div>
            `
              )
              .join("")}
        </div>`;
  }

  function findCommonFeatures(product1, product2) {
    // Handle potential missing data
    const product1Info = product1.product_information || {};
    const product2Info = product2.product_information || {};

    console.log("Product 1 Info Keys:", Object.keys(product1Info));
    console.log("Product 2 Info Keys:", Object.keys(product2Info));

    // Improved normalization function
    const normalizeKey = (key) => {
      if (typeof key !== "string") return "";
      return key
        .toLowerCase()
        .replace(/[\s_-]+/g, "")
        .trim();
    };

    const product1KeyMap = {};
    const product2KeyMap = {};

    // Create normalized key maps
    Object.keys(product1Info).forEach((key) => {
      const normalizedKey = normalizeKey(key);
      if (normalizedKey) {
        product1KeyMap[normalizedKey] = key;
      }
    });

    Object.keys(product2Info).forEach((key) => {
      const normalizedKey = normalizeKey(key);
      if (normalizedKey) {
        product2KeyMap[normalizedKey] = key;
      }
    });

    const commonFeatures = [];

    // Find common features based on normalized keys
    Object.keys(product1KeyMap).forEach((normalizedKey) => {
      if (product2KeyMap[normalizedKey]) {
        commonFeatures.push({
          product1Key: product1KeyMap[normalizedKey],
          product2Key: product2KeyMap[normalizedKey],
          normalizedKey: normalizedKey,
        });
      }
    });

    console.log(`Found ${commonFeatures.length} common features`);
    return commonFeatures;
  }

  function createFeatureComparisonTable(commonFeatures, product1, product2) {
    if (!Array.isArray(commonFeatures) || commonFeatures.length === 0) {
      console.log("No common features to display");
      return '<p class="text-center text-gray-500 my-4">No common features found between these products</p>';
    }

    const product1Info = product1.product_information || {};
    const product2Info = product2.product_information || {};

    // Filter out customer review features
    const filteredFeatures = commonFeatures.filter(
      (feature) =>
        !feature.product1Key.includes("Customer Reviews") &&
        !feature.product1Key.includes("customer review")
    );

    if (filteredFeatures.length === 0) {
      return '<p class="text-center text-gray-500 my-4">No common features found between these products</p>';
    }

    // Sort features alphabetically
    filteredFeatures.sort((a, b) => {
      return a.product1Key.localeCompare(b.product1Key);
    });

    return `
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="py-3 px-4 text-left text-gray-700 font-semibold">Feature</th>
                        <th class="py-3 px-4 text-left text-gray-700 font-semibold">${
                          product1.title
                            ? product1.title.split(" - ")[0]
                            : "Product 1"
                        }</th>
                        <th class="py-3 px-4 text-left text-gray-700 font-semibold">${
                          product2.title
                            ? product2.title.split(" - ")[0]
                            : "Product 2"
                        }</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredFeatures
                      .map((feature) => {
                        const value1 = product1Info[feature.product1Key];
                        const value2 = product2Info[feature.product2Key];
                        return `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="py-3 px-4 font-medium">${
                              feature.product1Key
                            }</td>
                            <td class="py-3 px-4">${value1 || "N/A"}</td>
                            <td class="py-3 px-4">${value2 || "N/A"}</td>
                        </tr>
                        `;
                      })
                      .join("")}
                </tbody>
            </table>
        </div>`;
  }

  function addToggleReviewEventListeners() {
    document
      .querySelectorAll(".toggle-review:not([data-event-added])")
      .forEach((button) => {
        button.setAttribute("data-event-added", "true");
        button.addEventListener("click", function () {
          const reviewId = this.getAttribute("data-review-id");
          const reviewContent = document.querySelector(
            `.review-content-${reviewId}`
          );

          if (reviewContent) {
            const isHidden = reviewContent.classList.contains("hidden");
            reviewContent.classList.toggle("hidden");
            this.textContent = isHidden ? "Show less" : "Show more";
          }
        });
      });
  }

  // This function needs to be updated in your script.js
  function displayResults(product1, product2) {
    console.log(
      "Displaying results for products:",
      product1.title,
      product2.title
    );
    console.log(
      "Product 1 info keys:",
      Object.keys(product1.product_information || {})
    );
    console.log(
      "Product 2 info keys:",
      Object.keys(product2.product_information || {})
    );

    // Clear previous content in the results div
    // Keep the comparison table but clear the review section
    const existingReviewsSection = resultsDiv.querySelector(".mt-8");
    if (existingReviewsSection) {
      existingReviewsSection.remove();
    }

    // Update table cells
    document.getElementById("product1-name").innerHTML =
      product1.title || "N/A";
    document.getElementById("product2-name").innerHTML =
      product2.title || "N/A";
    document.getElementById("product1-price").innerHTML =
      product1.price || "N/A";
    document.getElementById("product2-price").innerHTML =
      product2.price || "N/A";
    document.getElementById("product1-rating").innerHTML =
      product1.average_rating || "N/A";
    document.getElementById("product2-rating").innerHTML =
      product2.average_rating || "N/A";
    document.getElementById("product1-reviews").innerHTML =
      product1.total_reviews || "N/A";
    document.getElementById("product2-reviews").innerHTML =
      product2.total_reviews || "N/A";
    document.getElementById("product1-customers-say").innerHTML =
      formatFeatureValue(product1.customers_say, "customers_say");
    document.getElementById("product2-customers-say").innerHTML =
      formatFeatureValue(product2.customers_say, "customers_say");
    document.getElementById("product1-sentiments").innerHTML =
      formatFeatureValue(product1.customer_sentiments, "customer_sentiments");
    document.getElementById("product2-sentiments").innerHTML =
      formatFeatureValue(product2.customer_sentiments, "customer_sentiments");

    // Display product images
    const product1ImageCell = document.getElementById("product1-image");
    const product2ImageCell = document.getElementById("product2-image");

    // Set product 1 image - ensure it uses the first image from the array if available
    if (
      product1.images &&
      Array.isArray(product1.images) &&
      product1.images.length > 0
    ) {
      const imageUrl = product1.images[0];
      if (imageUrl && typeof imageUrl === "string") {
        product1ImageCell.innerHTML = `<img src="${imageUrl}" alt="${
          product1.title || "Product 1"
        }" class="product-image mx-auto">`;
        console.log("Product 1 image set:", imageUrl);
      } else {
        product1ImageCell.innerHTML = "No valid image available";
        console.log(
          "Product 1 has images array but first item is not valid:",
          product1.images[0]
        );
      }
    } else {
      product1ImageCell.innerHTML = "No image available";
      console.log(
        "Product 1 has no images array or it's empty:",
        product1.images
      );
    }

    // Set product 2 image - ensure it uses the first image from the array if available
    if (
      product2.images &&
      Array.isArray(product2.images) &&
      product2.images.length > 0
    ) {
      const imageUrl = product2.images[0];
      if (imageUrl && typeof imageUrl === "string") {
        product2ImageCell.innerHTML = `<img src="${imageUrl}" alt="${
          product2.title || "Product 2"
        }" class="product-image mx-auto">`;
        console.log("Product 2 image set:", imageUrl);
      } else {
        product2ImageCell.innerHTML = "No valid image available";
        console.log(
          "Product 2 has images array but first item is not valid:",
          product2.images[0]
        );
      }
    } else {
      product2ImageCell.innerHTML = "No image available";
      console.log(
        "Product 2 has no images array or it's empty:",
        product2.images
      );
    }

    // Continue with the rest of your displayResults function...
    // Add detailed reviews section
    const fullReviewsSection = document.createElement("div");
    fullReviewsSection.className = "mt-8";
    fullReviewsSection.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-2xl font-bold mb-6">Customer Reviews</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 class="text-xl font-semibold mb-4">${
                      product1.title
                    }</h3>
                    ${formatFullReviews(product1.customer_reviews)}
                </div>
                <div>
                    <h3 class="text-xl font-semibold mb-4">${
                      product2.title
                    }</h3>
                    ${formatFullReviews(product2.customer_reviews)}
                </div>
            </div>
        </div>
    `;
    resultsDiv.appendChild(fullReviewsSection);
    resultsDiv.classList.remove("hidden");

    // Add event listeners for review toggles
    document.querySelectorAll(".toggle-review").forEach((button) => {
      button.addEventListener("click", (e) => {
        const reviewContent = e.target.previousElementSibling;
        const isHidden = reviewContent.classList.contains("hidden");
        reviewContent.classList.toggle("hidden");
        e.target.textContent = isHidden ? "Show less" : "Show more";
      });
    });

    // Add event listeners for load more buttons
    document.querySelectorAll(".load-more-reviews").forEach((button) => {
      button.addEventListener("click", (e) => {
        const reviewsContainer = e.target.closest(".space-y-4");
        const productIndex = e.target
          .closest(".grid")
          .children[0].contains(e.target)
          ? 0
          : 1;
        const product = productIndex === 0 ? product1 : product2;
        const currentReviews =
          reviewsContainer.querySelectorAll(".review-item").length;

        if (currentReviews < product.customer_reviews.length) {
          const nextReviews = product.customer_reviews.slice(
            currentReviews,
            currentReviews + 3
          );
          const newReviewsHtml = nextReviews
            .map(
              (review, index) => `
                    <div class="review-item border-b border-gray-200 pb-4">
                        <div class="flex justify-between items-start">
                            <div class="font-medium text-lg">${
                              review.title || "No Title"
                            }</div>
                            <div class="${
                              review.rating >= 4
                                ? "text-green-600"
                                : review.rating <= 2
                                ? "text-red-600"
                                : "text-yellow-600"
                            } font-semibold">
                                ${review.rating}/5
                            </div>
                        </div>
                        <div class="text-gray-600 mt-2 review-content hidden">${
                          review.review || "No review text available"
                        }</div>
                        <button class="text-blue-600 hover:text-blue-800 text-sm mt-2 toggle-review" data-index="${
                          currentReviews + index
                        }">
                            Show more
                        </button>
                    </div>
                `
            )
            .join("");

          // Insert the new reviews before the load more button container
          const loadMoreContainer = e.target.closest(".text-center");
          loadMoreContainer.insertAdjacentHTML("beforebegin", newReviewsHtml);

          // Update remaining count or remove button if no more reviews
          const remainingReviews =
            product.customer_reviews.length -
            (currentReviews + nextReviews.length);
          if (remainingReviews > 0) {
            e.target.textContent = `Load more reviews (${remainingReviews} more)`;
          } else {
            loadMoreContainer.remove();
          }

          // Add event listeners to new toggle buttons
          const newToggleButtons = reviewsContainer.querySelectorAll(
            ".toggle-review:not([data-event-added])"
          );
          newToggleButtons.forEach((btn) => {
            btn.setAttribute("data-event-added", "true");
            btn.addEventListener("click", (e) => {
              const reviewContent = e.target.previousElementSibling;
              const isHidden = reviewContent.classList.contains("hidden");
              reviewContent.classList.toggle("hidden");
              e.target.textContent = isHidden ? "Show less" : "Show more";
            });
          });
        }
      });
    });
  }

  compareBtn.addEventListener("click", async () => {
    const url1 = product1Input.value.trim();
    const url2 = product2Input.value.trim();

    if (!url1 || !url2) {
      errorDiv.textContent = "Please enter both product URLs";
      errorDiv.classList.remove("hidden");
      return;
    }

    try {
      loadingDiv.classList.remove("hidden");
      errorDiv.classList.add("hidden");
      resultsDiv.classList.add("hidden");

      // Extract ASINs from URLs
      const asin1 = extractASIN(url1);
      const asin2 = extractASIN(url2);

      console.log(`Extracted ASINs: ${asin1}, ${asin2}`);

      // Fetch product data in parallel
      const [product1Data, product2Data] = await Promise.all([
        fetchProductData(asin1),
        fetchProductData(asin2),
      ]);

      // Log category warning if needed
      if (
        product1Data.category_id !== product2Data.category_id ||
        !product1Data.category_id ||
        !product2Data.category_id
      ) {
        console.warn(
          "Products may be in different categories. " +
            `Product 1 category: ${product1Data.category_id || "Unknown"}, ` +
            `Product 2 category: ${product2Data.category_id || "Unknown"}`
        );
      }

      // Display results
      displayResults(product1Data, product2Data);
    } catch (error) {
      console.error("Error occurred:", error);
      errorDiv.textContent =
        error.message || "An error occurred while comparing products";
      errorDiv.classList.remove("hidden");
      resultsDiv.classList.add("hidden");
    } finally {
      loadingDiv.classList.add("hidden");
    }
  });
});
