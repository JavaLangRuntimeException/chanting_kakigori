"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	currentStepAtom,
	orderStateAtom,
	selectedMenuAtom,
} from "@/store/atoms";

const POLLING_INTERVAL = 5000;

export default function OrderConfirmPage() {
	const router = useRouter();
	const [, setCurrentStep] = useAtom(currentStepAtom);
	const [orderState, setOrderState] = useAtom(orderStateAtom);
	const [selectedMenu] = useAtom(selectedMenuAtom);
	const [pollingCount, setPollingCount] = useState(0);

	useEffect(() => {
		setCurrentStep("order_confirm");
		setOrderState({ orderId: `ORDER-${Date.now()}`, status: "preparing" });
	}, [setCurrentStep, setOrderState]);

	useEffect(() => {
		const interval = setInterval(() => {
			setPollingCount((prev) => prev + 1);

			if (pollingCount >= 3) {
				setOrderState((prev) => ({ ...prev, status: "ready" }));
				router.push("/pickup");
			}
		}, POLLING_INTERVAL);

		return () => clearInterval(interval);
	}, [pollingCount, router, setOrderState]);

	if (!selectedMenu) {
		router.push("/");
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center mb-8">
						<div className="text-6xl mb-4">🍧</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">注文確認</h1>
						<p className="text-gray-600">3人全員の詠唱が完了しました！</p>
					</div>

					<div className="bg-blue-50 rounded-lg p-4 mb-6">
						<p className="text-sm text-gray-600 mb-1">注文メニュー</p>
						<p className="font-semibold text-gray-900">{selectedMenu.name}</p>
					</div>

					{orderState.orderId && (
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<p className="text-sm text-gray-600 mb-1">注文番号</p>
							<p className="font-mono text-lg text-gray-900">
								{orderState.orderId}
							</p>
						</div>
					)}

					<div className="mb-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600">注文ステータス</span>
							<span
								className={`px-3 py-1 rounded-full text-sm font-medium ${
									orderState.status === "ready"
										? "bg-green-100 text-green-800"
										: "bg-yellow-100 text-yellow-800"
								}`}
							>
								{orderState.status === "ready" ? "準備完了" : "準備中"}
							</span>
						</div>
					</div>

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
						<div className="flex items-center justify-center gap-2">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
							<p className="text-blue-800">注文状況を確認中...</p>
						</div>
						<p className="text-xs text-blue-600 text-center mt-2">
							5秒ごとに自動更新されます
						</p>
					</div>

					<div className="text-center">
						<p className="text-sm text-gray-500">
							まもなく受取案内画面に移動します
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
