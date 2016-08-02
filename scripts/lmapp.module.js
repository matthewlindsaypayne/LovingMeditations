(function(angular) {
  'use strict';
    
    var PATIENT_TYPE = 'Patient';
    var CAREGIVER_TYPE = 'Caregiver';
    
    var lmApp = angular.module('lmApp', ['ngRoute',
                                         'ngMessages',
                                         'lmApp.scrolling',
                                         'lmApp.models']);
    
    lmApp.config(function($routeProvider, $locationProvider) {
        
    });
    
    lmApp.run(function($rootScope, LMUser) {
        Parse.initialize("JEgXK9fpAD", "gmSkeY1CsB");
        Parse.serverURL = "https://lmserver-1281.appspot.com/parse";
        
        $rootScope.sessionUser = Parse.User.current();
        $rootScope.loggedIn = ($rootScope.sessionUser != null);
        console.log("User is : " + $rootScope.sessionUser);
    });
    
    lmApp.filter('uniqueVideoFilter', function () {
        return function(videos) {
            var out = [];
            var used = [];
            var videoId, matches;
            
            angular.forEach(videos, function(video) {
                matches = video.description.match("<h2>(.*)</h2>");
                if (matches) {
                videoId = matches[1];
                    if (videoId && used.indexOf(videoId) < 0) {
                        used.push(videoId);
                        video.uniqueVideoId = videoId;
                        out.push(video);
                    }
                }
            });
            
            return out;
        }
    });

    lmApp.controller('LovingMeditationsController', function($scope, $rootScope) {
        $scope.canInvite = true;
        
        $scope.logout = function() {
            Parse.User.logOut();
            $rootScope.loggedIn = false;
        };
        
    });

    lmApp.controller('InspirationsController', function($scope, $q) {
        var currentDate = new Date();
        var originalDate = new Date("May 1, 2016 03:00:00");
        var dateCount = Math.round(Math.abs((originalDate.getTime() - currentDate.getTime())/(24*60*60*1000)));
        var inspirationsDfd = $q.defer();
        var inspirations = Parse.Object.extend('Inspirations');
        var queryInspirations = new Parse.Query(inspirations);
        queryInspirations.equalTo("index", (dateCount % 86));
        queryInspirations.first().then(function (data) {
  	         inspirationsDfd.resolve(data);
        }, function (error) {
  	         inspirationsDfd.reject(error);
            console.log("Inspiration retrieval for this index failed.");
            $scope.currentInspiration = "A healthy outside starts from the inside. -Robert Urich";
        });
        
        inspirationsDfd.promise
            .then(function (inspiration) {
                $scope.currentInspiration = inspiration.attributes.text + "\n -" + inspiration.attributes.author;
                console.log($scope.currentInspiration);
        })
            .catch(function (error) {
            // log error
            console.log("Inspiration retrieval promise failed.");
            $scope.currentInspiration = "A healthy outside starts from the inside. -Robert Urich";
        });
    });
    
    lmApp.controller('ProgramsController', function($scope, $http, $sce, $q) {
        var programsList;
        $scope.selectedProgramId = -1;
        $scope.selectedProgramType = 'Patient'; //$scope.programType'';
        $scope.selectedProgramEmbedSrc = '';
        $http.get("https://api.wistia.com/v1/projects.json?api_password=5450cfdc1299ebebee9129dd19dc06f02db688040667cada25ae12a9924877ee")
            .success(function(data, status, headers, config) {
                programsList = data;
                $scope.programs = programsList;
            })
            .error(function(data, status, headers, config) {
                // log error
            console.log("Programs retrieval failed.");
        });
        
        $scope.changeProgramType = function(type) {
            $scope.selectedProgramType = type;
            $scope.selectedProgramId = -1;
        };
        
        $scope.selectProgram = function(programId, programHashedId) {
            if ($scope.selectedProgramId == -1) {
                var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
            
                if (w <= 374) {
                    var programWidth = "246";
                    var programHeight = "150";
                } else if (w <= 424) {
                    var programWidth = "301";
                    var programHeight = "180";
                } else if (w <= 767) {
                    var programWidth = "351";
                    var programHeight = "210";
                } else {
                    var programWidth = "640";
                    var programHeight = "360";
                }
                
                $scope.selectedProgramEmbedSrc = "//fast.wistia.net/embed/playlists/" + programHashedId + "?media_0_0%5BautoPlay%5D=false&media_0_0%5BcontrolsVisibleOnLoad%5D=false&theme=tab&version=v1&videoOptions%5BautoPlay%5D=true&videoOptions%5BvideoHeight%5D=" + programHeight +"&videoOptions%5BvideoWidth%5D=" + programWidth + "&videoOptions%5BvolumeControl%5D=true";
                $scope.selectedProgramId = programId;
                
                if ($rootScope.loggedIn === true) {
                    var programPlaylist = Wistia.playlist(programHashedId);
                    programPlaylist.bind("end", function(sectionIndex, videoIndex) {
                        {
                        var userVideo = userVideo.getByUserIdAndVideoId($rootScope.sessionUser.id, videoIndex);
                        if (userVideo) {
                            userVideo.playCount++;
                            userVideo.save(null, {
                                success: function (userVideo) {
                                    alert("User_Video updated!");
                                },
                                error: function(userVideo, error) {
                                    alert("User_Video update failed, " + error.message);
                                }
                            });
                        } else {
                            userVideo = new UserVideo();
                            userVideo.userId = $rootScope.sessionUser.id;
                            userVideo.videoId = videoIndex;
                            userVideo.playCount = 1;
                            userVideo.save(null, {
                                success: function (userVideo) {
                                    alert("User_Video created!");
                                },
                                error: function(userVideo, error) {
                                    alert("User_Video creation failed, " + error.message);
                                }
                            });
                        }
                    };
                });
                }
            } else {
                $scope.selectedProgramId = -1;
                $scope.selectedProgramEmbedSrc = '';
            }
            
        };
        
        
        $scope.programDisplayFilter = function(item) {
            if (item.name.includes($scope.selectedProgramType)) {
                if (($scope.selectedProgramId == -1) || (item.id == $scope.selectedProgramId)) {
                    return true;
                }
            }
            
            return false;
        };
        
        $scope.formatProgramImage = function(item) {
            var thumbnailWidth = "246";
            var thumbnailHeight = "150";
            return item.replace("image_crop_resized=200x120", "image_crop_resized=" + thumbnailWidth + "x" + thumbnailHeight);
        };
        
        $scope.trustSrc = function(src) {
            return $sce.trustAsResourceUrl(src);
        };
    });
    
    lmApp.controller('MeditationsController', function($scope, $http, $sce, $q, $location, $filter, $rootScope, anchorSmoothScroll, UserVideo, AdviserVideoCollection) {
        $scope.selectedMeditationId = -1;
        $scope.selectedMeditationEmbed = '';
        $scope.currentPage = 0;
        $scope.pageSize = 10;
        $scope.videosList = [];
        $scope.videoCount = 0;
        $scope.adviserSelectedList = [];
        $scope.uniqueVideoId = 0;
        $scope.showAdviser = false;
        $scope.showAdviserBlurbs = false;
        $scope.showAdviserMeditation = false;
        
        $scope.adviserQuestionList = [['1', 'Do you feel stressed or overwhelmed?'], ['2', 'Do you feel anxious or depressed?'], 
                                      ['3', 'Do you feel discomfort or pain?'], ['4', 'Do you feel fatigued or burnt out?'],
                                     ['5', 'Do you feel alone or disconnected?'], ['6', 'Do you feel worried?'],
                                     ['7', 'Do you feel fearful or hopeless?'], 
                                      ['8', 'Are you judging yourself, others or judging your situation?'],
                                     ['9', 'Are you experiencing lack of mental clarity?'], ['10', 'Do you feel stuck or unappreciated?']];
        
        $scope.adviserQuestionText = '';
        $scope.currentAdviserQuestionTag = 0;
        $scope.adviserVideoCollection = new AdviserVideoCollection();
        
        $http.get("https://api.wistia.com/v1/medias.json?api_password=5450cfdc1299ebebee9129dd19dc06f02db688040667cada25ae12a9924877ee")
            .success(function(data, status, headers, config) {
                $scope.videosList = $filter('uniqueVideoFilter')(data);
                $scope.videoCount = $scope.videosList.length;
        });
        
        $scope.numberOfPages = function() {
            try {
                return Math.ceil($scope.videoCount/$scope.pageSize);
            } catch (err) {
                console.log("Meditations not yet loaded.");
            }
        };
        
        $scope.selectMeditation = function(meditationId, meditationHashedId, meditationUniqueVideoId) {
            if ($scope.selectedMeditationId != meditationId) {
                var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
            
                if (w <= 374) {
                    var meditationWidth = "246";
                    var meditationHeight = "150";
                } else if (w <= 424) {
                    var mediationWidth = "301";
                    var meditationHeight = "180";
                } else if (w <= 767) {
                    var meditationWidth = "351";
                    var meditationHeight = "210";
                } else {
                    var meditationWidth = "640";
                    var meditationHeight = "360";
                }
                
                $scope.selectedMeditationId = meditationId;
                $scope.selectedMeditationEmbed = $sce.trustAsHtml("<script charset=\"ISO-8859-1\" src=\"//fast.wistia.com/assets/external/E-v1.js\" async></script><div id=\"meditationVideo\" class=\"wistia_embed wistia_async_" + $sce.trustAsHtml(meditationHashedId) + " center-block\" style=\"height:" + meditationHeight + "px;width:" + mediationWidth + "px\">&nbsp;</div>");
                $location.hash("meditation-embed");
                anchorSmoothScroll.scrollTo("meditation-embed");
                
                if ($rootScope.loggedIn === true) {
                    var meditationVideo = Wistia.api("meditationVideo");
                    video.bind("end", function() {
                        var userVideo = userVideo.getByUserIdAndVideoId($rootScope.sessionUser.id, meditationUniqueVideoId);
                        if (userVideo) {
                            userVideo.playCount++;
                            userVideo.save(null, {
                                success: function (userVideo) {
                                    alert("User_Video updated!");
                                },
                                error: function(userVideo, error) {
                                    alert("User_Video update failed, " + error.message);
                                }
                            });
                        } else {
                            userVideo = new UserVideo();
                            userVideo.userId = $rootScope.sessionUser.id;
                            userVideo.videoId = meditationUniqueVideoId;
                            userVideo.playCount = 1;
                            userVideo.save(null, {
                                success: function (userVideo) {
                                    alert("User_Video created!");
                                },
                                error: function(userVideo, error) {
                                    alert("User_Video creation failed, " + error.message);
                                }
                            });
                        }
                    });
                }
            } else {
                $scope.selectedMeditationId = -1;
                $scope.selectedMeditationEmbed = '';
            }
        };
        
        $scope.meditationDescriptionFilter = function(item) {
            var description;
            try {
                description = item.match("<p>(.*)</p>")[1];
                return description;
            } catch(err) {
                console.log("Poorly formed video description.");
            }
        };
        
        $scope.meditationDurationFilter = function(item) {
            var secondsTotal = Math.floor(item);
            var minutes = Math.floor(secondsTotal/60);
            var seconds = secondsTotal % 60;
        }
        
        $scope.formatMeditationBlurbImage = function(item) {
            var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
            if (w <= 374) {
                var thumbnailWidth = "246";
                var thumbnailHeight = "150";
            } else if (w <= 424) {
                var thumbnailWidth = "301";
                var thumbnailHeight = "180";
            } else if (w <= 767) {
                var thumbnailWidth = "351";
                var thumbnailHeight = "210";
            } else {
                var thumbnailWidth = "340";
                var thumbnailHeight = "276";
            }
            
            
            return item.replace("image_crop_resized=200x120", "image_crop_resized=" + thumbnailWidth + "x" + thumbnailHeight);
        };
        
        $scope.toggleAdviser = function() {
            if ($scope.showAdviser || $scope.showAdviserMeditation || $scope.showAdviserBlurbs) {
                $scope.showAdviser = false;
                $scope.showAdviserBlurbs = false;
                $scope.showAdviserMeditation = false;
                $scope.adviserQuestionText = '';
                $scope.currentAdviserQuestionTag = 0;
                $scope.adviserVideoCollection = new AdviserVideoCollection();
                $scope.currentPage = 0;
                $scope.selectedMeditationId = -1;
                $scope.selectedMeditationEmbed = '';
            } else {
                $scope.showAdviser = true;
                $scope.showAdviserBlurbs = false;
                $scope.showAdviserMeditation = false;
                var adviserQuestion = $scope.adviserQuestionList[Math.floor(Math.random() * $scope.adviserQuestionList.length)];
                $scope.adviserQuestionText = adviserQuestion[1];
                $scope.currentAdviserQuestionTag = adviserQuestion[0];
                
                $scope.videosList.forEach(function(video) {
                    try {
                        var tags = video.description.match("<h1>(.*)</h1>")[1].split(",");
                        $scope.adviserVideoCollection.addVideo(video.hashed_id, video.name, video.description, video.duration, video.thumbnail.url, tags);
                    } catch (err) {
                        console.log("Poorly formed description.");
                    }
                });
            }
        }
        
        $scope.adviserAnswer = function(answer) {
            if (answer) {
                $scope.adviserVideoCollection.keepTag($scope.currentAdviserQuestionTag);
            } else {
                $scope.adviserVideoCollection.removeTag($scope.currentAdviserQuestionTag);
            }
            
            if ($scope.adviserVideoCollection.isReadyToDisplay()) {
                $scope.displayAdviserBlurbs();
            } else {
                var nextTagIndex = $scope.adviserVideoCollection.getNextTagIndex();
                if (nextTagIndex > -1) {
                    $scope.currentAdviserQuestionTag = $scope.adviserQuestionList[nextTagIndex][0];
                    $scope.adviserQuestionText = $scope.adviserQuestionList[nextTagIndex][1];
                } else {
                    //throw error message
                }
            }
        }
        
        $scope.displayAdviserBlurbs = function() {
            $scope.showAdviser = false;
            $scope.showAdviserBlurbs = true;
            $scope.showAdviserMeditation = false;
        }
        
        $scope.displayAdviserMeditation = function(hashedId) {
            var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
            
            if (w <= 374) {
                var meditationWidth = "246";
                var meditationHeight = "150";
            } else if (w <= 424) {
                var mediationWidth = "301";
                var meditationHeight = "180";
            } else if (w <= 767) {
                var meditationWidth = "351";
                var meditationHeight = "210";
            } else {
                var meditationWidth = "640";
                var meditationHeight = "360";
            }
            
            $scope.selectedAdviserMeditationEmbed = $sce.trustAsHtml("<script charset=\"ISO-8859-1\" src=\"//fast.wistia.com/assets/external/E-v1.js\" async></script><div id=\"adviserMeditationVideo\" class=\"wistia_embed wistia_async_" + $sce.trustAsHtml(hashedId) + " center-block\" style=\"height:" + meditationHeight + "px;width:" + mediationWidth + "px\">&nbsp;</div>");
            $scope.showAdviser = false;
            $scope.showAdviserBlurbs = false;
            $scope.showAdviserMeditation = true;
        }
        
    });
    
    lmApp.filter('ProgramNameFilter', function () {
        return function(programName) {
                    var programDisplayName = programName.split('_')[2];
                    return programDisplayName;
                }
    });
    
    lmApp.filter('secondsToHHmmss', function($filter) {
        return function(seconds) {
            return $filter('date')(new Date(0, 0, 0).setSeconds(seconds), 'HH:mm:ss');
        };
    });
    
    lmApp.filter('startFrom', function() {
        return function(input, start) {
            if (input != null && input.length > 0) {
                start = +start; //parse to int
                return input.slice(start)
            }
        }
    });
    
    lmApp.controller('LoginController', function($scope, $http, $q, LMUser, $rootScope) {
        $scope.userSignup = new LMUser();
        $scope.userLogin = {};
        
        $scope.signup = function() {
            $scope.userSignup.username = $scope.userSignup.email;
            $scope.userSignup.userType = 0;
            $scope.userSignup.patientType = parseInt($scope.userSignup.patientType);
            $scope.userSignup.programEnrolledIn = "";
            $scope.userSignup.emailVerified = false;
            //if ()
            $scope.userSignup.signUp(null, {
                success: function(newUser) {
                    alert('New object created with objectId: ' + newUser.id);
                    $rootScope.loggedIn = true;
                    $rootScope.$apply();
                    $scope.userSignup = new LMUser();
                },
                error: function(newUser, error) {
                    console.log(error);
                    alert('Failed to create new object, with error code: ' + error.message);
                    $rootScope.loggedIn = false;
                    $rootScope.$apply();
                }
            });
        };
        
        $scope.login = function() {
            if ($rootScope.loggedIn == false) {
            LMUser.logIn($scope.userLogin.username, $scope.userLogin.password, {
                success: function(loggedInUser) {
                    alert('Logged in as user with objectId: ' + loggedInUser.id);
                    $rootScope.loggedIn = true;
                    $rootScope.$apply();
                    $scope.userLogin = {};
                },
                error: function(loggedInUser, error) {
                    alert('Failed to log in, with error code: ' + error.message);
                    $rootScope.loggedIn = false;
                    $rootScope.$apply();
                }
            });
            } else {
                alert('Attempted log in when user was already logged in.');
            }
        };
        
        $scope.forgotPassword = function() {
            alert('Email sent!');
        }
        
    });
    
    lmApp.controller('InvitesController', function($scope, $http, $q, $rootScope, Invite) {
        
        $scope.activeUsers = {};
        $scope.invitesSent = {};
        
        $scope.activeUsers.currentPage = 0;
        $scope.invitesSent.currentPage = 0;
        
        $scope.activeUsers.pageSize = 10;
        $scope.invitesSent.pageSize = 10;
        
        $scope.activeUsers.activeUsersList = [];
        $scope.invitesSent.invitesSentList = [];
        
        $scope.activeUsers.count = 0;
        $scope.invitesSent.count = 0;
        
        if ($rootScope.sessionUser) {
        $rootScope.sessionUser.activeUsersInvited().then(function(users) {
            $scope.activeUsers.activeUsersList = users;
            $scope.activeUsers.count = users.length;
        }, function(error) {
            alert("Active users promise failed.");
        });
        
        $rootScope.sessionUser.invitesSent().then(function(invites) {
            $scope.invitesSent.invitesSentList = invites;
            $scope.invitesSent.count = invites.length;
        }, function(error) {
            alert("Invite promise failed.");
        });
        
        $scope.activeUsers.activeUsersList = $rootScope.sessionUser.activeUsersInvited();
        $scope.invitesSent.invitesSentList = $rootScope.sessionUser.invitesSent();
        
        $scope.inviteTarget = new Invite();
        }
        
        $scope.numberOfPages = function(listLength, pageSize) {
            try {
                return Math.ceil(listLength/pageSize);
            } catch (err) {
                console.log("Invites section not yet loaded.");
            }
        };
        
        $scope.sendInvite = function() {
            //send email
                                //var params = {'toEmail': $scope.inviteTarget.email, 'name': $scope.inviteTarget.name};
                                var params = {'fromEmail': 'balancetemp@gmail.com', 'toEmail': 'matthew.lindsay.payne@gmail.com', 'subject': 'Email testing from Server', 'content': 'Light: The oldest game in the world.'};
                                $http.post("https://lmserver-1281.appspot.com/mail", params)
                                    .success(function(data, status, headers, config) {
                                      alert("Email sent! Uses Name!"); 
                                })
                                .error(function(data, status, headers, config) {
                                    // log error
                                    alert("Emailing failed");
                                    console.log(data);
                                    console.log(status);
                                });
            
            /*var inviteDfd = $q.defer();
 
            var query = new Parse.Query(Invite);
            query.equalTo("email", $scope.inviteTarget.email);
            query.find({
                success : function(anInvite) {
                    inviteDfd.resolve(anInvite);
                },
                error : function(aError) {
                    inviteDfd.reject(aError);
                }
            });
            
            inviteDfd.promise
                .then(function (anInvite) {
                    if (anInvite.length > 0) {
                        alert('Already been invited, can\'t again.');
                    } else {
                        $scope.inviteTarget.invitedByUserId = $rootScope.sessionUser.id;
                        $scope.inviteTarget.save(null, {
                            success: function(sentInvite) {
                                alert('Sent invite to ' + sentInvite.name);
                                $scope.inviteTarget = new Invite();
                                
                                //send email
                                var params = {'toEmail': $scope.inviteTarget.email, 'name': $scope.inviteTarget.name};
                                $http.post("http://localhost:8080/invite", JSON.stringify(params))
                                    .success(function(data, status, headers, config) {
                                      alert("Email sent! Uses Name!"); 
                                })
                                .error(function(data, status, headers, config) {
                                    // log error
                                    alert("Emailing failed");
                                    console.log(data);
                                    console.log(status);
                                });
                            },
                            error: function(sentInvite, error) {
                                alert('Failed to send invite, with error code: ' + error.message);
                            }
                        });
                        
                        
                    }
                })
                .catch(function (error) {
                    // log error
                    alert("Invite retrieval promise failed.");
                });*/
       };
    });
    
    lmApp.controller('ContactController', function($scope, $http, $q) {
        $scope.testSendEmail = function() {
            var data = $.param({
                json: JSON.stringify({
                    toEmail: 'balancetemp@gmail.com',
                    fromEmail: 'info@lovingmeditations.com',
                    subject: 'loving meditations test',
                    content: 'check check check check'
                })
            });
            $http.post('https://lmserver-1281.appspot.com/parse/mail')
                .success(function(data, status, headers, config) {
                    programsList = data;
                    $scope.programs = programsList;
                })
                .error(function(data, status, headers, config) {
                    // log error
                    console.log("Email send failed " + status);
                });
        }
    });
    
})(window.angular);