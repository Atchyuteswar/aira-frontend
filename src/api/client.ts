import axios from 'axios';

const API_URL = 'https://aira-backend-ver1-0.onrender.com';
// const API_URL = 'http://172.16.17.147:8000';


const apiClient = axios.create({
  baseURL: API_URL,
});

export default apiClient;