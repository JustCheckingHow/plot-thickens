import axios from "axios";


export const API_URL = import.meta.env.VITE_API_URL || 'https://api.justcheckinghow.com';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true
});

export default axiosInstance;

function getWebSocketUrl(path: string = ""): string {
    let wsUrl = API_URL.replace(/^http/, "ws");
    if (path && !wsUrl.endsWith("/")) wsUrl += "/";
    return wsUrl + path;
}

export function connectWebSocket(path: string = ""): WebSocket {
    const ws = new WebSocket(getWebSocketUrl(path));
    return ws;
}