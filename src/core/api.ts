import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Get base URL from environment, fallback to localhost:8000
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

// Response interceptor to unwrap data from success envelope
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponseEnvelope<any>>) => {
    // If the backend returned successfully, return the data directly
    const envelope = response.data;
    if (envelope && typeof envelope === 'object' && 'success' in envelope) {
      if (envelope.success) {
        return envelope.data as any;
      } else {
        // Handle validation/custom errors inside 200 response
        const errMsg = envelope.error?.message || 'Server error';
        return Promise.reject(new Error(errMsg));
      }
    }
    return response.data;
  },
  (error) => {
    // Standard HTTP error codes (400, 404, 500, etc.)
    const responseData = error.response?.data as ApiResponseEnvelope<any> | undefined;
    if (responseData && responseData.success === false && responseData.error) {
      return Promise.reject(new Error(responseData.error.message));
    }
    return Promise.reject(new Error(error.message || 'Network Error'));
  }
);

export default apiClient;
