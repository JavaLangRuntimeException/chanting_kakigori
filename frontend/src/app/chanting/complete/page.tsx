"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
	chantingStateAtom,
	currentStepAtom,
	selectedMenuAtom,
} from "@/store/atoms";

export default function ChantingCompletePage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [chantingState] = useAtom(chantingStateAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);

	useEffect(() => {
		setCurrentStep("chanting_complete");

		const timer = setTimeout(() => {
			router.push("/order/confirm");
		}, 5000);

		return () => clearTimeout(timer);
	}, [router, setCurrentStep]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center mb-8">
						<div className="text-6xl mb-4 animate-bounce">🎉</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							詠唱成功！
						</h1>
						<p className="text-gray-600">素晴らしい詠唱でした！</p>
					</div>

					{selectedMenu && (
						<div className="bg-green-50 rounded-lg p-4 mb-6">
							<p className="text-sm text-gray-600 mb-1">選択中のメニュー</p>
							<p className="font-semibold text-gray-900">{selectedMenu.name}</p>
						</div>
					)}

					<div className="space-y-4 mb-6">
						<div className="bg-gray-50 rounded-lg p-4">
							<p className="text-sm text-gray-600 mb-1">最大声量</p>
							<p className="text-2xl font-bold text-green-600">
								{Math.round(chantingState.maxVolume * 100)}%
							</p>
						</div>

						{chantingState.averageVolume > 0 && (
							<div className="bg-gray-50 rounded-lg p-4">
								<p className="text-sm text-gray-600 mb-1">平均声量</p>
								<p className="text-2xl font-bold text-green-600">
									{Math.round(chantingState.averageVolume * 100)}%
								</p>
							</div>
						)}

						{chantingState.transcript && (
							<div className="bg-gray-50 rounded-lg p-4">
								<p className="text-sm text-gray-600 mb-1">文字起こし結果</p>
								<p className="text-gray-900">{chantingState.transcript}</p>
							</div>
						)}
					</div>

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<p className="text-blue-800 text-center">
							他の参加者の詠唱を待っています...
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
