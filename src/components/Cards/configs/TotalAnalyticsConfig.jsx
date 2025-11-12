import { CHART_COLORS, addConsistentColors } from "@/components/Cards/analyticsCardConfig";
import { CARD_SYSTEM } from "@/constants";

export const calculateTotalAnalyticsData = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [],
      tableColumns: [],
      pieData: [],
      totalTasks: 0,
      totalHours: 0,
    };
  }

  // Initialize data structures
  const categoryData = {
    product: { tasks: 0, hours: 0, breakdown: {} },
    acquisition: { tasks: 0, hours: 0, breakdown: {} },
    marketing: { tasks: 0, hours: 0, breakdown: {} },
    misc: { tasks: 0, hours: 0, breakdown: {} },
  };

  // Process tasks
  tasks.forEach((task) => {
    const products = task.data_task?.products || task.products;
    const timeInHours = task.data_task?.timeInHours || task.timeInHours || 0;

    if (!products) return;

    const productsLower = products.toLowerCase().trim();

    // Product category
    if (productsLower.startsWith("product ")) {
      categoryData.product.tasks += 1;
      categoryData.product.hours += timeInHours;

      // Extract subcategory (casino, sport, etc.)
      const subcategory = productsLower.replace("product ", "").trim();
      if (subcategory) {
        if (!categoryData.product.breakdown[subcategory]) {
          categoryData.product.breakdown[subcategory] = { tasks: 0, hours: 0 };
        }
        categoryData.product.breakdown[subcategory].tasks += 1;
        categoryData.product.breakdown[subcategory].hours += timeInHours;
      }
    }
    // Acquisition category
    else if (productsLower.includes("acquisition")) {
      categoryData.acquisition.tasks += 1;
      categoryData.acquisition.hours += timeInHours;

      // Extract subcategory (casino, sport, etc.)
      let subcategory = "";
      if (productsLower.includes("casino")) subcategory = "casino";
      else if (productsLower.includes("sport")) subcategory = "sport";
      else if (productsLower.includes("poker")) subcategory = "poker";
      else if (productsLower.includes("lotto")) subcategory = "lotto";

      if (subcategory) {
        if (!categoryData.acquisition.breakdown[subcategory]) {
          categoryData.acquisition.breakdown[subcategory] = { tasks: 0, hours: 0 };
        }
        categoryData.acquisition.breakdown[subcategory].tasks += 1;
        categoryData.acquisition.breakdown[subcategory].hours += timeInHours;
      }
    }
    // Marketing category
    else if (productsLower.includes("marketing")) {
      categoryData.marketing.tasks += 1;
      categoryData.marketing.hours += timeInHours;

      // Extract subcategory (casino, sport, etc.)
      let subcategory = "";
      if (productsLower.includes("casino")) subcategory = "casino";
      else if (productsLower.includes("sport")) subcategory = "sport";
      else if (productsLower.includes("poker")) subcategory = "poker";
      else if (productsLower.includes("lotto")) subcategory = "lotto";

      if (subcategory) {
        if (!categoryData.marketing.breakdown[subcategory]) {
          categoryData.marketing.breakdown[subcategory] = { tasks: 0, hours: 0 };
        }
        categoryData.marketing.breakdown[subcategory].tasks += 1;
        categoryData.marketing.breakdown[subcategory].hours += timeInHours;
      }
    }
    // Misc category
    else if (productsLower.startsWith("misc ") || productsLower === "misc") {
      categoryData.misc.tasks += 1;
      categoryData.misc.hours += timeInHours;

      // Extract subcategory (casino, sport, etc.) if it exists
      let subcategory = "";
      if (productsLower.includes("casino")) subcategory = "casino";
      else if (productsLower.includes("sport")) subcategory = "sport";
      else if (productsLower.includes("poker")) subcategory = "poker";
      else if (productsLower.includes("lotto")) subcategory = "lotto";
      // If it's just "misc" without a subcategory, use "general" or leave empty
      else if (productsLower === "misc") subcategory = "general";

      if (subcategory) {
        if (!categoryData.misc.breakdown[subcategory]) {
          categoryData.misc.breakdown[subcategory] = { tasks: 0, hours: 0 };
        }
        categoryData.misc.breakdown[subcategory].tasks += 1;
        categoryData.misc.breakdown[subcategory].hours += timeInHours;
      }
    }
  });

  // Create table data with subcategory breakdown
  const tableData = [];
  
  // Helper function to capitalize first letter
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  
  // Product rows
  if (categoryData.product.tasks > 0) {
    // Add main category row
    const productRow = {
      category: "Product",
      subcategory: "",
      totalTasks: categoryData.product.tasks,
      totalHours: Math.round(categoryData.product.hours * 100) / 100,
      isMainCategory: true,
    };
    tableData.push(productRow);
    
    // Add subcategory rows
    const productSubcategories = Object.keys(categoryData.product.breakdown).sort();
    productSubcategories.forEach((subcategory) => {
      const subData = categoryData.product.breakdown[subcategory];
      tableData.push({
        category: "Product",
        subcategory: capitalize(subcategory),
        totalTasks: subData.tasks,
        totalHours: Math.round(subData.hours * 100) / 100,
        isMainCategory: false,
      });
    });
  }

  // Acquisition rows
  if (categoryData.acquisition.tasks > 0) {
    // Add main category row
    const acquisitionRow = {
      category: "Acquisition",
      subcategory: "",
      totalTasks: categoryData.acquisition.tasks,
      totalHours: Math.round(categoryData.acquisition.hours * 100) / 100,
      isMainCategory: true,
    };
    tableData.push(acquisitionRow);
    
    // Add subcategory rows
    const acquisitionSubcategories = Object.keys(categoryData.acquisition.breakdown).sort();
    acquisitionSubcategories.forEach((subcategory) => {
      const subData = categoryData.acquisition.breakdown[subcategory];
      tableData.push({
        category: "Acquisition",
        subcategory: capitalize(subcategory),
        totalTasks: subData.tasks,
        totalHours: Math.round(subData.hours * 100) / 100,
        isMainCategory: false,
      });
    });
  }

  // Marketing rows
  if (categoryData.marketing.tasks > 0) {
    // Add main category row
    const marketingRow = {
      category: "Marketing",
      subcategory: "",
      totalTasks: categoryData.marketing.tasks,
      totalHours: Math.round(categoryData.marketing.hours * 100) / 100,
      isMainCategory: true,
    };
    tableData.push(marketingRow);
    
    // Add subcategory rows
    const marketingSubcategories = Object.keys(categoryData.marketing.breakdown).sort();
    marketingSubcategories.forEach((subcategory) => {
      const subData = categoryData.marketing.breakdown[subcategory];
      tableData.push({
        category: "Marketing",
        subcategory: capitalize(subcategory),
        totalTasks: subData.tasks,
        totalHours: Math.round(subData.hours * 100) / 100,
        isMainCategory: false,
      });
    });
  }

  // Misc rows
  if (categoryData.misc.tasks > 0) {
    // Add main category row
    const miscRow = {
      category: "Misc",
      subcategory: "",
      totalTasks: categoryData.misc.tasks,
      totalHours: Math.round(categoryData.misc.hours * 100) / 100,
      isMainCategory: true,
    };
    tableData.push(miscRow);
    
    // Add subcategory rows
    const miscSubcategories = Object.keys(categoryData.misc.breakdown).sort();
    miscSubcategories.forEach((subcategory) => {
      const subData = categoryData.misc.breakdown[subcategory];
      tableData.push({
        category: "Misc",
        subcategory: capitalize(subcategory),
        totalTasks: subData.tasks,
        totalHours: Math.round(subData.hours * 100) / 100,
        isMainCategory: false,
      });
    });
  }

  // Add grand total row
  if (tableData.length > 0) {
    const grandTotalTasks = tableData
      .filter((row) => row.isMainCategory)
      .reduce((sum, row) => sum + row.totalTasks, 0);
    const grandTotalHours = tableData
      .filter((row) => row.isMainCategory)
      .reduce((sum, row) => sum + row.totalHours, 0);
    
    tableData.push({
      category: "Grand Total",
      subcategory: "",
      totalTasks: grandTotalTasks,
      totalHours: Math.round(grandTotalHours * 100) / 100,
      isMainCategory: true,
      isGrandTotal: true,
    });
  }

  // Create table columns
  const tableColumns = [
    { 
      key: "category", 
      header: "Category", 
      align: "left",
      render: (value, row) => (
        <span className={
          row?.isGrandTotal 
            ? "font-bold text-lg text-gray-900 dark:text-gray-100" 
            : row?.isMainCategory 
            ? "font-bold text-gray-900 dark:text-gray-100" 
            : "font-medium text-gray-700 dark:text-gray-300 pl-4"
        }>
          {row?.subcategory ? `  ${row.subcategory}` : value}
        </span>
      ),
    },
    { 
      key: "totalTasks", 
      header: "Total Tasks", 
      align: "center", 
      highlight: true,
      render: (value, row) => (
        <span className={
          row?.isGrandTotal 
            ? "font-bold text-lg text-gray-900 dark:text-gray-100" 
            : row?.isMainCategory 
            ? "font-bold text-gray-900 dark:text-gray-100" 
            : "font-medium text-gray-700 dark:text-gray-300"
        }>
          {value}
        </span>
      ),
    },
    { 
      key: "totalHours", 
      header: "Total Hours", 
      align: "center", 
      highlight: true,
      render: (value, row) => (
        <span className={
          row?.isGrandTotal 
            ? "font-bold text-lg text-gray-900 dark:text-gray-100" 
            : row?.isMainCategory 
            ? "font-bold text-gray-900 dark:text-gray-100" 
            : "font-medium text-gray-700 dark:text-gray-300"
        }>
          {typeof value === 'number' ? `${value.toFixed(1)}h` : value}
        </span>
      ),
    },
  ];

  // Create pie chart data (only main categories, exclude grand total)
  const pieData = tableData
    .filter((row) => row.isMainCategory && !row.isGrandTotal)
    .map((row) => ({
      name: row.category,
      value: row.totalTasks,
    }));

  // Assign specific distinct colors to each category
  const categoryColors = {
    'Marketing': '#e11d48',     // Rose-600 (vibrant red/pink)
    'Acquisition': '#2563eb',   // Blue-600 (vibrant blue)
    'Product': '#f59e0b',       // Amber-500 (orange/gold)
    'Misc': '#8C00FF',          // Purple-500 (purple/violet)
  };

  // Add specific colors to pie data
  const pieDataWithColors = pieData.map((item) => ({
    ...item,
    color: categoryColors[item.name] || CHART_COLORS.DEFAULT[0],
  }));

  // Calculate totals
  const totalTasks = categoryData.product.tasks + categoryData.acquisition.tasks + categoryData.marketing.tasks + categoryData.misc.tasks;
  const totalHours = categoryData.product.hours + categoryData.acquisition.hours + categoryData.marketing.hours + categoryData.misc.hours;

  return {
    tableData,
    tableColumns,
    pieData: pieDataWithColors,
    totalTasks,
    totalHours: Math.round(totalHours * 100) / 100,
    categoryData, // Include breakdown for potential future use
  };
};

export const getTotalAnalyticsCardProps = (tasks, isLoading = false) => {
  const totalData = calculateTotalAnalyticsData(tasks);

  const totalTasks = totalData.totalTasks || 0;
  const totalHours = totalData.totalHours || 0;

  return {
    title: "Total Analytics",
    tableData: totalData.tableData,
    tableColumns: totalData.tableColumns,
    pieData: totalData.pieData,
    pieTitle: `Total Tasks by Category (${totalTasks} tasks, ${totalHours}h)`,
    pieColors: totalData.pieData.map((item) => item.color),
    totalTasks,
    totalHours,
    className: "",
    isLoading,
  };
};

// Cached version
export const getCachedTotalAnalyticsCardProps = (tasks, isLoading = false) => {
  return getTotalAnalyticsCardProps(tasks, isLoading);
};

