// require['jquery']
"use strict";
var DATAPIPE = (function() {
  function process(fragments) {
    // load fragment htmls'
    var promises = [];
    fragments.forEach(function(fragment) {
      promises.push(loadHTMLAsync(fragment.id, fragment.src, {}));
    });
    // load fragments, async and parallel
    var fragsState = [];
    var whensPool = jQuery.when.apply(jQuery, promises);
    whensPool.done(function() {
      if (arguments) { // arguments will be sized and correspond to the promises array
        for (var i = 0; i < arguments.length; i++) {
          fragsState.push(arguments[i]);
        }
      }
      // gather scripts from the loaded fragments
      var scripts = [];
      fragsState.forEach(function(fragState) {
        if (fragState.success) {
          jQuery('#' + fragState.id + ' script').each(function(i,e) {
            if (scripts.indexOf(e.src) === -1) { //add only if not already there
              scripts.push(e.src);
            }        
          });          
        }
      });
      // load and execute the gathered scripts
      scripts.forEach(function(s) {
        jQuery.ajax({url:s,dataType:"script"})
      });
    });
  }
  //
  function loadHTMLAsync(id, url, payload) {
    var deferred = jQuery.Deferred();
    jQuery.ajax({url: url, dataType: "html"})
          .done(function(payload, textStatus, jqXHR) {
             document.getElementById(id).innerHTML = jqXHR.responseText;
             deferred.resolve({id:id,success:true});})
          .fail(function(jqXHR, textStatus, errorThrown) {
             deferred.resolve({id:id,success:false});}); 
          return deferred.promise();        
  }
  //
  return {
    process : process
  };
})();
