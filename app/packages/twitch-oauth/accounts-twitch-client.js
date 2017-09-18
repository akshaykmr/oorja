function union_arrays (x, y) {
    var obj = {};
    for (var i = x.length-1; i >= 0; -- i)
       obj[x[i]] = x[i];
    for (var i = y.length-1; i >= 0; -- i)
       obj[y[i]] = y[i];
    var res = []
    for (var k in obj) {
      if (obj.hasOwnProperty(k))  // <-- optional
        res.push(obj[k]);
    }
    return res;
  }

TwitchAccounts = {};

TwitchAccounts.requestCredential = function (options, credentialRequestCompleteCallback) {
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
        credentialRequestCompleteCallback = options;
        options = {};
    } else if (!options) {
        options = {};
    }

    var config = ServiceConfiguration.configurations.findOne({service: 'twitch'});
    if (!config) {
        credentialRequestCompleteCallback && credentialRequestCompleteCallback(
            new ServiceConfiguration.ConfigError());
        return;
    }

    var credentialToken = Random.secret();
    var loginStyle = OAuth._loginStyle('twitch', config, options);
    var requiredScope = ['user_read'];
    var scope = (options && options.requestPermissions) || ['user_read', 'channel_read'];
    scope = union_arrays(scope, requiredScope);
    var flatScope = scope.map(encodeURIComponent).join('+');

    var loginUrl =
        "https://api.twitch.tv/kraken/oauth2/authorize" +
        "?response_type=code" +
        "&client_id=" + config.clientId +
        "&redirect_uri=" + OAuth._redirectUri('twitch', config) +
        "&scope=" + flatScope +
        '&state=' + OAuth._stateParam(loginStyle, credentialToken);

    OAuth.launchLogin({
        loginService: "twitch"
        , loginStyle: loginStyle
        , loginUrl: loginUrl
        , credentialRequestCompleteCallback: credentialRequestCompleteCallback
        , credentialToken: credentialToken
    });
};