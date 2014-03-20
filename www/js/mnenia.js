(function(){
	function l(m) {
		_l('mnenia.js', m);
	}

	var PRELOAD = 3;
	
	var people = {},
		queue = [],
		qIndex = 0,
		events = {},
		menuActive = false;
	function emitEvent(eventName, args) {
        var event = events[eventName], i = 0;
		if(typeof(event)!=='undefined') {
			for (; i < event.length; i++) {
				event[i](args);
			}
		}
    }
    function getQuestion(userId, callback) {
    	l('called getQuestion on user ' + userId);
    	ServerApi.api('get_question', {'user_id':userId}, function(data) {
    		l('hello from callback for user ' + userId);
    		var r = data.response;
    		people[userId].question = {'id' : r.id, 'text' : r.text};
			l('User id'+userId + ' has question.text=' + r.text);
			if(typeof(callback)!='undefined') {
				callback(userId);
			}
    	});
    }
	function getLargePhoto(userId, callback) {
		VKApi.getProfilePhotos(userId, function(data) {
			var r = data.response,
				photo_large = '';
			if(typeof(r.count)!='undefined'&&r.count>0) {
				photo = r.items[r.count-1];				
			}
			if(typeof(photo)!='undefined') {
				for(var j in photo) {
					if((typeof(photo[j])!='function')&&(j.indexOf('photo_')!=-1))  {
						photo_large = photo[j];
					}
				}
			}
			people[userId].photo_large = photo_large;
			l('User id'+userId + ' has photo_large=' + photo_large);
			if(typeof(callback)!='undefined') {
				callback(userId);
			}
		});
	}
	function checkPerson(userId, callback) {
		var person = people[userId];
		function _callback() {
			if((typeof(person.photo_large)!='undefined')&&(typeof(person.question)!='undefined')) {
				callback();
			}
		}
		if(typeof(person.photo_large)=='undefined') {
			getLargePhoto(userId, callback);
		} 
		if(typeof(person.question)=='undefined') {
			getQuestion(userId, callback);
		}
		if((typeof(person.photo_large)!='undefined')&&(typeof(person.question)!='undefined')) 
			callback(userId);
	}
	function onQueueForward() {
		var personId = 0,
			person = null;
			to = qIndex + PRELOAD,
			to = to >= queue.length ? queue.length : to;
		l('Queue moved forward');
		l('About to process ' + (to - qIndex) + ' users');
		function _callback(userId) {
			if(queue[qIndex]==userId) {
				emitEvent('mainready', people[userId]);
			}
		}
		for(var i=qIndex; i<to; i++) {
			personId = queue[i];
			l('Current user: ' + personId);
			checkPerson(personId, _callback);
		}
	}
	var App = {
		on: function (eventName, listener) {
            if (typeof(events[eventName]) == 'undefined') {
                events[eventName] = [];
            }
            events[eventName].push(listener);
        },
		initialize : function(userId) {
			ServerApi.auth(userId, function() {
				VKApi.getFriends(function(data) {
					var r = data.response,
						length = r.count,
					    f = null,
					    i = 0;
					for(; i<length; i++) {
						f = r.items[i];
						people[f.id] =  f;
						queue.push(f.id);
					}
					l('Added ' + length +' friends');
					onQueueForward();
				});
			});
		},
//		getCurrentPerson : function() {
//			return
//		},
		next : function() {
			qIndex += 1;
			if(qIndex >= queue.length) {
				qIndex = 0;
			} 
			onQueueForward();
		},
		previous : function() {
			qIndex -=1;
			if(qIndex < 0) {
				qIndex = queue.length - 1;
			}
		},
		submitOpinion : function(text) {
			var person = people[queue[qIndex]];
			ServerApi.api('submit_opinion', {"qid" : person.question.id, "text" : text, "user_id" : person.id }, function() {
				l('opinion submitted.');
			});
		},
		toggleMenu : function() {
			//updateMenu();
			menuActive = !menuActive;
			emitEvent('menutoggle', menuActive);
		}
	};
	window.App = App;
})();