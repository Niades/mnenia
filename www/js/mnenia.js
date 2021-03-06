(function(){
	function l(m) {
		_l('mnenia.js', m);
	}

	var PRELOAD = 3;
	
	var people = {},
		questions = {},
		queue = [],
		qIndex = 0,
		events = {},
		user = {},
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
    			questions[r.id] = r;
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
	"opinions_about" : function(user, callback) {
		var fieldName = 'opinions_about',
			userId = user.id;
		ServerApi.api('get_opinions_about', { 'user_id' : userId }, function(data) {
			var r = data.response;
			user.opinions = r.items;
			user.total = r.total;
			user.positive = r.positive;
			user.negative = r.negative;
			for(var i in r.questions) {
				if(typeof(r.questions[i])!='function') {
					questions[r.questions[i].id] = r.questions[i];
				}
			}
			callback(fieldName);
		});
	},
	"opinions_about_me" : function(user, callback) {
		var fieldName = 'opinions_about_me';
		ServerApi.api('get_opinions_about', {}, function(data) {
			var r = data.response;
			user.opinions = r.items;
			user.total = r.total;
			user.positive = r.positive;
			user.negative = r.negative;
			for(var i in r.questions) {
				if(typeof(r.questions[i])!='function') {
					questions[r.questions[i].id] = r.questions[i];
				}
			}
			callback(fieldName);
		});
	},
	"friends" : function(user, callback) {
		var fieldName = 'friends',
			userId = user.id;
		VKApi.getFriends(userId, function(data) {
			user.friends = data.response.items;
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
			DataLoader.loadMissing(people[personId], ['question', 'photo_large'], _callback);
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
			user.id = userId;
			ServerApi.auth(userId, function() {
				VKApi.getSelfInfo(function(data) {
					 user = data.response[0];
					 if(typeof(user.photo_200)=='undefined') {
					 	user.photo_200 = user.photo_200_orig;
					 }
					 people[user.id] = user;
					 emitEvent('renderself', user);
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
					//I don't really like the way it looks
					//could lead to memory leakage probably
					people[userId].friends = r.items;
					l('Added ' + length +' friends');
					onQueueForward();
				});
				ServerApi.api('get_opinions_by', {}, function(data) {
					user.opinions_by = data.response;
				});
				});

			});
		},
//		getCurrentPerson : function() {
//			return
//		},
		showProfile : function(userId, callback) {
			var person = people[userId];
			DataLoader.loadMissing(person, ['question', 'opinions_about'], function() {
				var e = {
					"user" : person,
					"questions" : {},
					"opinions" : []
				}
				for(var i in person.opinions) {
					if(typeof(person.opinions[i])!='undefined') {
						var opinion = person.opinions[i];
						e.opinions.push(opinion);
						if(typeof(e.questions[opinion.qid])=='undefined') {
							e.questions[opinion.qid] = questions[opinion.qid];
						}
					}
				}
				emitEvent('showprofile', e);
				//At this point all the event handlers have completed
				//execution because their code contains nothing asynchronous 
				if(typeof(callback)!='undefined') {
					callback();
				}
			});
		},
		showFriends : function(userId, callback) {
			if(typeof(userId) == 'undefined'||typeof(userId) == 'function') {
				//This might be replaced with something more abstract like
				//arguments[i] is not function nor undefined because with
				//userId it seems sort of unclear what is really going on
				//here
				callback = userId;
				userId = user.id;
			}
			var person = people[userId];
			DataLoader.loadMissing(person, ['friends'], function() {
				emitEvent('showfriends', person.friends);
				if(typeof(callback)!='undefined') {
					callback();
				}
			});
		},
		showMyOpinions : function(callback) {
			var i = 0,
				opinion = null,
				opinions = user.opinions_by.items,
				length = opinions.length,
				//Here's the catch: this might contain some users which are not presented
				//in our nice people object, but at it's current state the application doesn't
				//allow you to browse not your friends' profiles, so this is not an issue, yet
				e = {
					"users" : {},
					"opinions" : []
				},
				ops = e.opinions,
				users = e.users;
			for (; i<length; i++) {
				opinion = opinions[i];
				ops.push(opinion);
				e.users[opinion.about_uid] = people[opinion.about_uid];
			}
			emitEvent('showmyopinions', e);
			if(typeof(callback)!='undefined') {
				callback();
			}	
		},
		showOpinionsAboutMe : function(callback){
				DataLoader.loadMissing(user, ['opinions_about_me'], function() {
					var i = 0,
						opinion = null,
						opinions = user.opinions,
						length = opinions.length,
						//Here's the catch: this might contain some users which are not presented
						//in our nice people object, but at it's current state the application doesn't
						//allow you to browse not your friends' profiles, so this is not an issue, yet
						e = {
							"users" : {},
							"opinions" : [],
							"questions" : {}
						},
						ops = e.opinions,
						users = e.users;
					for (; i<length; i++) {
						opinion = opinions[i];
						ops.push(opinion);
						e.users[opinion.about_uid] = people[opinion.about_uid];
						if(typeof(e.questions[opinion.qid])=='undefined') {
							e.questions[opinion.qid] = questions[opinion.qid];
						}
					}
					emitEvent('showopinionsaboutme', e);
					if(typeof(callback)!='undefined') {
						callback();
					}
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
		submitOpinion : function(userId, text, character) {
			//var person = people[queue[qIndex]];
			var person = people[userId];
			ServerApi.api('submit_opinion', {"qid" : person.question.id, "text" : text, "user_id" : person.id, "character" : character }, function() {
				l('opinion submitted.');
			});
		},
		toggleMenu : function() {
			//Update notification counters
			//updateMenu();
			menuActive = !menuActive;
			emitEvent('menutoggle', menuActive);
		}
	};
	window.App = App;
})();