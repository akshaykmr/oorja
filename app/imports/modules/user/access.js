import tokenHandler from 'imports/modules/tokenHandler';

const userAccess = {
  createToken(userId) {
    return tokenHandler.issue({ userId });
  },
  getUserId(token) {
    return tokenHandler.decode(token).userId;
  },
};

export default userAccess;
