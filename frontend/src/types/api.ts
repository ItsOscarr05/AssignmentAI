import { AxiosError } from 'axios';

export interface ApiError extends AxiosError {
  response?: {
    data: { [key: string]: any; message?: string };
    status: number;
    headers: Record<string, string>;
    statusText: string;
    config: any;
  };
}
