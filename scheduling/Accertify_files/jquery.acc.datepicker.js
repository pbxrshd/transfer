/**
 * Requires jquery-ui-i18n.js to be included. Assumes region comes in format
 * language_region, such as: "en_GB". The function will attempt to find by both
 * language and region, then by only language, and if not found, it will default
 * to English.
 *
 * jQuery locale support: af, ar-DZ, ar, az, be, bg, bs, ca, cs, cy-GB, da,
 * de, el, en-AU, en-GB, en-NZ, eo, es, et, eu, fa, fi, fo, fr-CA, fr-CH, fr,
 * gl, he, hi, hr, hu, hy, id, is, it, ja, ka, kk, km, ko, ky, lb, lt, lv, mk,
 * ml, ms, nb, nl-BE, nl, nn, no, pl, pt-BR, pt, rm, ro, ru, sk, sl, sq, sr-SR,
 * sr, sv, ta, th, tj, tr, uk, vi, zh-CN, zh-HK, zh-TW
 *
 * Custom locale support: en (equiv to en-US), en-IN, en-US, en-UK (dateformat=en-US),
 * es-CL (based on 'es' with modified dateFormat), en-CA (based on en-GB),
 * es-US (based on 'es' with modified dateFormat)
 *
 * Locales using default language:
 */


;(function($){
    $(document).ready(function() { //make sure datepicker regionals are loaded before calling
        $.datepicker.regional['en'] = $.datepicker.regional[''];         //Explicitly set 'en' to 'en-US'
        $.datepicker.regional['en-IN'] = $.datepicker.regional['en-GB']; //Same as GB, d/M/yy format
        $.datepicker.regional['en-US'] = $.datepicker.regional[''];      //Explicitly set 'en-US'
        $.datepicker.regional['en-UK'] = $.datepicker.regional[''];      //Set to en-US, requires M/d/yy format
        $.datepicker.setDefaults($.datepicker.regional['en']);
        $.datepicker.setDefaults($.datepicker.regional['en-IN']);
        $.datepicker.setDefaults($.datepicker.regional['en-US']);
        $.datepicker.setDefaults($.datepicker.regional['en-UK']);

        //Custom support for Chile (es-CL), based on 'es' (with modification to dateFormat)
        $.datepicker.regional['es-CL'] = {
            closeText: 'Cerrar',
            prevText: '&#x3c;Ant',
            nextText: 'Sig&#x3e;',
            currentText: 'Hoy',
            monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
            monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun',
                'Jul','Ago','Sep','Oct','Nov','Dic'],
            dayNames: ['Domingo','Lunes','Martes','Mi&eacute;rcoles','Jueves','Viernes','S&aacute;bado'],
            dayNamesShort: ['Dom','Lun','Mar','Mi&eacute;','Juv','Vie','S&aacute;b'],
            dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','S&aacute;'],
            weekHeader: 'Sm',
            dateFormat: 'dd-mm-yy',
            firstDay: 1,
            isRTL: false,
            showMonthAfterYear: false,
            yearSuffix: ''};
        $.datepicker.setDefaults($.datepicker.regional['es-CL']);

        //Canada
        $.datepicker.regional['en-CA'] = {
            closeText: 'Done',
            prevText: 'Prev',
            nextText: 'Next',
            currentText: 'Today',
            monthNames: ['January','February','March','April','May','June',
                'July','August','September','October','November','December'],
            monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
            weekHeader: 'Wk',
            dateFormat: 'dd/mm/yy',
            firstDay: 1,
            isRTL: false,
            showMonthAfterYear: false,
            yearSuffix: ''};
        $.datepicker.setDefaults($.datepicker.regional['en-CA']);

        //Spanish-speaking in US
        $.datepicker.regional['es-US'] = {
            closeText: 'Cerrar',
            prevText: '&#x3c;Ant',
            nextText: 'Sig&#x3e;',
            currentText: 'Hoy',
            monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
            monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun',
                'Jul','Ago','Sep','Oct','Nov','Dic'],
            dayNames: ['Domingo','Lunes','Martes','Mi&eacute;rcoles','Jueves','Viernes','S&aacute;bado'],
            dayNamesShort: ['Dom','Lun','Mar','Mi&eacute;','Juv','Vie','S&aacute;b'],
            dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','S&aacute;'],
            weekHeader: 'Sm',
            dateFormat: 'mm/dd/yy',
            firstDay: 1,
            isRTL: false,
            showMonthAfterYear: false,
            yearSuffix: ''};
        $.datepicker.setDefaults($.datepicker.regional['es-US']);
    });
}( jQuery ));

;(function($) {
    $.datepicker.setRegion = function(region) {
        var current = null;
        if (region != null) {
            region = region.replace("_", "-");
            current = $.datepicker.regional[region];
            if (current == null && region.length > 3) {
                current = $.datepicker.regional[region.substring(0,2)];
            }
        }
        //if no region was set yet, set it to default
        if (current == null) {
            current = $.datepicker.regional[""];
        }
        $.datepicker.setDefaults(current);
        return current;
    };
}( jQuery ));

