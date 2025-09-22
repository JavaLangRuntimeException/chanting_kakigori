"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVolumeDetector } from "@/hooks/useVolumeDetector";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
	chantingStateAtom,
	currentStepAtom,
	roomIdAtom,
	selectedMenuAtom,
} from "@/store/atoms";

const VOLUME_THRESHOLD = 0.5;
const CHANTING_DURATION = 10000;

export default function ChantingPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);
	const [chantingState, setChantingState] = useAtom(chantingStateAtom);
	const [roomId] = useAtom(roomIdAtom);
	const [isButtonPressed, setIsButtonPressed] = useState(false);
	const [volumeHistory, setVolumeHistory] = useState<number[]>([]);
	const [timeRemaining, setTimeRemaining] = useState(CHANTING_DURATION / 1000);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const startTimeRef = useRef<number | null>(null);

	const wsUrl = selectedMenu
		? `${process.env.NEXT_PUBLIC_API_URL?.replace("http://", "ws://").replace("https://", "wss://")}/ws?room=${selectedMenu.id}`
		: "";

	const { sendMessage } = useWebSocket({
		url: wsUrl,
		onMessage: (data) => {
			if (data.average !== undefined) {
				setChantingState((prev) => ({
					...prev,
					averageVolume: data.average,
				}));
			}
		},
	});

	const { transcript, startListening, stopListening } = useSpeechRecognition({
		onResult: (text) => {
			setChantingState((prev) => ({ ...prev, transcript: text }));
		},
	});

	const { volume, startDetecting, stopDetecting } = useVolumeDetector({
		onVolumeChange: (vol) => {
			if (isButtonPressed) {
				setChantingState((prev) => ({
					...prev,
					volume: vol,
					maxVolume: Math.max(prev.maxVolume, vol),
				}));
				setVolumeHistory((prev) => [...prev.slice(-49), vol]);
				sendMessage({ value: vol });
			}
		},
		updateInterval: 200,
	});

	useEffect(() => {
		setCurrentStep("chanting");
	}, [setCurrentStep]);

	useEffect(() => {
		if (isButtonPressed && startTimeRef.current === null) {
			startTimeRef.current = Date.now();
			timerRef.current = setInterval(() => {
				const elapsed = Date.now() - (startTimeRef.current || 0);
				const remaining = Math.max(0, CHANTING_DURATION - elapsed);
				setTimeRemaining(Math.ceil(remaining / 1000));

				if (remaining <= 0) {
					handleChantingEnd();
				}
			}, 100);
		} else if (!isButtonPressed && timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
			startTimeRef.current = null;
			setTimeRemaining(CHANTING_DURATION / 1000);
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [isButtonPressed]);

	const handleChantingEnd = () => {
		const avgVolume =
			volumeHistory.length > 0
				? volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length
				: 0;

		if (avgVolume >= VOLUME_THRESHOLD) {
			setCurrentStep("chanting_complete");
			router.push("/chanting/complete");
		} else {
			setCurrentStep("chanting_result");
			router.push("/chanting/result");
		}
	};

	const handleButtonPress = () => {
		setIsButtonPressed(true);
		startListening();
		startDetecting();
	};

	const handleButtonRelease = () => {
		setIsButtonPressed(false);
		stopListening();
		stopDetecting();
		setChantingState((prev) => ({ ...prev, volume: 0 }));
	};

	if (!selectedMenu) {
		router.push("/");
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">詠唱中</h1>
						<p className="text-gray-600">大きな声で詠唱してください！</p>
					</div>

					<div className="bg-purple-50 rounded-lg p-4 mb-6">
						<p className="text-sm text-gray-600 mb-1">選択中のメニュー</p>
						<p className="font-semibold text-gray-900">{selectedMenu.name}</p>
					</div>

					<div className="mb-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600">現在の声量</span>
							<span className="text-lg font-bold text-purple-600">
								{Math.round(chantingState.volume * 100)}%
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-6">
							<div
								className={`h-6 rounded-full transition-all duration-100 ${
									chantingState.volume >= VOLUME_THRESHOLD
										? "bg-green-500"
										: "bg-purple-500"
								}`}
								style={{ width: `${chantingState.volume * 100}%` }}
							/>
						</div>
						<div className="flex items-center justify-between mt-1">
							<span className="text-xs text-gray-500">静か</span>
							<span className="text-xs text-gray-500">大きい</span>
						</div>
					</div>

					{isButtonPressed && (
						<div className="mb-6">
							<div className="bg-blue-50 rounded-lg p-3">
								<p className="text-sm text-gray-600 mb-1">残り時間</p>
								<p className="text-2xl font-bold text-blue-600">
									{timeRemaining}秒
								</p>
							</div>
						</div>
					)}

					{transcript && (
						<div className="mb-6">
							<div className="bg-gray-50 rounded-lg p-3">
								<p className="text-sm text-gray-600 mb-1">認識された言葉</p>
								<p className="text-gray-900">{transcript}</p>
							</div>
						</div>
					)}

					<button
						type="button"
						onMouseDown={handleButtonPress}
						onMouseUp={handleButtonRelease}
						onTouchStart={handleButtonPress}
						onTouchEnd={handleButtonRelease}
						className={`w-full py-6 rounded-lg font-bold text-xl transition-all ${
							isButtonPressed
								? "bg-red-600 text-white scale-95"
								: "bg-purple-600 text-white hover:bg-purple-700"
						}`}
					>
						{isButtonPressed ? "詠唱中..." : "押して詠唱"}
					</button>

					<p className="text-center text-sm text-gray-500 mt-4">
						ボタンを押し続けている間、音声を取得します
					</p>
				</div>
			</div>
		</div>
	);
}
