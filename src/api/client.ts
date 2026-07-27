import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import type { ApiResponse } from "../types";

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "/api/v1",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor - LOG ALL REQUESTS
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`, {
          baseURL: config.baseURL,
          params: config.params,
          data: config.data,
          headers: config.headers,
        });
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error("❌ Request error:", error);
        return Promise.reject(error);
      },
    );

    // Response interceptor - LOG ALL RESPONSES
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `✅ [${response.config.method?.toUpperCase()}] ${response.config.url}`,
          {
            status: response.status,
            data: response.data,
          },
        );
        return response;
      },
      async (error) => {
        console.error(
          `❌ Response error [${error.config?.method?.toUpperCase()}] ${error.config?.url}`,
          {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          },
        );

        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const response = await this.client.post("/auth/refresh", {
                refreshToken,
              });
              const { accessToken, refreshToken: newRefreshToken } =
                response.data.data;

              localStorage.setItem("accessToken", accessToken);
              localStorage.setItem("refreshToken", newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            console.error("❌ Refresh failed:", refreshError);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      },
    );
  }
  // // Request interceptor
  // this.client.interceptors.request.use(
  //   (config) => {
  //     const token = localStorage.getItem('accessToken');
  //     if (token) {
  //       config.headers.Authorization = `Bearer ${token}`;
  //     }
  //     return config;
  //   },
  //   (error) => Promise.reject(error)
  // );

  // // Response interceptor
  // this.client.interceptors.response.use(
  //   (response) => response,
  //   async (error) => {
  //     const originalRequest = error.config;

  //     if (error.response?.status === 401 && !originalRequest._retry) {
  //       originalRequest._retry = true;

  //       try {
  //         const refreshToken = localStorage.getItem('refreshToken');
  //         if (refreshToken) {
  //           const response = await this.client.post('/auth/refresh', { refreshToken });
  //           const { accessToken, refreshToken: newRefreshToken } = response.data.data;

  //           localStorage.setItem('accessToken', accessToken);
  //           localStorage.setItem('refreshToken', newRefreshToken);

  //           originalRequest.headers.Authorization = `Bearer ${accessToken}`;
  //           return this.client(originalRequest);
  //         }
  //       } catch (refreshError) {
  //         // Refresh failed, redirect to login
  //         localStorage.removeItem('accessToken');
  //         localStorage.removeItem('refreshToken');
  //         window.location.href = '/login';
  //       }
  //     }

  //     return Promise.reject(error);
  //   }
  // );

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(
      url,
      config,
    );
    return response.data.data as T;
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(
      url,
      data,
      config,
    );
    return response.data.data as T;
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(
      url,
      data,
      config,
    );
    return response.data.data as T;
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(
      url,
      data,
      config,
    );
    return response.data.data as T;
  }

  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(
      url,
      config,
    );
    return response.data.data as T;
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = ApiClient.getInstance();
