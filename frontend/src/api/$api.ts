import type { AspidaClient, BasicHeaders } from "aspida";
import type { Methods as Methods_39nwfh } from "./api/v1/stores/menu";
import type { Methods as Methods_1o6vqb } from "./api/v1/stores/orders";
import type { Methods as Methods_e8ra0j } from "./api/v1/stores/orders/_orderId@string";

const api = <T>({ baseURL, fetch }: AspidaClient<T>) => {
	const prefix = (
		baseURL === undefined ? "http://localhost:8080" : baseURL
	).replace(/\/$/, "");
	const PATH0 = "/api/v1/stores/menu";
	const PATH1 = "/api/v1/stores/orders";
	const GET = "GET";
	const POST = "POST";

	return {
		api: {
			v1: {
				stores: {
					menu: {
						/**
						 * @returns Menu list
						 */
						get: (option?: { config?: T | undefined } | undefined) =>
							fetch<
								Methods_39nwfh["get"]["resBody"],
								BasicHeaders,
								Methods_39nwfh["get"]["status"]
							>(prefix, PATH0, GET, option).json(),
						/**
						 * @returns Menu list
						 */
						$get: (option?: { config?: T | undefined } | undefined) =>
							fetch<
								Methods_39nwfh["get"]["resBody"],
								BasicHeaders,
								Methods_39nwfh["get"]["status"]
							>(prefix, PATH0, GET, option)
								.json()
								.then((r) => r.body),
						$path: () => `${prefix}${PATH0}`,
					},
					orders: {
						_orderId: (val4: string) => {
							const prefix4 = `${PATH1}/${val4}`;

							return {
								/**
								 * @returns Order found
								 */
								get: (option?: { config?: T | undefined } | undefined) =>
									fetch<
										Methods_e8ra0j["get"]["resBody"],
										BasicHeaders,
										Methods_e8ra0j["get"]["status"]
									>(prefix, prefix4, GET, option).json(),
								/**
								 * @returns Order found
								 */
								$get: (option?: { config?: T | undefined } | undefined) =>
									fetch<
										Methods_e8ra0j["get"]["resBody"],
										BasicHeaders,
										Methods_e8ra0j["get"]["status"]
									>(prefix, prefix4, GET, option)
										.json()
										.then((r) => r.body),
								$path: () => `${prefix}${prefix4}`,
							};
						},
						/**
						 * @returns Order created
						 */
						post: (option: {
							body: Methods_1o6vqb["post"]["reqBody"];
							config?: T | undefined;
						}) =>
							fetch<
								Methods_1o6vqb["post"]["resBody"],
								BasicHeaders,
								Methods_1o6vqb["post"]["status"]
							>(prefix, PATH1, POST, option).json(),
						/**
						 * @returns Order created
						 */
						$post: (option: {
							body: Methods_1o6vqb["post"]["reqBody"];
							config?: T | undefined;
						}) =>
							fetch<
								Methods_1o6vqb["post"]["resBody"],
								BasicHeaders,
								Methods_1o6vqb["post"]["status"]
							>(prefix, PATH1, POST, option)
								.json()
								.then((r) => r.body),
						$path: () => `${prefix}${PATH1}`,
					},
				},
			},
		},
	};
};

export type ApiInstance = ReturnType<typeof api>;
export default api;
