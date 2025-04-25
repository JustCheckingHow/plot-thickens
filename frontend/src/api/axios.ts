import axios from "axios";


export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:6055';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true
});


export default axiosInstance;