(function(angular) {
  'use strict';
    
    var modelsModule = angular.module('lmApp.models', []);
    
    modelsModule.factory('LMUser', function($q, Invite) {
        var User = Parse.User.extend({
            initialize: function(attrs, options) {
                this.userType = 0;
                this.patientType = 0;
                this.programEnrolledIn = 0;
            },
            
            activeUsersInvited: function() {
                var deferOuter = $q.defer();
                
                var innerQuery = new Parse.Query("User_User");
                innerQuery.equalTo("sender_id", this.id);
                var query = new Parse.Query(this);
                query.matchesQuery("id", innerQuery);
                query.descending("lastLogin");
                query.find({
                    success: function(users) {
                        deferOuter.resolve(users);
                    },
                    error: function(error) {
                        alert("Failed loading active users.");
                        deferOuter.reject(error);
                    }
                });
                
                return deferOuter.promise;
            },
            
            invitesSent: function() {
                var defer = $q.defer();
                
                var query = new Parse.Query(Invite);
                query.equalTo("invitedByUserId", this.id);
                query.descending("CreatedAt");
                query.find({
                    success: function(invites) {
                        defer.resolve(invites);
                    },
                    error: function(error) {
                        alert("Failed loading invites.");
                        defer.reject(error);
                    }
                });
                
                return defer.promise;
            }
        });
        
        
        
        // Username property
        User.prototype.__defineGetter__("username", function() {
            return this.get("username");
        });
        User.prototype.__defineSetter__("username", function(aValue) {
            return this.set("username", aValue);
        });
        
        // Password property
        User.prototype.__defineGetter__("password", function() {
            return this.get("password");
        });
        User.prototype.__defineSetter__("password", function(aValue) {
            return this.set("password", aValue);
        });
        
        // Email property
        User.prototype.__defineGetter__("email", function() {
            return this.get("email");
        });
        User.prototype.__defineSetter__("email", function(aValue) {
            return this.set("email", aValue);
        });
        
        // LastLogin property
        User.prototype.__defineGetter__("lastLogin", function() {
            return this.get("lastLogin");
        });
        User.prototype.__defineSetter__("lastLogin", function(aValue) {
            return this.set("lastLogin", aValue);
        });
        
        // UserType property
        User.prototype.__defineGetter__("userType", function() {
            return this.get("userType");
        });
        User.prototype.__defineSetter__("userType", function(aValue) {
            return this.set("userType", aValue);
        });
        
        // PatientType property
        User.prototype.__defineGetter__("patientType", function() {
            return this.get("patientType");
        });
        User.prototype.__defineSetter__("patientType", function(aValue) {
            return this.set("patientType", aValue);
        });
        
        // ProgramEnrolledIn property
        User.prototype.__defineGetter__("programEnrolledIn", function() {
            return this.get("programEnrolledIn");
        });
        User.prototype.__defineSetter__("programEnrolledIn", function(aValue) {
            return this.set("programEnrolledIn", aValue);
        });
        
        // EmailVerified property
        User.prototype.__defineGetter__("emailVerified", function() {
            return this.get("emailVerified");
        });
        User.prototype.__defineSetter__("emailVerified", function(aValue) {
            return this.set("emailVerified", aValue);
        });
        
        return User;
    });
    
    modelsModule.factory('Invite', function($q) {
        var Invite = Parse.Object.extend('Invite', {
            initialize: function(attrs, options) {
                this.invitedByUserId = {};
                this.email = "";
            }
        });
        
        
        
        // InvitedByUserId property
        Invite.prototype.__defineGetter__("invitedByUserId", function() {
            return this.get("invitedByUserId");
        });
        Invite.prototype.__defineSetter__("invitedByUserId", function(aValue) {
            return this.set("invitedByUserId", aValue);
        });
        
        // Email property
        Invite.prototype.__defineGetter__("email", function() {
            return this.get("email");
        });
        Invite.prototype.__defineSetter__("email", function(aValue) {
            return this.set("email", aValue);
        });
        
        return Invite;
    });
    
    modelsModule.factory('UserVideo', function() {
        var UserVideo = Parse.Object.extend('UserVideo', {
            initialize: function(attrs, options) {
            }
        }, 
            {
                getByUserIdAndVideoId: function(userId, videoId) {
                    var userVideoDfd = $q.defer();
                    var queryUserVideo = new Parse.Query(this);
                    queryUserVideo.equalTo("userId", userId);
                    queryUserVideo.equalTo("videoId", videoId);
                    queryInspirations.find({
                        success: function(aUserVideo) {
                        userVideoDfd.resolve(aUserVideo);
                    },
                        error: function(error) {
                            console.log(error);
                            userVideoDfd.reject(error);
                            return null;
                        }
                    });
                    
                    return userVideoDfd.promise;
                }
        });
        
        // UserId property
        UserVideo.prototype.__defineGetter__("userId", function() {
            return this.get("userId");
        });
        UserVideo.prototype.__defineSetter__("userId", function(aValue) {
            return this.set("userId", aValue);
        });
        
        // VideoId property
        UserVideo.prototype.__defineGetter__("videoId", function() {
            return this.get("videoId");
        });
        UserVideo.prototype.__defineSetter__("videoId", function(aValue) {
            return this.set("videoId", aValue);
        });
        
        // Playcount property
        UserVideo.prototype.__defineGetter__("playCount", function() {
            return this.get("playCount");
        });
        UserVideo.prototype.__defineSetter__("playCount", function(aValue) {
            return this.set("playCount", aValue);
        });
        
        return UserVideo;
    });
    
    modelsModule.factory('AdviserVideo', function() {
        var AdviserVideo = function() {
            this.hashedId = 0;
            this.name = '';
            this.description = '';
            this.duration = null;
            this.thumbnailUrl = '';
            this.tags = {};
        }
        
        return AdviserVideo;
    });
    
    modelsModule.factory('AdviserVideoCollection', function(AdviserVideo) {
        var AdviserVideoCollection = function() {
            this.adviserVideos = [];
        };
        
        AdviserVideoCollection.prototype.addVideo = function(hashedId, name, description, duration, thumbnailUrl, tags) {
            var adviserVideo = new AdviserVideo();
            adviserVideo.hashedId = hashedId;
            adviserVideo.name = name;
            adviserVideo.description = description;
            adviserVideo.duration = duration;
            adviserVideo.thumbnailUrl = thumbnailUrl;
            adviserVideo.tags = tags;
            
            this.adviserVideos.push(adviserVideo);
        }
        
        AdviserVideoCollection.prototype.removeVideo = function(videoId) {
            var videoToRemove = this.adviserVideos.filter(function(video) {return video.hashedId == videoId;} );
            this.adviserVideos.splice(this.adviserVideos.indexOf(videoToRemove), 1);
        }
        
        AdviserVideoCollection.prototype.keepTag = function(tagId) {
            console.log(this.adviserVideos);
            var adviserVideosToRemove = [];
            for (var i = 0; i < this.adviserVideos.length; i++) {
                var video = this.adviserVideos[i]
                if (!video.tags.includes(tagId)) {
                    adviserVideosToRemove.push(video);
                }
            }
            
            for (var i = 0; i < adviserVideosToRemove.length; i++) {
                this.adviserVideos.splice(this.adviserVideos.indexOf(adviserVideosToRemove[i]), 1);
            }
        }
        
        AdviserVideoCollection.prototype.removeTag = function(tagId) {
            var adviserVideosToRemove = [];
            for (var i = 0; i < this.adviserVideos.length; i++) {
                var video = this.adviserVideos[i];
                if (video.tags.includes(tagId)) {
                    adviserVideosToRemove.push(video);
                }
            }
            
            for (var i = 0; i < adviserVideosToRemove.length; i++) {
                this.adviserVideos.splice(this.adviserVideos.indexOf(adviserVideosToRemove[i]), 1);
            }
        }
        
        AdviserVideoCollection.prototype.getNextTagIndex = function() {
            var tagCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            //iterate through adviserVideos
            for (var i = 0; i < this.adviserVideos.length; i++) {
                //tally tag counts
                for (var j = 0; j < this.adviserVideos[i].tags.length; j++) {
                    tagCounts[this.adviserVideos[i].tags[j]] += 1;
                }
            }
            
            //return highest
            return (indexOfMinAboveZero(tagCounts) - 1);
        }
        
        AdviserVideoCollection.prototype.isReadyToDisplay = function() {
            if (this.adviserVideos.length == 1) {
                //if there's only one video left remaining
                return true;
            } else {
                var tags = this.adviserVideos[0].tags;
                //for remaining adviserVideos, compile growing list of tags
                for (var i = 0; i < this.adviserVideos.length; i++) {
                    //if current video adds new tag, false
                    //if current video is missing a tag, false
                    if (!arraysEqual(this.adviserVideos[i].tags, tags)) {
                        return false;
                    }
                }
                //if iterate through all, true
                return true;
            }
        }
        
        AdviserVideoCollection.prototype.getVideoIdToDisplay = function() {
            return this.adviserVideos[Math.floor(Math.random() * this.adviserVideos.length)].hashedId;
        }
        
        function arraysEqual(arr1, arr2) {
            if(arr1.length !== arr2.length)
                return false;
            for(var i = arr1.length; i--;) {
                if(arr1[i] !== arr2[i])
                return false;
            }
            return true;
        }
        
        function indexOfMinAboveZero(arr) {
            if (arr.length === 0) {
                return -1;
            }

            var minAboveZero = arr[0];
            var minAboveZeroIndex = 0;
            
            for (var i = 1; i < arr.length; i++) {
                if (minAboveZero == 0) {
                    minAboveZeroIndex = i;
                    minAboveZero = arr[i];
                } else if (arr[i] != 0 && arr[i] < minAboveZero) {
                    minAboveZeroIndex = i;
                    minAboveZero = arr[i];
                } else if (arr[i] != 0 && arr[i] == minAboveZero) {
                    var chosenIndex = Math.random() < 0.5 ? i : minAboveZeroIndex;
                    minAboveZeroIndex = chosenIndex;
                    minAboveZero = arr[chosenIndex];
                }
            }
            if (minAboveZero > 0) {
                return minAboveZeroIndex;
            } else {
                return -1;
            }
            
        }
        
        return AdviserVideoCollection;
    });
    
})(window.angular);