import Storage from 'imports/modules/Storage';

export const MEDIA_SETTINGS_PREFIX = 'MEDIA_SETTINGS_PREFIX';

export const storeKeys = {
  WEBCAM_SETTING: 'WEBCAM_SETTING',
  VIDEO_RESOLUTION: 'VIDEO_RESOLUTION',
  VOICE_MUTE: 'VOICE_MUTE',
  VIDEO_MUTE: 'VIDEO_MUTE',
  VOICE_SOURCE: 'VOICE_SOURCE',
  VIDEO_SOURCE: 'VIDEO_SOURCE',
};


class MediaPreferences extends Storage {
  constructor() {
    super(MEDIA_SETTINGS_PREFIX);
  }

  getVideoResolution() {
    return this.getKey(storeKeys.VIDEO_RESOLUTION);
  }

  saveVideoResolution(videoResolution) {
    this.setKey(storeKeys.VIDEO_RESOLUTION, videoResolution);
    return this;
  }

  isVoiceMute() {
    return this.getKey(storeKeys.VOICE_MUTE) || false;
  }

  isVideoMute() {
    return this.getKey(storeKeys.VIDEO_MUTE) || false;
  }

  enableVoice(bool) {
    this.setKey(storeKeys.VOICE_MUTE, !bool);
    return this;
  }

  enableVideo(bool) {
    this.setKey(storeKeys.VIDEO_MUTE, !bool);
    return this;
  }

  getVoiceSource() {
    return this.getKey(storeKeys.VOICE_SOURCE);
  }

  setVoiceSource(deviceName) {
    this.setKey(storeKeys.VOICE_SOURCE, deviceName);
    return this;
  }

  getVideoSource() {
    return this.getKey(storeKeys.VIDEO_SOURCE);
  }

  setVideoSource(deviceName) {
    this.setKey(storeKeys.VIDEO_SOURCE, deviceName);
    return this;
  }
}

export const mediaPreferences = new MediaPreferences();

export default mediaPreferences;
