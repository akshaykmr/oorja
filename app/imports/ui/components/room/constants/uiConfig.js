// avoid magic strings

export default {
  COMPACT: 'COMPACT',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',

  streamContainerHeight: { // in percentage
    COMPACT: 0, // fixed height of 60px, only show avatar
    MEDIUM: '17%', // min height 100px
    LARGE: '20%', // min height 130px    | do not use this, need to fix CSS
  },
  // play with these settings when there is actually something rendering on the screen :D
  defaultBreakWidth: 660, // px
  defaultBreakRatio: 8 / 7,
};

