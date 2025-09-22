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

const REQUIRED_USERS = 3;

export default function WaitingRoomPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);
	const [waitingRoomState, setWaitingRoomState] = useAtom(waitingRoomStateAtom);
	const [chantingState, setChantingState] = useAtom(chantingStateAtom);
	const [countdown, setCountdown] = useState<number | null>(null);
	const stayNumHistoryRef = useRef<number[]>([]);
	const lastStableNumRef = useRef<number | null>(null);
	const [micPermissionGranted, setMicPermissionGranted] = useState(false);
	const [micPermissionError, setMicPermissionError] = useState<string | null>(
		null,
	);

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

	const { sendMessage } = useWebSocket({
		url: wsUrl,
		onMessage: (data) => {
			console.log("🚨", data);
			if (waitingRoomState.startTime) return;

			if (data.stay_num !== undefined) {
				lastStableNumRef.current = data.stay_num;
				setWaitingRoomState((prev) => ({
					...prev,
					currentUsers: data.stay_num,
				}));
				stayNumHistoryRef.current = [data.stay_num];
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

				// start_timeを受信したらマイク権限をリクエスト
				requestMicPermission();
				// 詠唱文章を取得
				fetchChantText();
			}
		},
		onOpen: () => {
			console.log("Connected to waiting room WebSocket");
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
		const interval = setInterval(() => {
			if (selectedMenu) {
				sendMessage({ action: "ping" });
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [selectedMenu, sendMessage]);

	if (!selectedMenu) {
		router.push("/");
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							待機ルーム
						</h1>
						<p className="text-gray-600">
							技育祭を盛り上げる仲間を待っています
						</p>
					</div>

					<div className="bg-blue-50 rounded-lg p-4 mb-6">
						<p className="text-sm text-gray-600 mb-1">選択中のメニュー</p>
						<p className="font-semibold text-gray-900">{selectedMenu.name}</p>
					</div>

					<div className="mb-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600">現在の待機人数</span>
							<span className="text-2xl font-bold text-blue-600">
								{waitingRoomState.currentUsers} / {REQUIRED_USERS}
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-3">
							<div
								className="bg-blue-600 h-3 rounded-full transition-all duration-500"
								style={{
									width: `${(waitingRoomState.currentUsers / REQUIRED_USERS) * 100}%`,
								}}
							/>
						</div>
					</div>

					{countdown !== null && (
						<>
							<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
								<p className="text-green-800 font-medium text-center">
									まもなく詠唱スタート！
								</p>
								<p className="text-3xl font-bold text-green-600 text-center mt-2">
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
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
									<p className="text-blue-800 text-center">
										✓ マイクの準備が完了しました
									</p>
								</div>
							)}
						</>
					)}

					<div className="text-center">
						<p className="text-sm text-gray-500">
							{waitingRoomState.currentUsers < REQUIRED_USERS
								? `あと${REQUIRED_USERS - waitingRoomState.currentUsers}人で詠唱開始`
								: "間もなく詠唱が始まります"}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
