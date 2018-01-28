import { Meteor } from 'meteor/meteor';
import nuveClient from 'imports/modules/NuveClient';

const { private: { Nuve } } = Meteor.settings;

export class Licode {
  constructor(N = nuveClient, nuveConfig = Nuve) {
    this.roomProvider = 'LICODE';
    this.N = N;
    this.N.API.init(nuveConfig.serviceId, nuveConfig.serviceKey, nuveConfig.host);
  }

  createRoom(roomId, options) {
    const nuveResponse = this.N.API.createRoom(roomId, options);
    const providerMetadata = {
      providerName: this.roomProvider,
      roomIdentifier: nuveResponse.data._id,
      NuveServiceName: Nuve.serviceName,
    };
    return providerMetadata;
  }

  createToken(providerMetadata, userId, role = 'presenter') {
    return this.N.API.createToken(providerMetadata.roomIdentifier, userId, role).content;
  }
}

export default new Licode();

