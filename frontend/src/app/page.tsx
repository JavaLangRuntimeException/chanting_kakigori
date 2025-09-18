// biome-ignore lint/a11y/noSvgWithoutTitle: SVG icons don't need titles
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
"use client";

import { useState } from "react";

export default function Page() {
	const [isRegistered, setIsRegistered] = useState(false);

	const handleRegister = () => {
		setIsRegistered(true);
		setTimeout(() => setIsRegistered(false), 3000);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white border-b border-gray-200">
				<div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center gap-6">
						{/* biome-ignore lint/a11y/useAltText: Logo */}
						<img
							src="/supporterz-logo.png"
							alt="サポーターズロゴ"
							className="h-8 object-contain"
						/>
						<nav className="hidden md:flex gap-6">
							<a href="/" className="text-sm text-gray-600 hover:text-gray-900">
								イベント
							</a>
							<a href="/" className="text-sm text-gray-600 hover:text-gray-900">
								企業一覧
							</a>
							<a href="/" className="text-sm text-gray-600 hover:text-gray-900">
								マイページ
							</a>
						</nav>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 py-8">
				<div className="bg-white rounded-lg shadow-sm overflow-hidden">
					<div className="relative">
						{/* biome-ignore lint/a11y/useAltText: Decorative header image */}
						<img
							src="/event-header.png"
							alt="技育祭 かき氷注文システムのUIを最凶にせよ"
							className="w-full h-96 object-cover"
						/>
					</div>

					<div className="p-6">
						{/* 会社情報と職種タグ */}
						<div className="flex items-center gap-3 mb-4">
							<div className="flex items-center gap-2">
								{/* biome-ignore lint/a11y/useAltText: Company logo */}
								<img
									src="https://d1tbli0m7ecuiv.cloudfront.net/a81acd58-f6ac-4d3f-b945-307160a70f85/logo"
									alt="サポーターズロゴ"
									className="w-10 h-10 rounded object-contain border border-gray-200"
								/>
								<span className="text-sm text-gray-600">
									株式会社サポーターズ
								</span>
							</div>
							<span className="text-xs text-gray-400">|</span>
							<span className="text-xs text-gray-600">
								2026, 2027, 2028, 2029, 2030年卒向け
							</span>
						</div>

						{/* 職種タグ */}
						<div className="flex flex-wrap gap-3 mb-6">
							<span className="inline-block px-5 py-1.5 border border-gray-700 text-gray-700 text-sm font-medium rounded-full">
								エンジニア
							</span>
							<span className="inline-block px-5 py-1.5 border border-gray-700 text-gray-700 text-sm font-medium rounded-full">
								総合職
							</span>
							<span className="inline-block px-5 py-1.5 border border-gray-700 text-gray-700 text-sm font-medium rounded-full">
								デザイナー
							</span>
						</div>

						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							技育祭企画！『YouTuber
							ラムダ技術部』コラボハッカソン「かき氷注文システムのUIを最凶にせよ!?」
						</h2>

						<div className="mb-6">
							<h3 className="text-lg font-semibold text-gray-800 mb-2">
								フラー株式会社
							</h3>
							<p className="text-gray-600 text-sm">
								デジタルパートナー事業 / スマホアプリ開発
							</p>
						</div>

						<div className="grid md:grid-cols-2 gap-8 mb-8">
							<div>
								<h4 className="font-semibold text-gray-900 mb-4">
									イベント概要
								</h4>
								<p className="text-gray-700 leading-relaxed mb-4">
									フラー株式会社は、スマートフォンアプリを中心としたデジタル技術で、企業のDXを支援するデジタルパートナー事業を展開しています。
								</p>
								<p className="text-gray-700 leading-relaxed mb-4">
									本イベントでは、代表取締役社長とCTOが直接登壇し、フラーのビジョン、事業内容、そしてエンジニアとしてのキャリアパスについて詳しくお話しします。
								</p>
								<p className="text-gray-700 leading-relaxed">
									アプリ開発の最前線で活躍したい方、技術力を活かして社会に価値を提供したい方、ぜひご参加ください。
								</p>
							</div>

							<div>
								<div className="flex items-center justify-between mb-4">
									<h4 className="font-semibold text-gray-900">開催日程</h4>
									<button
										type="button"
										className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
									>
										<svg
											className="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 24 24"
											aria-label="メールアイコン"
										>
											<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
										</svg>
										<span className="text-sm font-medium">
											このイベントに関する問い合わせ
										</span>
									</button>
								</div>
								<div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
									<div className="p-4 flex items-center justify-between">
										<div className="flex items-center gap-6">
											<div>
												<p className="text-sm font-medium text-gray-900">
													9月24日
												</p>
												<p className="text-sm text-gray-600">(水曜日)</p>
											</div>
											<div>
												<p className="text-sm font-medium text-gray-900">
													19:00〜20:00
												</p>
												<p className="text-xs text-gray-500">
													オンライン 締切9月23日(火) 18:00
												</p>
											</div>
										</div>
										<button
											type="button"
											className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
										>
											申込へ
										</button>
									</div>
									<div className="p-4 flex items-center justify-between">
										<div className="flex items-center gap-6">
											<div>
												<p className="text-sm font-medium text-gray-900">
													10月22日
												</p>
												<p className="text-sm text-gray-600">(水曜日)</p>
											</div>
											<div>
												<p className="text-sm font-medium text-gray-900">
													19:00〜20:00
												</p>
												<p className="text-xs text-gray-500">
													オンライン 締切10月21日(火) 18:00
												</p>
											</div>
										</div>
										<button
											type="button"
											className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
										>
											申込へ
										</button>
									</div>
									<div className="p-4 flex items-center justify-between">
										<div className="flex items-center gap-6">
											<div>
												<p className="text-sm font-medium text-gray-900">
													11月19日
												</p>
												<p className="text-sm text-gray-600">(水曜日)</p>
											</div>
											<div>
												<p className="text-sm font-medium text-gray-900">
													19:00〜20:00
												</p>
												<p className="text-xs text-gray-500">
													オンライン 締切11月18日(火) 18:00
												</p>
											</div>
										</div>
										<button
											type="button"
											className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
										>
											申込へ
										</button>
									</div>
									<div className="p-4 flex items-center justify-between">
										<div className="flex items-center gap-6">
											<div>
												<p className="text-sm font-medium text-gray-900">
													12月17日
												</p>
												<p className="text-sm text-gray-600">(水曜日)</p>
											</div>
											<div>
												<p className="text-sm font-medium text-gray-900">
													19:00〜20:00
												</p>
												<p className="text-xs text-gray-500">
													オンライン 締切12月16日(火) 18:00
												</p>
											</div>
										</div>
										<button
											type="button"
											className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
										>
											申込へ
										</button>
									</div>
								</div>
							</div>
						</div>

						<div className="mb-8">
							<h4 className="font-semibold text-gray-900 mb-4">
								こんな方におすすめ
							</h4>
							<ul className="space-y-2">
								<li className="flex items-start">
									<svg
										className="w-5 h-5 text-green-500 mr-2 mt-0.5"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-label="チェックアイコン"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
									<span className="text-gray-700">
										スマホアプリ開発に興味がある方
									</span>
								</li>
								<li className="flex items-start">
									<svg
										className="w-5 h-5 text-green-500 mr-2 mt-0.5"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-label="チェックアイコン"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
									<span className="text-gray-700">
										企業のDX支援に携わりたい方
									</span>
								</li>
								<li className="flex items-start">
									<svg
										className="w-5 h-5 text-green-500 mr-2 mt-0.5"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-label="チェックアイコン"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
									<span className="text-gray-700">
										最新技術を活用したサービス開発に挑戦したい方
									</span>
								</li>
								<li className="flex items-start">
									<svg
										className="w-5 h-5 text-green-500 mr-2 mt-0.5"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-label="チェックアイコン"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
									<span className="text-gray-700">
										成長環境でスキルアップしたい方
									</span>
								</li>
							</ul>
						</div>

						<div className="mb-8">
							<h4 className="font-semibold text-gray-900 mb-4">募集職種</h4>
							<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
								<div className="border border-gray-200 rounded-lg p-4">
									<h5 className="font-medium text-gray-900 mb-2">
										ソフトウェアエンジニア
									</h5>
									<p className="text-sm text-gray-600">
										iOS/Android/Webアプリ開発
									</p>
								</div>
								<div className="border border-gray-200 rounded-lg p-4">
									<h5 className="font-medium text-gray-900 mb-2">
										データサイエンティスト
									</h5>
									<p className="text-sm text-gray-600">データ分析・機械学習</p>
								</div>
								<div className="border border-gray-200 rounded-lg p-4">
									<h5 className="font-medium text-gray-900 mb-2">総合職</h5>
									<p className="text-sm text-gray-600">
										企画・営業・マーケティング
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			<footer className="bg-gray-800 text-white mt-16">
				<div className="max-w-6xl mx-auto px-4 py-8">
					<div className="grid md:grid-cols-4 gap-8">
						<div>
							<h5 className="font-semibold mb-4">サービス</h5>
							<ul className="space-y-2 text-sm text-gray-300">
								<li>
									<a href="/" className="hover:text-white">
										イベント一覧
									</a>
								</li>
								<li>
									<a href="/" className="hover:text-white">
										企業一覧
									</a>
								</li>
								<li>
									<a href="/" className="hover:text-white">
										就活コラム
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h5 className="font-semibold mb-4">企業向け</h5>
							<ul className="space-y-2 text-sm text-gray-300">
								<li>
									<a href="/" className="hover:text-white">
										採用サービス
									</a>
								</li>
								<li>
									<a href="/" className="hover:text-white">
										料金プラン
									</a>
								</li>
								<li>
									<a href="/" className="hover:text-white">
										導入事例
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h5 className="font-semibold mb-4">サポート</h5>
							<ul className="space-y-2 text-sm text-gray-300">
								<li>
									<a href="/" className="hover:text-white">
										ヘルプセンター
									</a>
								</li>
								<li>
									<a href="/" className="hover:text-white">
										お問い合わせ
									</a>
								</li>
								<li>
									<a href="/" className="hover:text-white">
										よくある質問
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h5 className="font-semibold mb-4">運営会社</h5>
							<ul className="space-y-2 text-sm text-gray-300">
								<li>
									<a href="/" className="hover:text-white">
										会社概要
									</a>
								</li>
								<li>
									<a href="/" className="hover:text-white">
										プライバシーポリシー
									</a>
								</li>
								<li>
									<a href="/" className="hover:text-white">
										利用規約
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
						<p>© 2025 サポーターズ. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
