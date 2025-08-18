// Configuration for different environments
const config = {
  development: {
    apiUrl: 'http://localhost:5001'
  },
  production: {
    apiUrl: 'https://atfcf-api.onrender.com' // This will be your Render API service URL
  }
};

// Get current environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const currentConfig = isDevelopment ? config.development : config.production;

// Export the API URL
window.API_BASE_URL = currentConfig.apiUrl;
