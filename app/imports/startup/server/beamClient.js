import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

const { private: { privateAPISecret }, public: { beamConfig } } = Meteor.settings;
const BEAM_ORIGIN = `${beamConfig.httpProtocolPrefix}${beamConfig.host}`;

const beamClient = {
  pushRoomEvent(roomId, { event = 'new_msg', payload = {} }) {
    HTTP.post(
      `${BEAM_ORIGIN}/api/v1/push_room_event`,
      {
        headers: {
          secret: privateAPISecret,
        },
        timeout: 3000,
        data: {
          room_id: roomId,
          event,
          payload,
        },
      },
    );
  },
};

export default beamClient;
