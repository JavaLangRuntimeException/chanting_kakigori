"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/api/@types";
import { apiClient } from "@/lib/apiClient";
import { currentStepAtom, selectedMenuAtom } from "@/store/atoms";

export function Content() {
	const [scheduleItems, setScheduleItems] = useState<MenuItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const [, setSelectedMenu] = useAtom(selectedMenuAtom);
	const [, setCurrentStep] = useAtom(currentStepAtom);

	useEffect(() => {
		const fetchMenu = async () => {
			try {
				setIsLoading(true);
				const response = await apiClient.api.v1.stores.menu.$get();
				setScheduleItems(response.menu || []);
				setError(null);
			} catch (err) {
				console.error("Failed to fetch menu:", err);
				setError("メニューの取得に失敗しました");
				setScheduleItems([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchMenu();
	}, []);

	const handleMenuSelect = (item: MenuItem) => {
		setSelectedMenu(item);
		setCurrentStep("order_loading");
		router.push("/order/loading");
	};
	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white border-b border-gray-200">
				<div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center gap-6">
						<img
							src="/supporterz-logo.png"
							alt="サポーターズロゴ"
							className="h-8 object-contain"
						/>
						<nav className="hidden md:flex gap-6">
							<a href="/" className="text-sm hover:text-gray-900">
								イベント
							</a>
							<a href="/" className="text-sm hover:text-gray-900">
								企業一覧
							</a>
							<a href="/" className="text-sm hover:text-gray-900">
								マイページ
							</a>
						</nav>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 py-8">
				<div className="bg-white rounded-lg shadow-sm overflow-hidden">
					<div className="relative">
						<img
							src="/event-header.png"
							alt="技育祭 かき氷注文システムのUIを最凶にせよ"
							className="w-full h-96 object-cover"
						/>
					</div>

					<div className="p-6">
						{error && (
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
								<p className="text-yellow-800 text-sm">{error}</p>
							</div>
						)}

						<div className="flex items-center gap-3 mb-4">
							<div className="flex items-center gap-2">
								<img
									src="https://d1tbli0m7ecuiv.cloudfront.net/a81acd58-f6ac-4d3f-b945-307160a70f85/logo"
									alt="サポーターズロゴ"
									className="w-10 h-10 rounded object-contain border border-gray-200"
								/>
								<span className="text-sm">株式会社サポーターズ</span>
							</div>
							<span className="text-xs text-gray-400">|</span>
							<span className="text-xs">
								2026, 2027, 2028, 2029, 2030年卒向け
							</span>
						</div>

						<div className="flex flex-wrap gap-3 mb-6">
							<span className="inline-block px-5 py-1.5 border border-gray-700 text-sm font-medium rounded-full">
								エンジニア
							</span>
							<span className="inline-block px-5 py-1.5 border border-gray-700 text-sm font-medium rounded-full">
								総合職
							</span>
							<span className="inline-block px-5 py-1.5 border border-gray-700 text-sm font-medium rounded-full">
								デザイナー
							</span>
						</div>

						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							技育祭企画！『YouTuber
							ラムダ技術部』コラボハッカソン「かき氷注文システムのUIを最凶にせよ!?」
						</h2>

						<div className="grid md:grid-cols-2 gap-8 mb-8">
							<div className="prose prose-gray max-w-none order-2 md:order-1">
								<p className="text-black leading-relaxed mb-4">
									2025年10月11日（土）～12日（日）の2日間で開催する、エンジニアを目指す学生のための学園祭！技育祭2025【秋】
									<br />
									その特別企画として、人気YouTuber『ラムダ技術部』とコラボハッカソンの開催が決定!!
								</p>
								<p className="text-black leading-relaxed mb-4">
									<strong>
										テーマは『かき氷注文システムのUIを最凶にせよ！?』
									</strong>
									<br />
									10月12日（日）技育祭2025【秋】のリアル会場にかき氷が登場！
									<br />
									このハッカソンは、かき氷を注文する当日のシステムを作るハッカソンです！
									<br />
									4種類のシロップを選ぶ最凶のUIとは…？
									<br />
									※シロップの種類は変更になる場合がございます。
								</p>
								<p className="text-black leading-relaxed mb-4">
									自分が作ったシステムが実際に技育祭の会場で使われる！？
									<br />
									内容はラムダ技術部がキックオフで説明！
									<br />
									当日は会場にラムダ技術部ラムダ氏を招き、特別講演の実施も決定！直接交流ができるかも！
								</p>
								<div className="bg-gray-50 p-4 rounded-lg mb-6">
									<p className="text-black leading-relaxed mb-4">
										<strong>技育祭とは？</strong>
										<br />
										技育プロジェクトの一環として年に2回開催されている日本最大のエンジニアを目指す学生向けオンラインテックカンファレンス。
									</p>
									<ul className="list-disc pl-6 space-y-2 mb-4">
										<li>
											「学園祭」のような雰囲気で、日本を代表するエンジニアからインプットを得ることができる！
										</li>
										<li>スマホ1台あればどこからでも参加可能!!</li>
										<li>入退室自由＆完全無料で気軽に参加可能！</li>
										<li>
											オンライン開催に加え、Day2は東京・虎ノ門にリアル会場を開設！
										</li>
										<li>
											ひろゆき氏や、成田悠輔氏など、超豪華ゲストの登壇が続々と決定中！
										</li>
									</ul>
									<p className="text-black">
										技育祭の詳細＆申込はこちら：
										<a
											href="https://geek.supporterz.jp/geeksai/2025autumn"
											target="_blank"
											rel="noreferrer noopener"
											className="text-blue-600 hover:text-blue-800 underline"
										>
											https://geek.supporterz.jp/geeksai/2025autumn
										</a>
										<br />
										技育プロジェクト：
										<a
											href="https://biz.supporterz.jp/geekpjt/"
											target="_blank"
											rel="noreferrer noopener"
											className="text-blue-600 hover:text-blue-800 underline"
										>
											https://biz.supporterz.jp/geekpjt/
										</a>
									</p>
								</div>

								<h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">
									ハッカソン詳細
								</h2>

								<div className="space-y-6">
									<div>
										<h3 className="font-semibold text-gray-900 mb-2">■日程</h3>
										<ul className="space-y-2">
											<li>
												<strong>【必須参加】</strong>
												キックオフ：9月8日(月)19:00−20:00
											</li>
											<li className="pl-4">
												└ 事前開発期間：キックオフ後 ~ 2025年9月23日(火祝)
											</li>
											<li>
												<strong>【必須参加】</strong>
												ハッカソン当日：2025年9月23日(火祝) 11:00 〜 19:00
											</li>
											<li>
												技育祭2025【秋】Day2：2025年10月12日(日) 11:00 〜 19:00
											</li>
										</ul>
										<p className="text-sm mt-2">
											※技育祭についてはぜひ当日お越しいただきたく、作成した作品を企画に利用する可能性があります。
										</p>
										<p className="text-sm mt-3">
											<strong>
												キックオフで最終的な参加エントリーを行います。参加できない場合はハッカソンへの参加はできません。
											</strong>
										</p>
										<ul className="list-disc pl-6 space-y-2 mt-3">
											<li>
												ハッカソン当日は途中で参加・退出はできません、あらかじめ予定を調整してご参加ください。
											</li>
											<li>
												事前開発期間は、時間のある方のみ実施をしてください
											</li>
											<li>
												アイデア /
												作品についてはラムダ技術部の企画や動画に使用する場合がございます。
											</li>
											<li>全てオンラインにて実施されます</li>
										</ul>
									</div>

									<div>
										<h3 className="font-semibold text-gray-900 mb-2">■場所</h3>
										<p className="text-black">
											オンライン。
											<br />
											開会式、成果発表などはZoomにてオンライン開催します。
											<br />
											開催URLは申し込み後にイベントページに表示されますのでご確認をお願いします。
										</p>
									</div>

									<div>
										<h3 className="font-semibold text-gray-900 mb-2">■対象</h3>
										<ul className="list-disc pl-6 space-y-2">
											<li>エンジニアを目指す学生</li>
											<li>技育祭2025【秋】Day2東京会場に参加可能な学生</li>
											<li>学年不問</li>
											<li>過去ハッカソン出場経験のある方</li>
											<li>2-5人でのチーム参加を必須といたします。</li>
										</ul>
									</div>

									<div>
										<h3 className="font-semibold text-gray-900 mb-2">
											■参加方法/チームについて
										</h3>
										<ul className="list-disc pl-6 space-y-2">
											<li>
												本ハッカソンは、2-5人でのチーム開発を必須とします。
											</li>
											<li>
												1人での個人参加や即席チームの募集はありません！
												あらかじめチームを組んで参加ください。
											</li>
										</ul>
										<p className="text-sm mt-2">
											※申し込み人数が予定数に達した場合、申し込み締切日より前に受付終了致します。
											<br />
											※本イベントへの参加は、チームメンバー全員のお申し込みが必要です。
										</p>
									</div>

									<div>
										<h3 className="font-semibold text-gray-900 mb-2">■定員</h3>
										<p className="text-black">先着約50名　10チームを想定</p>
									</div>

									<div>
										<h3 className="font-semibold text-gray-900 mb-2">
											■こんな方におススメ
										</h3>
										<ul className="list-disc pl-6 space-y-2">
											<li>
												「技育祭を一緒にもりあげたい！」と思ってくれている方
											</li>
											<li>「ラムダ技術部とハッカソンしたい」と思っている方</li>
											<li>
												「ちょっとエンタメ要素のあるハッカソンに参加したかったんや！」と思っている方
											</li>
										</ul>
									</div>

									<div>
										<h3 className="font-semibold text-gray-900 mb-2">
											■当日のタイムスケジュール
										</h3>
										<ul className="space-y-1">
											<li>11:00-12:00：開会式</li>
											<li>12:00-15:00：最終開発期間</li>
											<li>15:00-16:00：資料作成、プレゼン練習</li>
											<li>
												16:00-18:00：成果発表・結果発表（優秀者は当日使用についての案内があります）
											</li>
											<li>18:00-18:30：エンディング</li>
										</ul>
										<p className="text-sm mt-2">
											※進行状況によりタイムスケジュールは前後する可能性がございます。
										</p>
									</div>

									<div>
										<h3 className="font-semibold text-gray-900 mb-2">
											■テーマについて
										</h3>
										<p className="text-black">
											普段はテーマ自由の技育CAMPハッカソンですが、今回は技育祭特別企画！
											<br />
											テーマありのハッカソンを展開します！
											<br />
											<strong>
												テーマは『かき氷注文システムのUIを最凶にせよ！』
											</strong>
										</p>
									</div>

									<div>
										<h3 className="font-semibold text-gray-900 mb-2">
											■制作物について
										</h3>
										<p className="text-black">
											「プログラミングを用いて制作したもの」が制作物の条件となります。
										</p>
									</div>

									<div className="mt-8">
										<h3 className="font-semibold mb-3">
											サポーターズからの注意点
										</h3>
										<ul className="list-disc pl-6 space-y-2">
											<li>
												本イベントは予告なく、内容の変更、中止になる可能性があります。
											</li>
											<li>
												キックオフで最終的な参加エントリーを行います。参加できない場合はハッカソンへの参加はできません。
											</li>
											<li>
												ハッカソン当日は途中で参加・退出はできません、あらかじめ予定を調整してご参加ください。
											</li>
											<li>
												申し込み人数が予定数に達した場合、申し込み締切日より前に受付終了致します
											</li>
											<li>本イベントは支援金の支給はありません。</li>
										</ul>
									</div>
								</div>
							</div>
							<div className="order-1 md:order-2">
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
											role="img"
										>
											<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
										</svg>
										<span className="text-sm font-medium">
											このイベントに関する問い合わせ
										</span>
									</button>
								</div>
								<div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
									{isLoading ? (
										<div className="p-8 text-center">
											<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
											<p className="mt-3 text-sm text-gray-600">
												メニューを読み込み中...
											</p>
										</div>
									) : scheduleItems.length > 0 ? (
										scheduleItems.map((item) => (
											<div
												key={item.id}
												className="p-4 flex items-center justify-between"
											>
												<div className="flex items-center gap-6">
													<div>
														<p className="text-sm font-medium text-gray-900">
															{item.name}
														</p>
														<p className="text-xs text-gray-500">
															{item.description}
														</p>
													</div>
												</div>
												<button
													type="button"
													onClick={() => handleMenuSelect(item)}
													className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
												>
													申込へ
												</button>
											</div>
										))
									) : (
										<div className="p-8 text-center text-sm text-gray-500">
											メニューがありません
										</div>
									)}
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
