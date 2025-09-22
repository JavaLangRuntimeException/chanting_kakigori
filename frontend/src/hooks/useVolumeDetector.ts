"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVolumeDetectorOptions {
	onVolumeChange?: (volume: number) => void;
	updateInterval?: number;
}

export const useVolumeDetector = ({
	onVolumeChange,
	updateInterval = 100,
}: UseVolumeDetectorOptions = {}) => {
	const [volume, setVolume] = useState(0);
	const [isDetecting, setIsDetecting] = useState(false);
	const [isSupported, setIsSupported] = useState(true);

	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationRef = useRef<number | null>(null);
	const lastUpdateRef = useRef<number>(0);

	const detectVolume = useCallback(() => {
		if (!analyserRef.current) {
			return;
		}

		const bufferLength = analyserRef.current.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyserRef.current.getByteFrequencyData(dataArray);

		const sum = dataArray.reduce((a, b) => a + b, 0);
		const average = sum / bufferLength;
		const normalizedVolume = Math.min(average / 128, 1);

		const now = Date.now();
		if (now - lastUpdateRef.current >= updateInterval) {
			setVolume(normalizedVolume);
			onVolumeChange?.(normalizedVolume);
			lastUpdateRef.current = now;
		}

		if (isDetecting) {
			animationRef.current = requestAnimationFrame(detectVolume);
		}
	}, [isDetecting, onVolumeChange, updateInterval]);

	const startDetecting = useCallback(async () => {
		if (!navigator.mediaDevices?.getUserMedia) {
			setIsSupported(false);
			console.error("getUserMedia is not supported");
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;

			const audioContext = new (
				window.AudioContext || (window as any).webkitAudioContext
			)();
			audioContextRef.current = audioContext;

			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyserRef.current = analyser;

			const microphone = audioContext.createMediaStreamSource(stream);
			microphone.connect(analyser);
			microphoneRef.current = microphone;

			setIsDetecting(true);
		} catch (error) {
			console.error("Failed to access microphone:", error);
			setIsSupported(false);
		}
	}, []);

	const stopDetecting = useCallback(() => {
		setIsDetecting(false);

		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
			animationRef.current = null;
		}

		if (streamRef.current) {
			streamRef.current.getTracks().map((track) => track.stop());
			streamRef.current = null;
		}

		if (microphoneRef.current) {
			microphoneRef.current.disconnect();
			microphoneRef.current = null;
		}

		if (audioContextRef.current) {
			audioContextRef.current.close();
			audioContextRef.current = null;
		}

		setVolume(0);
	}, []);

	useEffect(() => {
		if (isDetecting) {
			detectVolume();
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isDetecting, detectVolume]);

	useEffect(() => {
		return () => {
			stopDetecting();
		};
	}, [stopDetecting]);

	return {
		volume,
		isDetecting,
		isSupported,
		startDetecting,
		stopDetecting,
	};
};
