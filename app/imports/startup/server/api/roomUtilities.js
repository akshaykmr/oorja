export const checkIfValidRoomName = (candidateRoomName) => {
  const namePattern = /^[@a-z0-9_-]+$/;
  return namePattern.test(candidateRoomName);
};

export const blah = false;
