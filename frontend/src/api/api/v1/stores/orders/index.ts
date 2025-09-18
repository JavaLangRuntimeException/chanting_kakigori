/* eslint-disable */
import type { DefineMethods } from "aspida";
import type * as Types from "../../../../@types";

export type Methods = DefineMethods<{
	post: {
		status: 201;
		/** Order created */
		resBody: Types.OrderResponse;

		reqBody: {
			menu_item_id?: string | undefined;
		};
	};
}>;
