import { useState, useRef, useEffect } from 'react';
import { FiMic, FiSquare, FiSend, FiX } from 'react-icons/fi';

export default function VoiceRecorder({ onSend, onCancel }) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mimeType });
        setBlob(b);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSend = () => {
    if (blob) onSend(blob, duration);
    cleanup();
  };

  const cleanup = () => {
    setBlob(null);
    setDuration(0);
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCancel = () => {
    if (recording) mediaRecorderRef.current?.stop();
    cleanup();
    onCancel?.();
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="voice-recorder">
      {!recording && !blob && (
        <button className="voice-record-btn" onClick={startRecording} title="Start recording">
          <FiMic />
        </button>
      )}
      {recording && (
        <div className="voice-recording-active">
          <div className="recording-pulse" />
          <span className="recording-time">{formatTime(duration)}</span>
          <button className="voice-stop-btn" onClick={stopRecording} title="Stop">
            <FiSquare />
          </button>
        </div>
      )}
      {blob && !recording && (
        <div className="voice-preview">
          <audio src={URL.createObjectURL(blob)} controls style={{ height: 32, flex: 1 }} />
          <button className="voice-send-btn" onClick={handleSend} title="Send">
            <FiSend />
          </button>
          <button className="voice-cancel-btn" onClick={handleCancel} title="Cancel">
            <FiX />
          </button>
        </div>
      )}
    </div>
  );
}
