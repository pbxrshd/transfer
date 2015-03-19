
"use strict";
var DATAPIPE = (function() {

    var SCRIPTS = [];

    function init() {
        main1();
    }

/*
prep:
  - get fragment ids
  - get fragment urls
  - generate fragment placeholders
htmls:
  - perform async parallel load of fragment htmls into their placeholders
  - keep track of succesfully loaded fragments
scripts:
  - create scriptsCollection
    - scriptsCollection is a set
    - scan base container and add to scriptsCollection
    - for each successfully loaded fragment
       - scan fragment and add to scriptsCollection
  - for each script in scriptsCollection
    - load and execute
*/


  function main1() {
    console.log("DATAPIPE inited");
    
    // get fragment ids
    var fragIds = getParam('frags').split(',');
    fragIds = jQuery.grep(fragIds, function(e) {
                return '' !== e;
    });

    // generate placeholders for each of the frags
    fragIds.forEach(function(fragId) {
        jQuery('#main_content').append('<div id="' + idToElement(fragId) + '"></div>');
    });

    // prepare fragments to be loaded
    var promises = [];
    fragIds.forEach(function(fragId) {
      promises.push(loadHTMLAsync(fragId, idToUrl(fragId), idToElement(fragId), {}));
    });        

    // load fragments, async and parallel
    var fragsState = [];
    var whensPool = jQuery.when.apply(jQuery, promises);
    whensPool.done(function(){
      if (arguments) { // arguments will be sized and correspond to the promises array
        for (var i = 0; i < arguments.length; i++) {
          fragsState.push(arguments[i]);
        }
      }
      // gather scripts
      var scripts = []; // TODO first add the scripts that are already here in the main page hosting the DATAPIPE script
      fragsState.forEach(function(fragState) {
        if (fragState.success) {
          extractScripts(idToElement(fragState.id), scripts);
        }
      });
      // execute scripts
      scripts.forEach(function(s){
        loadScript(s);
      });
    });
    whensPool.fail(function(){
      console.log('whens fail ');
    });        
  }

    function idToElement(fragId) {
        return 'frag_container_' + fragId;
    }
    
    function idToUrl(fragId) {
        return fragId + '.html';
    }

    function loadScript(url, getFromCache) {
        jQuery.ajax({
          url: url,
          dataType: "script",
          cache: getFromCache
        })
          .done(function() {
            console.log('  loaded ' + url);
          })
          .fail(function(jqXHR, textStatus, errorThrown) {
            console.log('loadScript error:' + textStatus + errorThrown);
          }); 
    }
    
    // idOfParentToExtractScriptFrom, arrayToAddExtractedScriptsTo
    function extractScripts(id, scripts) {
        var fragScripts = (document.getElementById(id)).getElementsByTagName("script");
        for (var i = 0; i < fragScripts.length; i++) {
            var scriptSrc = fragScripts[i].src;
            // simple set implementation, add only if not already there
            if (scripts.indexOf(scriptSrc) === -1) {
                scripts.push(scriptSrc);
            }
        }
    }
    
    function loadHTMLAsync(id, url, elementId, payload) {
        var deferred = jQuery.Deferred();
        // wrapping so we always return resolved, to avoid short circuiting when exec'ing in parallel  
        jQuery.ajax({
             url: url,
             dataType: "html"})
          .done(function(payload, textStatus, jqXHR) {
             // have to use .innerHTML, otherwise using jqUery.append actually executes the inline script, which we don't want
             // we are accumulating and exec'ing the scripts later
             document.getElementById(elementId).innerHTML = jqXHR.responseText;
             console.log('loadedHTML ' + id + '(' + url + ')');
             deferred.resolve({id:id,success:true});
          })
          .fail(function(jqXHR, textStatus, errorThrown) {
             console.log('loadHTML error:' + id + '(' + url + ') ' + textStatus + ' ' + errorThrown);
             deferred.resolve({id:id,success:false});
          }); 
          return deferred.promise();        
    }

    function getParam(paramKey) {
        var pairs = window.location.search.substring(1).split('&');
        for (var i=0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            if (pair.length === 2 && paramKey === pair[0]) {
                return pair[1];
            }
        }
        return '';
    }
    
    return {
        init : init
    };
})();

DATAPIPE.init();
