"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
	currentStepAtom,
	orderStateAtom,
	selectedMenuAtom,
} from "@/store/atoms";

export default function PickupPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [orderState] = useAtom(orderStateAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);

	useEffect(() => {
		setCurrentStep("pickup");
	}, [setCurrentStep]);

	const handleBackToMenu = () => {
		router.push("/");
	};

	if (!selectedMenu || !orderState.orderId) {
		router.push("/");
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							受取準備完了
						</h1>
						<p className="text-gray-600">かき氷の準備ができました</p>
					</div>

					<div className="bg-gray-50 rounded-lg p-6 mb-6">
						<p className="text-sm text-gray-600 mb-2">注文番号</p>
						<p className="font-mono text-2xl font-bold text-gray-900 mb-4">
							{orderState.orderId}
						</p>
						<p className="text-sm text-gray-600 mb-1">注文メニュー</p>
						<p className="font-semibold text-gray-900">{selectedMenu.name}</p>
					</div>

					<button
						type="button"
						onClick={handleBackToMenu}
						className="w-full py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
					>
						メニューに戻る
					</button>
				</div>
			</div>
		</div>
	);
}
