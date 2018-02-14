import { RoomStorage } from 'imports/modules/room/storage';

export const unexpectedError = ({ roomId, error }) => {
  console.error(error);
  if (roomId) {
    new RoomStorage(roomId).clear();
  }
};

export default { unexpectedError };

