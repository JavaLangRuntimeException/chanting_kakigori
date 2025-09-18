/* eslint-disable */
export type MenuItem = {
	id?: string | undefined;
	name?: string | undefined;
	description?: string | undefined;
};

export type OrderResponse = {
	id?: string | undefined;
	menu_item_id?: string | undefined;
	menu_name?: string | undefined;
	status?: "pending" | "waitingPickup" | "completed" | undefined;
	order_number?: number | undefined;
};

export type ErrorResponse = {
	error?: string | undefined;
	message?: string | undefined;
};
