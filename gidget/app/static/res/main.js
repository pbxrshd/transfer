// require['jquery','datapipe']
"use strict";
var MAIN = (function() {
  function init() {
    // gather fragment container ids
    var fragments = [];
    jQuery('.fragment-container').each(function(i,e){fragments.push({id:e.id,src:e.id+'.html'})});
    DATAPIPE.process(fragments);
  }
  return {
    init : init
  };
})();

MAIN.init();
