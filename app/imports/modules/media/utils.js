export const hasVideo = mediaStream => mediaStream.getVideoTracks().length > 0;
export const hasAudio = mediaStream => mediaStream.getAudioTracks().length > 0;

export const isVideoMuted = mediaStream =>
  mediaStream.getVideoTracks()
    .every(track => track.muted);

export const isAudioMuted = mediaStream =>
  mediaStream.getAudioTracks()
    .every(track => track.muted);

export const destroyMediaStream = (mediaStream) => {
  mediaStream.getAudioTracks().forEach(track => track.stop());
  mediaStream.getVideoTracks().forEach(track => track.stop());
};

export default {
  hasVideo,
  hasAudio,
  isVideoMuted,
  isAudioMuted,
  destroyMediaStream,
};
