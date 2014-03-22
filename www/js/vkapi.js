(function() {
    'use strict';
    var FRIENDS_FIELDS = "photo_50,photo_100,photo_200,sex,bdate,city",
        OWNER_FRIENDS_PARAMS = {
            "order" : "hints",
            "name_case" : "nom",
            "fields" : FRIENDS_FIELDS
        };
    var VKApi = {
        "getFriends" : function(userId, callback) {
            if(typeof(userId)=='function') {
                VK.api('friends.get', OWNER_FRIENDS_PARAMS, userId);
            } else {
                VK.api('friends.get', {"user_id" : userId}, callback);
            }
        },
        "getProfilePhotos" : function(userId, callback) {
            VK.api('photos.getProfile', {"owner_id" : userId}, callback);
        },
        "getSelfInfo" : function(callback) {
            VK.api('user.get', {"fields":FRIENDS_FIELDS}, callback);
        }
        
    };
    window.VKApi = VKApi;
})();