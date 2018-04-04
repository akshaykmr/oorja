import { mediaPreferences } from './storage';
import videoResolution from './videoResolution';

export const hasVideo = mediaStream => mediaStream.getVideoTracks().length > 0;
export const hasAudio = mediaStream => mediaStream.getAudioTracks().length > 0;

export const isVideoMuted = mediaStream =>
  mediaStream.getVideoTracks()
    .every(track => !track.enabled);

export const isAudioMuted = mediaStream =>
  mediaStream.getAudioTracks()
    .every(track => !track.enabled);

/* eslint-disable no-param-reassign */
export const muteAudioTracks = mediaStream =>
  mediaStream
    .getAudioTracks()
    .forEach((track) => { track.enabled = false; });

export const unmuteAudioTracks = mediaStream =>
  mediaStream
    .getAudioTracks()
    .forEach((track) => { track.enabled = true; });

export const muteVideoTracks = mediaStream =>
  mediaStream
    .getVideoTracks()
    .forEach((track) => { track.enabled = false; });

export const unmuteVideoTracks = mediaStream =>
  mediaStream
    .getVideoTracks()
    .forEach((track) => { track.enabled = true; });
/* eslint-enable no-param-reassign */

export const destroyMediaStream = (mediaStream) => {
  mediaStream.getTracks().forEach(track => track.stop());
};

export const getSavedConstraints = () => {
  const resolution = mediaPreferences.getVideoResolution() || videoResolution.setting.VGA;
  const audioDeviceId = mediaPreferences.getVoiceSource();
  const videoDeviceId = mediaPreferences.getVideoSource();
  const audioConstraints = {
    audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : undefined,
  };
  const videoConstraints = {
    video: Object.assign(
      { deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined },
      videoResolution.constraints[resolution],
    ),
  };
  return Object.assign(audioConstraints, videoConstraints);
};
