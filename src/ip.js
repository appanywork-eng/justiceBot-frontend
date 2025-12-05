// ip.js - auto-detect backend server

const LOCAL_BACKEND = "http://127.0.0.1:5000";

// Detect Termux network interface IP (rmnet_data0 or wlan0)
export function getBackendIP() {
    if (typeof window === "undefined") return LOCAL_BACKEND;

    const stored = localStorage.getItem("backend_ip");
    if (stored) return stored;

    return LOCAL_BACKEND; 
}

export const BACKEND_URL = getBackendIP();
