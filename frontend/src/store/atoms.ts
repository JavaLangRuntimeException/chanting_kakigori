import { atom } from "jotai";
import type { MenuItem } from "@/api/@types";

export type AppStep =
	| "menu"
	| "order_loading"
	| "error"
	| "waiting_room"
	| "chanting"
	| "chanting_result"
	| "chanting_complete"
	| "order_confirm"
	| "pickup";

export interface ChantingState {
	volume: number;
	isRecording: boolean;
	transcript: string;
	maxVolume: number;
	averageVolume: number;
	chantText?: string; // 詠唱する文章
}

export interface WaitingRoomState {
	currentUsers: number;
	startTime?: string;
}

export interface OrderState {
	orderId?: string;
	status?: string;
}

export const currentStepAtom = atom<AppStep>("menu");

export const selectedMenuAtom = atom<MenuItem | null>(null);

export const chantingStateAtom = atom<ChantingState>({
	volume: 0,
	isRecording: false,
	transcript: "",
	maxVolume: 0,
	averageVolume: 0,
});

export const waitingRoomStateAtom = atom<WaitingRoomState>({
	currentUsers: 0,
});

export const orderStateAtom = atom<OrderState>({});

export const roomIdAtom = atom<string>("");
