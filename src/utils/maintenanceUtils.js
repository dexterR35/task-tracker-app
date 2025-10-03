/**
 * Maintenance mode utilities
 */

// Set this to true when you want to enable maintenance mode
export const MAINTENANCE_MODE = false;

/**
 * Check if maintenance mode is enabled
 * @returns {boolean} True if maintenance mode is enabled
 */
export const isMaintenanceMode = () => {
  return MAINTENANCE_MODE;
};

/**
 * Get maintenance page content
 * @returns {string} HTML content for maintenance page
 */
export const getMaintenancePageContent = () => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>App Under Maintenance</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .animate-spin {
                animation: spin 1s linear infinite;
            }
        </style>
    </head>
    <body class="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div class="text-center max-w-md mx-auto px-6">
            <!-- Loading Spinner -->
            <div class="mb-8">
                <div class="w-12 h-12 mx-auto">
                    <div class="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 w-12 h-12"></div>
                </div>
            </div>

            <!-- Maintenance Message -->
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    App Maintenance
                </h1>
                <p class="text-gray-600 dark:text-gray-400 text-lg">
                    Will be available soon
                </p>
            </div>

            <!-- Footer -->
            <div class="text-xs text-gray-400 dark:text-gray-500">
                <p>Powered by NetBet</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
