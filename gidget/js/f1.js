"use strict";

var F1 = (function() {

    function init() {
        console.log(" F1 inited");
        console.log(MAIN.process('from f1'));
    }
    
    return {
        init : init
    };
})();

F1.init();
