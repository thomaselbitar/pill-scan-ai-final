import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';

// Configure base URL - change this to your backend URL
// For development, you might use: http://localhost:8000
// For Android emulator: http://10.0.2.2:8000
// For iOS simulator: http://localhost:8000
// For physical device: http://YOUR_COMPUTER_IP:8000
// 
// IMPORTANT: For physical devices (iPhone/Android), use your computer's IP address
// Find your IP: Windows (ipconfig) or Mac/Linux (ifconfig)
// Make sure your phone and computer are on the same WiFi network
const BASE_URL = __DEV__ 
  ? 'http://172.16.129.223:8000'  // Your computer's IP address for physical device testing
  : 'https://your-production-api.com';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  async (config) => {
    try {
      const username = await AsyncStorage.getItem('username');
      if (username) {
        // If your backend requires auth headers, add them here
        // config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth data:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      request: error.request,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
      }
    });

    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        i18n.t('generic_error');
      return Promise.reject(new Error(message));
    } else if (error.request) {
      const errorMessage =
        error.code === 'ECONNREFUSED'
          ? i18n.t('network_error_connection')
          : error.message === 'Network Error'
            ? i18n.t('network_error_unreachable')
            : i18n.t('generic_error');
      return Promise.reject(new Error(errorMessage));
    } else {
      return Promise.reject(new Error(error.message || i18n.t('generic_error')));
    }
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  // Register new user
  register: async (username, password) => {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  },

  // Login user
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
};

// ==================== CLASSIFY API ====================
export const classifyAPI = {
  // Classify image and extract product information
  classifyImage: async (imageUri) => {
    // Convert image URI to FormData for file upload
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename,
    });

    const response = await api.post('/classify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// ==================== AI (OpenRouter) API ====================
const AI_EXTRACT_TIMEOUT_MS = 120000;

export const aiAPI = {
  extractProductFromImage: async (imageUri) => {
    const formData = new FormData();

    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename,
    });

    const response = await api.post('/ai/extract-product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: AI_EXTRACT_TIMEOUT_MS,
    });
    return response.data;
  },
};

// ==================== PRICE API ====================
export const priceAPI = {
  // Predict price for a product
  predictPrice: async (productData) => {
    const response = await api.post('/price/predict', {
      product_name: productData.product_name,
      weight_num: productData.weight_num,
      weight_unit: productData.weight_unit,
      form: productData.form,
      use_type: productData.use_type,
    });
    return response.data;
  },
};

// ==================== PRODUCTS API ====================
export const productsAPI = {
  // Check if product exists
  checkProduct: async (productData) => {
    // Build query string for FastAPI query parameters
    const params = new URLSearchParams({
      product_name: productData.product_name,
      weight_num: String(productData.weight_num),
      weight_unit: productData.weight_unit,
      form: productData.form,
      use_type: productData.use_type,
    });
    
    const response = await api.post(`/products/check?${params.toString()}`);
    return response.data;
  },

  // Add or update product
  addProduct: async (productData, imageUri, price, quantity, username) => {
    const formData = new FormData();
    
    // Add image file
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename,
    });

    // Add form fields
    formData.append('username', username);
    formData.append('product_name', productData.product_name);
    formData.append('weight_num', String(productData.weight_num));
    formData.append('weight_unit', productData.weight_unit);
    formData.append('form', productData.form);
    formData.append('use_type', productData.use_type);
    formData.append('price', String(price));
    formData.append('quantity', String(quantity));

    const response = await api.post('/products/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all products
  getAllProducts: async () => {
    const response = await api.get('/products/all');
    return response.data;
  },

  // Edit product
  editProduct: async (productId, productData, price, username) => {
    // Build query string for FastAPI query parameters
    const params = new URLSearchParams({
      username: username,
      product_name: productData.product_name,
      weight_num: String(productData.weight_num),
      weight_unit: productData.weight_unit,
      form: productData.form,
      use_type: productData.use_type,
      price: String(price),
    });
    
    const response = await api.put(`/products/edit/${productId}?${params.toString()}`);
    return response.data;
  },

  // Remove quantity from product
  removeQuantity: async (productId, quantity, username) => {
    // Build query string for FastAPI query parameters
    const params = new URLSearchParams({
      username: username,
      quantity: String(quantity),
    });
    
    const response = await api.post(`/products/remove_quantity/${productId}?${params.toString()}`);
    return response.data;
  },

  // Delete product
  deleteProduct: async (productId, username) => {
    // Build query string for FastAPI query parameters
    const params = new URLSearchParams({
      username: username,
    });
    
    const response = await api.delete(`/products/delete/${productId}?${params.toString()}`);
    return response.data;
  },

  // Get activity logs
  getLogs: async (username) => {
    const response = await api.get('/products/logs', {
      params: { username },
    });
    return response.data;
  },
};

export default api;

