import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private static instance: ApiClient;
  private refreshPromise: Promise<string | null> | null = null;

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async getStoredCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const password = await AsyncStorage.getItem('userPassword');
      return email && password ? { email, password } : null;
    } catch {
      return null;
    }
  }

  private async refreshToken(): Promise<string | null> {
    // Si un refresh est déjà en cours, on attend le résultat
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const credentials = await this.getStoredCredentials();
      if (!credentials) {
        console.warn('No stored credentials for token refresh');
        return null;
      }

      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        console.warn('Token refresh failed:', response.status);
        return null;
      }

      const data = await response.json();
      const newToken = data.accessToken;

      if (newToken) {
        await AsyncStorage.setItem('accessToken', newToken);
        console.log('Token refreshed successfully');
        return newToken;
      }

      return null;
    } catch (error) {
      console.error('Error during token refresh:', error);
      return null;
    }
  }

  async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const makeRequest = async (token?: string): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
      });
    };

    try {
      // Première tentative avec le token actuel
      const currentToken = await AsyncStorage.getItem('accessToken');
      let response = await makeRequest(currentToken || undefined);

      // Si 401, on tente un refresh du token
      if (response.status === 401 && currentToken) {
        console.log('Token expired, attempting refresh...');
        
        const newToken = await this.refreshToken();
        
        if (newToken) {
          // Retry avec le nouveau token
          response = await makeRequest(newToken);
        } else {
          // Refresh failed, clear storage and redirect to login
          await AsyncStorage.multiRemove(['accessToken', 'userEmail', 'userPassword']);
          return {
            status: 401,
            error: 'Session expired. Please login again.',
          };
        }
      }

      const status = response.status;
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          status,
          error: errorText || `HTTP ${status}`,
        };
      }

      const data = await response.json();
      return {
        status,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 0,
        error: 'Network error',
      };
    }
  }

  // Méthodes de convenance
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = ApiClient.getInstance();
export default apiClient;
