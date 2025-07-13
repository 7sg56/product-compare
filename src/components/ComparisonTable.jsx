import { StarIcon } from "@heroicons/react/24/solid";

const ComparisonTable = ({ product1, product2 }) => {
  // Safety check for missing data
  if (!product1 || !product2) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
        <p className="text-red-500 dark:text-red-400">Error: Product data is missing</p>
      </div>
    );
  }

  const renderStars = (rating) => {
    if (!rating || rating === "N/A")
      return <span className="text-gray-400 dark:text-gray-500">No ratings</span>;

    const numRating = parseFloat(rating);
    if (isNaN(numRating))
      return <span className="text-gray-400 dark:text-gray-500">Invalid rating</span>;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(numRating)
                ? "text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
        <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{numRating}/5</span>
      </div>
    );
  };

  // Safe access function
  const safeGet = (obj, path, defaultValue = "N/A") => {
    try {
      if (!obj) return defaultValue;
      return path.split(".").reduce((o, key) => o?.[key], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 transition-colors duration-200 border border-gray-700">
      <h2 className="text-3xl font-bold mb-8 text-white text-center">Product Comparison</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b-2 border-gray-600">
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider w-1/4">
                Feature
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-purple-400 uppercase tracking-wider w-2/5">
                <div className="flex items-center">
                  <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                    1
                  </span>
                  {safeGet(product1, "title", "Product 1").substring(0, 40)}...
                </div>
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-indigo-400 uppercase tracking-wider w-2/5">
                <div className="flex items-center">
                  <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                    2
                  </span>
                  {safeGet(product2, "title", "Product 2").substring(0, 40)}...
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            <tr className="hover:bg-gray-700/50 transition-colors">
              <td className="py-4 px-6 text-sm font-medium text-white">Image</td>
              <td className="py-4 px-6">
                {safeGet(product1, "images", []).length > 0 ? (
                  <img
                    src={product1.images[0]}
                    alt={product1.title}
                    className="h-32 w-auto mx-auto object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 rounded-lg">
                    No image
                  </div>
                )}
              </td>
              <td className="py-4 px-6">
                {safeGet(product2, "images", []).length > 0 ? (
                  <img
                    src={product2.images[0]}
                    alt={product2.title}
                    className="h-32 w-auto mx-auto object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 rounded-lg">
                    No image
                  </div>
                )}
              </td>
            </tr>

            <tr className="hover:bg-gray-700/50 transition-colors">
              <td className="py-4 px-6 text-sm font-medium text-white">Price</td>
              <td className="py-4 px-6 text-green-400 font-semibold text-lg">
                {safeGet(product1, "price")}
              </td>
              <td className="py-4 px-6 text-green-400 font-semibold text-lg">
                {safeGet(product2, "price")}
              </td>
            </tr>

            <tr className="hover:bg-gray-700/50 transition-colors">
              <td className="py-4 px-6 text-sm font-medium text-white">Rating</td>
              <td className="py-4 px-6">{renderStars(safeGet(product1, "average_rating"))}</td>
              <td className="py-4 px-6">{renderStars(safeGet(product2, "average_rating"))}</td>
            </tr>

            <tr className="hover:bg-gray-700/50 transition-colors">
              <td className="py-4 px-6 text-sm font-medium text-white">Reviews Count</td>
              <td className="py-4 px-6">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full font-medium">
                  {safeGet(product1, "total_reviews")}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full font-medium">
                  {safeGet(product2, "total_reviews")}
                </span>
              </td>
            </tr>

            {/* Additional product info if available */}
            {(product1.product_information || product2.product_information) &&
              Object.keys({ ...product1.product_information, ...product2.product_information })
                .slice(0, 5)
                .map((key, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-white capitalize">
                      {key.replace(/_/g, " ")}
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {product1.product_information && product1.product_information[key]
                        ? String(product1.product_information[key]).substring(0, 100) +
                          (String(product1.product_information[key]).length > 100 ? "..." : "")
                        : "N/A"}
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {product2.product_information && product2.product_information[key]
                        ? String(product2.product_information[key]).substring(0, 100) +
                          (String(product2.product_information[key]).length > 100 ? "..." : "")
                        : "N/A"}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;