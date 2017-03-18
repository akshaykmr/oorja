import AbstractConnector from './AbstractConnector';

class LicodeConnector extends AbstractConnector {
  constructor(yConfig, connectorOptions) {
    console.log(yConfig, connectorOptions);
    super(yConfig, connectorOptions);
    
  }
  disconnect() {
    super.disconnect();
  }
  reconnect() {
    super.reconnect();
  }
  send(uid, message) {

  }
  broadcast(message) {

  }
  isDisconnected() {
    return false;
  }
}

export default LicodeConnector;
