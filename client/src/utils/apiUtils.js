import axios from 'axios';

// API retry utility with exponential backoff
export const apiRetry = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error codes
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      console.log(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Debounce utility for API calls
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle utility for API calls
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Enhanced axios instance with retry logic
export const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds timeout
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor with retry logic
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If the error is 429 (Too Many Requests) and we haven't already retried
      if (error.response?.status === 429 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Get retry delay from headers or use default
        const retryAfter = error.response.headers['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;

        console.log(`Rate limited. Retrying after ${delay}ms...`);
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, delay));
        return client(originalRequest);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Error handler utility
export const handleApiError = (error, defaultMessage = 'Bir xəta baş verdi') => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || defaultMessage;
    return {
      message,
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Server cavab vermir. İnternet bağlantınızı yoxlayın.',
      status: 0,
      data: null
    };
  } else {
    // Something else happened
    return {
      message: error.message || defaultMessage,
      status: 0,
      data: null
    };
  }
};