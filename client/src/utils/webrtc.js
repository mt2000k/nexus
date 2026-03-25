const FALLBACK_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const getIceServers = () => {
  const servers = [...FALLBACK_ICE_SERVERS];
  
  const turnUrl = import.meta.env.VITE_TURN_SERVER_URL;
  const turnUser = import.meta.env.VITE_TURN_SERVER_USERNAME;
  const turnPass = import.meta.env.VITE_TURN_SERVER_PASSWORD;

  if (turnUrl && turnUser && turnPass) {
    console.log('Using configured TURN server:', turnUrl);
    servers.push({
      urls: turnUrl,
      username: turnUser,
      credential: turnPass,
    });
  } else {
    console.warn('No TURN server configured. Cross-network calls may fail.');
  }

  return { iceServers: servers };
};

export function createPeerConnection(onIceCandidate, onTrack) {
  const pc = new RTCPeerConnection(getIceServers());

  pc.onicecandidate = (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    if (onTrack) {
      onTrack(event.streams[0]);
    }
  };

  return pc;
}

export async function getLocalStream(video = true, audio = true) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
    return stream;
  } catch (err) {
    console.error('Error getting local media:', err);
    return null;
  }
}

export async function createOffer(pc) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(pc) {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function setRemoteDescription(pc, sdp) {
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
}

export async function addIceCandidate(pc, candidate) {
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.error('Error adding ICE candidate:', err);
  }
}

export function stopStream(stream) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}
