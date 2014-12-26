// ************************* Keep The Accordion Selected State To Fill The Background ************************* //
jQuery('.acc-list-group a').click(function () {
    jQuery('.acc-list-group a').removeClass('active');
    jQuery(this).addClass('active');
});

// ************************* Scroll Top Top ************************* //
(function (a) { a.fn.scrollToTop = function (c) { var d = { speed: 800 }; c && a.extend(d, { speed: c }); return this.each(function () { var b = a(this); a(window).scroll(function () { 50 < a(this).scrollTop() ? b.fadeIn() : b.fadeOut() }); b.click(function (b) { b.preventDefault(); a("body, html").animate({ scrollTop: 0 }, d.speed) }) }) } })(jQuery);


jQuery(document).ready(function () {
    // ************************* Popover ************************* //
    // Popover Bottom
    jQuery(".acc-popover-general").popover({
        placement: 'bottom',
        container: '#popupContainerHolder',
        html: true,
        content: function () {
            return jQuery(this).next('.acc-general-popover-content-container').html();
        }
    });

    // Popover Left
    jQuery(".acc-popover-help").popover({
        placement: 'left',
        container: '#popupContainerHolder',
        html: true,
        content: function () {
            return jQuery(this).next('.acc-popover-help-content-container').html();
        }
    });

    jQuery('body').on('click', function (e) {
        if (jQuery(e.target).data('toggle') !== 'popover'
            && jQuery(e.target).parents('.popover.in').length === 0) {
            jQuery('[data-toggle="popover"]').popover('hide');
        }
    });

    // Hide Popover When Clicking On Another
    jQuery('[data-toggle="popover"]').on('click', function (e) {
        jQuery('[data-toggle="popover"]').not(this).popover('hide');
    });

    // ************************* Data Table ************************* //
    /*
    jQuery('#acc-analyst-performance-overview-table').dataTable();
    jQuery('#acc-data-extract-definitions-table').dataTable();

    jQuery('#acc-standard-report-a-first-table').dataTable();
    jQuery('#acc-standard-report-a-second-table').dataTable();
    jQuery('#acc-standard-report-a-third-table').dataTable();
    jQuery('#acc-standard-report-a-fourth-table').dataTable();

    jQuery('#detail-on-resolution-report-first-table').dataTable();
    jQuery('#detail-on-resolution-report-second-table').dataTable();
    jQuery('#detail-on-resolution-report-third-table').dataTable();
    */
    // ************************* Back To Top ************************* //
    jQuery("#toTop").scrollToTop(500);
});

//***************************************** Main Navigation Hover *****************************************
jQuery(function () {
    jQuery(".navbar-nav > .dropdown").hover(
        function () {
            jQuery(this).addClass('open');
        },

        function () {
            jQuery(this).removeClass('open');
        }
    );
});
