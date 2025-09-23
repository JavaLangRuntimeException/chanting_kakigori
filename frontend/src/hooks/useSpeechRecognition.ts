"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
	onResult?: (transcript: string) => void;
	onError?: (error: Event) => void;
	continuous?: boolean;
	interimResults?: boolean;
	lang?: string;
}

interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
	resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
	error: string;
}

declare global {
	interface Window {
		SpeechRecognition: any;
		webkitSpeechRecognition: any;
	}

	var SpeechRecognition: any;
	var webkitSpeechRecognition: any;
}

export const useSpeechRecognition = ({
	onResult,
	onError,
	continuous = true,
	interimResults = true,
	lang = "ja-JP",
}: UseSpeechRecognitionOptions = {}) => {
	const [isListening, setIsListening] = useState(false);
	const [transcript, setTranscript] = useState("");
	const [isSupported, setIsSupported] = useState(true);
	const recognitionRef = useRef<any>(null);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const SpeechRecognitionAPI =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		console.log("SpeechRecognitionAPI:", SpeechRecognitionAPI);

		if (!SpeechRecognitionAPI) {
			setIsSupported(false);
			return;
		}

		const recognition = new SpeechRecognitionAPI();
		recognition.continuous = continuous;
		recognition.interimResults = interimResults;
		recognition.lang = lang;

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			let finalTranscript = "";
			let interimTranscript = "";

			for (let i = event.resultIndex; i < event.results.length; i++) {
				const result = event.results[i];
				if (result.isFinal) {
					finalTranscript += result[0].transcript;
				} else {
					interimTranscript += result[0].transcript;
				}
			}

			const currentTranscript = finalTranscript || interimTranscript;
			setTranscript(currentTranscript);
			onResult?.(currentTranscript);
		};

		recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			console.error("Speech recognition error:", event.error);
			setIsListening(false);
			onError?.(event);
		};

		recognition.onend = () => {
			setIsListening(false);
		};

		recognitionRef.current = recognition;

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		};
	}, [continuous, interimResults, lang, onResult, onError]);

	const startListening = useCallback(() => {
		if (!recognitionRef.current || !isSupported) {
			console.warn("Speech recognition is not supported");
			return;
		}

		try {
			recognitionRef.current.start();
			setIsListening(true);
		} catch (error) {
			console.error("Failed to start speech recognition:", error);
		}
	}, [isSupported]);

	const stopListening = useCallback(() => {
		if (!recognitionRef.current) {
			return;
		}

		try {
			recognitionRef.current.stop();
			setIsListening(false);
		} catch (error) {
			console.error("Failed to stop speech recognition:", error);
		}
	}, []);

	const resetTranscript = useCallback(() => {
		setTranscript("");
	}, []);

	return {
		isListening,
		transcript,
		isSupported,
		startListening,
		stopListening,
		resetTranscript,
	};
};
