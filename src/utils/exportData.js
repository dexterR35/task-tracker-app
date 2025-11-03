import { logger } from "@/utils/logger.js";
import { formatDate, normalizeTimestamp } from "@/utils/dateUtils.js";
import { EXPORT_CONFIG } from "@/constants";

// CSV date format constant (ISO date with time)
const CSV_DATE_FORMAT = "yyyy-MM-dd HH:mm";

/**
 * Format value for CSV export with proper date formatting and empty field handling
 */
const formatValueForCSV = (
  value,
  columnId,
  reporters = [],
  users = [],
  row = null
) => {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return "-";
  }

  // Handle Done column - calculate difference between task end and start date
  if (columnId === "done") {
    if (!row) return "-";

    // Get start and end dates from the task
    const startDate = row.data_task?.startDate;
    const endDate = row.data_task?.endDate;

    if (startDate && endDate) {
      const normalizedStart = normalizeTimestamp(startDate);
      const normalizedEnd = normalizeTimestamp(endDate);

      if (normalizedStart && normalizedEnd) {
        const diffTime = normalizedEnd.getTime() - normalizedStart.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 0 ? "Same day" : `${diffDays} days`;
      }
    }

    return "-";
  }

  // Handle date columns (excluding done) - use simple date format without nanoseconds
  const dateColumns = ["startDate", "endDate", "dateCreated"];
  if (dateColumns.includes(columnId)) {
    const normalizedDate = normalizeTimestamp(value);
    if (normalizedDate) {
      // Use CSV date format constant
      const formattedDate = formatDate(normalizedDate, CSV_DATE_FORMAT, false);
      return formattedDate !== "N/A" ? formattedDate : "-";
    }
    return "-";
  }

  // Handle createdByName - always show user name instead of UID
  if (columnId === "createdByName") {
    // If value exists, check if it's a UID (long alphanumeric string) or email
    const userUID = row?.userUID || row?.createbyUID;
    const valueToCheck = value || userUID;

    if (valueToCheck && users.length > 0) {
      // Check if value is a UID (typically long alphanumeric strings) or if we have a userUID to match
      const isLikelyUID =
        typeof valueToCheck === "string" &&
        (valueToCheck.length > 20 || valueToCheck.match(/^[a-zA-Z0-9]{20,}$/));

      // Try to find user by UID
      const userByUID = userUID
        ? users.find((u) => {
            const userIdField = u.userUID || u.uid || u.id;
            return (
              userIdField &&
              typeof userIdField === "string" &&
              userIdField.toLowerCase() === userUID.toLowerCase()
            );
          })
        : null;

      // Try to find user by name/email if value looks like a name/email
      const userByName =
        !isLikelyUID && value
          ? users.find((u) => {
              const userName = u.name || u.email;
              return (
                userName &&
                typeof userName === "string" &&
                userName.toLowerCase() === value.toLowerCase()
              );
            })
          : null;

      // Return resolved user name
      if (userByUID) {
        return userByUID.name || userByUID.email || "-";
      }
      if (userByName) {
        return userByName.name || userByName.email || "-";
      }

      // If value exists and doesn't look like a UID, return it (it's likely already a name)
      if (value && !isLikelyUID) {
        return value;
      }
    }

    // Fallback to value if it exists
    return value || "-";
  }

  // Handle date created with simple format - properly handle seconds/nanoseconds
  if (columnId === "createdAt") {
    // Handle Firebase timestamp with seconds/nanoseconds
    if (value && typeof value === "object" && "seconds" in value) {
      const milliseconds =
        value.seconds * 1000 + (value.nanoseconds || 0) / 1000000;
      const date = new Date(milliseconds);
      // Use CSV date format constant
      const formattedDate = formatDate(date, CSV_DATE_FORMAT, false);
      return formattedDate !== "N/A" ? formattedDate : "-";
    }
    const normalizedDate = normalizeTimestamp(value);
    if (normalizedDate) {
      // Use CSV date format constant
      const formattedDate = formatDate(normalizedDate, CSV_DATE_FORMAT, false);
      return formattedDate !== "N/A" ? formattedDate : "-";
    }
    return "-";
  }

  // Handle boolean columns (VIP, ReWorked)
  if (columnId === "isVip" || columnId === "reworked") {
    return value ? "Yes" : "No";
  }

  // Handle AI Models array - join as single row
  if (columnId === "aiModels" && Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }

  // Handle Markets array - join as single row
  if (columnId === "markets" && Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }

  // Handle deliverables object - format with count and name (e.g., 2xgamepreview)
  if (columnId === "deliverables" && typeof value === "object") {
    if (Array.isArray(value)) {
      if (value.length === 0) return "-";

      let deliverables = [];

      value.forEach((item) => {
        if (typeof item === "object" && item.quantity && item.name) {
          // Format as "quantityxname" (e.g., 2xgamepreview)
          deliverables.push(`${item.quantity}x${item.name}`);
        }
      });

      if (deliverables.length === 0) return "-";

      return deliverables.join(", ");
    }

    // Handle single deliverable object
    if (value && typeof value === "object") {
      if (value.quantity && value.name) {
        // Format as "quantityxname" (e.g., 2xgamepreview)
        return `${value.quantity}x${value.name}`;
      }
      return "-";
    }
    return "-";
  }

  // Handle Jira Link - make it a full clickable URL
  if (columnId === "taskName" || columnId === "jiraLink") {
    if (!value) return "-";

    // If it's already a full URL, return it
    if (
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"))
    ) {
      return value;
    }

    // Extract JIRA base URL from validation pattern: https://gmrd.atlassian.net/browse/
    const jiraBaseUrl = "https://gmrd.atlassian.net/browse";

    // If it's a Jira ticket number (like GIMODEAR-123), make it a full URL
    if (typeof value === "string" && value.match(/^[A-Z]+-\d+$/)) {
      return `${jiraBaseUrl}/${value}`;
    }

    // If it's just a number, assume it's a ticket number and add GIMODEAR prefix
    if (typeof value === "string" && value.match(/^\d+$/)) {
      return `${jiraBaseUrl}/GIMODEAR-${value}`;
    }

    return value;
  }

  // Handle reporter - show name instead of UID/ID
  if (columnId === "reporters") {
    // If it's already a name, return it
    if (
      typeof value === "string" &&
      !value.includes("@") &&
      !value.includes("UID") &&
      !value.match(/^[a-zA-Z0-9]{20,}$/i)
    ) {
      return value;
    }
    // If it's a UID/ID, look it up from the reporters data
    if (typeof value === "string" && reporters.length > 0) {
      const reporter = reporters.find((r) => {
        const reporterIdField = r.reporterUID || r.uid || r.id;
        return (
          reporterIdField &&
          typeof reporterIdField === "string" &&
          reporterIdField.toLowerCase() === value.toLowerCase()
        );
      });
      return reporter?.name || value;
    }
    return value || "-";
  }

  // Handle observations
  if (columnId === "observations") {
    return value && value.trim() ? value : "-";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join("; ") : "-";
  }

  // Handle objects
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  // Handle strings
  const stringValue = String(value);
  if (stringValue.trim() === "") {
    return "-";
  }

  return stringValue;
};

/**
 * Unified CSV Export utility function
 * Handles both table data and analytics data exports
 */
export const exportToCSV = (data, columns, tableType, options = {}) => {
  try {
    const {
      filename = null,
      includeHeaders = true,
      analyticsMode = false,
      reporters = [],
      users = [],
    } = options;

    // Handle analytics data (array of objects without columns)
    if (analyticsMode || !columns) {
      return exportAnalyticsToCSV(data, tableType, {
        filename,
        includeHeaders,
      });
    }

    // Get all columns (both visible and hidden) excluding only the select column
    const allColumns = columns.filter(
      (col) => col.id !== "select" && col.id !== "actions"
    );

    // Debug logging removed

    // Create headers
    const headers = allColumns
      .map((col) => {
        // Handle different header types
        if (typeof col.header === "string") return col.header;
        if (typeof col.header === "function") return col.accessorKey || col.id;
        return col.accessorKey || col.id;
      })
      .join(EXPORT_CONFIG.CSV_DELIMITER);

    // Create rows
    const rows = data.map((row) => {
      return allColumns
        .map((col) => {
          let value;

          // Handle different accessor types
          if (typeof col.accessorFn === "function") {
            // Function accessor: (row) => row.data_task?.departments
            value = col.accessorFn(row);
          } else if (col.accessorKey) {
            // Simple accessor key: 'data_task.taskName'
            if (col.accessorKey.includes(".")) {
              // Nested accessor: 'data_task.taskName'
              const keys = col.accessorKey.split(".");
              value = keys.reduce((obj, key) => obj?.[key], row);
            } else {
              // Direct accessor
              value = row[col.accessorKey];
            }
          } else {
            value = null;
          }
          // Format the value using our custom formatter
          // Use id if available, otherwise derive from accessorKey (e.g., 'data_task.taskName' -> 'taskName')
          const columnId =
            col.id ||
            (col.accessorKey?.includes(".")
              ? col.accessorKey.split(".").pop()
              : col.accessorKey) ||
            "";
          const formattedValue = formatValueForCSV(
            value,
            columnId,
            reporters,
            users,
            row
          );

          // Escape delimiter, quotes, and newlines in string values
          const delimiter = EXPORT_CONFIG.CSV_DELIMITER;
          if (
            formattedValue.includes(delimiter) ||
            formattedValue.includes('"') ||
            formattedValue.includes("\n")
          ) {
            return `"${formattedValue.replace(/"/g, '""')}"`;
          }
          return formattedValue;
        })
        .join(EXPORT_CONFIG.CSV_DELIMITER);
    });

    // Add totals row for task table only
    let csvContent = [headers, ...rows].join("\n");

    if (tableType === "tasks" && data.length > 0) {
      // Calculate totals
      const totalTasks = data.length;
      let totalHR = 0;
      let totalAIHR = 0;
      const marketsSet = new Set();
      const productsSet = new Set();

      data.forEach((task) => {
        // Sum total HR
        const taskHR = task.data_task?.timeInHours || 0;
        totalHR += typeof taskHR === "number" ? taskHR : 0;

        // Sum total AI HR
        const aiUsed = task.data_task?.aiUsed?.[0];
        if (aiUsed?.aiTime) {
          totalAIHR += typeof aiUsed.aiTime === "number" ? aiUsed.aiTime : 0;
        }

        // Collect unique markets
        const markets = task.data_task?.markets;
        if (Array.isArray(markets)) {
          markets.forEach((market) => {
            if (market) marketsSet.add(market);
          });
        }

        // Collect unique products
        const product = task.data_task?.products;
        if (product) {
          productsSet.add(product);
        }
      });

      // Create totals row
      const delimiter = EXPORT_CONFIG.CSV_DELIMITER;
      const totalsRow = allColumns
        .map((col) => {
          const header =
            typeof col.header === "string"
              ? col.header
              : col.accessorKey || col.id;

          if (header === "JIRA LINK") {
            return "TOTALS";
          } else if (header === "MARKETS") {
            return Array.from(marketsSet).join(", ");
          } else if (header === "PRODUCT") {
            return Array.from(productsSet).join(", ");
          } else if (header === "TASK HR") {
            return `Total: ${totalHR.toFixed(1)}`;
          } else if (header === "AI MODELS") {
            return `Total AI HR: ${totalAIHR.toFixed(1)}`;
          } else if (header === "CREATED BY") {
            return `Total Tasks: ${totalTasks}`;
          } else {
            return "";
          }
        })
        .join(delimiter);

      csvContent = [headers, ...rows, totalsRow].join("\n");
    }

    // Create and download file
    const blob = new Blob([csvContent], {
      type: `text/csv;charset=${EXPORT_CONFIG.CSV_ENCODING};`,
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    // Use custom filename or generate default
    const exportFilename =
      filename ||
      `${tableType}_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", exportFilename);

    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    logger.error("Error exporting CSV:", error);
    return false;
  }
};

/**
 * Export analytics data to CSV
 * @param {Array|Object} data - Analytics data to export
 * @param {string} tableType - Type of data being exported
 * @param {Object} options - Export options
 * @returns {boolean} Success status
 */
export const exportAnalyticsToCSV = (data, tableType, options = {}) => {
  try {
    const { filename = null, includeHeaders = true } = options;

    let csvContent = "";

    // Handle different data structures
    if (Array.isArray(data)) {
      // Array of objects - create CSV from array
      if (data.length === 0) {
        csvContent = "No data available";
      } else {
        const headers = Object.keys(data[0]);
        const rows = data.map((item) =>
          headers
            .map((header) => {
              const value = item[header];
              if (value === null || value === undefined) return "";
              if (typeof value === "object") {
                return JSON.stringify(value);
              }
              const stringValue = String(value);
              const delimiter = EXPORT_CONFIG.CSV_DELIMITER;
              if (
                stringValue.includes(delimiter) ||
                stringValue.includes('"') ||
                stringValue.includes("\n")
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(EXPORT_CONFIG.CSV_DELIMITER)
        );

        if (includeHeaders) {
          csvContent = [
            headers.join(EXPORT_CONFIG.CSV_DELIMITER),
            ...rows,
          ].join("\n");
        } else {
          csvContent = rows.join("\n");
        }
      }
    } else if (typeof data === "object") {
      // Object data - create key-value pairs
      const delimiter = EXPORT_CONFIG.CSV_DELIMITER;
      const entries = Object.entries(data);
      const rows = entries.map(([key, value]) => {
        const stringValue =
          typeof value === "object" ? JSON.stringify(value) : String(value);
        const escapedValue =
          stringValue.includes(delimiter) ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        return `${key}${delimiter}${escapedValue}`;
      });

      if (includeHeaders) {
        csvContent = [`Key${delimiter}Value`, ...rows].join("\n");
      } else {
        csvContent = rows.join("\n");
      }
    } else {
      csvContent = "Invalid data format";
    }

    // Create and download file
    const blob = new Blob([csvContent], {
      type: `text/csv;charset=${EXPORT_CONFIG.CSV_ENCODING};`,
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    const exportFilename =
      filename ||
      `${tableType}_analytics_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", exportFilename);

    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    logger.error("Error exporting analytics CSV:", error);
    return false;
  }
};
