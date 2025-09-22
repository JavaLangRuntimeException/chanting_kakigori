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
	selectedMenuAtom,
} from "@/store/atoms";

const VOLUME_THRESHOLD = 0.001; // 実験用に限りなく低く設定
const CHANTING_DURATION = 10000;

export default function ChantingPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);
	const [chantingState, setChantingState] = useAtom(chantingStateAtom);
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
			if (data.average === undefined) return;
			setChantingState((prev) => ({
				...prev,
				averageVolume: data.average,
			}));
		},
	});

	const { startListening, stopListening, resetTranscript, isSupported } =
		useSpeechRecognition({
			onResult: (text) => {
				console.log("音声認識結果:", text);
				setChantingState((prev) => ({ ...prev, transcript: text }));
			},
			continuous: true,
			interimResults: true,
			lang: "ja-JP",
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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

	const handleButtonPress = () => {
		setIsButtonPressed(true);
		// 音声認識開始前にtranscriptをリセット
		resetTranscript();
		setChantingState((prev) => ({ ...prev, transcript: "" }));
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
		<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-blue-900 mb-2">詠唱中</h1>
						<p className="text-blue-700">大きな声で詠唱してください！</p>
					</div>

					{chantingState.chantText && (
						<div className="bg-white rounded-lg p-6 mb-6 border border-gray-300">
							<p className="text-center text-gray-700 mb-3 font-bold text-lg">
								詠唱文章
							</p>
							<p className="text-gray-900 leading-loose text-center font-bold text-base md:text-lg">
								{chantingState.chantText}
							</p>
						</div>
					)}

					<div className="mb-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600">現在の声量</span>
							<span className="text-lg font-bold text-blue-600">
								{Math.round(chantingState.volume * 100)}%
								<br />
								みんなの声量：{Math.round(volume * 100)}%
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-6">
							<div
								className={`h-6 rounded-full transition-all duration-100 ${
									chantingState.volume >= VOLUME_THRESHOLD
										? "bg-green-500"
										: "bg-blue-500"
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

					{!isSupported && (
						<div className="mb-6">
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
								<p className="text-sm text-yellow-700">
									⚠️ お使いのブラウザは音声認識をサポートしていません
								</p>
							</div>
						</div>
					)}

					{chantingState.transcript && (
						<div className="mb-6">
							<div className="bg-gray-50 rounded-lg p-3">
								<p className="text-sm text-gray-600 mb-1">認識された言葉</p>
								<p className="text-gray-900">{chantingState.transcript}</p>
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
								? "bg-blue-700 text-white scale-95"
								: "bg-blue-600 text-white hover:bg-blue-700"
						}`}
					>
						{isButtonPressed ? "詠唱中..." : "押して詠唱"}
					</button>
				</div>
			</div>
		</div>
	);
}
