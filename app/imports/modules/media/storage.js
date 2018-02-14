import Storage from 'imports/modules/Storage';

export const MEDIA_SETTINGS_PREFIX = 'MEDIA_SETTINGS_PREFIX';

export class MediaPreferences extends Storage {
  constructor() {
    super(MEDIA_SETTINGS_PREFIX);
  }
}

export default new MediaPreferences();
