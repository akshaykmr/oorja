import { MEDIASTREAMS_RESET, MEDIASTREAMS_UPDATE } from 'imports/ui/actions/mediaStreams';
import { SPEAKING, SPEAKING_STOPPED } from 'imports/ui/actions/stream';

const mapDispatchToProps = dispatch => ({
  updateMediaStreams: (changes) => {
    dispatch({
      type: MEDIASTREAMS_UPDATE,
      payload: {
        changes,
      },
    });
  },
  resetMediaStreams: () => {
    dispatch({
      type: MEDIASTREAMS_RESET,
    });
  },
  streamSpeaking: (streamId) => {
    dispatch({
      type: SPEAKING,
      payload: {
        streamId,
      },
    });
  },
  streamSpeakingStopped: (streamId) => {
    dispatch({
      type: SPEAKING_STOPPED,
      payload: {
        streamId,
      },
    });
  },
});

export default mapDispatchToProps;
