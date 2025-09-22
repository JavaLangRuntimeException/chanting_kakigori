import aspida from "@aspida/axios";
import axios from "axios";
import api from "@/api/$api";

const axiosInstance = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
	timeout: 30000,
	headers: {
		"Content-Type": "application/json",
	},
});

export const apiClient = api(aspida(axiosInstance));
