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