
export const extractInitialsFromName = (fullName) => {
  const words = fullName.toUpperCase().trim().split(' ');
  let initials = '';
  if (words.length > 1) {
    initials = words[0][0] + words[words.length - 1][0];
  } else if (words.length === 1 && words[0] !== '') {
    initials = `${words[0][0]}${words[0][1] ? words[0][1] : ''}`;
  }
  return initials;
};

export default {
  extractInitialsFromName,
};
