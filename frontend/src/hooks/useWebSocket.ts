"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseWebSocketOptions {
	url: string;
	onMessage?: (data: any) => void;
	onOpen?: (event: Event) => void;
	onClose?: (event: CloseEvent) => void;
	onError?: (event: Event) => void;
	autoReconnect?: boolean;
	reconnectDelay?: number;
}

export const useWebSocket = ({
	url,
	onMessage,
	onOpen,
	onClose,
	onError,
	autoReconnect = true,
	reconnectDelay = 3000,
}: UseWebSocketOptions) => {
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isConnectingRef = useRef(false);
	const reconnectAttemptsRef = useRef(0);
	const maxReconnectAttemptsRef = useRef(10);

	// useCallbackを使わず、refを使ってコールバック関数を保持
	const onMessageRef = useRef(onMessage);
	const onOpenRef = useRef(onOpen);
	const onCloseRef = useRef(onClose);
	const onErrorRef = useRef(onError);

	// コールバック関数が変更されたときにrefを更新
	useEffect(() => {
		onMessageRef.current = onMessage;
		onOpenRef.current = onOpen;
		onCloseRef.current = onClose;
		onErrorRef.current = onError;
	}, [onMessage, onOpen, onClose, onError]);

	const connect = useCallback(() => {
		if (
			isConnectingRef.current ||
			wsRef.current?.readyState === WebSocket.OPEN
		) {
			return;
		}

		isConnectingRef.current = true;

		try {
			const ws = new WebSocket(url);

			ws.onopen = (event) => {
				isConnectingRef.current = false;
				reconnectAttemptsRef.current = 0; // 接続成功時にカウンターをリセット
				onOpenRef.current?.(event);
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					// 文字列の"null"をnullに変換
					const processedData = Object.entries(data).reduce(
						(acc, [key, value]) => {
							acc[key] = value === "null" ? null : value;
							return acc;
						},
						{} as any,
					);
					onMessageRef.current?.(processedData);
				} catch (error) {
					console.error("Failed to parse WebSocket message:", error);
				}
			};

			ws.onclose = (event) => {
				isConnectingRef.current = false;
				onCloseRef.current?.(event);

				// 正常な切断（wasClean=true）または最大再接続回数を超えた場合は再接続しない
				if (
					autoReconnect &&
					!event.wasClean &&
					reconnectAttemptsRef.current < maxReconnectAttemptsRef.current
				) {
					reconnectAttemptsRef.current++;
					// 指数バックオフ：再試行ごとに待機時間を増やす
					const delay = Math.min(
						reconnectDelay * 1.5 ** reconnectAttemptsRef.current,
						30000,
					);
					console.log(
						`WebSocket reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`,
					);

					reconnectTimeoutRef.current = setTimeout(() => {
						connect();
					}, delay);
				} else if (
					reconnectAttemptsRef.current >= maxReconnectAttemptsRef.current
				) {
					console.error("Max reconnection attempts reached");
				}
			};

			ws.onerror = (event) => {
				isConnectingRef.current = false;
				onErrorRef.current?.(event);
			};

			wsRef.current = ws;
		} catch (error) {
			isConnectingRef.current = false;
			console.error("Failed to create WebSocket connection:", error);
		}
	}, [url, autoReconnect, reconnectDelay]);

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.close();
			wsRef.current = null;
		} else if (wsRef.current) {
			// 接続中の場合は、oncloseハンドラをnullにしてからcloseを呼ぶ
			wsRef.current.onclose = null;
			wsRef.current.onerror = null;
			wsRef.current.onmessage = null;
			wsRef.current.onopen = null;
			wsRef.current = null;
		}
	}, []);

	const sendMessage = useCallback((data: any) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(data));
		} else {
			console.warn("WebSocket is not connected");
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: 無限ループ防止のため
	useEffect(() => {
		if (!url) return;

		connect();

		return () => {
			disconnect();
		};
	}, [url]); // connectを依存配列から除外

	return { sendMessage, disconnect, reconnect: connect };
};
