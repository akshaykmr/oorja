if (!isTwitchRegistered) Accounts.oauth.registerService('twitch');
isTwitchRegistered = true;

if (Meteor.isClient) {
    Meteor.loginWithTwitch = function(options, callback) {
        // support a callback without options
        if (! callback && typeof options === "function") {
            callback = options;
            options = null;
        }

        var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
        TwitchAccounts.requestCredential(options, credentialRequestCompleteCallback);
    };
} else {
    Accounts.addAutopublishFields({
        forLoggedInUser: ['services.twitch'],
        forOtherUsers: [
            'services.twitch.display_name',
            'services.twitch.name',
            'services.twitch.logo'
        ]
    });
}