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

    DataLoader.init({
    	"question" : function(user, callback) {
    		var fieldName = 'question',
    		    userId = user.id;
    		ServerApi.api('get_question', {'user_id':userId}, function(data) {
    			var r = data.response;
    			user.question = {'id' : r.id, 'text' : r.text};

				callback(fieldName);
    		});
    	},
    	"photo_large" : function(user, callback) {
    		var fieldName = 'photo_large',
    			userId = user.id;
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
			user.photo_large = photo_large;
			callback(fieldName);
		});
	},
	"opinions" : function(user, callback) {
		var fieldName = 'opinions',
			userId = user.id;
		ServerApi.api('get_opinions', {'user_id':userId}, function(data) {
			var r = data.response;
			user.opinions = r;
			callback(fieldName);
		});
	}

});
	function onQueueForward() {
		var personId = 0,
			person = null;
			to = qIndex + PRELOAD,
			to = to >= queue.length ? queue.length : to;
		l('Queue moved forward');
		l('About to process ' + (to - qIndex) + ' users');
		function _callback(user) {
			l('User id' + user.id + ' has photo_large=' + people[user.id].photo_large);
			l('User id' + user.id + ' has question.text=' + people[user.id].question.text);
			if(queue[qIndex]==user.id) {
				emitEvent('queueupdate', people[user.id]);
			}
		}
		for(var i=qIndex; i<to; i++) {
			personId = queue[i];
			l('Current user: ' + personId);
			DataLoader.loadMissing(people[personId], ['question', 'photo_large', 'opinions'], _callback);
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
				VKApi.getSelfInfo(function(data) {
					 var self = data.response[0];
					 if(typeof(self.photo_200)=='undefined') {
					 	self.photo_200 = self.photo_200_orig;
					 }
					 people[self.id] = self;
					 emitEvent('renderself', self);
				});
				VKApi.getFriends(function(data) {
					var r = data.response,
						length = r.count,
					    f = null,
					    i = 0;
					for(; i<length; i++) {
						f = r.items[i];
						if(typeof(f.photo_200)=='undefined') {
							f.photo_200 = f.photo_200_orig;
						}
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
		showProfile : function(userId) {
			var person = people[userId];
			DataLoader.loadMissing(person, ['question', 'opinions'], function() {
				emitEvent('renderprofile', person);
			});
		},
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