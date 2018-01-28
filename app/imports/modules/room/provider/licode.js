import { Meteor } from 'meteor/meteor';
import nuveClient from 'imports/modules/NuveClient';

const { private: { Nuve } } = Meteor.settings;

export class Licode {
  constructor(N = nuveClient, nuveConfig = Nuve) {
    this.roomProvider = 'LICODE';
    this.N = N;
    this.N.API.init(nuveConfig.serviceId, nuveConfig.serviceKey, nuveConfig.host);
  }

  createRoom(roomName, options) {
    const nuveResponse = this.N.API.createRoom(roomName, options);
    const roomProviderMetadata = {
      providerName: this.roomProvider,
      roomIdentifier: nuveResponse.data._id,
      NuveServiceName: Nuve.serviceName,
    };
    return roomProviderMetadata;
  }
}

export default new Licode();

