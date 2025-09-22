/* eslint-disable */
import type { DefineMethods } from "aspida";

export type Methods = DefineMethods<{
	post: {
		status: 200;

		/** Generated chant */
		resBody: {
			chant?: string | undefined;
		};

		reqBody: {
			menu_item_id?:
				| "giiku-sai"
				| "giiku-haku"
				| "giiku-ten"
				| "giiku-camp"
				| undefined;
		};
	};
}>;
