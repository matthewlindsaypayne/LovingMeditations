(function(angular) {
  'use strict';
    
    var lmApp = angular.module('lmApp', []);
    
    lmApp.run(function() {
        Parse.initialize("JEgXK9fpAD", "gmSkeY1CsB");
        Parse.serverURL = "https://lmserver-1281.appspot.com/parse";
    });

    lmApp.controller('LovingMeditationsController', ['$scope', function($scope) {
        
    }])

    lmApp.controller('InspirationsController', function($scope, $q) {
        var InspirationsDfd = $q.defer();
        var Inspirations = Parse.Object.extend('Inspirations');
        var queryInspirations = new Parse.Query(Inspirations);
        queryInspirations.equalTo("author", "Yoda");
        queryInspirations.first().then(function (data) {
            console.log(data);
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
})(window.angular);


/* var lm_menu_height = 0;
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

} */