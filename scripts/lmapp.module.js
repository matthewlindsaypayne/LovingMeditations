(function(angular) {
  'use strict';
    
    var PATIENT_TYPE = 'Patient';
    var CAREGIVER_TYPE = 'Caregiver';
    
    var lmApp = angular.module('lmApp', ['ngRoute',
                                         'ngMessages',
                                         'lmApp.scrolling',
                                         'lmApp.models',
                                         'stripe.checkout']);
    
    lmApp.config(function($routeProvider, $locationProvider, $httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    });
    
    lmApp.run(function($rootScope, LMUser) {
        Parse.initialize('JEgXK9fpAD');
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

    lmApp.controller('LovingMeditationsController', function($scope, $http, $rootScope) {
        $rootScope.programs = [];
        $rootScope.freeMedia = [];
        
        $http.get("https://api.wistia.com/v1/projects.json?api_password=5450cfdc1299ebebee9129dd19dc06f02db688040667cada25ae12a9924877ee")
            .success(function(data, status, headers, config) {
                $rootScope.programs = data;
            })
            .error(function(data, status, headers, config) {
                // log error
            console.log("Programs retrieval failed.");
        });
        
        $http.get("https://api.wistia.com/v1/projects/y9r6xq82wn.json?api_password=5450cfdc1299ebebee9129dd19dc06f02db688040667cada25ae12a9924877ee")
            .success(function(data, status, headers, config) {
                if (data.name == "Free") {
                    $rootScope.freeMedia = data.medias;
                } else {
                    alert("Free videos list not found.");
                }
            })
            .error(function(data, status, headers, config) {
                //log error
                console.log("Free media program failed.");
        });
        
        
        
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
        })
            .catch(function (error) {
            // log error
            console.log("Inspiration retrieval promise failed.");
            $scope.currentInspiration = "A healthy outside starts from the inside. -Robert Urich";
        });
    });
    
    lmApp.controller('ProgramsController', function($scope, $http, $sce, UserVideo, $location, anchorSmoothScroll, $timeout, $rootScope, $q) {
        $scope.selectedProgramId = -1;
        $scope.selectedProgramType = 'Patient'; //$scope.programType'';
        $scope.selectedProgramEmbedSrc = '';
        
        $scope.changeProgramType = function(type) {
            $scope.selectedProgramType = type;
            $scope.selectedProgramId = -1;
        };
        
        $scope.selectProgram = function(programId, programHashedId) {
            if ($scope.selectedProgramId == -1) {
                var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
            
                if (w <= 374) {
                    var programWidth = "246";
                    var programHeight = "138";
                    var styleWidth = "330";
                    var styleHeight = "170";
                } else if (w <= 424) {
                    var programWidth = "301";
                    var programHeight = "169";
                    var styleWidth = "385";
                    var styleHeight = "201";
                } else if (w <= 767) {
                    var programWidth = "351";
                    var programHeight = "197";
                    var styleWidth = "435";
                    var styleHeight = "229";
                } else {
                    var programWidth = "640";
                    var programHeight = "360";
                    var styleWidth = "724";
                    var styleHeight = "392";
                }
                
                $scope.selectedProgramEmbed = $sce.trustAsHtml("<div id=\"wistia_" + programHashedId + "\" class=\"wistia_embed center-block\" style=\"width:" + programWidth + "px;height:" + programHeight + "px;\" data-video-width=\"" + programWidth +"\" data-video-height=\"" + programHeight +"\">&nbsp;</div><script charset=\"ISO-8859-1\" src=\"http://fast.wistia.com/assets/external/playlist-v1.js\"></script><script src=\"http://fast.wistia.com/assets/external/playlist-v1.js\"></script><script>wistiaPlaylist = Wistia.playlist(\"" + programHashedId + "\", {version: \"v1\", theme: \"tab\",videoOptions: {volumeControl: true,autoPlay: true,videoWidth: \"" + programWidth + "\",videoHeight: \"" + programHeight + "\"},media_0_0: {autoPlay: false,controlsVisibleOnLoad: false}});</script>");
                
                $scope.selectedProgramId = programId;
                
                 $timeout(function () {
                    var programPlaylist = Wistia.playlist(programHashedId);
                    if ($rootScope.loggedIn) {
                    programPlaylist.bind("end", function(sectionIndex, videoIndex) {
                        var currentVideo = programPlaylist.currentVideo();
                        var videoId = currentVideo.hashedId();
                        var userVideoPromise = UserVideo.getByUserIdAndVideoId($rootScope.sessionUser.id, videoId);
                        userVideoPromise.then(function(videos) {
                            if (videos.length > 0) {
                                var userVideo = videos[0];
                                userVideo.playCount++;
                                userVideo.save(null, {
                                    success: function (savedVideo) {
                                        alert("User_Video updated!");
                                    },
                                    error: function(savedVideo, error) {
                                        alert("User_Video update failed, " + error.message);
                                    }
                                })
                            } else {
                                var userVideo = new UserVideo();
                                userVideo.userId = $rootScope.sessionUser.id;
                                userVideo.videoId = videoId;
                                userVideo.playCount = 1;
                                userVideo.save(null, {
                                    success: function(savedVideo) {
                                        alert("User_Video created!");
                                    },
                                    error: function(savedVideo, error) {
                                        alert("User_Video creation failed, " + error.message);
                                    }
                                })
                            }
                        })
                    });
                    } else {
                        programPlaylist.bind("afterembed", function(sectionIndex, videoIndex) {
                            var currentVideo = programPlaylist.currentVideo();
                            var videoId = currentVideo.hashedId();
                            var isFreeVideo = false;
                            $.each($rootScope.freeMedia, function(i, obj) {
                                if (obj.hashedId == videoId) { isFreeVideo = true; return false;}
                            });
                            
                            if (!isFreeVideo) {
                                programPlaylist.currentVideo().pause();
                                $location.hash("lm-login");
                                anchorSmoothScroll.scrollTo("lm-login");
                            }
                        
                });
                        
                        programPlaylist.bind("play", function(sectionIndex, videoIndex) {
                            var currentVideo = programPlaylist.currentVideo();
                            var videoId = currentVideo.hashedId();
                            var isFreeVideo = false;
                            $.each($rootScope.freeMedia, function(i, obj) {
                                if (obj.hashedId == videoId) { isFreeVideo = true; return false;}
                            });
                            
                            if (!isFreeVideo) {
                                programPlaylist.currentVideo().pause();
                                $location.hash("lm-login");
                                anchorSmoothScroll.scrollTo("lm-login");
                            }
                        
                });
                    }
                }, 1000);
                
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
    
    lmApp.controller('MeditationsController', function($scope, $http, $sce, $q, $location, $filter, $timeout, $rootScope, anchorSmoothScroll, UserVideo, AdviserVideoCollection) {
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
                
                var isFreeVideo = false;
                $.each($rootScope.freeMedia, function(i, obj) {
                    if (obj.hashedId == meditationHashedId) { isFreeVideo = true; return false;}
                });
                
                if (!$rootScope.loggedIn && !isFreeVideo) {
                    $location.hash("lm-login");
                    anchorSmoothScroll.scrollTo("lm-login");
                } else {
                    
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
                $scope.selectedMeditationEmbed = $sce.trustAsHtml("<script charset=\"ISO-8859-1\" src=\"http://fast.wistia.com/assets/external/E-v1.js\" async></script><div id=\"meditationVideo\" class=\"wistia_embed wistia_async_" + $sce.trustAsHtml(meditationHashedId) + " center-block\" style=\"height:" + meditationHeight + "px;width:" + mediationWidth + "px\">&nbsp;</div>");
                
                $location.hash("meditation-embed");
                anchorSmoothScroll.scrollTo("meditation-embed");
                
                $timeout(function () {
                    var meditationVideo = Wistia.api("meditationVideo");
                if ($rootScope.loggedIn === true) {
                    meditationVideo.bind("end", function() {
                        var userVideoPromise = UserVideo.getByUserIdAndVideoId($rootScope.sessionUser.id, meditationHashedId);
                        userVideoPromise.then(function(videos) {
                            if (videos.length > 0) {
                                var userVideo = videos[0];
                                userVideo.playCount++;
                                userVideo.save(null, {
                                    success: function (savedVideo) {
                                        alert("User_Video updated!");
                                    },
                                    error: function(savedVideo, error) {
                                        alert("User_Video update failed, " + error.message);
                                    }
                                })
                            } else {
                                var userVideo = new UserVideo();
                                userVideo.userId = $rootScope.sessionUser.id;
                                userVideo.videoId = meditationHashedId;
                                userVideo.playCount = 1;
                                userVideo.save(null, {
                                    success: function(savedVideo) {
                                        alert("User_Video created!");
                                    },
                                    error: function(savedVideo, error) {
                                        alert("User_Video creation failed, " + error.message);
                                    }
                                })
                            }
                        })
                    });
                } else {
                    //check if meditationHashedId is in list of free videos
                    //pause and scroll to signup section
                    var isFreeVideo = false;
                    $.each($rootScope.freeMedia, function(i, obj) {
                        if (obj.hashedId == meditationHashedId) { isFreeVideo = true; return false;}
                    });
                }
                }, 1000);
            }
            } else {
                $scope.selectedMeditationId = -1;
                $scope.selectedMeditationEmbed = '';
            }
        }
        
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
        
        $scope.meditationPrevious = function() {
            $scope.currentPage= $scope.currentPage - 1;
            $location.hash("meditation-blurb-window");
            anchorSmoothScroll.scrollTo("meditation-blurb-window");
        }
        
        $scope.meditationNext = function() {
            $scope.currentPage= $scope.currentPage + 1;
            $location.hash("meditation-blurb-window");
            anchorSmoothScroll.scrollTo("meditation-blurb-window");
        }
        
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
            
            $scope.selectedAdviserMeditationEmbed = $sce.trustAsHtml("<script charset=\"ISO-8859-1\" src=\"http://fast.wistia.com/assets/external/E-v1.js\" async></script><div id=\"adviserMeditationVideo\" class=\"wistia_embed wistia_async_" + $sce.trustAsHtml(hashedId) + " center-block\" style=\"height:" + meditationHeight + "px;width:" + mediationWidth + "px\">&nbsp;</div>");
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
    
    lmApp.controller('LoginController', function($scope, $http, $q, LMUser, UserUser, Invite, $rootScope) {
        $scope.userSignup = new LMUser();
        $scope.userLogin = {};
        
        $scope.displayBilling = false;
        $scope.billingMonthly = false;
        $scope.billingAnnually = false;
        
        $scope.loginError = "";
        $scope.signupError = "";
        
        $scope.checkSignup = function() {
            $scope.signupError = "";
            //check if outstanding invite
            
            var userDfd = $q.defer();
            
            var userQuery = new Parse.Query(LMUser);
            userQuery.equalTo("username", $scope.userSignup.email);
            userQuery.find({
                success: function(userList) {
                    userDfd.resolve(userList);
                },
                error: function(userList) {
                    userDfd.reject(userList);
                }
            });
            
            userDfd.promise
                .then(function (userList) {
                    if (userList.length > 0) {
                        $scope.signupError = "Sign up failed, username already exists.";
                    } else {
            
            
            var inviteDfd = $q.defer();
 
            var query = new Parse.Query(Invite);
            query.equalTo("email", $scope.userSignup.email);
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
                        //if yes, signup
                        var newUserType = anInvite[0].newUserType;
                        var senderId = anInvite[0].invitedByUserId;
                        console.log(anInvite);
                        anInvite[0].destroy({
                            success: function(invite) {
                                var newUserId = signup(newUserType, 'invited');
                                var newUserUser = new UserUser();
                                newUserUser.sender_id = senderId;
                                newUserUser.target_id = newUserId;
                                newUserUser.save(null, {
                                    success: function(aUserUser) {
                                        console.log("User_User created.");
                                    },
                                    error: function(aUserUser, error) {
                                        console.log("Error creating User_User.");
                                    }
                                })
                            },
                            error: function(myObject, error) {
                                $scope.signupError = "Sign up failed, couldn't remove invite.";
                            }
                        });                
                    } else {
                        //if no
                        $scope.displayBilling = true;
                    }
            });
            }
            })
        }
        
        
        
        $scope.signupMonthly = function(token) {
            $http.get("https://lmserver-1281.appspot.com/subscribeMonthly/" + token.id + "/" + $scope.userSignup.email)
            .success(function(response, status, headers, config) {
                signup(0, JSON.parse(response).id);
            })
            .error(function(data, status) {
                // log error
                $scope.displayBilling = false;
                $scope.billingMonthly = false;
                $scope.signupError = "Monthly signup failed";
                console.log("Monthly signup failed");
                console.log(data);
                console.log(status);
            });
        }
        
        $scope.signupAnnually = function(token) {
            $http.get("https://lmserver-1281.appspot.com/subscribeAnnually/" + token.id + "/" + $scope.userSignup.email)
            .success(function(response, status, headers, config) {
                signup(0, JSON.parse(response).id);
            })
            .error(function(data, status) {
                // log error
                $scope.displayBilling = false;
                $scope.billingAnnually = false;
                $scope.signupError = "Monthly signup failed";
                console.log("Annual signup failed");
                console.log(data);
                console.log(status);
            });
        }
        
        function signup(userType, stripeID) {
            $scope.userSignup.username = $scope.userSignup.email;
            $scope.userSignup.userType = userType;
            $scope.userSignup.patientType = parseInt($scope.userSignup.patientType);
            $scope.userSignup.programEnrolledIn = "";
            $scope.userSignup.emailVerified = false;
            $scope.userSignup.stripeID = stripeID;
            console.log(stripeID);
            console.log($scope.userSignup.stripeID);
            $scope.userSignup.signUp(null, {
                success: function(newUser) {
                    var userId = newUser.id;
                    $scope.signupForm.$setUntouched();
                    Parse.User.logOut();
                    $rootScope.loggedIn = false;
                    $scope.displayBilling = false;
                    $scope.billingMonthly = false;
                    $scope.billingAnnually = false;
                    $scope.signupError = "You've successfully signed up! Check your email to verify.";
                    $scope.userSignup = {};
                    $rootScope.$apply();
                    return userId;
                },
                error: function(newUser, error) {
                    $scope.signupForm.$setUntouched();
                    $scope.signupError = "Signup failed.";
                    console.log(error);
                    $scope.userSignup.email.$setUntouched();
                    $scope.userSignup.password.$setUntouched();
                    $scope.userSignup.passwordConfirm.$setUntouched();
                    $rootScope.$apply();
                    return null;
                }
            });
        }
        
        $scope.login = function() {
            if ($rootScope.loggedIn == false) {
            LMUser.logIn($scope.userLogin.username, $scope.userLogin.password, {
                success: function(loggedInUser) {
                    if (loggedInUser.stripeID && loggedInUser.stripeID != 'invited') {
                        //check stripe
                        $http.get('https://lmserver-1281.appspot.com/customers/' + loggedInUser.stripeID) 
                            .success(function(data, status, headers, config) {
                                var stripeCustomer = JSON.parse(data);
                                var subscription = stripeCustomer.subscriptions.data[0];
                                if (!stripeCustomer.delinquent && subscription.status == "active") {
                                    location.reload();
                                } else {
                                    $scope.loginError = "Update your billing information."
                                    Parse.User.logOut();
                                }
                            })
                            .error(function(data, status, headers, config) {
                            // log error
                                console.log(status);
                                $scope.loginError = 'Failed to log in: ' + status;
                                Parse.User.logOut();
                            });
                    } else {
                        $rootScope.loggedIn = true;
                        $rootScope.$apply();
                        location.reload();
                    }
                },
                error: function(loggedInUser, error) {
                    console.log(error.code);
                    console.log(error.message);
                    $scope.loginError = 'Failed to log in: ' + error.message;
                    $rootScope.loggedIn = false;
                    $rootScope.$apply();
                }
            });
            } else {
                $scope.loginError = 'Attempted log in when user was already logged in.';
            }
        };
        
        $scope.forgotPassword = function() {
            var meditationVideo = Wistia.api("meditationVideo");
            console.log(meditationVideo);
            if ($scope.userLogin.username) {
                Parse.User.requestPasswordReset($scope.userLogin.username, {
                    success: function() {
                        $scope.loginError = "Password reset sent.";
                    },
                    error: function(error) {
                        // Show the error message somewhere
                        console.log(error.code);
                        console.log(error.message);
                        $scope.loginError = error.message;
                    }
                });
            } else {
                $scope.loginError = "Enter your email.";
            }
            
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
        
        $scope.inviteError = "";
        
        if ($rootScope.sessionUser) {
        $rootScope.sessionUser.activeUsersInvited().then(function(users) {
            $scope.activeUsers.activeUsersList = users;
            $scope.activeUsers.count = users.length;
        }, function(error) {
            console.log("Active users promise failed.");
        });
        
        $rootScope.sessionUser.invitesSent().then(function(invites) {
            $scope.invitesSent.invitesSentList = invites;
            $scope.invitesSent.count = invites.length;
        }, function(error) {
            console.log("Invite promise failed.");
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
            $scope.inviteError = "";
            var inviteDfd = $q.defer();
 
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
                    console.log(anInvite);
                    if (anInvite.length > 0) {
                        $scope.inviteError = 'Already been invited, can\'t again.';
                    } else {
                        $scope.inviteTarget.invitedByUserId = $rootScope.sessionUser.id;
                        $scope.inviteTarget.newUserType = ($rootScope.sessionUser.userType - 1);
                        $scope.inviteTarget.save(null, {
                            success: function(sentInvite) {
                                
                                //send email
                                $http.post("https://lmserver-1281.appspot.com/invite/" + sentInvite.email + "/" + sentInvite.name)
                                    .success(function(data, status, headers, config) {
                                      $scope.inviteError = "Invite Sent!";
                                        $scope.inviteForm.$setUntouched();
                                    $scope.inviteTarget = new Invite();
                                    $rootScope.sessionUser.invitesSent().then(function(invites) {
                                        $scope.invitesSent.invitesSentList = invites;
                                        $scope.invitesSent.count = invites.length;
                                    }, function(error) {
                                        console.log("Invite promise failed.");
                                    });
                                })
                                .error(function(data, status, headers, config) {
                                    // log error
                                    console.log(data);
                                    console.log(status);
                                    $scope.inviteError = "Invite failed.";
                                    sentInvite.destroy({
                                        success: function(invite) {
                                            $scope.inviteError = "Invite failed.";
                                        },
                                        error: function(myObject, error) {
                                            $scope.inviteError = "Invite Failed. Rollback Failed.";
                                        }
                                    });
                                    $scope.inviteTarget = new Invite();
                                });
                            },
                            error: function(sentInvite, error) {
                                $scope.inviteError = "Failed to send Invite: " + error.message;
                            }
                        });
                        
                        
                    }
                })
                .catch(function (error) {
                    // log error
                    alert("Invite retrieval promise failed.");
                });
       };
    });
    
    lmApp.controller('LogoutController', function($scope, $http, $rootScope, $q) {
        $scope.displayReady = false;
        $scope.signoutError = "";
        $scope.canCancel = false;
        
        var stripeCustomer;
        var subscription;
        
        if ($rootScope.loggedIn) {
            if ($rootScope.sessionUser.stripeID && $rootScope.sessionUser.stripeID != 'invited') {
                $http.get('https://lmserver-1281.appspot.com/customers/' + $rootScope.sessionUser.stripeID)
                    .success(function(data, status, headers, config) {
                        stripeCustomer = JSON.parse(data);
                        subscription = stripeCustomer.subscriptions.data[0];
                        if (subscription.status == "active" && !subscription.cancel_at_period_end) {
                            $scope.canCancel = true;
                        }     
                    })
                    .error(function(data, status, headers, config) {
                        // log error
                        console.log(status);
                        $scope.displayReady = false;
                        $scope.signoutError = "Error retrieving customer.";
                    })
            }
        }
            
        $scope.logout = function() {
            Parse.User.logOut();
            $rootScope.loggedIn = false;
            location.reload();
        };
        
        $scope.cancelSubscription = function() {
            if (stripeCustomer && subscription) {
                $http.get('https://lmserver-1281.appspot.com/cancel/' + stripeCustomer.id + '/' + subscription.id)
                .success(function(data, status, headers, config) {
                    var subscription = JSON.parse(data);
                    console.log(subscription);
                    if (subscription.cancel_at_period_end) {
                        $scope.displayReady = false;
                        $scope.signoutError = "Subscription canceled, you will no longer be billed.";
                        $scope.canCancel = false;
                    } else {
                        $scope.displayReady = false;
                        $scope.signoutError = "Subscription was not canceled.";
                    }
                })
                .error(function(data, status, headers, config) {
                    console.log(status);
                    $scope.displayReady = false;
                    $scope.signoutError = "Error sending cancel request.";
                });
            }
        }
    });
    
    lmApp.controller('ContactController', function($scope, $http, $q) {
        
    });
    
})(window.angular);