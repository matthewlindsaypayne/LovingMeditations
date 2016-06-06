(function(angular) {
  'use strict';
    
    var PATIENT_TYPE = 'Patient';
    var CAREGIVER_TYPE = 'Caregiver';
    
    var lmApp = angular.module('lmApp', []);
    
    lmApp.run(function() {
        Parse.initialize("JEgXK9fpAD", "gmSkeY1CsB");
        Parse.serverURL = "https://lmserver-1281.appspot.com/parse";
    });

    lmApp.controller('LovingMeditationsController', ['$scope', function($scope) {
        
    }]);

    lmApp.controller('InspirationsController', function($scope, $q) {
        var InspirationsDfd = $q.defer();
        var Inspirations = Parse.Object.extend('Inspirations');
        var queryInspirations = new Parse.Query(Inspirations);
        queryInspirations.equalTo("author", "Yoda");
        queryInspirations.first().then(function (data) {
  	         InspirationsDfd.resolve(data);
        }, function (error) {
  	         InspirationsDfd.reject(error);
        });
        InspirationsDfd.promise
            .then(function (inspiration) {
                $scope.currentInspiration = inspiration;
        })
            .catch(function (error) {
            // do something w/ this
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
                console.log(programsList);
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
                $scope.selectedProgramId = programId;
                $scope.selectedProgramEmbedSrc = "//fast.wistia.net/embed/playlists/" + programId + "?media_0_0%5BautoPlay%5D=false&media_0_0%5BcontrolsVisibleOnLoad%5D=false&theme=tab&version=v1&videoOptions%5BautoPlay%5D=true&videoOptions%5BvideoHeight%5D=360&videoOptions%5BvideoWidth%5D=640&videoOptions%5BvolumeControl%5D=true"
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
        /*var ProgramsDfd = $q.defer();
        var xmlHttp = new XMLHttpRequest();
        var url = "https://api.wistia.com/v1/projects.json?api_password=5450cfdc1299ebebee9129dd19dc06f02db688040667cada25ae12a9924877ee";
        var Programs = ;
        var ProgramsList = ;*/
        
    });
    
    lmApp.controller('MeditationsController', function($scope, $http, $q) {
        var videosList;
        $http.get("https://api.wistia.com/v1/projects/y9r6xq82wn.json?api_password=5450cfdc1299ebebee9129dd19dc06f02db688040667cada25ae12a9924877ee")
            .success(function(data, status, headers, config) {
                videosList = data.medias;
                console.log(videosList);
        })
    });
    
    lmApp.filter('ProgramNameFilter', function () {
        return function(programName) {
                    var programDisplayName = programName.split('_')[2];
                    return programDisplayName;
                }
    });
    
    lmApp.controller('LoginController', function($scope, $http, $q) {
        
    });
    
    lmApp.controller('InvitesController', function($scope, $http, $q) {
        
    });
    
    lmApp.controller('ContactController', function($scope, $http, $q) {
        
    });
    
})(window.angular);


 var lm_menu_height = 0;
jQuery(function($) {
    
    $(document).ready( function() {
        
        lm_menu_height = $('#lm-menu').height();
        // scroll spy to auto active the nav item
        $('body').scrollspy({ target: '#lm-nav-bar', offset: lm_menu_height + 10 });
        
        // scroll to specific id when click on menu
        $('#lm-menu .navbar-nav a').click(function(e){
            e.preventDefault(); 
            var linkId = $(this).attr('href');
            scrollTo(linkId);
            if($('.navbar-toggle').is(":visible") == true){
                $('.navbar-collapse').collapse('toggle');
            }
            $(this).blur();
            return false;
        });
        
    });
});

// scroll animation 
function scrollTo(selectors)
{

    if(!$(selectors).size()) return;
    var selector_top = $(selectors).offset().top - lm_menu_height;
    $('html,body').animate({ scrollTop: selector_top }, 'slow');

} 