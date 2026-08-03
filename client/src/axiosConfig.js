import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://crm-backend-live-4541.onrender.com";

axios.defaults.baseURL = API_URL;

axios.interceptors.request.use((config) => {
  if (config.url.startsWith("http://localhost:5000")) {
    config.url = config.url.replace("http://localhost:5000", API_URL);
  }
  return config;
});