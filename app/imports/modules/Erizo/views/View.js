/* eslint-disable */
/*
 * View class represents a HTML component
 * Every view is an EventDispatcher.
 */

export default View = function () {
    var that = Erizo.EventDispatcher({});

    // Variables

    // URL where it will look for icons and assets
    that.url = '';
    return that;
};

/* eslint-enable */
