
"use strict";
var DATAPIPE = (function() {

    var SCRIPTS = [];

    function init() {
        //main1();
        main2();
    }

    function main1() {
        console.log("DATAPIPE inited");
        var frags = getParam('frags').split(',');
        
        //var scripts = [];
        // TODO first add the scripts that are already here in the main page hosting the DATAPIPE script
        
        
        jQuery(document).ready( function(){
              //console.log('scripts:' + scripts);
            });
        
        
        // generate ids for all the fragments we'll be using
        var fragIds = [];
        frags.forEach( function(frag) {
            fragIds.push('frag_container_' + frag);
        });
        
        // load the html for each of the fragments
        frags.forEach( function(frag, i) {
          if ('' !== frag) {
            console.log('  processing:' + frag);
            jQuery('#main_content').append('<div id="' + fragIds[i] + '"></div><hr />');
            var data = {};
            loadHTML(frag + '.html', data, fragIds[i], function(){extractScripts(fragIds[i], SCRIPTS)});
          }
        });
        

        //console.log(scripts);
    }

    function main2() {
        console.log("DATAPIPE inited");
        var fragIds = getParam('frags').split(',');
        
        var scripts = []; // TODO first add the scripts that are already here in the main page hosting the DATAPIPE script
         
        var promises = []; 
        // process each of the frags
        var frags = [];
        fragIds.forEach( function(fragId) {
            if ('' !== fragId) {
                jQuery('#main_content').append('<div id="' + idToElement(fragId) + '"></div><hr />');
                promises.push({id:fragId,url:fragId+'.html'});
            }
        });
        
        var whensPool = jQuery.when.apply(jQuery, promises);
        whensPool.done(function(){
            var results = [];
            if (arguments) {
                for (var i = 0; i < arguments.length; i++) {
                    results.push(arguments[i]);
                }
            }
            console.log('whens done ' + JSON.stringify(results));
        });
        
        whensPool.fail(function(){
            console.log('whens fail ');
        });        

    }

    function idToElement(fragId) {
        return 'frag_container_' + id;
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
        console.log('extractScripts:' + id);
        var fragScripts = (document.getElementById(id)).getElementsByTagName("script");
        for (var i = 0; i < fragScripts.length; i++) {
            var scriptSrc = fragScripts[i].src;
            // naive set implementation, add only if not already there
            //console.log('scriptSrc:' + scriptSrc);
            if (scripts.indexOf(scriptSrc) === -1) {
                scripts.push(scriptSrc);
            }
        }
    }
    
    
    
    function loadHTMLAsync(id, url, data, elementId) {
        var deferred = jQuery.Deferred();
        
        // wrapping so we always return resolved, to avoid short circuiting when exec'ing in parallel  
          
        jQuery.ajax({
             url: url,
             dataType: "html"})
          .done(function(data, textStatus, jqXHR) {
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
    
    // does NOT execute any inline scripts embedded in the HTML
    // callback, if present, executed after success
    function loadHTML(url, data, elementId, callback) {
        jQuery.ajax({
          url: url,
          dataType: "html"
        })
          .done(function(data, textStatus, jqXHR) {
            // have to use .innerHTML, otherwise using jqUery.append actually executes the inline script, which we don;t want
            // we are accumulating and exec'ing the scripts later
            document.getElementById(elementId).innerHTML = jqXHR.responseText;
            if (typeof callback !== 'undefined') {
                callback();
            }
          })
          .fail(function(jqXHR, textStatus, errorThrown) {
            console.log('loadHTML error:' + textStatus + errorThrown);
          })
          //.always(function() {console.log(frag + ' completed...');})
          ; 
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
        init : init,
        scripts : SCRIPTS
    };
})();

DATAPIPE.init();
