export interface Item {
  id: string | number;
  name: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
} 