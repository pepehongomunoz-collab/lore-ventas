/**
 * Configuration file for API endpoints
 * Automatically detects environment and uses appropriate API URL
 */

/**
 * Get the API URL based on current environment
 * @returns {string} The API base URL
 */
export function getApiUrl() {
    // Check if we're on localhost (development)
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Development environment - local backend
        return 'http://localhost:3000/api';
    } else {
        // Production environment - Render backend
        return 'https://lore-ventas-api.onrender.com/api';
    }
}

// Export as default constant for convenience
export const API_URL = getApiUrl();

// Log the current API URL for debugging
console.log('🔧 API URL configured:', API_URL);
