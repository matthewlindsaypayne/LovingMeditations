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
        console.log($rootScope.sessionUser);
    });

    lmApp.controller('LovingMeditationsController', function($scope) {
        $scope.canInvite = true;
        
        $scope.logout = function() {
            Parse.User.logOut();
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
                $scope.selectedProgramEmbedSrc = "//fast.wistia.net/embed/playlists/" + programHashedId + "?media_0_0%5BautoPlay%5D=false&media_0_0%5BcontrolsVisibleOnLoad%5D=false&theme=tab&version=v1&videoOptions%5BautoPlay%5D=true&videoOptions%5BvideoHeight%5D=360&videoOptions%5BvideoWidth%5D=640&videoOptions%5BvolumeControl%5D=true";
                $scope.selectedProgramId = programId;
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
        
        $scope.trustSrc = function(src) {
            return $sce.trustAsResourceUrl(src);
        };
    });
    
    lmApp.controller('MeditationsController', function($scope, $http, $sce, $q, $location, anchorSmoothScroll) {
        $scope.selectedMeditationId = -1;
        $scope.selectedMeditationEmbed = '';
        $scope.currentPage = 0;
        $scope.pageSize = 10;
        $scope.videosList = [];
        $scope.videoCount = 0;
        
        $http.get("https://api.wistia.com/v1/medias.json?api_password=5450cfdc1299ebebee9129dd19dc06f02db688040667cada25ae12a9924877ee")
            .success(function(data, status, headers, config) {
                $scope.videosList = data;
                $scope.videoCount = data.length;
        });
        
        $scope.numberOfPages = function() {
            try {
                return Math.ceil($scope.videoCount/$scope.pageSize);
            } catch (err) {
                console.log("Meditations not yet loaded.");
            }
        };
        
        $scope.selectMeditation = function(meditationId, meditationHashedId) {
            if ($scope.selectedMeditationId != meditationId) {
                $scope.selectedMeditationId = meditationId;
                $scope.selectedMeditationEmbed = $sce.trustAsHtml("<script charset=\"ISO-8859-1\" src=\"//fast.wistia.com/assets/external/E-v1.js\" async></script><div class=\"wistia_embed wistia_async_" + $sce.trustAsHtml(meditationHashedId) + " center-block\" style=\"height:360px;width:640px\">&nbsp;</div>");
                $location.hash("meditation-embed");
                anchorSmoothScroll.scrollTo("meditation-embed");
                
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
            var thumbnailWidth = "250";
            var thumbnailHeight = "180";
            return item.replace("image_crop_resized=200x120", "image_crop_resized=" + thumbnailWidth + "x" + thumbnailHeight);
        };
        
        //$scope.trustedEmbedCode = $sce.trustAsHtml($scope.selectedMeditationEmbedCode);
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
            try {
                start = +start; //parse to int
                return input.slice(start);
                }
            catch(err) {
                console.log("Meditations not yet loaded.");
            }
        }
    });
    
    lmApp.controller('LoginController', function($scope, $http, $q, LMUser, $rootScope) {
        $scope.userSignup = new LMUser();
        $scope.userLogin = {};
        
        $scope.signup = function() {
            $scope.userSignup.lastLogin = "";
            $scope.userSignup.userType = 0;
            $scope.userSignup.programEnrolledIn = "";
            $scope.userSignup.emailVerified = false;
            $scope.userSignup.signUp(null, {
                success: function(newUser) {
                    alert('New object created with objectId: ' + newUser.id);
                },
                error: function(newUser, error) {
                    console.log(error);
                    alert('Failed to create new object, with error code: ' + error.message);
                }
            });
        };
        
        $scope.login = function() {
            LMUser.logIn($scope.userLogin.username, $scope.userLogin.password, {
                success: function(loggedInUser) {
                    alert('Logged in as user with objectId: ' + loggedInUser.id);
                },
                error: function(loggedInUser, error) {
                    alert('Failed to log in, with error code: ' + error.message);
                }
            });
        };
        
        
    });
    
    lmApp.controller('InvitesController', function($scope, $http, $q, $rootScope, Invite) {
        $scope.activeUsers = {};
        $scope.invitesSent = {};
        
        $scope.activeUsers.currentPage = 0;
        $scope.invitesSent.currentPage = 0;
        
        $scope.activeUsers.pageSize = 10;
        $scope.invitesSent.pageSize = 10;
        
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
        
        $scope.numberOfPages = function(listLength, pageSize) {
            try {
                return Math.ceil(listLength/pageSize);
            } catch (err) {
                console.log("Invites section not yet loaded.");
            }
        };
        
        $scope.sendInvite = function() {
           //send email
           alert("Email sent!");
           
           $scope.inviteTarget.invitedByUserId = $rootScope.sessionUser.id;
           $scope.inviteTarget.save(null, {
               success: function(sentInvite) {
                   alert('Sent invite to ' + sentInvite.name);
                   $scope.inviteTarget = new Invite();
               },
               error: function(sentInvite, error) {
                   alert('Failed to send invite, with error code: ' + error.message);
               }
           });
       }
    });
    
    lmApp.controller('ContactController', function($scope, $http, $q) {
        $scope.sendContactUs = function() {
            alert("Contact message sent!");
        }
    });
    
})(window.angular);