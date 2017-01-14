import BowserStack from './webrtc-stacks/BowserStack';
import ChromeCanaryStack from './webrtc-stacks/ChromeCanaryStack';
import ChromeRoadStack from './webrtc-stacks/ChromeRoadStack';
import ChromeStableStack from './webrtc-stacks/ChromeStableStack';
import FcStack from './webrtc-stacks/FcStack';
import FirefoxStack from './webrtc-stacks/FirefoxStack';

import { sessionId, Connection, getBrowser, GetUserMedia } from './Connection';
import { EventDispatcher, LicodeEvent, RoomEvent, StreamEvent, PublisherEvent } from './Events';
import Room from './Room';
import Stream from './Stream';

import View from './views/View';
import AudioPlayer from './views/AudioPlayer';
import Bar from './views/Bar';
import Speaker from './views/Speaker';
import VideoPlayer from './views/VideoPlayer';

const Erizo = {
  BowserStack,
  ChromeCanaryStack,
  ChromeRoadStack,
  ChromeStableStack,
  FcStack,
  FirefoxStack,

  sessionId,
  Connection,
  getBrowser,
  GetUserMedia,

  EventDispatcher,
  LicodeEvent,
  RoomEvent,
  StreamEvent,
  PublisherEvent,

  Room,
  Stream,

  View,
  AudioPlayer,
  Bar,
  Speaker,
  VideoPlayer,
};

export default Erizo;
