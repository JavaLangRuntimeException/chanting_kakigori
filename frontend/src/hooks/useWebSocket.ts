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
				onOpen?.(event);
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
					onMessage?.(processedData);
				} catch (error) {
					console.error("Failed to parse WebSocket message:", error);
				}
			};

			ws.onclose = (event) => {
				isConnectingRef.current = false;
				onClose?.(event);

				if (autoReconnect && !event.wasClean) {
					reconnectTimeoutRef.current = setTimeout(() => {
						connect();
					}, reconnectDelay);
				}
			};

			ws.onerror = (event) => {
				isConnectingRef.current = false;
				onError?.(event);
			};

			wsRef.current = ws;
		} catch (error) {
			isConnectingRef.current = false;
			console.error("Failed to create WebSocket connection:", error);
		}
	}, [url, onMessage, onOpen, onClose, onError, autoReconnect, reconnectDelay]);

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

	useEffect(() => {
		connect();

		return () => {
			disconnect();
		};
	}, [connect, disconnect]);

	return { sendMessage, disconnect, reconnect: connect };
};
