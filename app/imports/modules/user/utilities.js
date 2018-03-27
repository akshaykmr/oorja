
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

const avatarColors = ['#c78ae1', '#f4d448', '#e6cb71', '#66aee3', '#7bcd52',
  '#e5176f', '#d784a6', '#a693e9', '#f078ae', '#457fd1', '#8a4ebf'];

export const getRandomAvatarColor = () =>
  avatarColors[Math.floor(Math.random() * avatarColors.length)];
