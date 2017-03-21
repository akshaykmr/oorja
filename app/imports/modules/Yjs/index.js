import Y from 'yjs';

// types
import yArray from 'y-array';
import yMemory from 'y-memory';
import yMap from 'y-map';
import yText from 'y-text';
import yRichtext from 'y-richtext';
import yIndexDB from 'y-indexeddb';

import LicodeConnector from './LicodeConnector';

Y.extend(yArray, yMemory, yMap, yText, yRichtext, yIndexDB);
Y.extend('licodeConnector', LicodeConnector);

export default Y;

