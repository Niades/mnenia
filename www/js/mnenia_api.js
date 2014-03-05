(function() {
	'use strict';
	var API_URI = 'https://odin-dva.ru/mnenia/?{{0}}callback={{1}}';
	
	var sid = '';
	
	function l(m) {
		_l('mnenia_api.js', m);
	}
	
	var ServerApi = {
			auth : function(userId, callback) {
				self.api('init', {'user_id':userId}, function(data) {
					sid = data['response']['sid'];
					l('auth successful, sid = ' + sid);
					if(typeof(callback)!='undefined') {
						callback();
					}
				});
			},
			api : function(act, args, callback) {
				var _args = '';
				args['act'] = act;
				if(sid!='') {
					args['sid'] = sid;
				}
				for(var i in args) {
					if(typeof(args[i])!='function') {
						_args += sformat('{{0}}={{1}}&', [i, args[i]]);
					}
				}
				//Fix this like a man 
				var callbackName = 'jsonp' + Date.now();
				while(typeof(window[callbackName])!='undefined'){callbackName = 'jsonp' + Math.floor(Date.now() + Math.random() * 100)};
				window[callbackName] = callback;
				var requestUri = sformat(API_URI, _args, callbackName);
				var script = document.createElement('script');
				l('request uri: ' + requestUri);
				script.src = requestUri;
				document.getElementsByTagName('head')[0].appendChild(script);
			},
			setToken : function(token) {
				accessToken = token;
			}
		};
	var self = ServerApi;
	window.ServerApi = ServerApi;
})();