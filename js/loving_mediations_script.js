var lm_menu_height = 0;
jQuery(function($) {
    
    $(document).ready( function() {
        
        lm_menu_height = $('.lm-menu').height();
        // scroll spy to auto active the nav item
        $('body').scrollspy({ target: '#lm-nav-bar', offset: top_menu_height + 10 });
        
        // scroll to specific id when click on menu
        $('.lm-menu .navbar-nav a').click(function(e){
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