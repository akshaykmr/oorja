// avoid magic strings

export default {
  COMPACT: 'COMPACT',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',

  streamContainerHeight: { // in percentage
    COMPACT: 0, // fixed height of 60px, only show avatar
    MEDIUM: '10%', // min height 80px
    LARGE: '18%', // min height 130px
  },
  // play with these settings when there is actually something rendering on the screen :D
  defaultBreakWidth: 660, // px
  defaultBreakRatio: 8 / 7,
};

