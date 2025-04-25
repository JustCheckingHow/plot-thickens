import axios from 'axios';
import { Item } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchItems = async (): Promise<Item[]> => {
  try {
    const response = await api.get<Item[]>('/api/items');
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export default api; 