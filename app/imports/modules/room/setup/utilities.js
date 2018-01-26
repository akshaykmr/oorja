export const checkIfValidRoomName = (candidateRoomName) => {
  const namePattern = /^[@a-z0-9_-]+$/;
  return namePattern.test(candidateRoomName);
};

// Make minor adjustments to the roomName
export const touchUpRoomName = roomName =>
  roomName.trim()
    .split('')
    .map((char) => {
      if (char === ' ') return '-';
      return char;
    })
    .join('');

export default {
  checkIfValidRoomName,
  touchUpRoomName,
};

