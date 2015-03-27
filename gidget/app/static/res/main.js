// require['jquery','datapipe']
"use strict";
var MAIN = (function() {
  function init() {
    // gather fragment container ids
    var fragments = [];
    jQuery('.fragment-container').each(function(i,e){fragments.push({id:e.id,src:e.id+'.html'})});
    DATAPIPE.process(fragments);
  }
  //
  //
  function getData(id) {
      
    var url = 'data/' + id + '?error=' + (getQueryParam('error')?'true':'') + '&delay=' + (getQueryParam('delay')?'true':'');
     
    var deferred = jQuery.Deferred();
    jQuery.getJSON(url)
          .done(function(data) {
              deferred.resolve(data);
              })
          .fail(function(){deferred.reject()});
    return deferred.promise(); 
  }
  //
  function getQueryParam(paramKey) {
    var pairs = window.location.search.substring(1).split('&');
    for (var i=0; i < pairs.length; i++) {
      var pair = pairs[i].split('=');
        if (pair.length === 2 && paramKey === pair[0]) {
          return pair[1];
        }
    }
    return '';
  }
  
  //
  return {
    init : init,
    getData : getData
  };
})();

MAIN.init();
