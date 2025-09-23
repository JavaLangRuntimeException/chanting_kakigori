"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiClient } from "@/lib/apiClient";
import {
	chantingStateAtom,
	currentStepAtom,
	selectedMenuAtom,
	waitingRoomStateAtom,
} from "@/store/atoms";

const REQUIRED_USERS = 3 as const;
const PING_INTERVAL = 5000 as const;
const CONNECTION_TIMEOUT = 10000 as const;

export default function WaitingRoomPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);
	const [waitingRoomState, setWaitingRoomState] = useAtom(waitingRoomStateAtom);
	const [, setChantingState] = useAtom(chantingStateAtom);
	const [countdown, setCountdown] = useState<number | null>(null);
	const stayNumHistoryRef = useRef<number[]>([]);
	const lastStableNumRef = useRef<number | null>(null);
	const [micPermissionGranted, setMicPermissionGranted] = useState(false);
	const [micPermissionError, setMicPermissionError] = useState<string | null>(
		null,
	);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const wsUrl = selectedMenu
		? `${process.env.NEXT_PUBLIC_API_URL?.replace("http://", "ws://").replace("https://", "wss://")}/ws/stay?room=${selectedMenu.id}`
		: "";

	const requestMicPermission = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			stream.getTracks().map((track) => track.stop());
			setMicPermissionGranted(true);
			setMicPermissionError(null);
		} catch (error) {
			console.error("マイク権限の取得に失敗しました:", error);
			setMicPermissionError(
				"マイクへのアクセスが必要です。ブラウザの設定を確認してください。",
			);
			setMicPermissionGranted(false);
		}
	};

	const fetchChantText = async () => {
		if (!selectedMenu?.id) return;

		try {
			const response = await apiClient.api.v1.chant.$post({
				body: {
					menu_item_id: selectedMenu.id as
						| "giiku-sai"
						| "giiku-haku"
						| "giiku-ten"
						| "giiku-camp",
				},
			});

			if (response.chant) {
				setChantingState((prev) => ({
					...prev,
					chantText: response.chant,
				}));
			}
		} catch (error) {
			console.error("詠唱文章の取得に失敗しました:", error);
		}
	};

	const { sendMessage, disconnect } = useWebSocket({
		url: wsUrl,
		onMessage: (data) => {
			console.log("WebSocket message received:", data);
			setConnectionError(null);

			if (connectionTimeoutRef.current) {
				clearTimeout(connectionTimeoutRef.current);
				connectionTimeoutRef.current = null;
			}

			if (waitingRoomState.startTime) return;

			if (data.stay_num !== undefined) {
				const userCount =
					typeof data.stay_num === "number"
						? data.stay_num
						: Number(data.stay_num);
				lastStableNumRef.current = userCount;
				setWaitingRoomState((prev) => ({
					...prev,
					currentUsers: userCount,
				}));
				stayNumHistoryRef.current = [userCount];
			}

			if (data.start_time !== undefined && data.start_time !== null) {
				setWaitingRoomState((prev) => ({
					...prev,
					startTime: data.start_time,
					currentUsers: REQUIRED_USERS,
				}));
				const startTimeMs = new Date(data.start_time).getTime();
				const now = Date.now();
				const diff = Math.max(0, Math.floor((startTimeMs - now) / 1000));
				setCountdown(diff);

				requestMicPermission();
				fetchChantText();
			}
		},
		onOpen: () => {
			console.log("Connected to waiting room WebSocket");
			setIsConnected(true);
			setConnectionError(null);
		},
		onClose: (event: CloseEvent) => {
			console.log("Disconnected from waiting room WebSocket", {
				code: event.code,
				reason: event.reason,
				wasClean: event.wasClean,
			});
			setIsConnected(false);
			if (!waitingRoomState.startTime) {
				setConnectionError("接続が切断されました。再接続中...");
			}
		},
		onError: (error) => {
			console.error("WebSocket error:", error);
			setConnectionError("接続エラーが発生しました。再接続中...");
		},
	});

	useEffect(() => {
		setCurrentStep("waiting_room");
	}, [setCurrentStep]);

	useEffect(() => {
		if (countdown === null) return;

		if (countdown <= 0) {
			// マイク権限が取得できていない場合は遷移しない
			if (!micPermissionGranted && !micPermissionError) {
				// まだ権限リクエスト中の場合は待つ
				return;
			}
			router.push("/chanting");
			return;
		}

		const timer = setTimeout(() => {
			setCountdown((prev) => (prev !== null ? prev - 1 : null));
		}, 1000);

		return () => clearTimeout(timer);
	}, [countdown, router, micPermissionGranted, micPermissionError]);

	useEffect(() => {
		if (!selectedMenu || !isConnected) return;

		const interval = setInterval(() => {
			sendMessage({ action: "ping" });

			connectionTimeoutRef.current = setTimeout(() => {
				if (isConnected && !waitingRoomState.startTime) {
					setConnectionError("サーバーからの応答がありません。接続を確認中...");
				}
			}, CONNECTION_TIMEOUT);
		}, PING_INTERVAL);

		return () => {
			clearInterval(interval);
			if (connectionTimeoutRef.current) {
				clearTimeout(connectionTimeoutRef.current);
			}
		};
	}, [selectedMenu, sendMessage, isConnected, waitingRoomState.startTime]);

	useEffect(() => {
		return () => {
			if (connectionTimeoutRef.current) {
				clearTimeout(connectionTimeoutRef.current);
			}
			disconnect();
		};
	}, [disconnect]);

	if (!selectedMenu) {
		router.push("/");
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-lg shadow-lg p-8 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-br from-gray-50/10 to-transparent pointer-events-none" />
					<div className="text-center mb-8 relative">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							他の注文者を待機中
						</h1>
						<p className="text-gray-600">みんなで技育祭を盛り上げよう！</p>
					</div>

					<div className="bg-gray-50 rounded-lg p-4 mb-6">
						<p className="text-sm text-gray-600 mb-1">選択中のメニュー</p>
						<p className="font-semibold text-gray-900">{selectedMenu.name}</p>
					</div>

					<div className="mb-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600">現在の待機人数</span>
							<span className="text-2xl font-bold text-gray-900 transition-all duration-300">
								{waitingRoomState.currentUsers} / {REQUIRED_USERS}
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
							<div
								className="bg-gradient-to-r from-gray-700 to-gray-800 h-3 rounded-full transition-all duration-700 ease-out"
								style={{
									width: `${(waitingRoomState.currentUsers / REQUIRED_USERS) * 100}%`,
								}}
							/>
						</div>
					</div>

					{connectionError && !waitingRoomState.startTime && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 animate-pulse">
							<p className="text-yellow-800 text-center text-sm">
								{connectionError}
							</p>
						</div>
					)}

					{countdown !== null && (
						<>
							<div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6 relative overflow-hidden">
								<div className="absolute inset-0 bg-gradient-to-r from-gray-200/20 to-gray-300/20 animate-pulse" />
								<p className="text-gray-800 font-medium text-center relative">
									まもなく詠唱スタート！
								</p>
								<p className="text-4xl font-bold text-gray-900 text-center mt-2 relative">
									{countdown}秒
								</p>
							</div>

							{!micPermissionGranted && !micPermissionError && (
								<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
									<p className="text-yellow-800 text-center">
										マイクの権限を確認中...
									</p>
								</div>
							)}

							{micPermissionError && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
									<p className="text-red-800 text-center">
										{micPermissionError}
									</p>
								</div>
							)}

							{micPermissionGranted && (
								<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
									<p className="text-gray-800 text-center">
										✓ マイクの準備が完了しました
									</p>
								</div>
							)}
						</>
					)}

					<div className="text-center">
						{!isConnected && !connectionError ? (
							<div className="flex items-center justify-center space-x-2">
								<div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" />
								<div
									className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
									style={{ animationDelay: "0.1s" }}
								/>
								<div
									className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
									style={{ animationDelay: "0.2s" }}
								/>
								<span className="text-sm text-gray-500 ml-2">接続中...</span>
							</div>
						) : (
							<p className="text-sm text-gray-500">
								{waitingRoomState.currentUsers < REQUIRED_USERS
									? `あと${REQUIRED_USERS - waitingRoomState.currentUsers}人で詠唱開始`
									: "間もなく詠唱が始まります"}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
