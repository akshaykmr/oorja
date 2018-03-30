const setting = {
  QVGA: 'QVGA',
  VGA: 'VGA',
  HD: 'HD',
  FULL_HD: 'FULL_HD',
  UHD: 'UHD',
};

// value (name) is used for user facing elements such as selects.
// Also used for storing mediaQuality setting in localstorage.
// I dont want to store full constraints and thats why these objects are not nested.
const name = {
  QVGA: '240p',
  VGA: '480p',
  HD: 'HD',
  FULL_HD: 'Full HD',
  UHD: 'UHD',
};


const constraints = {
  QVGA: {
    video: { width: { exact: 320 }, height: { exact: 240 } },
  },
  VGA: {
    video: { width: { exact: 640 }, height: { exact: 480 } },
  },
  HD: {
    video: { width: { exact: 1280 }, height: { exact: 720 } },
  },
  FULL_HD: {
    video: { width: { exact: 1920 }, height: { exact: 1080 } },
  },
  UHD: {
    video: { width: { exact: 4096 }, height: { exact: 2160 } },
  },
};

export default {
  setting,
  name,
  constraints,
};
