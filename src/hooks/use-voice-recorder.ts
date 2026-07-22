"use client";

import * as React from "react";

interface VoiceRecorderResult {
  isRecording: boolean;
  seconds: number;
  start: () => Promise<void>;
  stop: () => Promise<File | null>;
  cancel: () => void;
  error: string | null;
}

/** Minimal MediaRecorder wrapper that produces an audio File on stop. */
export function useVoiceRecorder(): VoiceRecorderResult {
  const [isRecording, setIsRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setIsRecording(false);
    setSeconds(0);
  }, []);

  const start = React.useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied.");
      cleanup();
    }
  }, [cleanup]);

  const stop = React.useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        cleanup();
        resolve(file.size > 0 ? file : null);
      };
      recorder.stop();
    });
  }, [cleanup]);

  const cancel = React.useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.onstop = () => cleanup();
      recorder.stop();
    } else {
      cleanup();
    }
  }, [cleanup]);

  React.useEffect(() => cleanup, [cleanup]);

  return { isRecording, seconds, start, stop, cancel, error };
}
