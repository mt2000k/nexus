import { useEffect, useRef, useState } from 'react';
import { createPeerConnection, getLocalStream, createOffer, createAnswer, setRemoteDescription, addIceCandidate, stopStream } from '../utils/webrtc';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiAirplay } from 'react-icons/fi';

export default function VideoCall({ socket, user, targetUserId, targetUserName, isCaller, mode = 'video', onEnd }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [callStatus, setCallStatus] = useState(isCaller ? 'Calling...' : 'Connecting...');
  const iceCandidatesQueue = useRef([]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      console.log('Initializing call...', { isCaller, mode, targetUserId });
      const stream = await getLocalStream(mode === 'video', true);
      if (!stream) {
        console.error('Failed to get local stream');
        if (mounted) {
          setMicOn(false);
          setCamOn(false);
          setCallStatus('Media permission denied');
        }
        return;
      }
      if (!mounted) return;
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(
        (candidate) => {
          console.log('Generated ICE candidate', candidate.candidate.substring(0, 30) + '...');
          socket?.emit('ice_candidate', { targetUserId, candidate });
        },
        (remoteStream) => {
          console.log('Received remote stream');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setCallStatus('Connected');
        }
      );
      pcRef.current = pc;

      stream.getTracks().forEach((track) => {
        console.log('Adding track:', track.kind);
        pc.addTrack(track, stream);
      });

      if (isCaller) {
        console.log('Creating offer...');
        const offer = await createOffer(pc);
        socket?.emit('offer', { targetUserId, sdp: offer });
      }
    }

    init();

    const handleOffer = async (data) => {
      if (!pcRef.current) return;
      if (pcRef.current.signalingState !== 'stable') {
        console.warn('Received offer but signaling state is:', pcRef.current.signalingState);
        return;
      }
      console.log('Received offer');
      try {
        await setRemoteDescription(pcRef.current, data.sdp);
        const answer = await createAnswer(pcRef.current);
        console.log('Sending answer');
        socket?.emit('answer', { targetUserId: data.callerId, sdp: answer });
        processQueuedCandidates();
      } catch (err) {
        console.error('Failed to handle offer:', err);
      }
    };

    const handleAnswer = async (data) => {
      if (!pcRef.current) return;
      if (pcRef.current.signalingState !== 'have-local-offer') {
        console.warn('Received answer but signaling state is:', pcRef.current.signalingState);
        return;
      }
      console.log('Received answer');
      try {
        await setRemoteDescription(pcRef.current, data.sdp);
        setCallStatus('Connected');
        processQueuedCandidates();
      } catch (err) {
        console.error('Failed to set remote answer:', err);
      }
    };

    const handleICE = (data) => {
      if (!pcRef.current) return;
      if (pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
        addIceCandidate(pcRef.current, data.candidate);
      } else {
        console.log('Queueing ICE candidate');
        iceCandidatesQueue.current.push(data.candidate);
      }
    };

    const processQueuedCandidates = () => {
      if (!pcRef.current) return;
      console.log(`Processing ${iceCandidatesQueue.current.length} queued candidates`);
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        addIceCandidate(pcRef.current, candidate);
      }
    };

    const handleEnded = () => {
      cleanup();
      onEnd();
    };

    socket?.on('offer', handleOffer);
    socket?.on('answer', handleAnswer);
    socket?.on('ice_candidate', handleICE);
    socket?.on('call_ended', handleEnded);

    return () => {
      mounted = false;
      socket?.off('offer', handleOffer);
      socket?.off('answer', handleAnswer);
      socket?.off('ice_candidate', handleICE);
      socket?.off('call_ended', handleEnded);
      cleanup();
    };
  }, []);

  const cleanup = () => {
    console.log('Cleaning up call resources');
    stopStream(localStreamRef.current);
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    iceCandidatesQueue.current = [];
  };

  const toggleMic = async () => {
    let stream = localStreamRef.current;
    if (!stream) {
      alert("Microphone not found or permission denied. Please allow permissions in your browser.");
      return;
    }
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = async () => {
    let stream = localStreamRef.current;
    if (!stream) {
      alert("Camera not found or permission denied. Please allow permissions in your browser.");
      return;
    }
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (remoteVideoRef.current && mode === 'video') {
        await remoteVideoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP Error:', err);
    }
  };

  const handleEnd = () => {
    cleanup();
    onEnd();
  };

  return (
    <div className="video-call-overlay">
      <div style={{ color: 'white', marginBottom: '16px', fontSize: '0.95rem', opacity: 0.7 }}>
        {callStatus} — {targetUserName || 'Unknown'}
      </div>
      {mode === 'video' ? (
        <div className="video-container">
          <div className="video-wrapper">
            <video ref={localVideoRef} autoPlay playsInline muted className="mirrored" />
            <div className="video-label">{user?.username || 'You'}</div>
          </div>
          <div className="video-wrapper">
            <video ref={remoteVideoRef} autoPlay playsInline className="mirrored" />
            <div className="video-label">{targetUserName || 'Remote'}</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)' }}>
          <div style={{ fontSize: '5rem', marginBottom: '24px', animation: 'pulse 2s infinite' }}>📞</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Voice Call</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Talking to {targetUserName}...</div>
          <audio ref={remoteVideoRef} autoPlay />
        </div>
      )}
      <div className="video-controls">
        <button className={`video-control-btn ${micOn ? 'active' : ''}`} onClick={toggleMic} title={micOn ? 'Mute' : 'Unmute'}>
          {micOn ? <FiMic /> : <FiMicOff />}
        </button>
        {mode === 'video' && (
          <>
            <button className={`video-control-btn ${camOn ? 'active' : ''}`} onClick={toggleCam} title={camOn ? 'Turn off camera' : 'Turn on camera'}>
              {camOn ? <FiVideo /> : <FiVideoOff />}
            </button>
            <button className="video-control-btn" onClick={togglePiP} title="Picture-in-Picture">
              <FiAirplay />
            </button>
          </>
        )}
        <button className="video-control-btn end-call" onClick={handleEnd} title="End call">
          <FiPhoneOff />
        </button>
      </div>
    </div>
  );
}
