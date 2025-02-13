// Find your computer's IP address (e.g., 192.168.1.100)
const LOCAL_IP = '192.168.1.100'; // Replace with your IP
const DEV_URL = `http://${LOCAL_IP}:5000`;
const PROD_URL = 'https://your-production-url.com';

export const API_URL = __DEV__ ? DEV_URL : PROD_URL; 