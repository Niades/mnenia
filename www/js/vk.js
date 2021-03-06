(function() {
	'use strict';
	var OAUTH_URI = 'https://oauth.vk.com/authorize?client_id={{0}}&scope={{1}}&redirect_uri={{2}}&display={{3}}&v={{4}}&response_type=token',
		API_URI = 'https://api.vk.com/method/{{0}}?{{1}}access_token={{2}}&callback={{3}}',
		STANDALONE_REDIRECT_URI = 'https://oauth.vk.com/blank.html',
		API_VERSION = '5.8';
	
	var accessToken = 'b06246d467b3b1ab3e0cabbf562a356734841b5bf2d292fc6f51ffb3faea9f49dc2e49f0f963c76d9f019',
		userId = '184868738';
	
	function l(m) {
		_l('vk.js', m);
	}
	
	var VK = {
			auth : function(appId, scope, display, redirectUri, apiVersion, callback) {
				redirectUri = dv(redirectUri, STANDALONE_REDIRECT_URI);
				apiVersion = dv(apiVersion, API_VERSION);
				if(typeof(callback)=='undefined') {
					callback = ffn(arguments);
				}
				var uri = sformat(OAUTH_URI, [appId, scope, redirectUri, display, apiVersion]);
				l('auth uri: ' + uri);
				function onLoadStart(e) {
					l('page loading ' + e.url);
					if (RegExp(redirectUri).test(e.url)) {
						var groups = /access_token=([a-z0-9]+)/.exec(e.url);
						if(groups != null) {
							accessToken = groups[1];
							l('got token ' + accessToken);
							w.removeEventListener('loadstart', onLoadStart);
							w.close();
							if(callback) {
								callback(true);
							}
						}
					}
				}
				var w = window.open(uri, '_blank', 'location=no');
				w.addEventListener('loadstart', onLoadStart);
			},
			api : function(method, args, callback) {
				var _args = '', 
					explicitApiVersion = ((typeof(args)!='undefined')&&(typeof(args['v'])!='undefined'));
				for(var i in args) {
					if(typeof(args[i])!='function') {
						_args += sformat('{{0}}={{1}}&', [i, args[i]]);
					}
				}
				if(!explicitApiVersion) {
					_args += sformat('v={{0}}&', API_VERSION);
				}
				//Fix this like a man 
				var callbackName = 'jsonp' + Date.now();
				while(typeof(window[callbackName])!='undefined'){callbackName = 'jsonp' + Math.floor(Date.now() + Math.random() * 100)};
				window[callbackName] = callback;
				var requestUri = sformat(API_URI, [method, _args, accessToken, callbackName]);
				var script = document.createElement('script');
				l('request uri: ' + requestUri);
				script.src = requestUri;
				document.getElementsByTagName('head')[0].appendChild(script);
			},
			getUserId : function() {
				return userId;	
			}
		};
	window.VK = VK;
})();