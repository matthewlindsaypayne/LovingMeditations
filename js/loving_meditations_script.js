(function(angular) {
  'use strict';
    
    var PATIENT_TYPE = 'Patient';
    var CAREGIVER_TYPE = 'Caregiver';
    
    var lmApp = angular.module('lmApp', []);
    
    lmApp.run(function() {
        Parse.initialize("JEgXK9fpAD", "gmSkeY1CsB");
        Parse.serverURL = "https://lmserver-1281.appspot.com/parse";
    });

    lmApp.controller('LovingMeditationsController', function($scope) {
        $scope.loggedIn = true;
        $scope.canInvite = true;
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
        });
        
        inspirationsDfd.promise
            .then(function (inspiration) {
                $scope.currentInspiration = inspiration.attributes.text + "\n -" + inspiration.attributes.author;
        })
            .catch(function (error) {
            // log error
            console.log("Inspiration retrieval failed.");
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
        
        $http.get("https://api.wistia.com/v1/medias.json?api_password=5450cfdc1299ebebee9129dd19dc06f02db688040667cada25ae12a9924877ee")
            .success(function(data, status, headers, config) {
                $scope.videosList = data;
                console.log($scope.videosList);
        });
        
        $scope.numberOfPages = function() {
            try {
                return Math.ceil($scope.videosList.length/$scope.pageSize);
            } catch (err) {
                console.log("Meditations not yet loaded.");
            }
        }
        
        $scope.selectMeditation = function(meditationId, meditationHashedId) {
            if ($scope.selectedMeditationId != meditationId) {
                $scope.selectedMeditationId = meditationId;
                $scope.selectedMeditationEmbed = $sce.trustAsHtml("<script charset=\"ISO-8859-1\" src=\"//fast.wistia.com/assets/external/E-v1.js\" async></script><div class=\"wistia_embed wistia_async_" + $sce.trustAsHtml(meditationHashedId) + " center-block\" style=\"height:360px;width:640px\">&nbsp;</div>");
                console.log("Now Showing!");
                $location.hash("meditation-embed");
                anchorSmoothScroll.scrollTo("meditation-embed");
                
            } else {
                $scope.selectedMeditationId = -1;
                $scope.selectedMeditationEmbed = '';
                console.log("Now Hiding!");
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
        }
        
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
    
    lmApp.controller('LoginController', function($scope, $http, $q) {
        
    });
    
    lmApp.controller('InvitesController', function($scope, $http, $q) {
        
    });
    
    lmApp.controller('ContactController', function($scope, $http, $q) {
        
    });
    
    lmApp.directive('scrollSpy', function ($window) {
  return {
    restrict: 'A',
    controller: function ($scope) {
      $scope.spies = [];
      this.addSpy = function (spyObj) {
        $scope.spies.push(spyObj);
      };
    },
    link: function (scope, elem, attrs) {
      var spyElems;
      spyElems = [];

      scope.$watch('spies', function (spies) {
        var spy, _i, _len, _results;
        _results = [];

        for (_i = 0, _len = spies.length; _i < _len; _i++) {
          spy = spies[_i];

          if (spyElems[spy.id] == null) {
            _results.push(spyElems[spy.id] = elem.find('#' + spy.id));
          }
        }
        return _results;
      });

      $($window).scroll(function () {
        var highlightSpy, pos, spy, _i, _len, _ref;
        highlightSpy = null;
        _ref = scope.spies;

        // cycle through `spy` elements to find which to highlight
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          spy = _ref[_i];
          spy.out();

          // catch case where a `spy` does not have an associated `id` anchor
          if (spyElems[spy.id].offset() === undefined) {
            continue;
          }

          if ((pos = spyElems[spy.id].offset().top) - $window.scrollY <= 0) {
            // the window has been scrolled past the top of a spy element
            spy.pos = pos;

            if (highlightSpy == null) {
              highlightSpy = spy;
            }
            if (highlightSpy.pos < spy.pos) {
              highlightSpy = spy;
            }
          }
        }

        // select the last `spy` if the scrollbar is at the bottom of the page
        if ($(window).scrollTop() + $(window).height() >= $(document).height()) {
          spy.pos = pos;
          highlightSpy = spy;
        }        

        return highlightSpy != null ? highlightSpy["in"]() : void 0;
      });
    }
  };
});

    lmApp.directive('spy', function ($location, $anchorScroll, anchorSmoothScroll) {
  return {
    restrict: "A",
    require: "^scrollSpy",
    link: function(scope, elem, attrs, affix) {
      elem.click(function () {
        $location.hash(attrs.spy);
        anchorSmoothScroll.scrollTo(attrs.spy);
      });

      affix.addSpy({
        id: attrs.spy,
        in: function() {
          elem.addClass('active');
        },
        out: function() {
          elem.removeClass('active');
        }
      });
    }
  };
});
    
lmApp.service('anchorSmoothScroll', function(){
    
    this.scrollTo = function(eID) {

        // This scrolling function 
        // is from http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript
        
        var startY = currentYPosition();
        var stopY = elmYPosition(eID) - $('#lm-menu').height() + 10;
        var distance = stopY > startY ? stopY - startY : startY - stopY;
        if (distance < 100) {
            scrollTo(0, stopY); return;
        }
        var speed = Math.round(distance / 100);
        if (speed >= 20) speed = 20;
        var step = Math.round(distance / 25);
        var leapY = stopY > startY ? startY + step : startY - step;
        var timer = 0;
        if (stopY > startY) {
            for ( var i=startY; i<stopY; i+=step ) {
                setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
                leapY += step; if (leapY > stopY) leapY = stopY; timer++;
            } return;
        }
        for ( var i=startY; i>stopY; i-=step ) {
            setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
            leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
        }
        
        function currentYPosition() {
            // Firefox, Chrome, Opera, Safari
            if (self.pageYOffset) return self.pageYOffset;
            // Internet Explorer 6 - standards mode
            if (document.documentElement && document.documentElement.scrollTop)
                return document.documentElement.scrollTop;
            // Internet Explorer 6, 7 and 8
            if (document.body.scrollTop) return document.body.scrollTop;
            return 0;
        }
        
        function elmYPosition(eID) {
            var elm = document.getElementById(eID);
            var y = elm.offsetTop;
            var node = elm;
            while (node.offsetParent && node.offsetParent != document.body) {
                node = node.offsetParent;
                y += node.offsetTop;
            } return y;
        }

    };
    
});
    
})(window.angular);