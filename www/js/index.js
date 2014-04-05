
        var opinionCharacter = 0,
            currentUserId = 0;

        document.addEventListener('deviceready', onDeviceReady, false);
        $(document).ready(onDocumentReady);
        function onDeviceReady() {
            function l(m) {
                _l('index.html', m);
            }

            //VK.auth('4147892', 'friends,photos', 'mobile', function() {
            App.on('queueupdate', function(person) {
                currentUserId = person.id;
                $('.username').find('span').text(person.first_name + ' ' + person.last_name);
                $('.question').find('span').text(person.question.text);
                $('.photo').css('background-image', 'url(' + person.photo_large + ')');
                $('.photo').off('click');
                $('.photo').on('click', function() {
                    App.showProfile(person.id);
                });
            });
            App.on('menutoggle', function(isactive) {
                if(isactive) {
                    $('.content-holder').animate({'left':'0'});
                } else {
                    $('.content-holder').animate({'left':'-87.91666666666667%'});
                }
            });
            App.on('renderself', function(profile) {
                l('rendering self');
                $('.profile-pic').find('img').attr('src', profile.photo_200);
                $('.profile-name').find('h2').text(profile.first_name + ' ' + profile.last_name);
                $('.profile-name').on('click', function() {
                    $('.menu').find('li').removeClass('active');
                    App.showProfile(profile.id);
                    App.toggleMenu();
                });
            });
            App.on('showfriends', function(friends) {
                var i=0,
                    length = friends.length,
                    friend = null,
                    //ejs dude
                    html = '';
                for(; i<length; i++) {
                    friend = friends[i];
                    html += sformat('<li onclick="App.showProfile({{0}});"><div class="friend-photo"><img src="{{1}}"></img></div><div class="friend-name">{{2}}</div><div class="clearfix"></div></li>', friend.id, friend.photo_100, friend.first_name + ' ' + friend.last_name);
                }
                $('.friends-list').html(html);
                showScreen('friendlist');
                }) ;
            App.on('showprofile', function(e) {
                var profile = e.user,
                    opinions = e.opinions,
                    questions = e.questions;
                l('rendering profile for user with id = ' + profile.photo_200);
                $('.user-pic').find('img').attr('src', profile.photo_200);
                $('.user-info').find('h2').text(profile.first_name + ' ' + profile.last_name);
                $('.user-question').text(profile.question.text);
                $('.user-opinions-count').html(sformat('<strong>{{0}}</strong> мнений', profile.total));
                $('#profile-positive-count').html(sformat('<strong>:)</strong> {{0}}', profile.positive));
                $('#profile-negative-count').html(sformat('<strong>:(</strong> {{0}}', profile.negative));
                //First of all we should make our opinions object look like
                //Question--+--Opinion
                //          +--Opinion
                //          +--Opinion
                //...
                //Not 
                //Opinion--+--Question.ID
                //         +--Question.Text
                //Opinion--+--Question.ID
                //         +--Question.Text
                //...
                var ops = {};
                for(var i=0; i<opinions.length; i++) {
                    var opinion = opinions[i];
                    if(typeof(ops[opinion.question_id])=='undefined') {
                        var question = questions[opinion.qid];
                        ops[question.id] = {
                            "id" : question.id,
                            "text" : question.text,
                            "opinions" : []
                        };
                    }
                    ops[question.id]['opinions'].push(opinion);
                }

                //This seemss like overoptimized to me
                var questions = ops,
                    question = null,
                    opinions = null,
                    opinion = null,
                    html = '';
                for(var i in questions) {
                    if(typeof(questions[i])!='function') {
                        //What the fuck am I doing seriously
                        question = questions[i];
                        //This should probably be replaced using ejs
                        html += sformat('<div class="opinion-question"><span>{{0}}</span>', question.text);
                        opinions = question.opinions;
                        for(var j in opinions) {
                            if(typeof(opinions[j])!='function') {
                                opinion = opinions[j];
                                //same 
                                html += sformat('<div class="opinion"><div class="opinion-character">{{1}}</div>{{0}}</div>', opinion.text, (function(character){
                                    if(character==1) {
                                        return '<p class="positive">:)</p>';
                                    } else if (character==0) {
                                        return '<p class="neutral">:|</p>';
                                    } else if(character == -1) {
                                        return '<p class="negative">:(</p>';
                                    }
                                })(opinion.character));
                            }
                        }
                        html += '</div>';
                    }
                }
                $('.user-opinion-list').html(html);
                showScreen('profile');
            }) ;
            App.on('showmyopinions', function(e) {
                //ejs
                var html = '',
                    i = 0,
                    opinion = null,
                    opinions = e.opinions,
                    users = e.users,
                    length = opinions.length;
                l(length + ' opinions ');
                $('.my-opinions-count').find('p').find('strong').html(length);
                for(; i<length; i++) {
                    opinion = opinions[i];
                    html += sformat('<li><div class="opinion-character">{{4}}</div><div class="my-opinion-left"><div class="my-opinion-userpic"><img src="{{0}}" /></div><span class="my-opinion-unlocked">{{3}}</span></div><div class="my-opinion-main"><span class="my-opinion-question">{{1}}</span><p>{{2}}</p></div><div class="clearfix"></div></li>', users[opinion.about_uid].photo_100, opinion.question_text, opinion.text, opinion.unlocked ? 'Просмотрено' : 'Не просмотрено', (function(character){
                                    if(character==1) {
                                        return '<p class="positive">:)</p>';
                                    } else if (character==0) {
                                        return '<p class="neutral">:|</p>';
                                    } else if(character == -1) {
                                        return '<p class="negative">:(</p>';
                                    }
                                })(opinion.character));
                }
                $('.my-opinions-list').html(html);
            });
            App.on('showopinionsaboutme', function(e) {
                l('show opinions about me handler called');
                console.log(e);
                var html= '',
                opinion = null,
                opinions = e.opinions,
                users = e.users,
                question = null,
                questions = e.questions,
                $lockedOps = $('.locked-opinions'),
                $unlockedOps = $('.about-unlocked-opinions'),
                //container
                $cont = null;
                /*for(var i=0; i<questions.length; i++) {
                    //here we are adding opinions to both unlocked and locked opinions list
                    //and this is a bad thing, but since a list with no list items does not
                    //affect the appearance, I do not care
                    html += '<div class="unlocked-list-container"></div>'
                }*/
                for(var i=0; i<opinions.length; i++) {
                    opinion = opinions[i];
                    l('rendering opinions #' + i);
                    if(opinion.unlocked) {
                        $cont = $unlockedOps.find('#uquestion' + opinion.qid);
                        if($cont.length == 0) {
                            question = questions[opinion.qid];
                            $unlockedOps.append(sformat('<div id="uquestion{{0}}">\
                                                            <div class="opinion-question">\
                                                                {{1}}\
                                                            </div>\
                                                            <ul class="unlocked-opinions-list">\
                                                            </ul>\
                                                        </div>', question.id, question.text));
                            $cont = $('#uquestion'+question.id);
                        }
                        $cont.find('ul').append(sformat('<li class="opinion-item" id="opinion_{{0}}">\
                                                    <div class="opinion-info">\
                                                        <img/>\
                                                        <span>{{1}}</span>\
                                                     </div>\
                                                     <div class="opinion-body">\
                                                        <p>{{2}}</p>\
                                                     </div>\
                                                </li>', opinion.id, opinion.time, opinion.text));
                    } else {
                        $cont = $lockedOps.find('#lquestion' + opinion.qid);
                        if($cont.length == 0) {
                            question = questions[opinion.qid];
                            $lockedOps.append(sformat('<div id="lquestion{{0}}">\
                                                            <div class="opinion-question">\
                                                                {{1}}\
                                                            </div>\
                                                            <ul class="locked-opinions-list">\
                                                            </ul>\
                                                       </div>', question.id, question.text));
                            $cont = $lockedOps.find('#lquestion' + opinion.qid);
                        } 
                        $cont.find('ul').append(sformat('<li class="opinion-item-locked" id="opinion_{{0}}">\
                                                            <div class="opinion-info">\
                                                                <img/>\
                                                                <span>{{1}}</span>\
                                                            </div><span>Посмотреть за $300</span>\
                                                            <div class="opinion-lock">\
                                                                <img/>\
                                                            </div><div class="clearfix"></div>\
                                                         </li>', opinion.id, opinion.time));
                    }
                }
                $('.opinion-item-locked').off('click').on('click', function() {
                    $this = $(this);
                    var id = $this.attr('id').match(/opinion_([0-9]*)/)[1];
                    App.unlockOpinion(id, function(opinion) {
                        $this.off('click').removeClass('opinion-item-locked').html(sformat('\
                                                     <div class="opinion-info">\
                                                        <img/>\
                                                        <span>{{0}}</span>\
                                                     </div>\
                                                     <div class="opinion-body">\
                                                        <p>{{1}}</p>\
                                                     </div>', opinion.time, opinion.text));
                        alert('Done');
                    }, function(error) {
                        alert(error.message);
                    });
                })
            });
            //Showing queue by default
            showScreen('queue');
    
            App.initialize(VK.getUserId());
                //VKApi.getFriends(function(data) {
                //  console.log(data);
                //});
            //});
        }

        function onDocumentReady() {
            $('.menu-button').on('click', function() {
                App.toggleMenu();
            });
            $('#button-submit').on('click', function() {
                //App.submitOpinion($('input.opinion-input').val());
                //App.next();
                showScreen('send');
            });
//          $('#button-next').on('click', function() {
//              App.next();
//          });
            $('.menu').find('li').on('click', function() {
                var $this = $(this);
                $this.parent().find('li').removeClass('active');
                $this.addClass('active');
            });
            $('.send-button').on('click', function() {
                App.submitOpinion(currentUserId, $('textarea').val(), opinionCharacter);
                App.next();
                showScreen('queue');
            });
            $('.characters').find('li').on('click', function() {
                var $this = $(this),
                    id = $this.attr('id');
                $this.parent().find('li').removeClass('active');
                $this.addClass('active');
                if(id == 'opinion-negative') {
                    opinionCharacter = -1;
                } else if(id == 'opinion-neutral') {
                    opinionCharacter = 0;
                } else if(id == 'opinion-positive') {
                    opinionCharacter = 1;
                }
            });
            $('#nav_queue').on('click', function() {
                showScreen('queue');
                App.toggleMenu();
            });
            $('#nav_friends').on('click', function() {
                App.showFriends(function() {
                    App.toggleMenu();
                }); 
            });
            $('#nav_my_opinions').on('click', function() {
                App.showMyOpinions(function() {
                    showScreen('my_opinions');
                    App.toggleMenu();
                });
            });
            $('#nav_about_me').on('click', function() {
                App.showOpinionsAboutMe(function() {
                    showScreen('about_me');
                    App.toggleMenu();
                })
            })
        }

        function showScreen(id) {
                $('.screen').css('z-index', 0);
                $('#' + id).css('z-index', 99);
        }
