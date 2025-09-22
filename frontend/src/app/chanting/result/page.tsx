"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
	chantingStateAtom,
	currentStepAtom,
	selectedMenuAtom,
} from "@/store/atoms";

export default function ChantingResultPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [chantingState] = useAtom(chantingStateAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);

	useEffect(() => {
		setCurrentStep("chanting_result");
	}, [setCurrentStep]);

	const handleRetry = () => {
		router.push("/chanting");
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">詠唱失敗</h1>
						<p className="text-gray-600">声量が足りませんでした</p>
					</div>

					{selectedMenu && (
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<p className="text-sm text-gray-600 mb-1">選択中のメニュー</p>
							<p className="font-semibold text-gray-900">{selectedMenu.name}</p>
						</div>
					)}

					<div className="space-y-4 mb-6">
						<div className="bg-gray-50 rounded-lg p-4">
							<p className="text-sm text-gray-600 mb-1">最大声量</p>
							<p className="text-2xl font-bold text-gray-900">
								{Math.round(chantingState.maxVolume * 100)}%
							</p>
						</div>

						{chantingState.transcript && (
							<div className="bg-gray-50 rounded-lg p-4">
								<p className="text-sm text-gray-600 mb-1">認識された言葉</p>
								<p className="text-gray-900">{chantingState.transcript}</p>
							</div>
						)}
					</div>

					<button
						type="button"
						onClick={handleRetry}
						className="w-full py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
					>
						もう一度挑戦する
					</button>
				</div>
			</div>
		</div>
	);
}
