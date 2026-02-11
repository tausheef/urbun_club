// utils/api.js
import axios from "axios";

// Create axios instance with base configuration
export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:5000/api/v1" 
    : "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Access forbidden");
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error("Resource not found");
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error("Server error");
    }

    return Promise.reject(error);
  }
);

// ==================== DOCKET APIs ====================

export const docketAPI = {
  // Get all dockets
  getAll: async (params = {}) => {
    const response = await axiosInstance.get("/dockets", { params });
    return response.data;
  },

  // Get single docket by ID
  getById: async (id) => {
    const response = await axiosInstance.get(`/dockets/${id}`);
    return response.data;
  },

  // Create new docket
  create: async (docketData) => {
    const response = await axiosInstance.post("/dockets", docketData);
    return response.data;
  },

  // Update docket
  update: async (id, docketData) => {
    const response = await axiosInstance.put(`/dockets/${id}`, docketData);
    return response.data;
  },

  // Cancel docket
  cancel: async (id, reason) => {
    const response = await axiosInstance.patch(`/dockets/${id}/cancel`, { reason });
    return response.data;
  },

  // Restore cancelled docket
  restore: async (id) => {
    const response = await axiosInstance.patch(`/dockets/${id}/restore`);
    return response.data;
  },

  // Get cancelled dockets
  getCancelled: async () => {
    const response = await axiosInstance.get("/dockets/cancelled");
    return response.data;
  },

  // Delete docket
  delete: async (id) => {
    const response = await axiosInstance.delete(`/dockets/${id}`);
    return response.data;
  },
};

// ==================== INVOICE APIs ====================

export const invoiceAPI = {
  // Get all invoices
  getAll: async () => {
    const response = await axiosInstance.get("/invoices");
    return response.data;
  },

  // Get single invoice by ID
  getById: async (id) => {
    const response = await axiosInstance.get(`/invoices/${id}`);
    return response.data;
  },

  // Create new invoice
  create: async (invoiceData) => {
    const response = await axiosInstance.post("/invoices", invoiceData);
    return response.data;
  },

  // Update invoice
  update: async (id, invoiceData) => {
    const response = await axiosInstance.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  // Delete invoice
  delete: async (id) => {
    const response = await axiosInstance.delete(`/invoices/${id}`);
    return response.data;
  },
};

// ==================== E-WAY BILL APIs ====================

export const ewayBillAPI = {
  // Get expired e-way bills
  getExpired: async () => {
    const response = await axiosInstance.get("/ewaybills/expired");
    return response.data;
  },

  // Get expired count
  getExpiredCount: async () => {
    const response = await axiosInstance.get("/ewaybills/expired/count");
    return response.data;
  },
};

// ==================== ACTIVITY APIs ====================

export const activityAPI = {
  // Get activities for a docket
  getByDocket: async (docketId) => {
    const response = await axiosInstance.get(`/activities/docket/${docketId}`);
    return response.data;
  },

  // Create new activity
  create: async (activityData) => {
    const response = await axiosInstance.post("/activities", activityData);
    return response.data;
  },

  // Update activity
  update: async (id, activityData) => {
    const response = await axiosInstance.put(`/activities/${id}`, activityData);
    return response.data;
  },

  // Upload POD image
  uploadPOD: async (activityId, file) => {
    const formData = new FormData();
    formData.append("podImage", file);
    
    const response = await axiosInstance.patch(
      `/activities/${activityId}/upload-pod`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // ✅ NEW: Delete POD image from activity
  deletePOD: async (activityId) => {
    const response = await axiosInstance.delete(
      `/activities/${activityId}/delete-pod`
    );
    return response.data;
  },

  // Get delivered dockets
  getDelivered: async () => {
    const response = await axiosInstance.get("/activities/delivered-dockets");
    return response.data;
  },

  // Get undelivered dockets
  getUndelivered: async () => {
    const response = await axiosInstance.get("/activities/undelivered-dockets");
    return response.data;
  },

  // Get pending dockets
  getPending: async () => {
    const response = await axiosInstance.get("/activities/pending-dockets");
    return response.data;
  },

  // Get RTO dockets
  getRTO: async () => {
    const response = await axiosInstance.get("/activities/rto-dockets");
    return response.data;
  },

  // Delete activity
  delete: async (id) => {
    const response = await axiosInstance.delete(`/activities/${id}`);
    return response.data;
  },
};

// ==================== CO-LOADER APIs ====================

export const coLoaderAPI = {
  // Get all co-loaders
  getAll: async () => {
    const response = await axiosInstance.get("/coloaders");
    return response.data;
  },

  // Get co-loader by ID
  getById: async (id) => {
    const response = await axiosInstance.get(`/coloaders/${id}`);
    return response.data;
  },

  // Get co-loader by docket ID
  getByDocketId: async (docketId) => {
    const response = await axiosInstance.get(`/coloaders/docket/${docketId}`);
    return response.data;
  },

  // Create new co-loader
  create: async (coLoaderData) => {
    const formData = new FormData();
    formData.append("docketId", coLoaderData.docketId);
    formData.append("transportName", coLoaderData.transportName);
    formData.append("transportDocket", coLoaderData.transportDocket);
    
    // ✅ Only append challan if it exists (optional field)
    if (coLoaderData.challan) {
      formData.append("challan", coLoaderData.challan);
    }

    const response = await axiosInstance.post("/coloaders", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update co-loader
  update: async (id, coLoaderData) => {
    const formData = new FormData();
    if (coLoaderData.transportName) {
      formData.append("transportName", coLoaderData.transportName);
    }
    if (coLoaderData.transportDocket) {
      formData.append("transportDocket", coLoaderData.transportDocket);
    }
    if (coLoaderData.challan) {
      formData.append("challan", coLoaderData.challan); // New file (optional)
    }

    const response = await axiosInstance.put(`/coloaders/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete co-loader
  delete: async (id) => {
    const response = await axiosInstance.delete(`/coloaders/${id}`);
    return response.data;
  },
};

// ==================== AUTH APIs ====================

export const authAPI = {
  // Login
  login: async (credentials) => {
    const response = await axiosInstance.post("/auth/login", credentials);
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  },

  // Google login redirect
  googleLogin: () => {
    window.location.href = `${axiosInstance.defaults.baseURL}/auth/google`;
  },
};

// ==================== UTILITY FUNCTIONS ====================

// Generic GET request
export const get = async (endpoint, params = {}) => {
  const response = await axiosInstance.get(endpoint, { params });
  return response.data;
};

// Generic POST request
export const post = async (endpoint, data) => {
  const response = await axiosInstance.post(endpoint, data);
  return response.data;
};

// Generic PUT request
export const put = async (endpoint, data) => {
  const response = await axiosInstance.put(endpoint, data);
  return response.data;
};

// Generic PATCH request
export const patch = async (endpoint, data) => {
  const response = await axiosInstance.patch(endpoint, data);
  return response.data;
};

// Generic DELETE request
export const del = async (endpoint) => {
  const response = await axiosInstance.delete(endpoint);
  return response.data;
};

// Upload file
export const uploadFile = async (endpoint, file, fieldName = "file") => {
  const formData = new FormData();
  formData.append(fieldName, file);
  
  const response = await axiosInstance.post(endpoint, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export default axiosInstance;