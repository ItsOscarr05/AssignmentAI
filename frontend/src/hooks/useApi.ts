import { useState } from "react";

interface ApiError {
  message: string;
  status?: number;
}

interface ApiOptions {
  baseURL?: string;
  headers?: Record<string, string>;
}

export const useApi = (options: ApiOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const baseURL =
    options.baseURL ||
    (import.meta.env as any).REACT_APP_API_URL ||
    "http://localhost:8000";
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const handleResponse = async (response: Response) => {
    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.detail || "An error occurred",
        status: response.status,
      };
    }

    return data;
  };

  const request = async (
    endpoint: string,
    method: string = "GET",
    body?: any,
    headers: Record<string, string> = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method,
        headers: {
          ...defaultHeaders,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      });

      const data = await handleResponse(response);
      return data;
    } catch (err) {
      const error = err as ApiError;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    get: (endpoint: string, headers?: Record<string, string>) =>
      request(endpoint, "GET", undefined, headers),
    post: (endpoint: string, body: any, headers?: Record<string, string>) =>
      request(endpoint, "POST", body, headers),
    put: (endpoint: string, body: any, headers?: Record<string, string>) =>
      request(endpoint, "PUT", body, headers),
    delete: (endpoint: string, headers?: Record<string, string>) =>
      request(endpoint, "DELETE", undefined, headers),
  };
};
