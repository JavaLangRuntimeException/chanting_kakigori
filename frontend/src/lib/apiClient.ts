import aspida from "@aspida/axios";
import axios from "axios";
import api from "@/api/$api";

const axiosInstance = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	timeout: 30000,
	headers: {
		"Content-Type": "application/json",
	},
	transformResponse: [
		(data) => {
			if (!data) return data;
			try {
				return JSON.parse(data);
			} catch {
				return data;
			}
		},
	],
});

export const apiClient = api(aspida(axiosInstance));
