const ComparisonTable = ({ product1, product2 }) => {
  const formatFeatureValue = (value, key) => {
    if (value === null || value === undefined) return "N/A";

    switch (key) {
      case "customers_say":
        return typeof value === "string"
          ? value
          : "No customer reviews available";
      case "customer_sentiments":
        return Array.isArray(value) && value.length > 0
          ? value.map((item, index) => (
              <div
                key={index}
                className={`${
                  item.sentiment === "POSITIVE"
                    ? "text-green-600"
                    : item.sentiment === "NEGATIVE"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                <span className="font-medium">{item.title || "Unknown"}:</span>{" "}
                {item.sentiment || "Unknown"}
              </div>
            ))
          : "No sentiment data available";
      default:
        return String(value);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h2 className="text-xl font-bold mb-3">Product Comparison</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 comparison-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Feature
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                Product 1
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                Product 2
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">Product Image</td>
              <td className="px-4 py-2 text-sm text-gray-500 text-center">
                {product1.images && Array.isArray(product1.images) && product1.images.length > 0 ? (
                  <img
                    src={product1.images[0]}
                    alt={product1.title || "Product 1"}
                    className="product-image mx-auto"
                  />
                ) : (
                  "No image available"
                )}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500 text-center">
                {product2.images && Array.isArray(product2.images) && product2.images.length > 0 ? (
                  <img
                    src={product2.images[0]}
                    alt={product2.title || "Product 2"}
                    className="product-image mx-auto"
                  />
                ) : (
                  "No image available"
                )}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">Product Name</td>
              <td className="px-4 py-2 text-sm text-gray-500">{product1.title || "N/A"}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{product2.title || "N/A"}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">Price</td>
              <td className="px-4 py-2 text-sm text-gray-500">{product1.price || "N/A"}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{product2.price || "N/A"}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">Rating</td>
              <td className="px-4 py-2 text-sm text-gray-500">{product1.average_rating || "N/A"}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{product2.average_rating || "N/A"}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">Total Reviews</td>
              <td className="px-4 py-2 text-sm text-gray-500">{product1.total_reviews || "N/A"}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{product2.total_reviews || "N/A"}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">What Customers Say</td>
              <td className="px-4 py-2 text-sm text-gray-500">
                <div className="text-gray-700">
                  {formatFeatureValue(product1.customers_say, "customers_say")}
                </div>
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                <div className="text-gray-700">
                  {formatFeatureValue(product2.customers_say, "customers_say")}
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">Customer Sentiments</td>
              <td className="px-4 py-2 text-sm text-gray-500">
                <div className="space-y-1">
                  {formatFeatureValue(product1.customer_sentiments, "customer_sentiments")}
                </div>
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                <div className="space-y-1">
                  {formatFeatureValue(product2.customer_sentiments, "customer_sentiments")}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;