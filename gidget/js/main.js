"use strict";

var MAIN = (function() {

    function init() {
        console.log(" MAIN inited");
    }
    
    function process(unprocessed) {
        return 'processed ' + unprocessed;
    }
    
    return {
        init : init,
        process : process
    };
})();

MAIN.init();
