(function( $, undefined ) {

	$.fn.rolltext = function(){
	   	return this.each(function(){

            var roll = (function (msec) {
                var tm = 0;

                return function(){
                    tm && clearTimeout(tm);
                    tm = setTimeout(function() {
                            if (isRolling) {
                                jList.animate({scrollTop: 25 * i}, 'slow', 'swing', function(){
                                    i++;
                                    i %= n;
                                    if (i == 0) {
                                        jList.scrollTop(0);
                                    }
                                    setTimeout(roll, Math.random()*1000);
                                });
                            } else {
                                roll();
                            }
                        }, msec);
                }
            })(2000),

            isRolling = true,

            jList = $(this)
                    .bind('mouseenter',function(){
                        isRolling = false;
                    })
                    .bind('mouseleave',function () {
                        isRolling = true;
                    }),
            i = 0, n;

            jList.append(jList.children(':first').clone());
            n = jList.children("li").length;
            roll();
        });
	};

})(jQuery);

$(document)
.on("swipeleft swiperight", ".ui-page-active[data-role=page]", function(evt){
    var goThere;
    if ( evt.type === 'swipeleft' ) {
        goThere = $('.ui-navbar>ul>li>a.ui-btn-active', this).parent().index() + 1 ;
        if (goThere > 3) goThere -= 4;
    } else if ( evt.type === 'swiperight' ) {
        goThere = $('.ui-navbar>ul>li>a.ui-btn-active', this).parent().index() - 1 ;
        if (goThere < 0 ) goThere += 4;
    }

    $.mobile.changePage($('.ui-navbar>ul>li', this).eq(goThere).find('a')[0].href, {
        role : "page",
        transition : "slide",
        reverse : evt.type === 'swiperight'
    });
}).on('pageinit', "[data-role=dialog]", function(evt){
    $('#nbm-rolltext').rolltext();
});