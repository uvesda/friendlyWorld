import axios from "axios";

export const baseApi = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 5000
});

// Интерцептор пока пустой
baseApi.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);