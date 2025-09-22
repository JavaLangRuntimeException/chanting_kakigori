"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
	currentStepAtom,
	roomIdAtom,
	selectedMenuAtom,
	waitingRoomStateAtom,
} from "@/store/atoms";

const REQUIRED_USERS = 3;

export default function WaitingRoomPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);
	const [waitingRoomState, setWaitingRoomState] = useAtom(waitingRoomStateAtom);
	const [roomId] = useAtom(roomIdAtom);
	const [countdown, setCountdown] = useState<number | null>(null);

	const wsUrl = selectedMenu
		? `ws://localhost:8080/ws/stay?room=${selectedMenu.id}`
		: "";

	const { sendMessage } = useWebSocket({
		url: wsUrl,
		onMessage: (data) => {
			console.log("Received WebSocket message:", data);
			if (data.stay_num !== undefined) {
				setWaitingRoomState((prev) => ({
					...prev,
					currentUsers: data.stay_num,
				}));
			}
			if (data.start_time !== undefined && data.start_time !== null) {
				setWaitingRoomState((prev) => ({
					...prev,
					startTime: data.start_time,
				}));
				const startTimeMs = new Date(data.start_time).getTime();
				const now = Date.now();
				const diff = Math.max(0, Math.floor((startTimeMs - now) / 1000));
				setCountdown(diff);
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
			router.push("/chanting");
			return;
		}

		const timer = setTimeout(() => {
			setCountdown((prev) => (prev !== null ? prev - 1 : null));
		}, 1000);

		return () => clearTimeout(timer);
	}, [countdown, router]);

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
						<div className="text-5xl mb-4">🎪</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							待機ルーム
						</h1>
						<p className="text-gray-600">
							イベント会場を盛り上げる仲間を待っています
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
						<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
							<p className="text-green-800 font-medium text-center">
								まもなく詠唱が開始されます！
							</p>
							<p className="text-3xl font-bold text-green-600 text-center mt-2">
								{countdown}秒
							</p>
						</div>
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
