// Copyright (c) 2006 Sébastien Gruhier (http://xilinus.com, http://itseb.com)
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// VERSION 1.3

var Window = Class.create();

Window.keepMultiModalWindow = false;
Window.hasEffectLib = (typeof Effect != 'undefined');
Window.resizeEffectDuration = 0.4;

Window.prototype = {
  // Constructor
  // Available parameters : className, blurClassName, title, minWidth, minHeight, maxWidth, maxHeight, width, height, top, left, bottom, right, resizable, zIndex, opacity, recenterAuto, wiredDrag
  //                        hideEffect, showEffect, showEffectOptions, hideEffectOptions, effectOptions, url, draggable, closable, minimizable, maximizable, parent, onload
  //                        add all callbacks (if you do not use an observer)
  //                        onDestroy onStartResize onStartMove onResize onMove onEndResize onEndMove onFocus onBlur onBeforeShow onShow onHide onMinimize onMaximize onClose

  initialize: function() {
    var id;
    var optionIndex = 0;
    // For backward compatibility like win= new Window("id", {...}) instead of win = new Window({id: "id", ...})
    if (arguments.length > 0) {
      if (typeof arguments[0] == "string" ) {
        id = arguments[0];
        optionIndex = 1;
      }
      else
        id = arguments[0] ? arguments[0].id : null;
    }

    // Generate unique ID if not specified
    if (!id)
      id = "window_" + new Date().getTime();

    if ($(id))
      alert("Window " + id + " is already registered in the DOM! Make sure you use setDestroyOnClose() or destroyOnClose: true in the constructor");

    this.options = Object.extend({
      className:         "dialog",
      blurClassName:     null,
      minWidth:          100,
      minHeight:         20,
      resizable:         true,
      closable:          true,
      minimizable:       true,
      maximizable:       true,
      draggable:         true,
      userData:          null,
      showEffect:        (Window.hasEffectLib ? Effect.Appear : Element.show),
      hideEffect:        (Window.hasEffectLib ? Effect.Fade : Element.hide),
      showEffectOptions: {},
      hideEffectOptions: {},
      effectOptions:     null,
      parent:            document.body,
      title:             "&nbsp;",
      url:               null,
      onload:            Prototype.emptyFunction,
      width:             200,
      height:            300,
      opacity:           1,
      recenterAuto:      true,
      wiredDrag:         false,
      closeCallback:     null,
      destroyOnClose:    false,
      gridX:             1,
      gridY:             1
    }, arguments[optionIndex] || {});
    if (this.options.blurClassName)
      this.options.focusClassName = this.options.className;

    if (typeof this.options.top == "undefined" &&  typeof this.options.bottom ==  "undefined")
      this.options.top = this._round(Math.random()*500, this.options.gridY);
    if (typeof this.options.left == "undefined" &&  typeof this.options.right ==  "undefined")
      this.options.left = this._round(Math.random()*500, this.options.gridX);

    if (this.options.effectOptions) {
      Object.extend(this.options.hideEffectOptions, this.options.effectOptions);
      Object.extend(this.options.showEffectOptions, this.options.effectOptions);
      if (this.options.showEffect == Element.Appear)
        this.options.showEffectOptions.to = this.options.opacity;
    }
    if (Window.hasEffectLib) {
      if (this.options.showEffect == Effect.Appear)
        this.options.showEffectOptions.to = this.options.opacity;

      if (this.options.hideEffect == Effect.Fade)
        this.options.hideEffectOptions.from = this.options.opacity;
    }
    if (this.options.hideEffect == Element.hide)
      this.options.hideEffect = function(){ Element.hide(this.element); if (this.options.destroyOnClose) this.destroy(); }.bind(this)

    if (this.options.parent != document.body)
      this.options.parent = $(this.options.parent);

    this.element = this._createWindow(id);
    this.element.win = this;

    // Bind event listener
    this.eventMouseDown = this._initDrag.bindAsEventListener(this);
    this.eventMouseUp   = this._endDrag.bindAsEventListener(this);
    this.eventMouseMove = this._updateDrag.bindAsEventListener(this);
    this.eventOnLoad    = this._getWindowBorderSize.bindAsEventListener(this);
    this.eventMouseDownContent = this.toFront.bindAsEventListener(this);
    this.eventResize = this._recenter.bindAsEventListener(this);

    this.topbar = $(this.element.id + "_top");
    this.bottombar = $(this.element.id + "_bottom");
    this.content = $(this.element.id + "_content");

    Event.observe(this.topbar, "mousedown", this.eventMouseDown);
    Event.observe(this.bottombar, "mousedown", this.eventMouseDown);
    Event.observe(this.content, "mousedown", this.eventMouseDownContent);
    Event.observe(window, "load", this.eventOnLoad);
    Event.observe(window, "resize", this.eventResize);
    Event.observe(window, "scroll", this.eventResize);
    Event.observe(this.options.parent, "scroll", this.eventResize);

    if (this.options.draggable)  {
      var that = this;
      [this.topbar, this.topbar.up().previous(), this.topbar.up().next()].each(function(element) {
        element.observe("mousedown", that.eventMouseDown);
        element.addClassName("top_draggable");
      });
      [this.bottombar.up(), this.bottombar.up().previous(), this.bottombar.up().next()].each(function(element) {
        element.observe("mousedown", that.eventMouseDown);
        element.addClassName("bottom_draggable");
      });

    }

    if (this.options.resizable) {
      this.sizer = $(this.element.id + "_sizer");
      Event.observe(this.sizer, "mousedown", this.eventMouseDown);
    }

    this.useLeft = null;
    this.useTop = null;
    if (typeof this.options.left != "undefined") {
      this.element.setStyle({left: parseFloat(this.options.left) + 'px'});
      this.useLeft = true;
    }
    else {
      this.element.setStyle({right: parseFloat(this.options.right) + 'px'});
      this.useLeft = false;
    }

    if (typeof this.options.top != "undefined") {
      this.element.setStyle({top: parseFloat(this.options.top) + 'px'});
      this.useTop = true;
    }
    else {
      this.element.setStyle({bottom: parseFloat(this.options.bottom) + 'px'});
      this.useTop = false;
    }

    this.storedLocation = null;

    this.setOpacity(this.options.opacity);
    if (this.options.zIndex)
      this.setZIndex(this.options.zIndex)

    if (this.options.destroyOnClose)
      this.setDestroyOnClose(true);

    this._getWindowBorderSize();
    this.width = this.options.width;
    this.height = this.options.height;
    this.visible = false;

    this.constraint = false;
    this.constraintPad = {top: 0, left:0, bottom:0, right:0};

    if (this.width && this.height)
      this.setSize(this.options.width, this.options.height);
    this.setTitle(this.options.title)
    Windows.register(this);
  },

  // Destructor
  destroy: function() {
    this._notify("onDestroy");
    Event.stopObserving(this.topbar, "mousedown", this.eventMouseDown);
    Event.stopObserving(this.bottombar, "mousedown", this.eventMouseDown);
    Event.stopObserving(this.content, "mousedown", this.eventMouseDownContent);

    Event.stopObserving(window, "load", this.eventOnLoad);
    Event.stopObserving(window, "resize", this.eventResize);
    Event.stopObserving(window, "scroll", this.eventResize);

    Event.stopObserving(this.content, "load", this.options.onload);

    if (this._oldParent) {
      var content = this.getContent();
      var originalContent = null;
      for(var i = 0; i < content.childNodes.length; i++) {
        originalContent = content.childNodes[i];
        if (originalContent.nodeType == 1)
          break;
        originalContent = null;
      }
      if (originalContent)
        this._oldParent.appendChild(originalContent);
      this._oldParent = null;
    }

    if (this.sizer)
        Event.stopObserving(this.sizer, "mousedown", this.eventMouseDown);

    if (this.options.url)
      this.content.src = null

     if(this.iefix)
      Element.remove(this.iefix);

    Element.remove(this.element);
    Windows.unregister(this);
  },

  // Sets close callback, if it sets, it should return true to be able to close the window.
  setCloseCallback: function(callback) {
    this.options.closeCallback = callback;
  },

  // Gets window content
  getContent: function () {
    return this.content;
  },

  // Sets the content with an element id
  setContent: function(id, autoresize, autoposition) {
    var element = $(id);
    if (null == element) throw "Unable to find element '" + id + "' in DOM";
    this._oldParent = element.parentNode;

    var d = null;
    var p = null;

    if (autoresize)
      d = Element.getDimensions(element);
    if (autoposition)
      p = Position.cumulativeOffset(element);

    var content = this.getContent();
    // Clear HTML (and even iframe)
    this.setHTMLContent("");
    content = this.getContent();

    content.appendChild(element);
    element.show();
    if (autoresize)
      this.setSize(d.width, d.height);
    if (autoposition)
      this.setLocation(p[1] - this.heightN, p[0] - this.widthW);
  },

  setHTMLContent: function(html) {
    // It was an url (iframe), recreate a div content instead of iframe content
    if (this.options.url) {
      this.content.src = null;
      this.options.url = null;

  	  var content ="<div id=\"" + this.getId() + "_content\" class=\"" + this.options.className + "_content\"> </div>";
      $(this.getId() +"_table_content").innerHTML = content;

      this.content = $(this.element.id + "_content");
    }

    this.getContent().innerHTML = html;
  },

  setAjaxContent: function(url, options, showCentered, showModal) {
    this.showFunction = showCentered ? "showCenter" : "show";
    this.showModal = showModal || false;

    options = options || {};

    // Clear HTML (and even iframe)
    this.setHTMLContent("");

    this.onComplete = options.onComplete;
    if (! this._onCompleteHandler)
      this._onCompleteHandler = this._setAjaxContent.bind(this);
    options.onComplete = this._onCompleteHandler;

    new Ajax.Request(url, options);
    options.onComplete = this.onComplete;
  },

  _setAjaxContent: function(originalRequest) {
    Element.update(this.getContent(), originalRequest.responseText);
    if (this.onComplete)
      this.onComplete(originalRequest);
    this.onComplete = null;
    this[this.showFunction](this.showModal)
  },

  setURL: function(url) {
    // Not an url content, change div to iframe
    if (this.options.url)
      this.content.src = null;
    this.options.url = url;
    var content= "<iframe frameborder='0' name='" + this.getId() + "_content'  id='" + this.getId() + "_content' src='" + url + "' width='" + this.width + "' height='" + this.height + "'> </iframe>";
    $(this.getId() +"_table_content").innerHTML = content;

    this.content = $(this.element.id + "_content");
  },

  getURL: function() {
  	return this.options.url ? this.options.url : null;
  },

  refresh: function() {
    if (this.options.url)
	    $(this.element.getAttribute('id') + '_content').src = this.options.url;
  },

  // Stores position/size in a cookie, by default named with window id
  setCookie: function(name, expires, path, domain, secure) {
    name = name || this.element.id;
    this.cookie = [name, expires, path, domain, secure];

    // Get cookie
    var value = WindowUtilities.getCookie(name)
    // If exists
    if (value) {
      var values = value.split(',');
      var x = values[0].split(':');
      var y = values[1].split(':');

      var w = parseFloat(values[2]), h = parseFloat(values[3]);
      var mini = values[4];
      var maxi = values[5];

      this.setSize(w, h);
      if (mini == "true")
        this.doMinimize = true; // Minimize will be done at onload window event
      else if (maxi == "true")
        this.doMaximize = true; // Maximize will be done at onload window event

      this.useLeft = x[0] == "l";
      this.useTop = y[0] == "t";

      this.element.setStyle(this.useLeft ? {left: x[1]} : {right: x[1]});
      this.element.setStyle(this.useTop ? {top: y[1]} : {bottom: y[1]});
    }
  },

  // Gets window ID
  getId: function() {
    return this.element.id;
  },

  // Detroys itself when closing
  setDestroyOnClose: function() {
    this.options.destroyOnClose = true;
  },

  setConstraint: function(bool, padding) {
    this.constraint = bool;
    this.constraintPad = Object.extend(this.constraintPad, padding || {});
    // Reset location to apply constraint
    if (this.useTop && this.useLeft)
      this.setLocation(parseFloat(this.element.style.top), parseFloat(this.element.style.left));
  },

  // initDrag event

  _initDrag: function(event) {
    // No resize on minimized window
    if (Event.element(event) == this.sizer && this.isMinimized())
      return;

    // No move on maximzed window
    if (Event.element(event) != this.sizer && this.isMaximized())
      return;

    if (Prototype.Browser.IE && this.heightN == 0)
      this._getWindowBorderSize();

    // Get pointer X,Y
    this.pointer = [this._round(Event.pointerX(event), this.options.gridX), this._round(Event.pointerY(event), this.options.gridY)];
    if (this.options.wiredDrag)
      this.currentDrag = this._createWiredElement();
    else
      this.currentDrag = this.element;

    // Resize
    if (Event.element(event) == this.sizer) {
      this.doResize = true;
      this.widthOrg = this.width;
      this.heightOrg = this.height;
      this.bottomOrg = parseFloat(this.element.getStyle('bottom'));
      this.rightOrg = parseFloat(this.element.getStyle('right'));
      this._notify("onStartResize");
    }
    else {
      this.doResize = false;

      // Check if click on close button,
      var closeButton = $(this.getId() + '_close');
      if (closeButton && Position.within(closeButton, this.pointer[0], this.pointer[1])) {
        this.currentDrag = null;
        return;
      }

      this.toFront();

      if (! this.options.draggable)
        return;
      this._notify("onStartMove");
    }
    // Register global event to capture mouseUp and mouseMove
    Event.observe(document, "mouseup", this.eventMouseUp, false);
    Event.observe(document, "mousemove", this.eventMouseMove, false);

    // Add an invisible div to keep catching mouse event over iframes
    WindowUtilities.disableScreen('__invisible__', '__invisible__', this.overlayOpacity);

    // Stop selection while dragging
    document.body.ondrag = function () { return false; };
    document.body.onselectstart = function () { return false; };

    this.currentDrag.show();
    Event.stop(event);
  },

  _round: function(val, round) {
    return round == 1 ? val  : val = Math.floor(val / round) * round;
  },

  // updateDrag event
  _updateDrag: function(event) {
    var pointer =  [this._round(Event.pointerX(event), this.options.gridX), this._round(Event.pointerY(event), this.options.gridY)];
    var dx = pointer[0] - this.pointer[0];
    var dy = pointer[1] - this.pointer[1];

    // Resize case, update width/height
    if (this.doResize) {
      var w = this.widthOrg + dx;
      var h = this.heightOrg + dy;

      dx = this.width - this.widthOrg
      dy = this.height - this.heightOrg

      // Check if it's a right position, update it to keep upper-left corner at the same position
      if (this.useLeft)
        w = this._updateWidthConstraint(w)
      else
        this.currentDrag.setStyle({right: (this.rightOrg -dx) + 'px'});
      // Check if it's a bottom position, update it to keep upper-left corner at the same position
      if (this.useTop)
        h = this._updateHeightConstraint(h)
      else
        this.currentDrag.setStyle({bottom: (this.bottomOrg -dy) + 'px'});

      this.setSize(w , h);
      this._notify("onResize");
    }
    // Move case, update top/left
    else {
      this.pointer = pointer;

      if (this.useLeft) {
        var left =  parseFloat(this.currentDrag.getStyle('left')) + dx;
        var newLeft = this._updateLeftConstraint(left);
        // Keep mouse pointer correct
        this.pointer[0] += newLeft-left;
        this.currentDrag.setStyle({left: newLeft + 'px'});
      }
      else
        this.currentDrag.setStyle({right: parseFloat(this.currentDrag.getStyle('right')) - dx + 'px'});

      if (this.useTop) {
        var top =  parseFloat(this.currentDrag.getStyle('top')) + dy;
        var newTop = this._updateTopConstraint(top);
        // Keep mouse pointer correct
        this.pointer[1] += newTop - top;
        this.currentDrag.setStyle({top: newTop + 'px'});
      }
      else
        this.currentDrag.setStyle({bottom: parseFloat(this.currentDrag.getStyle('bottom')) - dy + 'px'});

      this._notify("onMove");
    }
    if (this.iefix)
      this._fixIEOverlapping();

    this._removeStoreLocation();
    Event.stop(event);
  },

   // endDrag callback
   _endDrag: function(event) {
    // Remove temporary div over iframes
     WindowUtilities.enableScreen('__invisible__');

    if (this.doResize)
      this._notify("onEndResize");
    else
      this._notify("onEndMove");

    // Release event observing
    Event.stopObserving(document, "mouseup", this.eventMouseUp,false);
    Event.stopObserving(document, "mousemove", this.eventMouseMove, false);

    Event.stop(event);

    this._hideWiredElement();

    // Store new location/size if need be
    this._saveCookie()

    // Restore selection
    document.body.ondrag = null;
    document.body.onselectstart = null;
  },

  _updateLeftConstraint: function(left) {
    if (this.constraint && this.useLeft && this.useTop) {
      var width = this.options.parent == document.body ? WindowUtilities.getPageSize().windowWidth : this.options.parent.getDimensions().width;

      if (left < this.constraintPad.left)
        left = this.constraintPad.left;
      if (left + this.width + this.widthE + this.widthW > width - this.constraintPad.right)
        left = width - this.constraintPad.right - this.width - this.widthE - this.widthW;
    }
    return left;
  },

  _updateTopConstraint: function(top) {
    if (this.constraint && this.useLeft && this.useTop) {
      var height = this.options.parent == document.body ? WindowUtilities.getPageSize().windowHeight : this.options.parent.getDimensions().height;

      var h = this.height + this.heightN + this.heightS;

      if (top < this.constraintPad.top)
        top = this.constraintPad.top;
      if (top + h > height - this.constraintPad.bottom)
        top = height - this.constraintPad.bottom - h;
    }
    return top;
  },

  _updateWidthConstraint: function(w) {
    if (this.constraint && this.useLeft && this.useTop) {
      var width = this.options.parent == document.body ? WindowUtilities.getPageSize().windowWidth : this.options.parent.getDimensions().width;
      var left =  parseFloat(this.element.getStyle("left"));

      if (left + w + this.widthE + this.widthW > width - this.constraintPad.right)
        w = width - this.constraintPad.right - left - this.widthE - this.widthW;
    }
    return w;
  },

  _updateHeightConstraint: function(h) {
    if (this.constraint && this.useLeft && this.useTop) {
      var height = this.options.parent == document.body ? WindowUtilities.getPageSize().windowHeight : this.options.parent.getDimensions().height;
      var top =  parseFloat(this.element.getStyle("top"));

      if (top + h + this.heightN + this.heightS > height - this.constraintPad.bottom)
        h = height - this.constraintPad.bottom - top - this.heightN - this.heightS;
    }
    return h;
  },


  // Creates HTML window code
  _createWindow: function(id) {
    var className = this.options.className;
    var win = document.createElement("div");
    win.setAttribute('id', id);
    win.className = "dialog";

    var content;
    if (this.options.url)
      content= "<iframe frameborder=\"0\" name=\"" + id + "_content\"  id=\"" + id + "_content\" src=\"" + this.options.url + "\"> </iframe>";
    else
      content ="<div id=\"" + id + "_content\" class=\"" +className + "_content\"> </div>";

    var closeDiv = this.options.closable ? "<div class='"+ className +"_close' id='"+ id +"_close' onclick='Windows.close(\""+ id +"\", event)'> </div>" : "";
    var minDiv = this.options.minimizable ? "<div class='"+ className + "_minimize' id='"+ id +"_minimize' onclick='Windows.minimize(\""+ id +"\", event)'> </div>" : "";
    var maxDiv = this.options.maximizable ? "<div class='"+ className + "_maximize' id='"+ id +"_maximize' onclick='Windows.maximize(\""+ id +"\", event)'> </div>" : "";
    var seAttributes = this.options.resizable ? "class='" + className + "_sizer' id='" + id + "_sizer'" : "class='"  + className + "_se'";
    var blank = "../themes/default/blank.gif";

    win.innerHTML = closeDiv + minDiv + maxDiv + "\
      <table id='"+ id +"_row1' class=\"top table_window\">\
        <tr>\
          <td class='"+ className +"_nw'></td>\
          <td class='"+ className +"_n'><div id='"+ id +"_top' class='"+ className +"_title title_window'>"+ this.options.title +"</div></td>\
          <td class='"+ className +"_ne'></td>\
        </tr>\
      </table>\
      <table id='"+ id +"_row2' class=\"mid table_window\">\
        <tr>\
          <td class='"+ className +"_w'></td>\
            <td id='"+ id +"_table_content' class='"+ className +"_content' valign='top'>" + content + "</td>\
          <td class='"+ className +"_e'></td>\
        </tr>\
      </table>\
        <table id='"+ id +"_row3' class=\"bot table_window\">\
        <tr>\
          <td class='"+ className +"_sw'></td>\
            <td class='"+ className +"_s'><div id='"+ id +"_bottom' class='status_bar'><span style='float:left; width:1px; height:1px'></span></div></td>\
            <td " + seAttributes + "></td>\
        </tr>\
      </table>\
    ";
    Element.hide(win);
    this.options.parent.insertBefore(win, this.options.parent.firstChild);
    Event.observe($(id + "_content"), "load", this.options.onload);
    return win;
  },


  changeClassName: function(newClassName) {
    var className = this.options.className;
    var id = this.getId();
    $A(["_close", "_minimize", "_maximize", "_sizer", "_content"]).each(function(value) { this._toggleClassName($(id + value), className + value, newClassName + value) }.bind(this));
    this._toggleClassName($(id + "_top"), className + "_title", newClassName + "_title");
    $$("#" + id + " td").each(function(td) {td.className = td.className.sub(className,newClassName); });
    this.options.className = newClassName;
  },

  _toggleClassName: function(element, oldClassName, newClassName) {
    if (element) {
      element.removeClassName(oldClassName);
      element.addClassName(newClassName);
    }
  },

  // Sets window location
  setLocation: function(top, left) {
    top = this._updateTopConstraint(top);
    left = this._updateLeftConstraint(left);

    var e = this.currentDrag || this.element;
    e.setStyle({top: top + 'px'});
    e.setStyle({left: left + 'px'});

    this.useLeft = true;
    this.useTop = true;
  },

  getLocation: function() {
    var location = {};
    if (this.useTop)
      location = Object.extend(location, {top: this.element.getStyle("top")});
    else
      location = Object.extend(location, {bottom: this.element.getStyle("bottom")});
    if (this.useLeft)
      location = Object.extend(location, {left: this.element.getStyle("left")});
    else
      location = Object.extend(location, {right: this.element.getStyle("right")});

    return location;
  },

  // Gets window size
  getSize: function() {
    return {width: this.width, height: this.height};
  },

  // Sets window size
  setSize: function(width, height, useEffect) {
    width = parseFloat(width);
    height = parseFloat(height);

    // Check min and max size
    if (!this.minimized && width < this.options.minWidth)
      width = this.options.minWidth;

    if (!this.minimized && height < this.options.minHeight)
      height = this.options.minHeight;

    if (this.options. maxHeight && height > this.options. maxHeight)
      height = this.options. maxHeight;

    if (this.options. maxWidth && width > this.options. maxWidth)
      width = this.options. maxWidth;


    if (this.useTop && this.useLeft && Window.hasEffectLib && Effect.ResizeWindow && useEffect) {
      new Effect.ResizeWindow(this, null, null, width, height, {duration: Window.resizeEffectDuration});
    } else {
      this.width = width;
      this.height = height;
      var e = this.currentDrag ? this.currentDrag : this.element;

      e.setStyle({width: width + this.widthW + this.widthE + "px"})
      e.setStyle({height: height  + this.heightN + this.heightS + "px"})

      // Update content size
      if (!this.currentDrag || this.currentDrag == this.element) {
        var content = $(this.element.id + '_content');
        content.setStyle({height: height  + 'px'});
        content.setStyle({width: width  + 'px'});
      }
    }
  },

  updateHeight: function() {
    this.setSize(this.width, this.content.scrollHeight, true);
  },

  updateWidth: function() {
    this.setSize(this.content.scrollWidth, this.height, true);
  },

  // Brings window to front
  toFront: function() {
    if (this.element.style.zIndex < Windows.maxZIndex)
      this.setZIndex(Windows.maxZIndex + 1);
    if (this.iefix)
      this._fixIEOverlapping();
  },

  getBounds: function(insideOnly) {
    if (! this.width || !this.height || !this.visible)
      this.computeBounds();
    var w = this.width;
    var h = this.height;

    if (!insideOnly) {
      w += this.widthW + this.widthE;
      h += this.heightN + this.heightS;
    }
    var bounds = Object.extend(this.getLocation(), {width: w + "px", height: h + "px"});
    return bounds;
  },

  computeBounds: function() {
     if (! this.width || !this.height) {
      var size = WindowUtilities._computeSize(this.content.innerHTML, this.content.id, this.width, this.height, 0, this.options.className)
      if (this.height)
        this.width = size + 5
      else
        this.height = size + 5
    }

    this.setSize(this.width, this.height);
    if (this.centered)
      this._center(this.centerTop, this.centerLeft);
  },

  // Displays window modal state or not
  show: function(modal) {
    this.visible = true;
    if (modal) {
      // Hack for Safari !!
      if (typeof this.overlayOpacity == "undefined") {
        var that = this;
        setTimeout(function() {that.show(modal)}, 10);
        return;
      }
      Windows.addModalWindow(this);

      this.modal = true;
      this.setZIndex(Windows.maxZIndex + 1);
      Windows.unsetOverflow(this);
    }
    else
      if (!this.element.style.zIndex)
        this.setZIndex(Windows.maxZIndex + 1);

    // To restore overflow if need be
    if (this.oldStyle)
      this.getContent().setStyle({overflow: this.oldStyle});

    this.computeBounds();

    this._notify("onBeforeShow");
    if (this.options.showEffect != Element.show && this.options.showEffectOptions)
      this.options.showEffect(this.element, this.options.showEffectOptions);
    else
      this.options.showEffect(this.element);

    this._checkIEOverlapping();
    WindowUtilities.focusedWindow = this
    this._notify("onShow");
  },

  // Displays window modal state or not at the center of the page
  showCenter: function(modal, top, left) {
    this.centered = true;
    this.centerTop = top;
    this.centerLeft = left;

    this.show(modal);
  },

  isVisible: function() {
    return this.visible;
  },

  _center: function(top, left) {
    var windowScroll = WindowUtilities.getWindowScroll(this.options.parent);
    var pageSize = WindowUtilities.getPageSize(this.options.parent);
    if (typeof top == "undefined")
      top = (pageSize.windowHeight - (this.height + this.heightN + this.heightS))/2;
    top += windowScroll.top

    if (typeof left == "undefined")
      left = (pageSize.windowWidth - (this.width + this.widthW + this.widthE))/2;
    left += windowScroll.left
    this.setLocation(top, left);
    this.toFront();
  },

  _recenter: function(event) {
    if (this.centered) {
      var pageSize = WindowUtilities.getPageSize(this.options.parent);
      var windowScroll = WindowUtilities.getWindowScroll(this.options.parent);

      // Check for this stupid IE that sends dumb events
      if (this.pageSize && this.pageSize.windowWidth == pageSize.windowWidth && this.pageSize.windowHeight == pageSize.windowHeight &&
          this.windowScroll.left == windowScroll.left && this.windowScroll.top == windowScroll.top)
        return;
      this.pageSize = pageSize;
      this.windowScroll = windowScroll;
      // set height of Overlay to take up whole page and show
      if ($('overlay_modal'))
        $('overlay_modal').setStyle({height: (pageSize.pageHeight + 'px')});

      if (this.options.recenterAuto)
        this._center(this.centerTop, this.centerLeft);
    }
  },

  // Hides window
  hide: function() {
    this.visible = false;
    if (this.modal) {
      Windows.removeModalWindow(this);
      Windows.resetOverflow();
    }
    // To avoid bug on scrolling bar
    this.oldStyle = this.getContent().getStyle('overflow') || "auto"
    this.getContent().setStyle({overflow: "hidden"});

    this.options.hideEffect(this.element, this.options.hideEffectOptions);

     if(this.iefix)
      this.iefix.hide();

    if (!this.doNotNotifyHide)
      this._notify("onHide");
  },

  close: function() {
    // Asks closeCallback if exists
    if (this.visible) {
      if (this.options.closeCallback && ! this.options.closeCallback(this))
        return;

      if (this.options.destroyOnClose) {
        var destroyFunc = this.destroy.bind(this);
        if (this.options.hideEffectOptions.afterFinish) {
          var func = this.options.hideEffectOptions.afterFinish;
          this.options.hideEffectOptions.afterFinish = function() {func();destroyFunc() }
        }
        else
          this.options.hideEffectOptions.afterFinish = function() {destroyFunc() }
      }
      Windows.updateFocusedWindow();

      this.doNotNotifyHide = true;
      this.hide();
      this.doNotNotifyHide = false;
      this._notify("onClose");
    }
  },

  minimize: function() {
    if (this.resizing)
      return;

    var r2 = $(this.getId() + "_row2");

    if (!this.minimized) {
      this.minimized = true;

      var dh = r2.getDimensions().height;
      this.r2Height = dh;
      var h  = this.element.getHeight() - dh;

      if (this.useLeft && this.useTop && Window.hasEffectLib && Effect.ResizeWindow) {
        new Effect.ResizeWindow(this, null, null, null, this.height -dh, {duration: Window.resizeEffectDuration});
      } else  {
        this.height -= dh;
        this.element.setStyle({height: h + "px"});
        r2.hide();
      }

      if (! this.useTop) {
        var bottom = parseFloat(this.element.getStyle('bottom'));
        this.element.setStyle({bottom: (bottom + dh) + 'px'});
      }
    }
    else {
      this.minimized = false;

      var dh = this.r2Height;
      this.r2Height = null;
      if (this.useLeft && this.useTop && Window.hasEffectLib && Effect.ResizeWindow) {
        new Effect.ResizeWindow(this, null, null, null, this.height + dh, {duration: Window.resizeEffectDuration});
      }
      else {
        var h  = this.element.getHeight() + dh;
        this.height += dh;
        this.element.setStyle({height: h + "px"})
        r2.show();
      }
      if (! this.useTop) {
        var bottom = parseFloat(this.element.getStyle('bottom'));
        this.element.setStyle({bottom: (bottom - dh) + 'px'});
      }
      this.toFront();
    }
    this._notify("onMinimize");

    // Store new location/size if need be
    this._saveCookie()
  },

  maximize: function() {
    if (this.isMinimized() || this.resizing)
      return;

    if (Prototype.Browser.IE && this.heightN == 0)
      this._getWindowBorderSize();

    if (this.storedLocation != null) {
      this._restoreLocation();
      if(this.iefix)
        this.iefix.hide();
    }
    else {
      this._storeLocation();
      Windows.unsetOverflow(this);

      var windowScroll = WindowUtilities.getWindowScroll(this.options.parent);
      var pageSize = WindowUtilities.getPageSize(this.options.parent);
      var left = windowScroll.left;
      var top = windowScroll.top;

      if (this.options.parent != document.body) {
        windowScroll =  {top:0, left:0, bottom:0, right:0};
        var dim = this.options.parent.getDimensions();
        pageSize.windowWidth = dim.width;
        pageSize.windowHeight = dim.height;
        top = 0;
        left = 0;
      }

      if (this.constraint) {
        pageSize.windowWidth -= Math.max(0, this.constraintPad.left) + Math.max(0, this.constraintPad.right);
        pageSize.windowHeight -= Math.max(0, this.constraintPad.top) + Math.max(0, this.constraintPad.bottom);
        left +=  Math.max(0, this.constraintPad.left);
        top +=  Math.max(0, this.constraintPad.top);
      }

      var width = pageSize.windowWidth - this.widthW - this.widthE;
      var height= pageSize.windowHeight - this.heightN - this.heightS;

      if (this.useLeft && this.useTop && Window.hasEffectLib && Effect.ResizeWindow) {
        new Effect.ResizeWindow(this, top, left, width, height, {duration: Window.resizeEffectDuration});
      }
      else {
        this.setSize(width, height);
        this.element.setStyle(this.useLeft ? {left: left} : {right: left});
        this.element.setStyle(this.useTop ? {top: top} : {bottom: top});
      }

      this.toFront();
      if (this.iefix)
        this._fixIEOverlapping();
    }
    this._notify("onMaximize");

    // Store new location/size if need be
    this._saveCookie()
  },

  isMinimized: function() {
    return this.minimized;
  },

  isMaximized: function() {
    return (this.storedLocation != null);
  },

  setOpacity: function(opacity) {
    if (Element.setOpacity)
      Element.setOpacity(this.element, opacity);
  },

  setZIndex: function(zindex) {
    this.element.setStyle({zIndex: zindex});
    Windows.updateZindex(zindex, this);
  },

  setTitle: function(newTitle) {
    if (!newTitle || newTitle == "")
      newTitle = "&nbsp;";

    Element.update(this.element.id + '_top', newTitle);
  },

  getTitle: function() {
    return $(this.element.id + '_top').innerHTML;
  },

  setStatusBar: function(element) {
    var statusBar = $(this.getId() + "_bottom");

    if (typeof(element) == "object") {
      if (this.bottombar.firstChild)
        this.bottombar.replaceChild(element, this.bottombar.firstChild);
      else
        this.bottombar.appendChild(element);
    }
    else
      this.bottombar.innerHTML = element;
  },

  _checkIEOverlapping: function() {
    if(!this.iefix && (navigator.appVersion.indexOf('MSIE')>0) && (navigator.userAgent.indexOf('Opera')<0) && (this.element.getStyle('position')=='absolute')) {
        new Insertion.After(this.element.id, '<iframe id="' + this.element.id + '_iefix" '+ 'style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" ' + 'src="javascript:false;" frameborder="0" scrolling="no"></iframe>');
        this.iefix = $(this.element.id+'_iefix');
    }
    if(this.iefix)
      setTimeout(this._fixIEOverlapping.bind(this), 50);
  },

  _fixIEOverlapping: function() {
      // NOTE - AMortland commented out this one line to deal with an IE7 issue
      // Position.clone(this.element, this.iefix);

      this.iefix.style.zIndex = this.element.style.zIndex - 1;
      this.iefix.show();
  },

  _getWindowBorderSize: function(event) {
    // Hack to get real window border size!!
    var div = this._createHiddenDiv(this.options.className + "_n")
    this.heightN = Element.getDimensions(div).height;
    div.parentNode.removeChild(div)

    var div = this._createHiddenDiv(this.options.className + "_s")
    this.heightS = Element.getDimensions(div).height;
    div.parentNode.removeChild(div)

    var div = this._createHiddenDiv(this.options.className + "_e")
    this.widthE = Element.getDimensions(div).width;
    div.parentNode.removeChild(div)

    var div = this._createHiddenDiv(this.options.className + "_w")
    this.widthW = Element.getDimensions(div).width;
    div.parentNode.removeChild(div);

    var div = document.createElement("div");
    div.className = "overlay_" + this.options.className ;
    document.body.appendChild(div);
    //alert("no timeout:\nopacity: " + div.getStyle("opacity") + "\nwidth: " + document.defaultView.getComputedStyle(div, null).width);
    var that = this;

    // Workaround for Safari!!
    setTimeout(function() {that.overlayOpacity = ($(div).getStyle("opacity")); div.parentNode.removeChild(div);}, 10);

    // Workaround for IE!!
    if (Prototype.Browser.IE) {
      this.heightS = $(this.getId() +"_row3").getDimensions().height;
      this.heightN = $(this.getId() +"_row1").getDimensions().height;
    }

    // Safari size fix
    if (Prototype.Browser.WebKit && Prototype.Browser.WebKitVersion < 420)
      this.setSize(this.width, this.height);
    if (this.doMaximize)
      this.maximize();
    if (this.doMinimize)
      this.minimize();
  },

  _createHiddenDiv: function(className) {
    var objBody = document.body;
    var win = document.createElement("div");
    win.setAttribute('id', this.element.id+ "_tmp");
    win.className = className;
    win.style.display = 'none';
    win.innerHTML = '';
    objBody.insertBefore(win, objBody.firstChild);
    return win;
  },

  _storeLocation: function() {
    if (this.storedLocation == null) {
      this.storedLocation = {useTop: this.useTop, useLeft: this.useLeft,
                             top: this.element.getStyle('top'), bottom: this.element.getStyle('bottom'),
                             left: this.element.getStyle('left'), right: this.element.getStyle('right'),
                             width: this.width, height: this.height };
    }
  },

  _restoreLocation: function() {
    if (this.storedLocation != null) {
      this.useLeft = this.storedLocation.useLeft;
      this.useTop = this.storedLocation.useTop;

      if (this.useLeft && this.useTop && Window.hasEffectLib && Effect.ResizeWindow)
        new Effect.ResizeWindow(this, this.storedLocation.top, this.storedLocation.left, this.storedLocation.width, this.storedLocation.height, {duration: Window.resizeEffectDuration});
      else {
        this.element.setStyle(this.useLeft ? {left: this.storedLocation.left} : {right: this.storedLocation.right});
        this.element.setStyle(this.useTop ? {top: this.storedLocation.top} : {bottom: this.storedLocation.bottom});
        this.setSize(this.storedLocation.width, this.storedLocation.height);
      }

      Windows.resetOverflow();
      this._removeStoreLocation();
    }
  },

  _removeStoreLocation: function() {
    this.storedLocation = null;
  },

  _saveCookie: function() {
    if (this.cookie) {
      var value = "";
      if (this.useLeft)
        value += "l:" +  (this.storedLocation ? this.storedLocation.left : this.element.getStyle('left'))
      else
        value += "r:" + (this.storedLocation ? this.storedLocation.right : this.element.getStyle('right'))
      if (this.useTop)
        value += ",t:" + (this.storedLocation ? this.storedLocation.top : this.element.getStyle('top'))
      else
        value += ",b:" + (this.storedLocation ? this.storedLocation.bottom :this.element.getStyle('bottom'))

      value += "," + (this.storedLocation ? this.storedLocation.width : this.width);
      value += "," + (this.storedLocation ? this.storedLocation.height : this.height);
      value += "," + this.isMinimized();
      value += "," + this.isMaximized();
      WindowUtilities.setCookie(value, this.cookie)
    }
  },

  _createWiredElement: function() {
    if (! this.wiredElement) {
      if (Prototype.Browser.IE)
        this._getWindowBorderSize();
      var div = document.createElement("div");
      div.className = "wired_frame " + this.options.className + "_wired_frame";

      div.style.position = 'absolute';
      this.options.parent.insertBefore(div, this.options.parent.firstChild);
      this.wiredElement = $(div);
    }
    if (this.useLeft)
      this.wiredElement.setStyle({left: this.element.getStyle('left')});
    else
      this.wiredElement.setStyle({right: this.element.getStyle('right')});

    if (this.useTop)
      this.wiredElement.setStyle({top: this.element.getStyle('top')});
    else
      this.wiredElement.setStyle({bottom: this.element.getStyle('bottom')});

    var dim = this.element.getDimensions();
    this.wiredElement.setStyle({width: dim.width + "px", height: dim.height +"px"});

    this.wiredElement.setStyle({zIndex: Windows.maxZIndex+30});
    return this.wiredElement;
  },

  _hideWiredElement: function() {
    if (! this.wiredElement || ! this.currentDrag)
      return;
    if (this.currentDrag == this.element)
      this.currentDrag = null;
    else {
      if (this.useLeft)
        this.element.setStyle({left: this.currentDrag.getStyle('left')});
      else
        this.element.setStyle({right: this.currentDrag.getStyle('right')});

      if (this.useTop)
        this.element.setStyle({top: this.currentDrag.getStyle('top')});
      else
        this.element.setStyle({bottom: this.currentDrag.getStyle('bottom')});

      this.currentDrag.hide();
      this.currentDrag = null;
      if (this.doResize)
        this.setSize(this.width, this.height);
    }
  },

  _notify: function(eventName) {
    if (this.options[eventName])
      this.options[eventName](this);
    else
      Windows.notify(eventName, this);
  }
};

// Windows containers, register all page windows
var Windows = {
  windows: [],
  modalWindows: [],
  observers: [],
  focusedWindow: null,
  maxZIndex: 10000,
  overlayShowEffectOptions: {duration: 0.5},
  overlayHideEffectOptions: {duration: 0.5},

  addObserver: function(observer) {
    this.removeObserver(observer);
    this.observers.push(observer);
  },

  removeObserver: function(observer) {
    this.observers = this.observers.reject( function(o) { return o==observer });
  },

  // onDestroy onStartResize onStartMove onResize onMove onEndResize onEndMove onFocus onBlur onBeforeShow onShow onHide onMinimize onMaximize onClose
  notify: function(eventName, win) {
    this.observers.each( function(o) {if(o[eventName]) o[eventName](eventName, win);});
  },

  // Gets window from its id
  getWindow: function(id) {
    return this.windows.detect(function(d) { return d.getId() ==id });
  },

  // Gets the last focused window
  getFocusedWindow: function() {
    return this.focusedWindow;
  },

  updateFocusedWindow: function() {
    this.focusedWindow = this.windows.length >=2 ? this.windows[this.windows.length-2] : null;
  },

  // Registers a new window (called by Windows constructor)
  register: function(win) {
    this.windows.push(win);
  },

  // Add a modal window in the stack
  addModalWindow: function(win) {
    // Disable screen if first modal window
    if (this.modalWindows.length == 0) {
      WindowUtilities.disableScreen(win.options.className, 'overlay_modal', win.overlayOpacity, win.getId(), win.options.parent);
    }
    else {
      // Move overlay over all windows
      if (Window.keepMultiModalWindow) {
        $('overlay_modal').style.zIndex = Windows.maxZIndex + 1;
        Windows.maxZIndex += 1;
        WindowUtilities._hideSelect(this.modalWindows.last().getId());
      }
      // Hide current modal window
      else
        this.modalWindows.last().element.hide();
      // Fucking IE select issue
      WindowUtilities._showSelect(win.getId());
    }
    this.modalWindows.push(win);
  },

  removeModalWindow: function(win) {
    this.modalWindows.pop();

    // No more modal windows
    if (this.modalWindows.length == 0)
      WindowUtilities.enableScreen();
    else {
      if (Window.keepMultiModalWindow) {
        this.modalWindows.last().toFront();
        WindowUtilities._showSelect(this.modalWindows.last().getId());
      }
      else
        this.modalWindows.last().element.show();
    }
  },

  // Registers a new window (called by Windows constructor)
  register: function(win) {
    this.windows.push(win);
  },

  // Unregisters a window (called by Windows destructor)
  unregister: function(win) {
    this.windows = this.windows.reject(function(d) { return d==win });
  },

  // Closes all windows
  closeAll: function() {
    this.windows.each( function(w) {Windows.close(w.getId())} );
  },

  closeAllModalWindows: function() {
    WindowUtilities.enableScreen();
    this.modalWindows.each( function(win) {if (win) win.close()});
  },

  // Minimizes a window with its id
  minimize: function(id, event) {
    var win = this.getWindow(id)
    if (win && win.visible)
      win.minimize();
    Event.stop(event);
  },

  // Maximizes a window with its id
  maximize: function(id, event) {
    var win = this.getWindow(id)
    if (win && win.visible)
      win.maximize();
    Event.stop(event);
  },

  // Closes a window with its id
  close: function(id, event) {
    var win = this.getWindow(id);
    if (win)
      win.close();
    if (event)
      Event.stop(event);
  },

  blur: function(id) {
    var win = this.getWindow(id);
    if (!win)
      return;
    if (win.options.blurClassName)
      win.changeClassName(win.options.blurClassName);
    if (this.focusedWindow == win)
      this.focusedWindow = null;
    win._notify("onBlur");
  },

  focus: function(id) {
    var win = this.getWindow(id);
    if (!win)
      return;
    if (this.focusedWindow)
      this.blur(this.focusedWindow.getId())

    if (win.options.focusClassName)
      win.changeClassName(win.options.focusClassName);
    this.focusedWindow = win;
    win._notify("onFocus");
  },

  unsetOverflow: function(except) {
    this.windows.each(function(d) { d.oldOverflow = d.getContent().getStyle("overflow") || "auto" ; d.getContent().setStyle({overflow: "hidden"}) });
    if (except && except.oldOverflow)
      except.getContent().setStyle({overflow: except.oldOverflow});
  },

  resetOverflow: function() {
    this.windows.each(function(d) { if (d.oldOverflow) d.getContent().setStyle({overflow: d.oldOverflow}) });
  },

  updateZindex: function(zindex, win) {
    if (zindex > this.maxZIndex) {
      this.maxZIndex = zindex;
      if (this.focusedWindow)
        this.blur(this.focusedWindow.getId())
    }
    this.focusedWindow = win;
    if (this.focusedWindow)
      this.focus(this.focusedWindow.getId())
  }
};

var Dialog = {
  dialogId: null,
  onCompleteFunc: null,
  callFunc: null,
  parameters: null,

  confirm: function(content, parameters) {
    // Get Ajax return before
    if (content && typeof content != "string") {
      Dialog._runAjaxRequest(content, parameters, Dialog.confirm);
      return
    }
    content = content || "";

    parameters = parameters || {};
    var okLabel = parameters.okLabel ? parameters.okLabel : "Ok";
    var cancelLabel = parameters.cancelLabel ? parameters.cancelLabel : "Cancel";

    // Backward compatibility
    parameters = Object.extend(parameters, parameters.windowParameters || {});
    parameters.windowParameters = parameters.windowParameters || {};

    parameters.className = parameters.className || "alert";

    var okButtonClass = "class ='" + (parameters.buttonClass ? parameters.buttonClass + " " : "") + " ok_button'"
    var cancelButtonClass = "class ='" + (parameters.buttonClass ? parameters.buttonClass + " " : "") + " cancel_button'"
    var content = "\
      <div class='" + parameters.className + "_message'>" + content  + "</div>\
        <div class='" + parameters.className + "_buttons'>\
          <input type='button' value='" + okLabel + "' onclick='Dialog.okCallback()' " + okButtonClass + "/>\
          <input type='button' value='" + cancelLabel + "' onclick='Dialog.cancelCallback()' " + cancelButtonClass + "/>\
        </div>\
    ";
    return this._openDialog(content, parameters)
  },

  alert: function(content, parameters) {
    // Get Ajax return before
    if (content && typeof content != "string") {
      Dialog._runAjaxRequest(content, parameters, Dialog.alert);
      return
    }
    content = content || "";

    parameters = parameters || {};
    var okLabel = parameters.okLabel ? parameters.okLabel : "Ok";

    // Backward compatibility
    parameters = Object.extend(parameters, parameters.windowParameters || {});
    parameters.windowParameters = parameters.windowParameters || {};

    parameters.className = parameters.className || "alert";

    var okButtonClass = "class ='" + (parameters.buttonClass ? parameters.buttonClass + " " : "") + " ok_button'"
    var content = "\
      <div class='" + parameters.className + "_message'>" + content  + "</div>\
        <div class='" + parameters.className + "_buttons'>\
          <input type='button' value='" + okLabel + "' onclick='Dialog.okCallback()' " + okButtonClass + "/>\
        </div>";
    return this._openDialog(content, parameters)
  },

  info: function(content, parameters) {
    // Get Ajax return before
    if (content && typeof content != "string") {
      Dialog._runAjaxRequest(content, parameters, Dialog.info);
      return
    }
    content = content || "";

    // Backward compatibility
    parameters = parameters || {};
    parameters = Object.extend(parameters, parameters.windowParameters || {});
    parameters.windowParameters = parameters.windowParameters || {};

    parameters.className = parameters.className || "alert";

    var content = "<div id='modal_dialog_message' class='" + parameters.className + "_message'>" + content  + "</div>";
    if (parameters.showProgress)
      content += "<div id='modal_dialog_progress' class='" + parameters.className + "_progress'>  </div>";

    parameters.ok = null;
    parameters.cancel = null;

    return this._openDialog(content, parameters)
  },

  setInfoMessage: function(message) {
    $('modal_dialog_message').update(message);
  },

  closeInfo: function() {
    Windows.close(this.dialogId);
  },

  _openDialog: function(content, parameters) {
    var className = parameters.className;

    if (! parameters.height && ! parameters.width) {
      parameters.width = WindowUtilities.getPageSize(parameters.options.parent || document.body).pageWidth / 2;
    }
    if (parameters.id)
      this.dialogId = parameters.id;
    else {
      var t = new Date();
      this.dialogId = 'modal_dialog_' + t.getTime();
      parameters.id = this.dialogId;
    }

    // compute height or width if need be
    if (! parameters.height || ! parameters.width) {
      var size = WindowUtilities._computeSize(content, this.dialogId, parameters.width, parameters.height, 5, className)
      if (parameters.height)
        parameters.width = size + 5
      else
        parameters.height = size + 5
    }
    parameters.effectOptions = parameters.effectOptions ;
    parameters.resizable   = parameters.resizable || false;
    parameters.minimizable = parameters.minimizable || false;
    parameters.maximizable = parameters.maximizable ||  false;
    parameters.draggable   = parameters.draggable || false;
    parameters.closable    = parameters.closable || false;

    var win = new Window(parameters);
    win.getContent().innerHTML = content;

    win.showCenter(true, parameters.top, parameters.left);
    win.setDestroyOnClose();

    win.cancelCallback = parameters.onCancel || parameters.cancel;
    win.okCallback = parameters.onOk || parameters.ok;

    return win;
  },

  _getAjaxContent: function(originalRequest)  {
      Dialog.callFunc(originalRequest.responseText, Dialog.parameters)
  },

  _runAjaxRequest: function(message, parameters, callFunc) {
    if (message.options == null)
      message.options = {}
    Dialog.onCompleteFunc = message.options.onComplete;
    Dialog.parameters = parameters;
    Dialog.callFunc = callFunc;

    message.options.onComplete = Dialog._getAjaxContent;
    new Ajax.Request(message.url, message.options);
  },

  okCallback: function() {
    var win = Windows.focusedWindow;
    if (!win.okCallback || win.okCallback(win)) {
      // Remove onclick on button
      $$("#" + win.getId()+" input").each(function(element) {element.onclick=null;})
      win.close();
    }
  },

  cancelCallback: function() {
    var win = Windows.focusedWindow;
    // Remove onclick on button
    $$("#" + win.getId()+" input").each(function(element) {element.onclick=null})
    win.close();
    if (win.cancelCallback)
      win.cancelCallback(win);
  }
}
/*
  Based on Lightbox JS: Fullsize Image Overlays
  by Lokesh Dhakar - http://www.huddletogether.com

  For more information on this script, visit:
  http://huddletogether.com/projects/lightbox/

  Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
  (basically, do anything you want, just leave my name and link)
*/

if (Prototype.Browser.WebKit) {
  var array = navigator.userAgent.match(new RegExp(/AppleWebKit\/([\d\.\+]*)/));
  Prototype.Browser.WebKitVersion = parseFloat(array[1]);
}

var WindowUtilities = {
  // From dragdrop.js
  getWindowScroll: function(parent) {
    var T, L, W, H;
    parent = parent || document.body;
    if (parent != document.body) {
      T = parent.scrollTop;
      L = parent.scrollLeft;
      W = parent.scrollWidth;
      H = parent.scrollHeight;
    }
    else {
      var w = window;
      with (w.document) {
        if (w.document.documentElement && documentElement.scrollTop) {
          T = documentElement.scrollTop;
          L = documentElement.scrollLeft;
        } else if (w.document.body) {
          T = body.scrollTop;
          L = body.scrollLeft;
        }
        if (w.innerWidth) {
          W = w.innerWidth;
          H = w.innerHeight;
        } else if (w.document.documentElement && documentElement.clientWidth) {
          W = documentElement.clientWidth;
          H = documentElement.clientHeight;
        } else {
          W = body.offsetWidth;
          H = body.offsetHeight
        }
      }
    }
    return { top: T, left: L, width: W, height: H };
  },
  //
  // getPageSize()
  // Returns array with page width, height and window width, height
  // Core code from - quirksmode.org
  // Edit for Firefox by pHaez
  //
  getPageSize: function(parent){
    parent = parent || document.body;
    var windowWidth, windowHeight;
    var pageHeight, pageWidth;
    if (parent != document.body) {
      windowWidth = parent.getWidth();
      windowHeight = parent.getHeight();
      pageWidth = parent.scrollWidth;
      pageHeight = parent.scrollHeight;
    }
    else {
      var xScroll, yScroll;

      if (window.innerHeight && window.scrollMaxY) {
        xScroll = document.body.scrollWidth;
        yScroll = window.innerHeight + window.scrollMaxY;
      } else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
        xScroll = document.body.scrollWidth;
        yScroll = document.body.scrollHeight;
      } else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
        xScroll = document.body.offsetWidth;
        yScroll = document.body.offsetHeight;
      }


      if (self.innerHeight) {  // all except Explorer
        windowWidth = self.innerWidth;
        windowHeight = self.innerHeight;
      } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
        windowWidth = document.documentElement.clientWidth;
        windowHeight = document.documentElement.clientHeight;
      } else if (document.body) { // other Explorers
        windowWidth = document.body.clientWidth;
        windowHeight = document.body.clientHeight;
      }

      // for small pages with total height less then height of the viewport
      if(yScroll < windowHeight){
        pageHeight = windowHeight;
      } else {
        pageHeight = yScroll;
      }

      // for small pages with total width less then width of the viewport
      if(xScroll < windowWidth){
        pageWidth = windowWidth;
      } else {
        pageWidth = xScroll;
      }
    }
    return {pageWidth: pageWidth ,pageHeight: pageHeight , windowWidth: windowWidth, windowHeight: windowHeight};
  },

  disableScreen: function(className, overlayId, overlayOpacity, contentId, parent) {
    WindowUtilities.initLightbox(overlayId, className, function() {this._disableScreen(className, overlayId, overlayOpacity, contentId)}.bind(this), parent || document.body);
  },

  _disableScreen: function(className, overlayId, overlayOpacity, contentId) {
    // prep objects
    var objOverlay = $(overlayId);

    var pageSize = WindowUtilities.getPageSize(objOverlay.parentNode);

    // Hide select boxes as they will 'peek' through the image in IE, store old value
    if (contentId && Prototype.Browser.IE) {
      WindowUtilities._hideSelect();
      WindowUtilities._showSelect(contentId);
    }

    // set height of Overlay to take up whole page and show
    objOverlay.style.height = (pageSize.pageHeight + 'px');
    objOverlay.style.display = 'none';
    if (overlayId == "overlay_modal" && Window.hasEffectLib && Windows.overlayShowEffectOptions) {
      objOverlay.overlayOpacity = overlayOpacity;
      new Effect.Appear(objOverlay, Object.extend({from: 0, to: overlayOpacity}, Windows.overlayShowEffectOptions));
    }
    else
      objOverlay.style.display = "block";
  },

  enableScreen: function(id) {
    id = id || 'overlay_modal';
    var objOverlay =  $(id);
    if (objOverlay) {
      // hide lightbox and overlay
      if (id == "overlay_modal" && Window.hasEffectLib && Windows.overlayHideEffectOptions)
        new Effect.Fade(objOverlay, Object.extend({from: objOverlay.overlayOpacity, to:0}, Windows.overlayHideEffectOptions));
      else {
        objOverlay.style.display = 'none';
        objOverlay.parentNode.removeChild(objOverlay);
      }

      // make select boxes visible using old value
      if (id != "__invisible__")
        WindowUtilities._showSelect();
    }
  },

  _hideSelect: function(id) {
    if (Prototype.Browser.IE) {
      id = id ==  null ? "" : "#" + id + " ";
      $$(id + 'select').each(function(element) {
        if (! WindowUtilities.isDefined(element.oldVisibility)) {
          element.oldVisibility = element.style.visibility ? element.style.visibility : "visible";
          element.style.visibility = "hidden";
        }
      });
    }
  },

  _showSelect: function(id) {
    if (Prototype.Browser.IE) {
      id = id ==  null ? "" : "#" + id + " ";
      $$(id + 'select').each(function(element) {
        if (WindowUtilities.isDefined(element.oldVisibility)) {
          // Why?? Ask IE
          try {
            element.style.visibility = element.oldVisibility;
          } catch(e) {
            element.style.visibility = "visible";
          }
          element.oldVisibility = null;
        }
        else {
          if (element.style.visibility)
            element.style.visibility = "visible";
        }
      });
    }
  },

  isDefined: function(object) {
    return typeof(object) != "undefined" && object != null;
  },

  // initLightbox()
  // Function runs on window load, going through link tags looking for rel="lightbox".
  // These links receive onclick events that enable the lightbox display for their targets.
  // The function also inserts html markup at the top of the page which will be used as a
  // container for the overlay pattern and the inline image.
  initLightbox: function(id, className, doneHandler, parent) {
    // Already done, just update zIndex
    if ($(id)) {
      Element.setStyle(id, {zIndex: Windows.maxZIndex + 1});
      Windows.maxZIndex++;
      doneHandler();
    }
    // create overlay div and hardcode some functional styles (aesthetic styles are in CSS file)
    else {
      var objOverlay = document.createElement("div");
      objOverlay.setAttribute('id', id);
      objOverlay.className = "overlay_" + className
      objOverlay.style.display = 'none';
      objOverlay.style.position = 'absolute';
      objOverlay.style.top = '0';
      objOverlay.style.left = '0';
      objOverlay.style.zIndex = Windows.maxZIndex + 1;
      Windows.maxZIndex++;
      objOverlay.style.width = '100%';
      parent.insertBefore(objOverlay, parent.firstChild);
      if (Prototype.Browser.WebKit && id == "overlay_modal") {
        setTimeout(function() {doneHandler()}, 10);
      }
      else
        doneHandler();
    }
  },

  setCookie: function(value, parameters) {
    document.cookie= parameters[0] + "=" + escape(value) +
      ((parameters[1]) ? "; expires=" + parameters[1].toGMTString() : "") +
      ((parameters[2]) ? "; path=" + parameters[2] : "") +
      ((parameters[3]) ? "; domain=" + parameters[3] : "") +
      ((parameters[4]) ? "; secure" : "");
  },

  getCookie: function(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
      begin = dc.indexOf(prefix);
      if (begin != 0) return null;
    } else {
      begin += 2;
    }
    var end = document.cookie.indexOf(";", begin);
    if (end == -1) {
      end = dc.length;
    }
    return unescape(dc.substring(begin + prefix.length, end));
  },

  _computeSize: function(content, id, width, height, margin, className) {
    var objBody = document.body;
    var tmpObj = document.createElement("div");
    tmpObj.setAttribute('id', id);
    tmpObj.className = className + "_content";

    if (height)
      tmpObj.style.height = height + "px"
    else
      tmpObj.style.width = width + "px"

    tmpObj.style.position = 'absolute';
    tmpObj.style.top = '0';
    tmpObj.style.left = '0';
    tmpObj.style.display = 'none';

    tmpObj.innerHTML = content;
    objBody.insertBefore(tmpObj, objBody.firstChild);

    var size;
    if (height)
      size = $(tmpObj).getDimensions().width + margin;
    else
      size = $(tmpObj).getDimensions().height + margin;
    objBody.removeChild(tmpObj);
    return size;
  }
}

/*
 to support the tree view control
 
 notes: couldn't just use bg images on the spans to indicate i, node, spacer, etc. worked fine with IE, but on firefox,    
        bgimages do not resize automatically, so on changing font size, the whole tree renedered messed up.
 
 requires:prototype.js
 requires: CONSTANTS_CONTEXT_ROOT to be defined (in header.jsp?)
*/

//var IMAGES_DIR = "/unsecured/images";
var IMAGES_DIR = CONSTANTS_CONTEXT_ROOT + "/unsecured/images";


// node clicked
function treeview_nc(ref)
{
  var root = ($(ref).up());
  (root.select('div')).invoke('toggle');
  treeview_toggle(ref);
}

function treeview_toggle(ref)
{
  if(ref.hasClassName('no')) {
    ref.removeClassName('no');ref.addClassName('nc');
    (ref.down('img')).src = IMAGES_DIR + '/tv_nc.gif';
  } else if(ref.hasClassName('nc')) {
    ref.removeClassName('nc');ref.addClassName('no');
    (ref.down('img')).src = IMAGES_DIR + '/tv_no.gif';
  } else if(ref.hasClassName('nlo')) {
    ref.removeClassName('nlo');ref.addClassName('nlc');
    (ref.down('img')).src = IMAGES_DIR + '/tv_nlc.gif';
  } else if(ref.hasClassName('nlc')) {
    ref.removeClassName('nlc');ref.addClassName('nlo');
    (ref.down('img')).src = IMAGES_DIR + '/tv_nlo.gif';
  }  
}
// checbox clicked 
function treeview_cc(ref)
{
  $(ref).up('div').select('input[type="checkbox"]').each(function(e){e.checked=ref.checked;});
}

var TreeFunctions = {

    toggleCheckbox : function(elm){
        var children = $(elm).up('.row').select('.subTree input[type="checkbox"]');

        children.each( function(box){
                box.checked=elm.checked;
            }
        );
        TreeFunctions.toggleParentCheckbox(elm);
    },

    toggleParentCheckbox : function(elm)
    {
        var parentCheckbox = elm.up('.subTreeTitleWrapper').up('.subTreeTitleWrapper');
        if ( parentCheckbox )
        {
            parentCheckbox = parentCheckbox.down('input[type="checkbox"]');
            var siblings = elm.up('.subTree').select('input[type="checkbox"]');

            var check = true,
                i= 0,
                len =siblings.length;

            for ( ; i<len ; i++){
                if (!siblings[i].checked)
                {
                    check = false;
                    break;
                }
            }
            parentCheckbox.checked = check;
            TreeFunctions.toggleParentCheckbox(parentCheckbox);
        }
    },
    toggleIcons : function(ref)
    {
        ref.up().down('ul').toggle();
        ref.toggleClassName("fa-minus-square-o");
        ref.toggleClassName("fa-plus-square");
    },
    colExpAll: function(elm, open){
        var icons = elm.up('.tree_wrapper').down('.tree-hierarchy').select('.fa');

        for ( var i=0; i<icons.length; i++)
        {
            TreeFunctions.openCloseTree(icons[i], open);
        }
    },
    openCloseTree : function(ref, open){
        ref.removeClassName("fa-plus-square");
        ref.removeClassName("fa-minus-square-o");
        if ( open)
        {
            ref.up().down('ul').show();
            ref.addClassName("fa-minus-square-o");
        }
        else
        {
            ref.up().down('ul').hide();
            ref.addClassName("fa-plus-square");

        }



    }
}

/*
  SortTable
  version 2
  7th April 2007
  Stuart Langridge, http://www.kryogenix.org/code/browser/sorttable/
  
  Instructions:
  Download this file
  Add <script src="sorttable.js"></script> to your HTML
  Add class="sortable" to any table you'd like to make sortable
  Click on the headers to sort
  
  Thanks to many, many people for contributions and suggestions.
  Licenced as X11: http://www.kryogenix.org/code/browser/licence.html
  This basically means: do what you want with it.
 */

var stIsIE = /* @cc_on!@ */false;

sorttable = {
    init : function() {

        // quit if this function has already been called
        if (arguments.callee.done)
            return;
        // flag this function so we don't do the same thing twice
        arguments.callee.done = true;
        // kill the timer
        if (_timer)
            clearInterval(_timer);

        if (!document.createElement || !document.getElementsByTagName)
            return;

        sorttable.DATE_RE = /^(\d\d?)[\/\.-](\d\d?)[\/\.-]((\d\d)?\d\d)$/;

        forEach(document.getElementsByTagName('table'), function(table) {
            if (table.className.search(/\bsortable\b/) != -1) {
                sorttable.makeSortable(table);
            }
        });
    },

    removeAll : function(s, t) {
        var i = s.indexOf(t);
        var r = "";
        if (i == -1)
            return s;
        r += s.substring(0, i) + remove(s.substring(i + t.length), t);
        return r;
    },

    makeSortableHeaderProxy : function(table) {

        // console.log("calling makeSortableHeaderProxy with:");
        // console.log(table);

        if (table.alreadySortableProxy == 'yes') {
            // console.log("table.alreadySortableProxy is: " + table.alreadySortableProxy + " so don't make it sortable again!");
            return;
        } else {
            // console.log("table.alreadySortableProxy is not yet set, time to set it");
            table.alreadySortableProxy = 'yes';
        }
        // console.log("NOW table.alreadySortableProxy is: " + table.alreadySortableProxy);

        if (table.getElementsByTagName('thead').length == 0) {
            // table doesn't have a tHead. Since it should have, create one and
            // put the first table row in it.
            the = document.createElement('thead');
            the.appendChild(table.rows[0]);
            table.insertBefore(the, table.firstChild);
        }
        // Safari doesn't support table.tHead, sigh
        if (table.tHead == null)
            table.tHead = table.getElementsByTagName('thead')[0];

        if (table.tHead.rows.length != 1)
            return; // can't cope with two header rows

        // Sorttable v1 put rows with a class of "sortbottom" at the bottom (as
        // "total" rows, for example). This is B&R, since what you're supposed
        // to do is put them in a tfoot. So, if there are sortbottom rows,
        // for backwards compatibility, move them to tfoot (creating it if needed).
        sortbottomrows = [];
        for ( var i = 0; i < table.rows.length; i++) {
            if (table.rows[i].className.search(/\bsortbottom\b/) != -1) {
                sortbottomrows[sortbottomrows.length] = table.rows[i];
            }
        }
        if (sortbottomrows) {
            if (table.tFoot == null) {
                // table doesn't have a tfoot. Create one.
                tfo = document.createElement('tfoot');
                table.appendChild(tfo);
            }
            for ( var i = 0; i < sortbottomrows.length; i++) {
                tfo.appendChild(sortbottomrows[i]);
            }
            delete sortbottomrows;
        }

        // work through each column and calculate its type
        headrow = table.tHead.rows[0].cells;
        for ( var i = 0; i < headrow.length; i++) {
            // manually override the type with a sorttable_type attribute
            if (!headrow[i].className.match(/\bsorttable_nosort\b/)) { // skip this col
                mtch = headrow[i].className.match(/\bsorttable_([a-z0-9]+)\b/);
                if (mtch) {
                    override = mtch[1];
                }
                if (mtch && typeof sorttable["sort_" + override] == 'function') {
                    headrow[i].sorttable_sortfunction = sorttable["sort_" + override];
                } else {
                    headrow[i].sorttable_sortfunction = sorttable.guessType(table, i);
                }
                // make it clickable to sort
                headrow[i].sorttable_columnindex = i;
                headrow[i].sorttable_tbody = table.tBodies[0];

                dean_addEvent(headrow[i], "click", function(e) {

                    // find the proxied table header to work on
                    var idProxyHeader = this.id;
                    var idLength = idProxyHeader.length;
                    var idHiddenHeader = idProxyHeader.replace(/Proxy/gi, '');
                    var fireOnThis = document.getElementById(idHiddenHeader);

                    // kick off the sort event on the real table (the table with
                    // data in it)
                    /*
                    if (stIsIE) {
                        fireOnThis.click();
                    } else {
                        var evObj = document.createEvent('MouseEvents');
                        evObj.initMouseEvent('click', true, true, window, 1, 12, 345, 7, 220, false, false, false, false, 0, null);
                        fireOnThis.dispatchEvent(evObj);
                    }
                    */
                    try {
                        fireOnThis.click();
                    } catch (e) {
                        try {
                            var evObj = document.createEvent('MouseEvents');
                            evObj.initMouseEvent('click', true, true, window, 1, 12, 345, 7, 220, false, false, false, false, 0, null);
                            fireOnThis.dispatchEvent(evObj);
                        } catch (e2) {}
                    }

                    // do the work to make the header proxy table appear sorted
                    // (arrows etc)
                    if (this.className.search(/\bsorttable_sorted\b/) != -1) {

                        // console.log("inside the block with 'sorttable_sorted'");
                        this.className = this.className.replace('sorttable_sorted', 'sorttable_sorted_reverse');
                        // clear out the FWD indicator
                        try {
                            this.removeChild(document.getElementById('sorttable_sortfwdind'));
                        } catch (e) {
                            // console.warn("unable to remove FWD ind. reason: " +
                            // e.name + " " + e.message);
                        }

                        // add in the REV indicator
                        sortrevind = document.createElement('span');
                        sortrevind.id = "sorttable_sortrevind";
                        sortrevind.innerHTML = stIsIE ? '&nbsp<font face="webdings">5</font>' : '&nbsp;&#x25B4;';
                        this.appendChild(sortrevind);
                        return;
                    }

                    if (this.className.search(/\bsorttable_sorted_reverse\b/) != -1) {

                        this.className = this.className.replace('sorttable_sorted_reverse', 'sorttable_sorted');

                        // remove the REV indicator
                        try {
                            this.removeChild(document.getElementById('sorttable_sortrevind'));
                        } catch (e) {
                            // console.warn("unable to remove REV ind. reason: " +
                            // e.name + " " + e.message);
                        }

                        // add in the FWD indicator
                        sortfwdind = document.createElement('span');
                        sortfwdind.id = "sorttable_sortfwdind";
                        sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
                        this.appendChild(sortfwdind);
                        return;
                    }

                    // this only happens the first time a cell is clicked on a table

                    // clear out other cells in the table that were sorted
                    theadrow = this.parentNode;
                    forEach(theadrow.childNodes, function(cell) {
                        if (cell.nodeType == 1) { // an element
                            cell.className = cell.className.replace('sorttable_sorted_reverse', '');
                            cell.className = cell.className.replace('sorttable_sorted', '');
                        }
                    });
                    sortfwdind = document.getElementById('sorttable_sortfwdind');
                    if (sortfwdind) {
                        sortfwdind.parentNode.removeChild(sortfwdind);
                    }
                    sortrevind = document.getElementById('sorttable_sortrevind');
                    if (sortrevind) {
                        sortrevind.parentNode.removeChild(sortrevind);
                    }

                    // mark current column as the one we are sorted by
                    this.className += ' sorttable_sorted';
                    sortfwdind = document.createElement('span');
                    sortfwdind.id = "sorttable_sortfwdind";
                    sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
                    this.appendChild(sortfwdind);
                });
            }
        }
    },

    makeSortable : function(table) {

        // console.log("calling makeSortable with:");
        // console.log(table);

        if (table.alreadySortable == 'yes') {
            // console.log("table.alreadySortable is: " + table.alreadySortable + " so don't make it sortable again!");
            return;
        } else {
            // console.log("table.alreadySortable is not yet set, time to set it");
            table.alreadySortable = 'yes';
        }
        // console.log("NOW table.alreadySortable is: " + table.alreadySortable);

        if (table.getElementsByTagName('thead').length == 0) {
            // table doesn't have a tHead. Since it should have, create one and
            // put the first table row in it.
            the = document.createElement('thead');
            the.appendChild(table.rows[0]);
            table.insertBefore(the, table.firstChild);
        }
        // Safari doesn't support table.tHead, sigh
        if (table.tHead == null)
            table.tHead = table.getElementsByTagName('thead')[0];

        // if (table.tHead.rows.length != 1) return; // can't cope with two header rows

        // Sorttable v1 put rows with a class of "sortbottom" at the bottom (as
        // "total" rows, for example). This is B&R, since what you're supposed
        // to do is put them in a tfoot. So, if there are sortbottom rows,
        // for backwards compatibility, move them to tfoot (creating it if needed).
        sortbottomrows = [];
        for ( var i = 0; i < table.rows.length; i++) {
            if (table.rows[i].className.search(/\bsortbottom\b/) != -1) {
                sortbottomrows[sortbottomrows.length] = table.rows[i];
            }
        }

        if (sortbottomrows) {
            if (table.tFoot == null) {
                // table doesn't have a tfoot. Create one.
                tfo = document.createElement('tfoot');
                table.appendChild(tfo);
            }
            for ( var i = 0; i < sortbottomrows.length; i++) {
                tfo.appendChild(sortbottomrows[i]);
            }
            delete sortbottomrows;
        }

        // work through each column and calculate its type
        headrow = table.tHead.rows[0].cells;
        for ( var i = 0; i < headrow.length; i++) {
            // manually override the type with a sorttable_type attribute
            if (!headrow[i].className.match(/\bsorttable_nosort\b/)) { // skip this col
                mtch = headrow[i].className.match(/\bsorttable_([a-z0-9]+)\b/);
                if (mtch) {
                    override = mtch[1];
                }
                if (mtch && typeof sorttable["sort_" + override] == 'function') {
                    headrow[i].sorttable_sortfunction = sorttable["sort_" + override];
                } else {
                    headrow[i].sorttable_sortfunction = sorttable.guessType(table, i);
                }
                // make it clickable to sort
                headrow[i].sorttable_columnindex = i;
                headrow[i].sorttable_tbody = table.tBodies[0];

                dean_addEvent(headrow[i], "click", function(e) {

                    // console.log("clicked on a header row");
                    // console.log(e);

                    if (this.className.search(/\bsorttable_sorted\b/) != -1) {
                        // if we're already sorted by this column, just
                        // reverse the table, which is quicker
                        // console.log("table is already SORTED");
                        sorttable.reverse(this.sorttable_tbody);
                        this.className = this.className.replace('sorttable_sorted', 'sorttable_sorted_reverse');
                        try {
                            this.removeChild(document.getElementById('sorttable_sortfwdind'));
                        } catch (e) {
                            // console.warn("unable to remove FWD ind. reason: " +
                            // e.name + " " + e.message);
                        }

                        sortrevind = document.createElement('span');
                        sortrevind.id = "sorttable_sortrevind";
                        sortrevind.innerHTML = stIsIE ? '&nbsp<font face="webdings">5</font>' : '&nbsp;&#x25B4;';
                        this.appendChild(sortrevind);
                        return;
                    }
                    if (this.className.search(/\bsorttable_sorted_reverse\b/) != -1) {
                        // if we're already sorted by this column in reverse, just
                        // re-reverse the table, which is quicker
                        // console.log("table is already SORTED IN REVERSE");
                        sorttable.reverse(this.sorttable_tbody);
                        this.className = this.className.replace('sorttable_sorted_reverse', 'sorttable_sorted');
                        try {
                            this.removeChild(document.getElementById('sorttable_sortrevind'));
                        } catch (e) {
                            // console.warn("unable to remove REV ind. reason: " + e.name +
                            // " " + e.message);
                        }

                        sortfwdind = document.createElement('span');
                        sortfwdind.id = "sorttable_sortfwdind";
                        sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
                        this.appendChild(sortfwdind);
                        return;
                    }
                    // console.log("table was not yet sorted, time to get to work");
                    // remove sorttable_sorted classes
                    theadrow = this.parentNode;
                    forEach(theadrow.childNodes, function(cell) {
                        if (cell.nodeType == 1) { // an element
                            cell.className = cell.className.replace('sorttable_sorted_reverse', '');
                            cell.className = cell.className.replace('sorttable_sorted', '');
                        }
                    });
                    sortfwdind = document.getElementById('sorttable_sortfwdind');
                    if (sortfwdind) {
                        sortfwdind.parentNode.removeChild(sortfwdind);
                    }
                    sortrevind = document.getElementById('sorttable_sortrevind');
                    if (sortrevind) {
                        sortrevind.parentNode.removeChild(sortrevind);
                    }

                    this.className += ' sorttable_sorted';
                    sortfwdind = document.createElement('span');
                    sortfwdind.id = "sorttable_sortfwdind";
                    sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
                    this.appendChild(sortfwdind);

                    // build an array to sort. This is a Schwartzian transform thing,
                    // i.e., we "decorate" each row with the actual sort key,
                    // sort based on the sort keys, and then put the rows back in order
                    // which is a lot faster because you only do getInnerText once per row
                    row_array = [];
                    col = this.sorttable_columnindex;
                    rows = this.sorttable_tbody.rows;
                    for ( var j = 0; j < rows.length; j++) {
                        row_array[row_array.length] = [ sorttable.getInnerText(rows[j].cells[col]), rows[j] ];
                    }
                    /* If you want a stable sort, uncomment the following line */
                    // sorttable.shaker_sort(row_array, this.sorttable_sortfunction);
                    /* and comment out this one */
                    row_array.sort(this.sorttable_sortfunction);

                    tb = this.sorttable_tbody;
                    var toggleValue = true;
                    for ( var j = 0; j < row_array.length; j++) {

                        if (toggleValue) {
                            row_array[j][1].className = "row_even";
                        } else {
                            row_array[j][1].className = "row_odd";
                        }
                        toggleValue = !toggleValue;
                        tb.appendChild(row_array[j][1]);
                    }

                    delete row_array;
                });
            }
        }
    },

    guessType : function(table, column) {

        // guess the type of a column based on its first non-blank row
        sortfn = sorttable.sort_alpha;

        // console.log("GuessType for column-" + column);

        for ( var i = 0; i < table.tBodies[0].rows.length; i++) {
            text = sorttable.getInnerText(table.tBodies[0].rows[i].cells[column]);
            if (text != '') {
                if (text.match(/^-?[£$¤]?[\d,.]+%?$/)) {
                    // console.log("for column-" + column + " using a sort_numeric");
                    return sorttable.sort_numeric;
                }
                // check for a date: dd/mm/yyyy or dd/mm/yy
                // can have / or . or - as separator
                // can be mm/dd as well
                possdate = text.match(sorttable.DATE_RE)
                // console.log("   possdate for column-" + column + " row-" + i + " = [" + possdate + "]   text was: [" + text + "]");
                // console.log(text);
                // console.log(possdate);
                if (possdate != null && possdate != '') {
                // if (possdate) {
                    // console.log(" got inside the block for possdate, (possdate && true) = " + (possdate && true));
                    // looks like a date
                    first = parseInt(possdate[1]);
                    second = parseInt(possdate[2]);
                    if (first > 12) {
                        // definitely dd/mm
                        // console.log("for column-" + column + " using a sort_ddmm(1)     " + " first=" + first + " second=" + second);
                        return sorttable.sort_ddmm;
                    } else if (second > 12) {
                        // console.log("for column-" + column + " using a sort_mmdd        " + " first=" + first + " second=" + second);
                        return sorttable.sort_mmdd;
                    } else {
                        // looks like a date, but we can't tell which, so assume
                        // that it's dd/mm (English imperialism!) and keep looking
                        // console.log("for column-" + column + " using a sort_ddmm(2)     " + " first=" + first + " second=" + second);
                        sortfn = sorttable.sort_ddmm;
                    }
                }
            }
        }
        // console.log("for column-" + column + " using a sort_alpha (default)");
        return sortfn;
    },

    getInnerText : function(node) {
        // gets the text we want to use for sorting for a cell.
        // strips leading and trailing whitespace.
        // this is *not* a generic getInnerText function; it's special to sorttable.
        // for example, you can override the cell text with a customkey attribute.
        // it also gets .value for <input> fields.

        hasInputs = (typeof node.getElementsByTagName == 'function') && node.getElementsByTagName('input').length;

        if (node.getAttribute("sorttable_customkey") != null) {
            return node.getAttribute("sorttable_customkey");
        } else if (typeof node.textContent != 'undefined' && !hasInputs) {
            return node.textContent.replace(/^\s+|\s+$/g, '');
        } else if (typeof node.innerText != 'undefined' && !hasInputs) {
            return node.innerText.replace(/^\s+|\s+$/g, '');
        } else if (typeof node.text != 'undefined' && !hasInputs) {
            return node.text.replace(/^\s+|\s+$/g, '');
        } else {
            switch (node.nodeType) {
                case 3:
                    if (node.nodeName.toLowerCase() == 'input') {
                        return node.value.replace(/^\s+|\s+$/g, '');
                    }
                case 4:
                    return node.nodeValue.replace(/^\s+|\s+$/g, '');
                    break;
                case 1:
                case 11:
                    var innerText = '';
                    for ( var i = 0; i < node.childNodes.length; i++) {
                        innerText += sorttable.getInnerText(node.childNodes[i]);
                    }
                    return innerText.replace(/^\s+|\s+$/g, '');
                    break;
                default:
                    return '';
            }
        }
    },

    reverse : function(tbody) {
        // reverse the rows in a tbody
        newrows = [];
        for ( var i = 0; i < tbody.rows.length; i++) {
            newrows[newrows.length] = tbody.rows[i];
        }
        for ( var i = newrows.length - 1; i >= 0; i--) {
            tbody.appendChild(newrows[i]);
        }
        delete newrows;
    },

    /*
     * sort functions each sort function takes two parameters, a and b you are
     * comparing a[0] and b[0]
     */
    sort_numeric : function(a, b) {
        aa = parseFloat(a[0].replace(/[^0-9.-]/g, ''));
        if (isNaN(aa))
            aa = 0;
        bb = parseFloat(b[0].replace(/[^0-9.-]/g, ''));
        if (isNaN(bb))
            bb = 0;
        return aa - bb;
    },

    sort_alpha : function(a, b) {
        if (a[0] == b[0])
            return 0;
        if (a[0] < b[0])
            return -1;
        return 1;
    },

    sort_ddmm : function(a, b) {
        mtch = a[0].match(sorttable.DATE_RE);
        y = mtch[3];
        m = mtch[2];
        d = mtch[1];
        if (m.length == 1)
            m = '0' + m;
        if (d.length == 1)
            d = '0' + d;
        dt1 = y + m + d;
        mtch = b[0].match(sorttable.DATE_RE);
        y = mtch[3];
        m = mtch[2];
        d = mtch[1];
        if (m.length == 1)
            m = '0' + m;
        if (d.length == 1)
            d = '0' + d;
        dt2 = y + m + d;
        if (dt1 == dt2)
            return 0;
        if (dt1 < dt2)
            return -1;
        return 1;
    },

    sort_mmdd : function(a, b) {
        mtch = a[0].match(sorttable.DATE_RE);
        y = mtch[3];
        d = mtch[2];
        m = mtch[1];
        if (m.length == 1)
            m = '0' + m;
        if (d.length == 1)
            d = '0' + d;
        dt1 = y + m + d;
        mtch = b[0].match(sorttable.DATE_RE);
        y = mtch[3];
        d = mtch[2];
        m = mtch[1];
        if (m.length == 1)
            m = '0' + m;
        if (d.length == 1)
            d = '0' + d;
        dt2 = y + m + d;
        if (dt1 == dt2)
            return 0;
        if (dt1 < dt2)
            return -1;
        return 1;
    },

    shaker_sort : function(list, comp_func) {
        // A stable sort function to allow multi-level sorting of data
        // see: http://en.wikipedia.org/wiki/Cocktail_sort
        // thanks to Joseph Nahmias
        var b = 0;
        var t = list.length - 1;
        var swap = true;

        while (swap) {
            swap = false;
            for ( var i = b; i < t; ++i) {
                if (comp_func(list[i], list[i + 1]) > 0) {
                    var q = list[i];
                    list[i] = list[i + 1];
                    list[i + 1] = q;
                    swap = true;
                }
            } // for
            t--;

            if (!swap)
                break;

            for ( var i = t; i > b; --i) {
                if (comp_func(list[i], list[i - 1]) < 0) {
                    var q = list[i];
                    list[i] = list[i - 1];
                    list[i - 1] = q;
                    swap = true;
                }
            } // for
            b++;

        } // while(swap)
    }
}

/*******************************************************************************
 * Supporting functions: bundled here to avoid depending on a library
 ******************************************************************************/

// Dean Edwards/Matthias Miller/John Resig
/* for Mozilla/Opera9 */
if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", sorttable.init, false);
}

/* for Internet Explorer */
/* @cc_on @ */
/*
 * @if (@_win32) var dummy = (location.protocol == "https:") ? "//:" :
 * "javascript:void(0)"; document.write("<script id=__ie_onload defer src='" +
 * dummy + "'><\/script>");
 * 
 * var script = document.getElementById("__ie_onload");
 * 
 * script.onreadystatechange = function() { if (this.readyState == "complete") {
 * sorttable.init(); // call the onload handler } }; /*@end @
 */

/* for Safari */
if (/WebKit/i.test(navigator.userAgent)) { // sniff
    var _timer = setInterval(function() {
        if (/loaded|complete/.test(document.readyState)) {
            sorttable.init(); // call the onload handler
        }
    }, 10);
}

/* for other browsers */
window.onload = sorttable.init;

// written by Dean Edwards, 2005
// with input from Tino Zijdel, Matthias Miller, Diego Perini

// http://dean.edwards.name/weblog/2005/10/add-event/

function dean_addEvent(element, type, handler) {
    if (element.addEventListener) {
        element.addEventListener(type, handler, false);
    } else {
        // assign each event handler a unique ID
        if (!handler.$$guid)
            handler.$$guid = dean_addEvent.guid++;
        // create a hash table of event types for the element
        if (!element.events)
            element.events = {};
        // create a hash table of event handlers for each element/event pair
        var handlers = element.events[type];
        if (!handlers) {
            handlers = element.events[type] = {};
            // store the existing event handler (if there is one)
            if (element["on" + type]) {
                handlers[0] = element["on" + type];
            }
        }
        // store the event handler in the hash table
        handlers[handler.$$guid] = handler;
        // assign a global event handler to do all the work
        element["on" + type] = handleEvent;
    }
};
// a counter used to create unique IDs
dean_addEvent.guid = 1;

function removeEvent(element, type, handler) {
    if (element.removeEventListener) {
        element.removeEventListener(type, handler, false);
    } else {
        // delete the event handler from the hash table
        if (element.events && element.events[type]) {
            delete element.events[type][handler.$$guid];
        }
    }
};

function handleEvent(event) {

    var returnValue = true;
    // grab the event object (IE uses a global event object)
    event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
    // get a reference to the hash table of event handlers
    var handlers = this.events[event.type];
    // execute each event handler
    for ( var i in handlers) {
        this.$$handleEvent = handlers[i];
        if (this.$$handleEvent(event) === false) {
            returnValue = false;
        }
    }
    return returnValue;
};

function fixEvent(event) {
    // add W3C standard event methods
    event.preventDefault = fixEvent.preventDefault;
    event.stopPropagation = fixEvent.stopPropagation;
    return event;
};

fixEvent.preventDefault = function() {
    this.returnValue = false;
};

fixEvent.stopPropagation = function() {
    this.cancelBubble = true;
}

// Dean's forEach: http://dean.edwards.name/base/forEach.js
/*
 * forEach, version 1.0 Copyright 2006, Dean Edwards License:
 * http://www.opensource.org/licenses/mit-license.php
 */

// array-like enumeration
if (!Array.forEach) { // mozilla already supports this
    Array.forEach = function(array, block, context) {
        for ( var i = 0; i < array.length; i++) {
            block.call(context, array[i], i, array);
        }
    };
}

// generic enumeration
Function.prototype.forEach = function(object, block, context) {
    for ( var key in object) {
        if (typeof this.prototype[key] == "undefined") {
            block.call(context, object[key], key, object);
        }
    }
};

// character enumeration
String.forEach = function(string, block, context) {
    Array.forEach(string.split(""), function(chr, index) {
        block.call(context, chr, index, string);
    });
};

// globally resolve forEach enumeration
var forEach = function(object, block, context) {
    if (object) {
        var resolve = Object; // default
        if (object instanceof Function) {
            // functions have a "length" property
            resolve = Function;
        } else if (object.forEach instanceof Function) {
            // the object implements a custom forEach method so use that
            object.forEach(block, context);
            return;
        } else if (typeof object == "string") {
            // the object is a string
            resolve = String;
        } else if (typeof object.length == "number") {
            // the object is array-like
            resolve = Array;
        }
        resolve.forEach(object, block, context);
    }
};
//  Prototip 1.0.2
//  by Nick Stakenburg - http://www.nickstakenburg.com
//  08-08-2007
//
//  More information on this project:
//  http://www.nickstakenburg.com/projects/prototip/
//
//  Licensed under the Creative Commons Attribution 3.0 License
//  http://creativecommons.org/licenses/by/3.0/
//

var Tips = {
  tips: [],
  zIndex: 1200,

  add: function(tip) {
    this.tips.push(tip);
  },

  remove: function(element) {
    var tip = this.tips.find(function(t){ return t.element == $(element); });
    if (!tip) return;

    this.tips = this.tips.reject(function(t) { return t==tip; });
    tip.deactivate();
    if(tip.tooltip) tip.wrapper.remove();
    if(tip.underlay) tip.underlay.remove();
  }
}

var Tip = Class.create();
Tip.prototype = {

  initialize: function(element, content) {
    this.element = $(element);
    Tips.remove(this.element);

    this.content = content;

    this.options = Object.extend({
      className: 'tooltip',
      duration: 0.3,					// duration of the effect
      effect: false,					// false, 'appear' or 'blind'
      hook: false,						// { element: {'topLeft|topRight|bottomLeft|bottomRight'}, tip: {'topLeft|topRight|bottomLeft|bottomRight'}
      offset: (arguments[2] && arguments[2].hook) ? {x:0, y:0} : {x:16, y:16},
      fixed: false,						// follow the mouse if false
      target: this.element,				// or another element
      title: false,
      viewport: true					// keep within viewport if mouse is followed
    }, arguments[2] || {});

    this.target = $(this.options.target);

    if (this.options.hook) {
      this.options.fixed = true;
      this.options.viewport = false;
    }

	if (this.options.effect) {
      this.queue = { position: 'end', limit: 1, scope: ''}
      var c = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
      for (var i=0; i<6; i++) {
        var r = Math.floor(Math.random() * c.length);
        this.queue.scope += c.substring(r,r+1);
      }
    }

    this.buildWrapper();

    Tips.add(this);
    this.activate();
  },

  activate: function() {
    this.eventShow = this.showTip.safeBind(this);
    this.eventHide = this.hideTip.safeBind(this);

    this.element.observe('mousemove', this.eventShow);
    this.element.observe('mouseout', this.eventHide);
  },

  deactivate: function() {
    this.element.stopObserving('mousemove', this.eventShow);
    this.element.stopObserving('mouseout', this.eventHide);
  },

  buildWrapper: function() {
  this.wrapper = document.createElement('div');
    Element.setStyle(this.wrapper, {
      position: 'absolute',
      zIndex: Tips.zIndex+1,
      display: 'none'
    });

    // IE select fix
    if (Prototype.Browser.IE) {
      this.underlay = document.createElement('iframe');
      this.underlay.src = 'javascript:;';
      Element.setStyle(this.underlay, {
        position: 'absolute',
        display: 'none',
        border: 0,
        margin: 0,
        opacity: 0.01,
        padding: 0,
        background: 'none',
        zIndex: Tips.zIndex
      });
    }
  },

  buildTip: function() {
    if(Prototype.Browser.IE) document.body.appendChild(this.underlay); // IE selectbox fix

    // add the tooltip
    this.tooltip = this.wrapper.appendChild(document.createElement('div'));
    this.tooltip.className = this.options.className;
    this.tooltip.style.position = 'relative';

    // add the title
    if (this.options.title) {
      this.title = this.tooltip.appendChild(document.createElement('div'));
      this.title.className = 'tiptitle';
      Element.update(this.title, this.options.title);
    }

    // content
    this.tip = this.tooltip.appendChild(document.createElement('div'));
    this.tip.className = 'tipcontent';
    Element.update(this.tip, this.content);

    // add wrapper to the body
    document.body.appendChild(this.wrapper);

    // prepare for effects
    var w = this.wrapper.getDimensions();
    this.wrapper.setStyle({ width: w.width+'px', height: w.height+'px' });
    if (Prototype.Browser.IE) this.underlay.setStyle({ width: w.width+'px', height: w.height+'px' });
    Element.hide(this.tooltip);
  },

  showTip: function(event){
    if (!this.tooltip) this.buildTip();
    this.positionTip(event); // follow mouse
    if (this.wrapper.visible() && this.options.effect != 'appear') return;

    if (Prototype.Browser.IE) this.underlay.show(); // IE select fix
    this.wrapper.show();

    if (!this.options.effect) {
      this.tooltip.show();
    } else {
      // stop running effect
	  if (this.activeEffect) Effect.Queues.get(this.queue.scope).remove(this.activeEffect);
      // start new
	  this.activeEffect = Effect[Effect.PAIRS[this.options.effect][0]](this.tooltip, { duration: this.options.duration, queue: this.queue});
	}
  },

  hideTip: function(event){
    if(!this.wrapper.visible()) return;

	if (!this.options.effect) {
      if (Prototype.Browser.IE) { this.underlay.hide(); } // select fix
      this.tooltip.hide();
      this.wrapper.hide();
    }
    else {
      // stop running effect
	  if (this.activeEffect) Effect.Queues.get(this.queue.scope).remove(this.activeEffect);
      // start new
	  this.activeEffect = Effect[Effect.PAIRS[this.options.effect][1]](this.tooltip, { duration: this.options.duration, queue: this.queue, afterFinish: function(){
        if (Prototype.Browser.IE) this.underlay.hide(); // select fix
        this.wrapper.hide();
      }.bind(this)});
    }
  },

  positionTip: function(event){
    // calculate
    var offset = {'left': this.options.offset.x,'top': this.options.offset.y};
    var targetPosition = Position.cumulativeOffset(this.target);
    var tipd = this.wrapper.getDimensions();
    var pos = {
      'left': (this.options.fixed) ? targetPosition[0] : Event.pointerX(event),
      'top': (this.options.fixed) ? targetPosition[1] : Event.pointerY(event)
    }

    // add offsets
    pos.left += offset.left;
    pos.top += offset.top;

    if (this.options.hook) {
      var dims = {'target': this.target.getDimensions(), 'tip': tipd}
      var hooks = {'target': Position.cumulativeOffset(this.target), 'tip': Position.cumulativeOffset(this.target)}

      for(var z in hooks) {
        switch(this.options.hook[z]){
          case 'topRight':
            hooks[z][0] += dims[z].width;
            break;
          case 'bottomLeft':
            hooks[z][1] += dims[z].height;
            break;
          case 'bottomRight':
            hooks[z][0] += dims[z].width;
            hooks[z][1] += dims[z].height;
            break;
        }
      }

      // move based on hooks
      pos.left += -1*(hooks.tip[0] - hooks.target[0]);
      pos.top += -1*(hooks.tip[1] - hooks.target[1]);
    }

    // move tooltip when there is a different target when following mouse
    if (!this.options.fixed && this.element !== this.target) {
      var elementPosition = Position.cumulativeOffset(this.element);
      pos.left += -1*(elementPosition[0] - targetPosition[0]);
      pos.top += -1*(elementPosition[1] - targetPosition[1]);
	}

    if (!this.options.fixed && this.options.viewport) {
      var scroll = this.getScrollOffsets();
      var viewport = this.viewportSize();
      var pair = {'left': 'width', 'top': 'height'};

      for(var z in pair) {
        if ((pos[z] + tipd[pair[z]] - scroll[z]) > viewport[pair[z]]) {
          pos[z] = pos[z] - tipd[pair[z]] - 2*offset[z];
		}
      }
    }

    // position
    this.wrapper.setStyle({
      left: pos.left + 'px',
      top: pos.top + 'px'
    });

    if (Prototype.Browser.IE) this.underlay.setStyle({ left: pos.left+'px', top: pos.top+'px' });
  },

  // Functions below hopefully won't be needed with prototype 1.6
  viewportWidth: function(){
    if (Prototype.Browser.Opera) return document.body.clientWidth;
    return document.documentElement.clientWidth;
  },

  viewportHeight: function(){
    if (Prototype.Browser.Opera) return document.body.clientHeight;
    if (Prototype.Browser.WebKit) return this.innerHeight;
    return document.documentElement.clientHeight;
  },

  viewportSize : function(){
    return {'height': this.viewportHeight(), 'width': this.viewportWidth()};
  },

  getScrollLeft: function(){
	  return this.pageXOffset || document.documentElement.scrollLeft;
  },

  getScrollTop: function(){
    return this.pageYOffset || document.documentElement.scrollTop;
  },

  getScrollOffsets: function(){
    return {'left': this.getScrollLeft(), 'top': this.getScrollTop()}
  }
}

/* fix for $A is not defined on Firefox */
Function.prototype.safeBind = function() {
  var __method = this, args = $A(arguments), object = args.shift();
  return function() {
	if (typeof $A == 'function')
    return __method.apply(object, args.concat($A(arguments)));
  }
}
THE_CURRENT_IE_SELECT_BOX_FIXER = null;

IESelectWidthFixer = Class.create();
IESelectWidthFixer.prototype =
{
    initialize : function( seId )
    {
        this.selectElementId = seId;
        this.selectElement   = $(this.selectElementId);

        if (Prototype.Browser.IE == true)
        {
            if (getInternetExplorerVersion() >= 8.0) {
                return;
            } 
            else {
                this.prepareFixForIe();
            }
        }
        else
        {
            // do nothing, since we only need the fix in IE
            // alert("this script does not run unless you're using IE");
        }
    },

    getSelectElementId : function()
    {
        return this.selectElementId;
    },

    prepareFixForIe : function()
    {
        // make sure it is only operating on select elements
		if( this.selectElement.tagName.toLowerCase() != 'select')
		{
			throw 'element [' + this.selectElement.id + '] is not a <select>';
			return;
		};

		// capture the current style of the select element, and its parent span
		var originalRuntimeStyle       = this.selectElement.runtimeStyle;
		var originalParentRuntimeStyle = this.selectElement.parentNode.runtimeStyle;

		var sDisplay = this.selectElement.parentNode.currentStyle.display.toLowerCase() ;
		if( sDisplay ==' ' || sDisplay=='inline' || sDisplay=='inline-block' )
		{
			originalParentRuntimeStyle.display = 'inline-block';
			originalParentRuntimeStyle.width = this.selectElement.offsetWidth + 'px';
			originalParentRuntimeStyle.height = this.selectElement.offsetHeight + 'px';
			originalParentRuntimeStyle.position = 'relative';
			originalRuntimeStyle.position = 'absolute';
			originalRuntimeStyle.top = 0;
			originalRuntimeStyle.left = 0;
		}

		this.selectElement.selectedIndex = Math.max( 0 , this.selectElement.selectedIndex );

        // watch for mouseover events on the select
		Event.observe( this.selectElement, 'mouseover', this.onmouseover.bindAsEventListener(this), true);

        // watch for mousedown events on the page
		Event.observe( document, 'mousedown', this.onmousedown.bindAsEventListener(this), true);

        // watch for change events on the select
		Event.observe( this.selectElement, 'change', this.collapseSelect.bindAsEventListener(this), true);

        // watch for mouseout on the select
        Event.observe( this.selectElement, 'mouseout', this.onmouseout.bindAsEventListener(this), true);
    },

	onmouseover : function(e)
	{
	    if (THE_CURRENT_IE_SELECT_BOX_FIXER != null && THE_CURRENT_IE_SELECT_BOX_FIXER != this)
	    {
	        THE_CURRENT_IE_SELECT_BOX_FIXER.collapseSelect(e);
	    }

		this.nStartWidth =  this.selectElement.offsetWidth ;
		this.selectElement.runtimeStyle.width = 'auto';
		this.nEndWidth  = this.selectElement.offsetWidth;

        if (this.nEndWidth > this.nStartWidth)
        {
    		this.expandSelectOptions(this);
    	}
    	else
	    {
            this.selectElement.runtimeStyle.width = '';
	    }

		this.selectElement.focus();

		THE_CURRENT_IE_SELECT_BOX_FIXER = this;
    },

    // when the users mouse leaves the select, if they are not in the midst of making a
    // selection, collapse it back to its original size
    onmouseout : function(e)
    {
        if (this.userIsSelectingFromList == true)
        {
            return;
        }
        else
        {
            this.collapseSelect(e);
        }
    },

	onmousedown : function(e)
	{
	    // get the element that was clicked to cause this event
	    var eventTarget = ( e.srcElement || e.target );

        // if the user clicked on the select element, let them
        // pick their value
		if( (eventTarget == this.selectElement) )
		{
			Event.stop(e);

            this.userIsSelectingFromList = true;

			return false;
		}
		else
	    {
    		// if they have clicked on anything else,
	    	// do the work to collapse the dropdown back to normal size
            this.restoreSelectToOriginalSize(this);

            this.userIsSelectingFromList = false;
        }
	},

    // makes the select look like it looked before
    restoreSelectToOriginalSize : function(element)
    {
        var el = $(element);
        el.selectElement.runtimeStyle.width = '';
    },

    // another means of shrinking the select back to its original size
	collapseSelect : function(e)
	{
		this.selectElement.runtimeStyle.width = '';
        this.userIsSelectingFromList = false;
        try
        {
            this.selectElement.blur();
        }
        catch (e) {}
	},

    // used to gently resize the select element - make it slide out
	expandSelectOptions : function(element)
	{
	    var el = $(element);

		el.selectElement.runtimeStyle.width = 'auto';
		el.selectElement.selectedIndex = Math.max( 0 , el.selectElement.selectedIndex );
	}
};
/*
 common client side functionality

 requires:prototype.js
*/

/*

*/

var RESPONSE_STATUS_SUCCESS = "SUCCESS";
var RESPONSE_STATUS_FAILURE = "FAILURE";

function selectAll() {
    overviewSelectAll();
    jQuery('.selectAll').each(function(index, value) { rowSelect(jQuery(value)); });
}
function rowSelect(row) {
    row.next().attr('value', row[0].checked);
}

function overviewSelectAll(group) {
	
	var groupName = group || "";
	var isMasterChecked=document.getElementsByClassName('selectAllMaster' + groupName)[0].checked;
	$A(document.getElementsByClassName('selectAll' + groupName)).each(function(e){e.checked=isMasterChecked;});
}

function addLoadEvent(func) {
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      if (oldonload) {
        oldonload();
      }
      func();
    }
  }
}

function getInternetExplorerVersion() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat(RegExp.$1);
    }
    return rv;
}

/**
*  adds setValue counterpart toprototype.js getValue.
*  implementation not complete!!
*  for now only works for dropdowns
*/
function setValue(element, valueToSet)
{
	var elementRef = $(element);
    if (("SELECT" == elementRef.tagName)) {
        for (var i = 0; i < elementRef.options.length; i++) {
          if (valueToSet == elementRef.options[i].value) {
            elementRef.options[i].selected = true;
            break; //out of for loop
          }
        }
     }
}

function confirmDialog(message)
{
	return confirm(message);
}

// Used to pop-up the neg val hit screen
//     takes in:
//       context  - the base context
//       transId  - the transaction id
//       vcId     - a virtual column id
//       negHitId - the id of the neg value that was hit
//       detailId - optional - the id of the negative row where value was hit
function popupNegValDetails(context, transId, vcId, negHitId, detailId, bucketId) {
    return popupNegValDetailsWithSuppliedValues(context, transId, vcId, negHitId, detailId, bucketId, {});
}
function popupNegValDetailsWithSuppliedValues(context, transId, vcId, negHitId, detailId, bucketId, suppliedValues) {

    var requestString = context;
    requestString += '/jsp/agent/queue/negativeHitDetails.jsf';
    requestString += '?transId=' + transId;
    requestString += '&vcId=' + vcId;
    requestString += '&negHitId=' + negHitId;
    if (detailId != null && detailId != '') {
        requestString += '&detailId=' + detailId;
    }
    if (bucketId != null && bucketId != '') {
        requestString += '&bucketId=' + bucketId;
    }

    // now gather each property of the suppliedValues and tack those on as request parameters
    for (var name in suppliedValues) {
        // ignore inherited properties with this line
        if (suppliedValues.hasOwnProperty(name)) {
          // get the value of the object stored at that name
            var value = suppliedValues[name];
            requestString += "&" + name + "=" + value;
        }
    }

    // give the window unique to this transaction and negative value combination
    var windowId = 'transId' + transId + 'negHitId' + negHitId;

    // alert("unique window id is: [" + windowId + "]");

    var myWindow
        = window.open(requestString,
                      windowId,
                      'status=0,location=0,directories=0,menubar=0,toolbar=0,width=450,height=450,resizable=1');
}

// TODO comment
function popupShareNegValDetailsNoBucket(context, transId, vcId) {
    popupShareNegValDetails(context, transId, vcId, null);
}
function popupShareNegValDetails(context, transId, vcId, bucketId)
{
    var requestString = context;
    requestString += '/jsp/agent/queue/shareNegativeHitDetails.jsf';
    requestString += '?transId=' + transId;
    requestString += '&vcId=' + vcId;
    if (bucketId != null) {
        requestString += "&bucketId=" + bucketId;
    }

    // give the window unique to this transaction and negative value combination
    var windowId = 'transId' + transId;
    var myWindow
        = window.open(requestString,
                      windowId,
                      'status=0,location=0,directories=0,menubar=0,toolbar=0,width=450,height=450,resizable=1');
}


function popupSimilarTransactionsBase(context, transId, detailId, vcId, bucketId)
{
    var requestString = context;
    requestString += '/jsp/agent/queue/similarTransactions.jsf';
    requestString += '?transId=' + transId;
    requestString += '&detailId=' + detailId;
    requestString += '&vcId=' + vcId;
    requestString += '&bucketId=' + bucketId;

    // give the window unique to this transaction and virtual column combination
    var windowId = "transId" + transId + "detailId" + detailId + "vcId" + vcId;

    //alert("unique window id is: [" + windowId + "]");

    var myWindow
        = window.open(requestString,
                      windowId,
                      'status=0,location=0,directories=0,menubar=0,toolbar=0,width=600,height=400,resizable=1,scrollbars=1');
}

function popupBounce(context, transId, rfId, bucketId, valueId, detailRecordId) {
    return popupBounceWithSuppliedValues(context, transId, rfId, bucketId, valueId, detailRecordId, {});
}

function popupBounceWithSuppliedValues(context, transId, rfId, bucketId, valueId, detailRecordId, suppliedValues)
{
    var requestString = context;
    requestString += '/jsp/agent/bounce.jsf';
    requestString += '?transId=' + transId;
    requestString += '&reviewFunctionId=' + rfId;
    requestString += '&bucketId=' + bucketId;
    requestString += '&linkFieldName=link1_text';
    requestString += '&value=' + valueId;
    if (detailRecordId != null) {
        requestString += '&detailRecordId=' + detailRecordId;
    }

    // now gather each property of the suppliedValues and tack those on as request parameters
    for (var name in suppliedValues) {
        // ignore inherited properties with this line
        if (suppliedValues.hasOwnProperty(name)) {
          // get the value of the object stored at that name
            var value = suppliedValues[name];
            requestString += "&" + name + "=" + value;
        }
    }

    // give the window unique to this transaction and virtual column combination
    var windowId = "transId" + transId + "reviewFunctionId" + rfId;

    // alert("unique window id is: [" + windowId + "]");

    var myWindow
        = window.open(requestString,
                      windowId,
                      'status=0,location=0,directories=0,menubar=0,toolbar=0,width=450,height=300,resizable=1');
}
//
// getPageSize()
// Returns array with page width, height and window width, height
// Core code from - quirksmode.org
// Edit for Firefox by pHaez
//
function getPageSize(parent)
{
    parent = parent || document.body;
    var windowWidth, windowHeight;
    var pageHeight, pageWidth;

    if (parent != document.body)
    {
        windowWidth = parent.getWidth();
        windowHeight = parent.getHeight();
        pageWidth = parent.scrollWidth;
        pageHeight = parent.scrollHeight;
    }
    else
    {
        var xScroll, yScroll;

        if (window.innerHeight && window.scrollMaxY)
        {
            xScroll = document.body.scrollWidth;
            yScroll = window.innerHeight + window.scrollMaxY;
        }
        else if (document.body.scrollHeight > document.body.offsetHeight) // all but Explorer Mac
        {
          xScroll = document.body.scrollWidth;
          yScroll = document.body.scrollHeight;
        }
        else  // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
        {
          xScroll = document.body.offsetWidth;
          yScroll = document.body.offsetHeight;
        }

        if (self.innerHeight)   // all except Explorer
        {
            windowWidth = self.innerWidth;
            windowHeight = self.innerHeight;
        }
        else if (document.documentElement && document.documentElement.clientHeight)  // Explorer 6 Strict Mode
        {
            windowWidth = document.documentElement.clientWidth;
            windowHeight = document.documentElement.clientHeight;
        }
        else if (document.body)  // other Explorers
        {
            windowWidth = document.body.clientWidth;
            windowHeight = document.body.clientHeight;
        }

        // for small pages with total height less then height of the viewport
        if(yScroll < windowHeight)
        {
            pageHeight = windowHeight;
        }
        else
        {
            pageHeight = yScroll;
        }

        // for small pages with total width less then width of the viewport
        if(xScroll < windowWidth)
        {
            pageWidth = windowWidth;
        }
        else
        {
            pageWidth = xScroll;
        }
    }
    return {pageWidth: pageWidth, pageHeight: pageHeight, windowWidth: windowWidth, windowHeight: windowHeight};
}

function getWindowScroll(parent)
{
    var T, L, W, H;
    parent = parent || document.body;
    if (parent != document.body)
    {
        T = parent.scrollTop;
        L = parent.scrollLeft;
        W = parent.scrollWidth;
        H = parent.scrollHeight;
    }
    else
    {
        var w = window;
        with (w.document)
        {
            if (w.document.documentElement && documentElement.scrollTop)
            {
                T = documentElement.scrollTop;
                L = documentElement.scrollLeft;
            }
            else if (w.document.body)
            {
                T = body.scrollTop;
                L = body.scrollLeft;
            }
            if (w.innerWidth)
            {
                W = w.innerWidth;
                H = w.innerHeight;
            }
            else if (w.document.documentElement && documentElement.clientWidth)
            {
                W = documentElement.clientWidth;
                H = documentElement.clientHeight;
            }
            else
            {
                W = body.offsetWidth;
                H = body.offsetHeight
            }
        }
    }
    return { top: T, left: L, width: W, height: H };
}

// Registers with all ajax calls on the screen to show a wait cursor centered on
// the screen when an ajax call begins, then hide the cursor when the call completes
//
// To use this method, you must also include the following block somewhere in your page:
//
// <div id="waitCursorId" style="display:none; position:absolute; border-style: none; background-color: transparent; padding: 0px;">
//     <img src="/unsecured/images/cursor-wait.gif">
// </div>

function showWaitCursorForAllAjaxCalls()
{
    // this block will show a wait cursor while the ajax call is processing,
    // and then hide it when the call has completed
    Ajax.Responders.register({
        // this block executes right as the ajax request is starting
        onCreate: function()
        {
            var windowLeftMiddle = null;
            var windowTopMiddle = null;

            // make a call to common.js to get the page dimensions
            var pageDimensions = getPageSize();

            // the call returns an object with four attributes:
            //     pageWidth
            //     pageHeight
            //     windowWidth
            //     windowHeight

            // make a call to common.js to get the page scroll
            // the call returns an object with four attributes:
            //     top
            //     left
            //     width
            //     height
            var pageScroll = getWindowScroll();

            windowLeftMiddle = pageDimensions.windowWidth / 2;
            windowTopMiddle  = pageDimensions.windowHeight / 2;

            // get reference to the wait cursor div
            var busyCursor = $('waitCursorId');

            busyCursor.setStyle(
                {
                    left: (windowLeftMiddle + pageScroll.left - 25) + "px",
                    top:  (windowTopMiddle + pageScroll.top - 25) + "px"
                }
            );

            Effect.Appear('waitCursorId',{duration:0.3,queue:'end'});
        },
        // this block executes right as the ajax request is complete
        onComplete: function()
        {
            Effect.Fade('waitCursorId',{duration:0.3,queue:'end'});
        }

});

}


function scrollToTop()
{
    var x1 = x2 = x3 = 0;
    var y1 = y2 = y3 = 0;

    if (document.documentElement)
    {
        x1 = document.documentElement.scrollLeft || 0;
        y1 = document.documentElement.scrollTop || 0;
    }

    if (document.body)
    {
        x2 = document.body.scrollLeft || 0;
        y2 = document.body.scrollTop || 0;
    }

    x3 = window.scrollX || 0;
    y3 = window.scrollY || 0;

    var x = Math.max(x1, Math.max(x2, x3));
    var y = Math.max(y1, Math.max(y2, y3));

    window.scrollTo(Math.floor(x / 2), Math.floor(y / 2));

    if (x > 0 || y > 0)
    {
        window.setTimeout("scrollToTop()", 20);
    }
}

var unauthorizedAccess = false;

function hasParameterWarnings(ajaxResponse)
{
    try
    {
        // alert("got back a response: " + ajaxResponse.responseText);

        // parse the response into a JSON object for easier manipulation
        var jsonResponse = ajaxResponse.responseText.evalJSON();

        // alert("mapped response to json object: " + jsonResponse);

        var arrayOfErrorMessages = jsonResponse.arrayOfErrorMessages;
        // alert("arrayOfErrorMessages = " + arrayOfErrorMessages);

        if (arrayOfErrorMessages != null && arrayOfErrorMessages.length > 0)
        {
            var errorMessage = "ERROR: There was an issue processing your request:\n\n";
            for (var i = 0; i < arrayOfErrorMessages.length; i++)
            {
                errorMessage += "  *  " + arrayOfErrorMessages[i] + "\n";
            }

            // if they have not yet been alerted, tell them they were bad
            if (unauthorizedAccess == false)
            {
                // take note of the fact they are being warned once
                unauthorizedAccess = true;
                // if they have done something inappropriate, don't show the screen
                $('mainContentDiv').hide();
                $('mainContentDiv').remove();

                // and tell them that they can't access that
                alert(errorMessage);
            }

            return true;
        }
    }
    catch (e)
    {
        // if the response cannot even be parsed as JSON, it could not have
        // been a paramter problem -
        // just let it go...
    }

    //
    return false;
}

/************************************************************/
/*
 Initializes a new instance of the StringBuilder class and appends the given value if supplied.
 usage:
 var sb = new StringBuilder();
 var sb = new StringBuilder('zero');
 sb.append('one').append('two').append('three');
 alert(sb);
*/
function StringBuilder(value)
{
    this.strings = new Array("");
    this.append(value);
}
// appends the given value to the end of this instance.
StringBuilder.prototype.append = function(value){if(value)this.strings.push(value);return this;}
// clears the string buffer.
StringBuilder.prototype.clear = function(){this.strings.length = 1;}
// converts this instance to a String (overrides String.toString).
StringBuilder.prototype.toString = function(){return this.strings.join("");}
/************************************************************/


/** Used to tell if this form has been submitted */
var HAS_FORM_BEEN_SUBMITTED = false;
function doAllowSubmit() {
    if( HAS_FORM_BEEN_SUBMITTED ) {
        return false;
    } else {
        HAS_FORM_BEEN_SUBMITTED = true;
        return true;
    }
}


function getInnerText(elementRef)
{
    if (elementRef.innerText) { // IE;
        return elementRef.innerText;
    } else if (elementRef.textContent) {
        return elementRef.textContent;
    } else {
    	return '';
        //alert('error applying getInnerText to ' + elementRef);
    }

}

//***************************************************************************
//
// Allows a group of radio buttons to be unchecked by clicking on the
// already checked value again.
//
function allowRadioUnchecks(radioGroupName) {

    // get the radio buttons in the group
    var radios = document.getElementsByName(radioGroupName);
 
    for (var i = 0; i < radios.length; i++) {
        var radio = $(radios[i]);

        // on mousedown, track if it was already checked
        radio.observe('mousedown', function() {
            if (this.checked) {
                this.writeAttribute('alreadyChecked', 'yes');
            } else {
                this.writeAttribute('alreadyChecked', 'no');
            }
        } );
        
        // on mouse up, check to see if it had previously been checked
        // if so, uncheck the whole group
        radio.observe('mouseup', function() {
            var already = this.readAttribute('alreadyChecked');
            if (already != null && already == 'yes') {
                var uncheckAll = function() {
                    for (var j = 0; j < radios.length; j++) {
                        radios[j].checked = false;
                    }
                };
                // the timeout is needed to ensure the uncheck
                // happens _AFTER_ the onclick event
                setTimeout(uncheckAll, 100);
                var blurIt = function() {
                    radio.blur();
                };
                setTimeout(blurIt, 120);
            }
        });
    }
}

var transactionViewMode = false;
var transactionViewOneMode = false;
var transactionIdMode = false;
var showStateMode = false;
var showFlexValues = true;

function isShowingFlexValues() {
	return showFlexValues;
}

function initAltModes() {
    document.onkeydown = function(e) { 
        e = e || window.event;

        // figure out which key was pressed
        if (e.keyCode) code = e.keyCode;
        else if (e.which) code = e.which;
        var character = String.fromCharCode(code).toLowerCase();

        if (!transactionViewMode) {
            if (e.altKey && e.ctrlKey && character == 'v') {
                transactionViewMode = true;
                findTransactionLinks().each(function(link) { toggleViewModeLink(link); });
            }
        } else {
            if (e.altKey && e.ctrlKey && character == 'v') {
                findTransactionLinks().each(function(link) { toggleViewModeLink(link); });
                transactionViewMode = false;
            }
        }
        if (!transactionViewOneMode) {
            if (e.altKey && e.ctrlKey && character == 'o') {
                transactionViewOneMode = true;
                findTransactionLinks().each(function(link) { toggleViewOneTransactionModeLink(link); });
            }
        } else {
            if (e.altKey && e.ctrlKey && character == 'o') {
                findTransactionLinks('viewSingleTran\.jsf\\?hid.').each(function(link) { toggleViewOneTransactionModeLink(link); });
                transactionViewOneMode = false;
            }
        }
        if (!transactionIdMode) {
            if (e.altKey && e.ctrlKey && character == 'i') {
                transactionIdMode = true;
                findTransactionLinks().each(function(link) { toggleIdMode(link); });
            }
        } else {
            if (e.altKey && e.ctrlKey && character == 'i') {
                findTransactionLinks().each(function(link) { toggleIdMode(link); });
                transactionIdMode = false;
            }
        }

        if (!showStateMode) {
            if (e.altKey && e.ctrlKey && character == 's') {
                showStateInformation();
            }
        } else {
            if (e.altKey && e.ctrlKey && character == 's') {
                hideStateInformation();
            }
        }
        
        if (e.altKey && e.ctrlKey && character == 'f') {
        	showFlexValues = !showFlexValues;
        	toggleFlex();
        	flexValuesToggled();
        }
    } 
}

function showStateInformation() {
}
function hideStateInformation() {
}

var flexValuesToggled = function() {
	//no-op (can be overriden)
}

function toggleViewModeLink(link) {
    // look to see if it has the origUrl attribute
    var origUrl = link.readAttribute('origUrl');

    if (origUrl != null && origUrl != '') {
        // put the orig url back
        link.href = origUrl;
        
        // remove the attribute
        link.writeAttribute('origUrl', '');   
        
        // and make it look normal again
        link.removeClassName('viewmodelink');

    } else {
     
        // tack onto the url to make the link click into view mode
        var suffix = "&mode=V";
        // if there is no ? in it, the suffix must use ?
        if (link.href.indexOf('?') < 0) {
            suffix = '?mode=V';
        }
        
        // hang onto its original url
        link.writeAttribute('origUrl', link.href);  

        // give it a new look to make it stand out
        link.addClassName('viewmodelink');
        
        // append the view logic to the url
        link.href = link.href + suffix;
    }
}

function toggleIdMode(link) {
    // look to see if it has the originnerhtml attribute
    var origInnerHtml = link.readAttribute('origInnerHtml');

    if (origInnerHtml != null && origInnerHtml != '') {
        // put the orig url back
        link.update( origInnerHtml );
        
        // remove the attribute
        link.writeAttribute('origInnerHtml', '');   
        
        // and make it look normal again
        link.removeClassName('idmodelink');

    } else {
     
        // swap the inner html with the tran id
        // regex detailing link href pattern that indicates a link to a transaction
        var re = new RegExp('(.*)agent.queue.transactiondetail\.jsf\\?transId.([0-9]+)');
        var regexMatch = re.exec(link.href);
        var transactionId = regexMatch[2];

        
        // hang onto its origInnerHtml
        link.writeAttribute('origInnerHtml', link.innerHTML);  

        // give it a new look to make it stand out
        link.addClassName('idmodelink');
        
        // append the view logic to the url
        link.update(transactionId);
    }
}

function toggleViewOneTransactionModeLink(link) {

    // look to see if it has the origUrl attribute
    var origUrl = link.readAttribute('origUrl2');

    if (origUrl != null && origUrl != '') {
        // put the orig url back
        link.href = origUrl;
        
        // remove the attribute
        link.writeAttribute('origUrl2', '');   
        
        // and make it look normal again
        link.removeClassName('viewonetransactionmodelink');

    } else {
     
        // hang onto its original url
        link.writeAttribute('origUrl2', link.href);  

        // give it a new look to make it stand out
        link.addClassName('viewonetransactionmodelink');

        // regex detailing link href pattern that indicates a link to a transaction
        var re = new RegExp('(.*)agent.queue.transactiondetail\.jsf\\?transId.([0-9]+)');
        var regexMatch = re.exec(link.href);
        var baseUrl = regexMatch[1];
        var transactionId = regexMatch[2];
        
        // append the view logic to the url
        link.href = baseUrl + 'other/viewSingleTran.jsf?hid=' + transactionId;
    }
}

function findTransactionLinks(regexpString) {
 
    if (regexpString == null || regexpString == '') {
        regexpString = 'transactiondetail\.jsf\\?transId.';
    }
 
    // regex detailing link href pattern that indicates a link to a transaction
    var re = new RegExp(regexpString);
 
    var links = $A();
 
    // find all links on the page
    $$('a').each(function(link) {

        // narrow it down to those with hrefs
        if (link.href) {
            var regexMatch = re.exec(link.href);
            if (regexMatch) {
                links.push(link);
            }
       }
    });
    
    return links;
}

function toggleFlex() {
    $$('span.flex_translation').each(
        function(item) {

            var content = item.innerHTML;
            var title = item.title;

            item.update(title);
            item.writeAttribute('title', content);
        }
    );
    return false;
} 


/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
 
var Base64 = {
 
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = Base64._utf8_encode(input);
 
		while (i < input.length) {
 
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
		}
 
		return output;
	},
 
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
 
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
 
		}
 
		output = Base64._utf8_decode(output);
 
		return output;
 
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
 
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 
		}
 
		return string;
	}
 
}

//***************************************************************************
//
// Given the name of a table, find the child TBODY tag inside which acutally
// has content in it. This is needed due to IE non-compliance with DOM manipulation
// standards. For some reason, IE always tacks on its own TBODY tag when you
// create a table...
//
function getUtilizedTableBodyFromTable(tableId)
{
    var theTable = $(tableId);

    // because IE always puts its own TBODY tag in, we need to find WHICH TBODY to append to
    // (since there will be two of them in IE, but only one in Firefox)
    var theTableBody = null;
    if (Prototype.Browser.IE)
    {
        // first, gather up all of the TBODY tags (there will be two, trust me)
        var tableBodies = getImmediateDescendantsOfType(theTable, 'tbody');
        for (var tb = 0; tb < tableBodies.length; tb++)
        {
            var nextTableBody = tableBodies[tb];

            // look for any rows in this body
            var rowsInBody = nextTableBody.select('tr');
            if (rowsInBody.length > 0)
            {
                theTableBody = nextTableBody;
            }
        }

        // if none of the tbodies had any rows, just pick the first tbody and use it
        if (theTableBody == null)
        {
            // alert("didn't find anything with content, so just using the first row");
            theTableBody = theTable.firstChild;
        }
    }
    else
    {
        theTableBody = theTable.firstChild;
    }

    return theTableBody;
}

//***************************************************************************
//
// Takes an a reference to a table object, loops through it, and colors the
// rows alternating colors (i.e. 'STRIPE-ING')
// This is to ensure that when a new row is added,
// both IE and FireFox will show it with the correct coloring
//
function stripeTable(tableElement)
{
    var theTable = $(tableElement);

    // loop over all the rows, alternating their coloring
    var theTableBody = getUtilizedTableBodyFromTable(tableElement)
    var theTableRows = getImmediateDescendantsOfType(theTableBody, 'tr');

    var visibleCounter = 0;

    for (var r = 0; r < theTableRows.length; r++)
    {
        // get reference to the row
        var theRow = theTableRows[r];

        // if the row is invisible, don't count it when striping (so if an even row is between
        // two odd rows, but is invisible, we don't put two even rows together)
        if ($(theRow).hasClassName('invisible'))
        {
            continue;
        }
        else {

            // if the row already has row_even or row_odd, take it off
            if ($(theRow).hasClassName('row_even')) {
                $(theRow).removeClassName('row_even');
            }
            if ($(theRow).hasClassName('row_odd')) {
                $(theRow).removeClassName('row_odd');
            }

            // now apply the proper row style
            if (visibleCounter % 2 == 0)
            {
                $(theRow).addClassName('row_even');
            }
            else
            {
                $(theRow).addClassName('row_odd');
            }

            visibleCounter += 1;
        }
    }
}

//***************************************************************************
//
// This method will get all immediate descendants of a particular node
// that match the given tag type. For example, you might wish to find all
// 'table' elements within a 'div'...
//
function getImmediateDescendantsOfType(element, type)
{
    var results = new Array();

    var immediateDescendants = element.childElements();
    for (var i = 0; i < immediateDescendants.length; i++)
    {
        var nextChild = immediateDescendants[i];

        var upperType = type.toUpperCase();
        var upperTagName = nextChild.tagName.toUpperCase();

        if (upperType == upperTagName)
        {
            results.push( $(nextChild ) );
        }
    }

    // alert("found " + results.length + " elements of type '" + type + "' inside element " + element);

    return results;
}

/**
 * Determines the screenpage id (taking into account the legacy and spring pages)
 * Determines (through a back end call) the appropriate help file to include (role and locale aware)
 * Dynamically includes the help js (resource is tasked only if the user hits the help link)
 * Calls the help function (passing in context),from the dynamically included js, to launch the help system.
 * 
 * @param ref
 */

function showHelp(ref)
{
	var screenPageIdValue = '';
	var screenPageNameValue = '';
	// try to get the primary elements that would have the page ids
	var screenPageId = $('page_screen_id');
	var screenPageName = $('page_screen_name');
	// if the primary elements are not found, look for the page ids in the secondary elements
	if (null == screenPageId) {
		screenPageId = $('page_screen_id_alt');
		screenPageName = $('page_screen_name_alt');
	}
	// extract the values from within the elements
	if (null != screenPageId && null != screenPageName) {
		screenPageIdValue = screenPageId.innerHTML;
		screenPageNameValue = screenPageName.innerHTML;
		try {
			jQuery.getJSON('/ajaxHandler', {request:"getHelpSystemPath"},
					   function(helpSystemJson){
					     jQuery.getScript(helpSystemJson.script, function(){FMCOpenHelp(screenPageIdValue,null,null,null,helpSystemJson.path);});
					   });
		} catch(error) {
			alert('Unexpected error launching help ' + error);
		}
	} else {
		alert('no reference found for screenPageId');
	}
	
	// add the gathered values as a title to the help element, (to help debugging)
	$(ref).writeAttribute('title', screenPageNameValue + ':' + screenPageIdValue);
	
}


function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { 
            return pair[1]; 
        }
    }
    return null; //not found 
}

function countCheckedItems() {
    var checkedCount = 0;
    $$('input[type=checkbox].selectAll').each(
        function(cb) {
            if (cb.checked) {
                checkedCount++;
            }
        }
    );
    return checkedCount;
}

function toggleDeleteUpdateCopyButtons() {
    if (countCheckedItems() > 0) {
        jQuery("input[value='delete'].acc-general-button").removeAttr("disabled");
        jQuery("input[value='update'].acc-general-button").removeAttr("disabled");
        jQuery("input[value='copy'].acc-general-button").removeAttr("disabled");
        jQuery("input[value='view'].acc-general-button").removeAttr("disabled");
    } else {
        jQuery("input[value='delete'].acc-general-button").attr("disabled", true);
        jQuery("input[value='update'].acc-general-button").attr("disabled", true);
        jQuery("input[value='copy'].acc-general-button").attr("disabled", true);
        jQuery("input[value='view'].acc-general-button").attr("disabled", true);
    }
}

Resizer = Class.create();
Resizer.prototype = {
        
    initialize: function(element, options) {
        
        this.element = $(element);
        
        // Add data holder to element to store position variables
        this.moveposition = {x: 0, y: 0};
    
        this.options = Object.extend( {
            minHeight: 50
        }, options || {}); 
        // this last line allows options to be passed in
        // optionally, and will override any defaults with those
        // passed in
        
        this.setupResizer();
    },
    
    setupResizer: function() {

        // this is the element that a user will use to resize
        this.gripper = Builder.node('div', {className: 'gripper'});
        this.element.parentNode.appendChild(this.gripper);

        var gripperMarginRight = getElementWidth(this.gripper) - getElementWidth(this.element) + 'px';

        this.gripper.setStyle({ 'margin-right': gripperMarginRight});

        var theElement = this.element;
        var movePosition = this.moveposition;
        var theMinHeight = this.options.minHeight;
        
        function moveListener(event) {
            // Calculate how far the mouse moved
            var moved = {
                        x: (getEventCoordinatesX(event) - movePosition.x),
                        y: (getEventCoordinatesY(event) - movePosition.y)
                     };

            // Set element's x/y utility property
            movePosition = {x: getEventCoordinatesX(event), y: getEventCoordinatesY(event)};

            // Track the element's border dimensions (this adds to size)
            var borderStyle = theElement.getStyle('border-width');
            var borderSize = borderStyle.split(' ')[0].replace(/[^0-9]/g,'');

            // Track the element's padding dimensions  (this adds to size)
            var paddingStyle = theElement.getStyle('padding');
            var paddingSize = paddingStyle.split(' ')[0].replace(/[^0-9]/g,'');

            // Add things up that change dimensions
            var sizeAdjust = (borderSize*2) + (paddingSize*2);

            // Update element's style to show its new height and width
            var size = theElement.getDimensions();
            
            // make sure it never gets smaller than the min height
            var theHeight = size.height + moved.y - sizeAdjust;

            if (theHeight < theMinHeight) {
                theHeight = theMinHeight;
            }
            
            theElement.setStyle( {height: theHeight + 'px'} );
            // theElement.setStyle({
            //       height: size.height + moved.y - sizeAdjust + 'px',
            //       width: size.width + moved.x - sizeAdjust + 'px'
            //    });
         }
        
        // Listen for 'mouse down' on gripper to start the move listener
        Event.observe(this.gripper, 'mousedown', 
            function(event) {
               // Set starting x/y
                movePosition = {x: getEventCoordinatesX(event), y: getEventCoordinatesY(event)};
               // Start listening for mouse move on body
               Event.observe(document.body, 'mousemove', moveListener);
            }
        );
        
        // Listen for 'mouse up' to cancel 'move' listener
        Event.observe(document.body, 'mouseup', 
            function(event) {
                Event.stopObserving(document.body, 'mousemove', moveListener);
            }
        );
    }
}


// methods for getting x and y from an event
function getEventCoordinates(event) {
    var docElement = document.documentElement;
    var body = document.body || { scrollLeft: 0, scrollTop: 0 };

    return {
      x: event.pageX || 
         (event.clientX + (docElement.scrollLeft || body.scrollLeft) - (docElement.clientLeft || 0)),
      y: event.pageY || 
         (event.clientY + (docElement.scrollTop || body.scrollTop) - (docElement.clientTop || 0))
    };
}

function getEventCoordinatesX(event) {
    return getEventCoordinates(event).x;
}

function getEventCoordinatesY(event) {
    return getEventCoordinates(event).y;
}

function getElementHeight(element) {
    return Element.getDimensions(element).height;
}

function getElementWidth(element) {
    return Element.getDimensions(element).width;
}

/**
 * This method fires a prototype.js custom event, notifying
 * listeners that an event has occurred that will maintain
 * the session.
 *
 * Any link/ajax event that fires should call this method, to
 * tell the IdleTimer that action has occurred that will
 * keep the session alive.
 *
 * @return
 */
function fireUserActiveEvent() {
    document.fire('state:active', { currentTime: new Date() });
}

/**
 * The IdleTimer class will listen for a custom prototype.js event, called
 * 'state:active', which is to be fired by the page upon certain key
 * actions.
 *
 * When the event is observed by this object, it will reset its countdown
 * timer.
 *
 * When the timer reaches a critical level (i.e. a couple of minutes
 * before anticipated session timeout), this object will alert the
 * user and give them an opportunity to keep their session alive,
 * through a heartbeat or ping to the server.
 *
 * Call it like this:
 *
 * new IdleTimer();
 *
 * or
 *
 * new IdleTimer({duration: 60000, warnAt: 10000});
 *
 */
var IdleTimer = Class.create({

    // timer to track time until session time out
    _mainWarningTimer: null,
    // timer to track time after the warning left until session time out
    _finalTimer: null,
    // used to count down the time in the warning panel
    _countdownTimer: null,
    // the number of seconds left for the countdown timer
    _secondsRemaining: null,
    // the original page title
    _orgPageTitle: null,

    // the constructor to the class
    initialize: function(options) {

        this.options = Object.extend({
            // 15 minutes, by default, in milliseconds
            duration: 900000,
            // 2 minute warning
            warnAt: 120000,
            // text for this widget
            ABOUT_TO_EXPIRE_TEXT: 'Your session is about to expire.',
            ABOUT_TO_EXPIRE_TITLE: 'Session Timeout',
            OK_BUTTON_TEXT: 'OK',
            DIALOG_TITLE_TEXT: 'WARNING',
            COUNTDOWN_TEXT_1: 'You have approximately',
            COUNTDOWN_TEXT_2: 'seconds to click',
            COUNTDOWN_TEXT_3: 'before your session times out.',
            RECONNECT_TEXT_1: 'Your session may have expired. Click',
            RECONNECT_TEXT_2: 'to attempt to reconnect.',
            EXPIRED_TEXT_1: 'Your session has expired. Please log back in.',
            SESSION_EXPIRED_TEXT: 'YOUR SESSION HAS EXPIRED',
            SESSION_EXPIRED_TITLE: 'Session Expired'
        }, options || {} ); // this last line will override the
        // defaults with options passed in

    },

    beginTimer: function() {
        this.initObservers();
        this.startTimer();
    },

    // begin listening for events
    initObservers: function() {
        // listen for the custom prototype.js event
        Event.observe(document, 'state:active', this.restartTimer.bind(this));
    },

    // restarts the timer
    restartTimer: function() {
        this.startTimer();
    },

    // starts the timer that tracks how close the user is to session time out
    startTimer: function() {

        // clear out the timer
        clearTimeout(this._mainWarningTimer);

        // figure out how long to wait before warning the user
        var timeBeforeWarning = this.options.duration - this.options.warnAt;

        // start the timer
        // when it runs out, call the warnOfImpendingTimeout method
        this._mainWarningTimer = setTimeout(
            function() { this.warnOfImpendingTimeout(); }.bind(this),
            timeBeforeWarning);
    },

    // begins the warning sequence
    warnOfImpendingTimeout: function() {

        clearTimeout(this._finalTimer);

        // start the final timer - this runs for the remaining time
        // until session timeout
        // when it runs out, call the tooLate method
        this._finalTimer = setTimeout(
            function() {
                this.timeout();
            }.bind(this),
            this.options.warnAt);

        this._orgPageTitle = document.title;
        this.showWarningPanel();
    },

    // kicks off the countdown
    beginCountdown: function() {
        clearTimeout(this._countdownTimer);
        this._secondsRemaining = parseInt((parseInt(this.options.warnAt) - 1000) / 1000);
        if ($('countdowntimer') != null) {
            $('countdowntimer').update(this._secondsRemaining);
        }
        this.countDown();
    },

    // keeps the countdown running
    countDown: function() {

        this._countdownTimer = setTimeout(
            function() {
                this.decrementCounter();
                if (document.title === this._orgPageTitle) {
                    document.title = this.options.ABOUT_TO_EXPIRE_TITLE;
                } else {
                    document.title = this._orgPageTitle;
                }
            }.bind(this),
            // go a little faster than once per second ;)
            900);
    },

    // counts down by one second, and updates the countdown timer display
    decrementCounter: function() {

        this._secondsRemaining = (parseInt(this._secondsRemaining) - 1);

        if (this._secondsRemaining >= 0) {

            this.countDown();

            if ($('countdowntimer') != null) {
                $('countdowntimer').update(this._secondsRemaining);
            }
        } else {
            this.stopCountdown();
        }
    },

    // stops the countdown
    stopCountdown: function() {
        clearTimeout(this._countdownTimer);
        _secondsRemaining = null;
    },

    timeout: function() {

        // stop the countdown timer
        this.stopCountdown();

        // stop the final timer
        clearTimeout(this._finalTimer);

        // tell the user things don't look good...
        this.showSessionExpiredPanel();

        document.title = this.options.SESSION_EXPIRED_TITLE;
    },

    // invoked once the user is warned and clicks ok
    userAskedToExtendSession: function() {

        // stop the countdown timer
        this.stopCountdown();

        // stop the final timer
        clearTimeout(this._finalTimer);

        document.title = this._orgPageTitle;

        // send the pulse back to the server
        this.sessionPing();
    },

    // shows the dialog warning the user of impending timeout
    showWarningPanel: function() {

        var referenceToThis = this;
        var container = Builder.node('div', {className: 'centered'});

        var dialogContent = Builder.node('div');
        container.appendChild(dialogContent);

        var okButton = Builder.node('input',
            {
                type: 'button',
                id: 'timeoutWarningOkButton',
                name: 'timeoutWarningOkButton',
                value: this.options.OK_BUTTON_TEXT
            }
        );

        var dialogTable = Builder.node('table', {className: 'data_table2 attention'},
            [
                Builder.node('tr',
                    [
                        Builder.node('td',
                            [
                                Builder.node('div', {id: 'timeoutwarningdiv', style: 'margin: 4px; padding: 5px;'},
                                    [
                                        this.options.ABOUT_TO_EXPIRE_TEXT,
                                        Builder.node('br'),
                                        Builder.node('br'),
                                        this.options.COUNTDOWN_TEXT_1, ' ',
                                        Builder.node('span', {id: 'countdowntimer', className: 'bold'}, [(this.options.warnAt / 1000)]),
                                        ' ',
                                        this.options.COUNTDOWN_TEXT_2, ' ',
                                        this.options.OK_BUTTON_TEXT, ' ',
                                        this.options.COUNTDOWN_TEXT_3,
                                        Builder.node('br'),
                                        Builder.node('br'),
                                        Builder.node('div', {className: 'centered'}, [okButton])
                                    ]
                                )
                            ]
                        ),
                    ]
                ),
            ]);
        dialogContent.appendChild(dialogTable);

        Dialog.info(container.innerHTML,
            {
                width: 600,
                zIndex: 20000,
                windowParameters: {className: 'alphacube'},
                title: this.options.DIALOG_TITLE_TEXT,
                draggable: true,
                resizable: true,
                overlayShowEffectOptions: {duration: 0},
                overlayHideEffectOptions: {duration: 0}
            }
        );

        // bind the ok button to close the dialog
        Event.observe( $('timeoutWarningOkButton'), 'click',
            function () {
                // once they click on it, check to see if the
                // session is still alive
                referenceToThis.userAskedToExtendSession();
                return true;
            }
        );

        // show countdown
        this.beginCountdown();
    },

    // shows the dialog a user will see if they let their session expire
    showSessionExpiredPanel: function() {

        var referenceToThis = this;

        var okButton = Builder.node('input',
            {
                type: 'button',
                id: 'sessionExpiredOkButton',
                name: 'sessionExpiredOkButton',
                value: this.options.OK_BUTTON_TEXT
            }
        );

        var dialogDiv = Builder.node('div',
            [
                this.options.RECONNECT_TEXT_1,
                ' ',
                this.options.OK_BUTTON_TEXT,
                ' ',
                this.options.RECONNECT_TEXT_2,
                Builder.node('br'),
                Builder.node('br'),
                Builder.node('div', {className: 'centered'}, [ okButton ])
            ]);

        // plug that content into the timeout div
        $('timeoutwarningdiv').update(dialogDiv.innerHTML);

        // bind the ok button to close the dialog
        Event.observe( $('sessionExpiredOkButton'), 'click',
            function () {
                // once they click on it, check to see if the
                // session is still alive
                referenceToThis.userAskedToExtendSession();
                return true;
            }
        );
    },

    // ping the server with ajax to extend the sesssion timeout
    sessionPing: function() {

        var referenceToThis = this;

        new Ajax.Request(

            // this is the url to call for the ajax call
            '/ajaxHandler',

            // and these are the options specific to this ajax call
            Object.extend(
                {
                    parameters: {
                        jsonRequest:
                            Object.toJSON({
                                request: 'ping'
                            })
                    },
                    onFailure: function() {
                        referenceToThis.confirmedTimeout();
                    },

                    onException: function() {
                        referenceToThis.confirmedTimeout();
                    },

                    // this is the method to call when we get an answer back from the server
                    onSuccess: function(ajaxResponse) {

                        var jsonResponse = ajaxResponse.responseText.evalJSON();

                        if (jsonResponse.status != null && jsonResponse.status == 'SUCCESS') {
                            // alert("the server 'ping' was successful with the message: " + jsonResponse.reason);
                            referenceToThis.restartTimer();
                            Dialog.closeInfo();
                        } else {
                            referenceToThis.confirmedTimeout();
                        }
                    }
                })
        );
    },

    confirmedTimeout: function() {

        var referenceToThis = this;

        // stop listening for 'state:active' messages
        Event.stopObserving(document, 'state:active');

        var okButton = Builder.node('input',
            {
                type: 'button',
                id: 'confirmedExpiredOkButton',
                name: 'confirmedExpiredOkButton',
                value: this.options.OK_BUTTON_TEXT
            }
        );

        var dialogDiv = Builder.node('div',
            [
                this.options.EXPIRED_TEXT_1,
                Builder.node('br'),
                Builder.node('br'),
                Builder.node('div', {className: 'centered'}, [ okButton ])
            ]);

        // plug that content into the timeout div
        $('timeoutwarningdiv').update(dialogDiv.innerHTML);

        // warn the user about the timeout
        $$("div[class='red bar']").each(function (item) {

            Element.insert( item, {'after':
                Builder.node('div', {style: "text-align: center;"},
                    [
                        Builder.node('h1', {className: 'bgImportant attention'}, [referenceToThis.options.SESSION_EXPIRED_TEXT])
                    ]
                )
            });
        });

        // bind the ok button to close the dialog
        Event.observe( $('confirmedExpiredOkButton'), 'click',
            function () {
                // close out the dialog
                Dialog.closeInfo();

                return true;
            }
        );
    }

});
Ajax.AlertsPanel = Class.create();

Ajax.AlertsPanel.prototype = {
    initialize: function(options) {
        this.options = Object.extend( {
            eventualTarget: '',
            baseUrl: '/ajaxHandler',        // this is the base url
            dialogClassName: 'alphacube',   // this is the style of the dialog box
            okButtonText: 'OK',             // this is the text for the 'OK' button
            cancelButtonText: 'Cancel'      // this is the text for the 'Cancel' button
        }, options || {} ); // this last line allows options to be passed in
                            // optionally, and will override any defaults with those
                            // passed in
    },

    proceedWithPageLoad: function() {
        try {
            Dialog.closeInfo();
        } catch (e) {
        }
    },

    // makes an ajax call to the server to see if there are any alerts that the user needs to see
    checkForUnseenAlerts: function(viewedAlertId) {
        new Ajax.Request(this.options.baseUrl, {
                method: 'post',
                onSuccess: this.processCheckForAlertsResponse.bind(this),
                onFailure: this.checkForAlertsFailure.bind(this),
                onException: this.checkForAlertsException.bind(this),
                parameters: {
                        request: 'getNextUnseenAlert',
                        viewedAlertId: viewedAlertId
                    }
            }
        );
    },

    // this method is called when the ajax call to check for unseen alerts returns
    processCheckForAlertsResponse: function(ajaxResponse) {
        if (hasParameterWarnings(ajaxResponse)) {
            return;
        }

        // alert("got back a successful response: " + ajaxResponse.responseText);

        if ((! ajaxResponse) || (! ajaxResponse.responseText)) {
            //alert("Unable to check for unseen alerts - empty response");
            this.proceedWithPageLoad();
            return;
        }
    
        // update the dialog with data from the ajax call
        var jsonResponse = {};
        try {
            jsonResponse = ajaxResponse.responseText.evalJSON();
        } catch (je) {
            //alert("Unable to check for unseen alerts. Code: json-" + je.name + " message: " + je.message);
            this.proceedWithPageLoad();
            return;
        }

        // determine if there are unseen alerts to display
        var unseenAlertCount = 0;
        
        try {
            unseenAlertCount = Number(jsonResponse.unseenAlertCount);

            if (unseenAlertCount == Number.NaN) {
                unseenAlertCount = 0;
            }
        } catch (ne) {
            alert("Number parse exception while checking for unseen alerts: " + ne.name + " message: " + ne.message);
            unseenAlertCount = 0;
        }

        if (unseenAlertCount === 0) {
            //alert("you have seen all the alerts. go ahead and just get to work, ok?");
            this.proceedWithPageLoad();
        }
        else
        {
            // alert("there are still " + unseenAlertCount + " alerts you need to see. ready?");
            this.enterViewUnseenAlertsFlow(jsonResponse);
        }
    },

    // not much we can do here but tell them there was an issue and proceed
    checkForAlertsFailure: function(ajaxResponse) {
        alert("There was an error checking for unseen alerts " + ajaxResponse);
        this.proceedWithPageLoad();
    },

    // not much we can do here but tell them there was an issue and proceed
    checkForAlertsException: function(ajaxResponse, ex) {
        alert("An exception occurred while checking to see if there were any unseen alerts: " + ex.name + " message: " + ex.message);
        this.proceedWithPageLoad();
    },

    enterViewUnseenAlertsFlow: function(jsonResponse) {
        // first, do the work to construct the html for the panel
        var viewAlertHtml =
            this.buildViewAlertPanel(jsonResponse);

        if (this.isDialogVisible) {
            Dialog.setInfoMessage(viewAlertHtml);
        } else {
            // show the dialog
            Dialog.info(viewAlertHtml, {
                    width: 500,
                    title: "",
                    draggable: true,
                    resizable: true,
                    overlayShowEffectOptions: { duration: 0.25 },
                    overlayHideEffectOptions: null,
                    hideEffect: Element.hide,
                    destroyOnClose: true,
                    windowParameters: { className: this.options.dialogClassName }
                }
            );

            this.isDialogVisible = true;
        }

        // bind the ok button to the event that will cycle them through unseen events
        $('okButton').onclick = this.acknowledgeAlert.bind(this);

        // show the ok button after a moment, so they can't click it right away
        // new Effect.toggle('okButton', 'appear', { duration: 2.0, queue: 'end' });
    },

    // sends the information that the alert has been seen, and optionally gets the
    // next alert as well
    acknowledgeAlert: function() {
        // gather up information from the form
        var alertId = $F('alertId');

        // close the alert that is open
        //Dialog.closeInfo();

        // pass in the id of the one that was just viewed, and wait for the next one
        this.checkForUnseenAlerts(alertId);
    },

    // constructs the view alert panel
    //
    // @param jsonResponse - is the response from the server that indicated there
    //                       some unseen alerts they need to view
    buildViewAlertPanel: function(jsonResponse) {
        var container = Builder.node('div');

        var theForm = Builder.node('form', {id: 'viewAlertForm'});
        // the div is just to help us extract the actual html

        container.appendChild(theForm);

        var alertObj = jsonResponse.nextUnseenAlert;

        var theTable = Builder.node('table', {className: 'alertTable'},
            [
                Builder.node('tr', {height: '20px'},
                    [
                        Builder.node('td', {colSpan: 3, className: 'centered'},
                            [
                                Builder.node('h3', [jsonResponse.title])
                            ]
                        )
                    ]
                ),
                Builder.node('tr', {height: '15px'},
                    [
                        Builder.node('td', {colSpan: 3},
                            [
                                // the id is needed to later mark down that the user has seen it
                                Builder.node('input',
                                    {
                                        type: 'hidden',
                                        id: 'alertId',
                                        value: alertObj.id
                                    }
                                )
                            ]
                        )
                    ]
                ),
                Builder.node('tr',
                    [
                        Builder.node('td', {className: 'dataElement top_align bolded', nowrap: 'nowrap'}, [alertObj.alertIdentifierLabel]),
                        Builder.node('td', {width: '10px'}),
                        Builder.node('td', {className: 'top_align'}, [alertObj.alertIdentifier])
                    ]
                ),
                Builder.node('tr',
                    [
                        Builder.node('td', {className: 'dataElement top_align bolded', nowrap: 'nowrap'}, [alertObj.beginDateLabel]),
                        Builder.node('td', {width: '10px'}),
                        Builder.node('td', {className: 'top_align'}, [alertObj.beginDate])
                    ]
                ),
                Builder.node('tr',
                    [
                        Builder.node('td', {className: 'dataElement top_align bolded', nowrap: 'nowrap'}, [alertObj.endDateLabel]),
                        Builder.node('td', {width: '10px'}),
                        Builder.node('td', {className: 'top_align'}, [alertObj.endDate])
                    ]
                ),
                Builder.node('tr',
                    [
                        Builder.node('td', {className: 'dataElement top_align bolded', nowrap: 'nowrap'}, [alertObj.alertTypeLabel]),
                        Builder.node('td', {width: '10px'}),
                        Builder.node('td', {className: 'top_align'}, [alertObj.alertType])
                    ]
                ),
                Builder.node('tr',
                    [
                        Builder.node('td', {className: 'dataElement top_align bolded', nowrap: 'nowrap'}, [alertObj.severityTypeLabel]),
                        Builder.node('td', {width: '10px'}),
                        Builder.node('td', {className: 'top_align'}, [alertObj.severityType])
                    ]
                ),
                Builder.node('tr',
                    [
                        Builder.node('td', {className: 'dataElement top_align bolded', nowrap: 'nowrap'}, [alertObj.alertDescriptionLabel]),
                        Builder.node('td', {width: '10px'}),
                        Builder.node('td', {className: 'top_align'}, [alertObj.alertDescription])
                    ]
                ),
                Builder.node('tr',
                    [
                        Builder.node('td', {className: 'dataElement top_align bolded', nowrap: 'nowrap'}, [alertObj.alertTextLabel]),
                        Builder.node('td', {width: '10px'}),
                        Builder.node('td', {className: 'top_align'}, [alertObj.alertText])
                    ]
                ),
                Builder.node('tr', {height: '20px'}),
                Builder.node('tr',
                    [
                        Builder.node('td', {colSpan: 3, align: 'center'},
                            [
                                Builder.node('input',
                                    {
                                        type: 'button',
                                        id: 'okButton',
                                        name: 'okButton',
                                        value: this.options.okButtonText
                                    }
                                )
                            ]
                        )
                    ]
                )
            ]
        );

        theForm.appendChild(theTable);
        // alert(container.innerHTML);
        return container.innerHTML;
    }
}
// multi select 2 pane widget support

var MultiSelect2PaneWidget = {
    displayNumOfItemsInAvailPane : function(paneId, availPaneCounter) {
        var noSelInAvailPane = 0;
        var noItemsInAvailPane = 0;
        var paneRef = document.getElementById(paneId);
        if (paneRef.hasChildNodes()) {
            for (var i = 0; i < paneRef.length; i++) {
                noItemsInAvailPane ++;
                if (paneRef[i].selected) {
                    noSelInAvailPane ++;
                }
            }
        }

        var message = document.getElementById(availPaneCounter).innerHTML;
        message = this.formatMessage(message, [noSelInAvailPane, noItemsInAvailPane]);
        document.getElementById(availPaneCounter).innerHTML = message;
    },
    displayNumOfItemsInChosenPane : function(paneId, chosenPaneCounter) {
        var noItemsInChosenPane = 0;
        var paneRef = document.getElementById(paneId);
        if (paneRef.hasChildNodes()) {
            for (var i = 0; i < paneRef.length; i++) {
                noItemsInChosenPane ++;
            }
        }

        var message = document.getElementById(chosenPaneCounter).innerHTML;
        message = this.formatMessage(message, [noItemsInChosenPane]);
        document.getElementById(chosenPaneCounter).innerHTML = message;
    },
    filterAvailablePaneItems : function(paneId, dropdownFilters, textFilter, availPaneCounter, tmpPaneId) {
        var tmpPaneRef = document.getElementById(tmpPaneId);
        var paneRef = document.getElementById(paneId);

        var dValues = [];
        if (dropdownFilters != null) {
            for (var i = 0; i < dropdownFilters.length; i ++) {
                var d = document.getElementById(dropdownFilters[i]);
                var dValue = d.options[d.selectedIndex].value;
                dValues.push(dValue);
            }
        }

        var tValue = document.getElementById(textFilter).value.toLowerCase();

        if (tmpPaneRef.hasChildNodes()) {
            for (var i = tmpPaneRef.length - 1; i >= 0;  i--) {
                paneRef.appendChild(tmpPaneRef[i]);
            }
        }

        if (paneRef.hasChildNodes()) {
            for (var i = paneRef.length - 1; i >= 0; i--) {
                var optionAttr = paneRef[i].getAttribute("class");
                var optionText = paneRef[i].text.toLowerCase();

                var noMatched = false;

                for (var j = 0; j < dValues.length; j ++) {
                    if (dValues[j] != '' && optionAttr.indexOf(dValues[j]) == -1) {
                        noMatched = true;
                        break;
                    }
                }

                if (tValue != '' && optionText.indexOf(tValue) == -1) {
                    noMatched = true;
                }

                if (noMatched) {
                    paneRef[i].selected = false;
                    tmpPaneRef.appendChild(paneRef[i]);
                }
            }
        }

        this.sortSelectByText(paneRef);

        this.displayNumOfItemsInAvailPane(paneId, availPaneCounter);
    },
    // move selected from avail to chosen
    moveAvailableToChosen : function(availablePaneId, availableSelectAllCheckBox, availPaneCounter,
                                     chosenPaneId, chosenSelectAllCheckBox, chosenPaneLabel) {
        var availRef = document.getElementById(availablePaneId);
        var chosenRef = document.getElementById(chosenPaneId);
        var chosenInsertionPoint = (chosenRef.selectedIndex != -1) ? chosenRef[chosenRef.selectedIndex]: null;
        if (availRef.selectedIndex != -1) {
            var refsToMove = [];
            for (var i = 0; i < availRef.length; i++) {
                if (availRef[i].selected) {
                    availRef[i].selected = false;
                    refsToMove.push(availRef[i]);
                }
            }
            for (var j = 0, len = refsToMove.length; j < len; j++) {
                chosenRef.insertBefore(refsToMove[j], chosenInsertionPoint);
            }
        }

        document.getElementById(availableSelectAllCheckBox).checked = false;
        document.getElementById(chosenSelectAllCheckBox).checked = false;

        this.displayNumOfItemsInAvailPane(availablePaneId, availPaneCounter);
        this.displayNumOfItemsInChosenPane(chosenPaneId, chosenPaneLabel);
    },
    // move selected from chosen back to avail
    moveChosenToAvailable : function (chosenPaneId, chosenSelectAllCheckBox, chosenPaneLabel,
                                      availablePaneId, availableSelectAllCheckBox, availPaneCounter,
                                      dropdownFilters, textFilter, tmpPaneId) {
        var availRef = document.getElementById(availablePaneId);
        var chosenRef = document.getElementById(chosenPaneId);
        if (chosenRef.selectedIndex != -1) {
            var newAvailFrame = [];
            if (availRef.hasChildNodes()) {
                for (var i = 0; i < availRef.length; i++) {
                    newAvailFrame.push(availRef[i]);
                    availRef.removeChild(availRef[i]);
                }
            }

            var selectedByIndex = [];
            for (var i = 0; i < chosenRef.length; i++) {
                selectedByIndex[i] = chosenRef[i].selected;
                var currentChosenRef = chosenRef[i];
                if (currentChosenRef.selected) {
                    currentChosenRef.selected = false;
                    newAvailFrame.push(currentChosenRef);
                }
            }

            var l = chosenRef.length;
            while (l--) {
                if (selectedByIndex[l]) {
                    chosenRef.remove(l);
                }
            }

            for (var i = 0; i < newAvailFrame.length; i++) {
                availRef.appendChild(newAvailFrame[i]);
            }

            this.sortSelectByText(availRef);
        }

        document.getElementById(chosenSelectAllCheckBox).checked = false;
        document.getElementById(availableSelectAllCheckBox).checked = false;

        this.filterAvailablePaneItems(availablePaneId, dropdownFilters, textFilter, availPaneCounter, tmpPaneId);

        this.displayNumOfItemsInChosenPane(chosenPaneId, chosenPaneLabel);
    },
    moveChosenUp : function(chosenPaneId) { // move selected from chosen one place up
        var chosenRef = document.getElementById(chosenPaneId);
        if (chosenRef.selectedIndex != -1) {
            var selectedRef = chosenRef[chosenRef.selectedIndex];
            var prevRef = selectedRef.previousElementSibling;
            if (prevRef) {
                chosenRef.insertBefore(selectedRef,prevRef);
            }
        }
    },
    moveChosenDown : function(chosenPaneId) { // move selected from chosen one place down
        var chosenRef = document.getElementById(chosenPaneId);
        if (chosenRef.selectedIndex != -1) {
            var selectedRef = chosenRef[chosenRef.selectedIndex];
            var nextRef = selectedRef.nextElementSibling;
            if (nextRef) {
                chosenRef.insertBefore(nextRef,selectedRef);
            }
        }
    },
    toggleSelectAllItems : function(paneId, selectAllCheckboxId, availablePaneId, availPaneCounter) {
        var selected = document.getElementById(selectAllCheckboxId).checked;
        this.selectAllItems(paneId, selected);
        if (paneId == availablePaneId) {
            this.displayNumOfItemsInAvailPane(availablePaneId, availPaneCounter);
        }
    },
    selectAllItems : function(paneId, selected) {
        var paneRef = document.getElementById(paneId);
        if (paneRef.hasChildNodes()) {
            for (var i = 0; i < paneRef.length; i++) {
                paneRef[i].selected = selected;
            }
        }
    },
    sortSelectByText : function(selElem) {
        var tmpAry = [];
        for (var i=0;i<selElem.options.length;i++) {
            tmpAry[i] = [];
            tmpAry[i][0] = selElem.options[i].text;
            tmpAry[i][1] = selElem.options[i].value;
            tmpAry[i][2] = selElem.options[i].getAttribute("class");
            tmpAry[i][3] = selElem.options[i].getAttribute("title");
        }
        tmpAry.sort();
        while (selElem.options.length > 0) {
            selElem.options[0] = null;
        }
        for (var i=0;i<tmpAry.length;i++) {
            var op = new Option(tmpAry[i][0], tmpAry[i][1]);
            selElem.options[i] = op;
            selElem.options[i].setAttribute("class", tmpAry[i][2]);
            selElem.options[i].setAttribute("title", tmpAry[i][3]);
        }
    },
    formatMessage: function(message, replacements) {
        var tokens = message.split(" ");
        var replaceIndex = 0;
        for (var i = 0; i < tokens.length; i ++) {
            if (jQuery.isNumeric(tokens[i])) {
                tokens[i] = replacements[replaceIndex++];
            }
        }

        return tokens.join(" ");
    }
}

var Multi = {
    initMultiselect: function(idOriginal, jsf, filterEnable, filterDelay, msgLeft, msgRight, sort){
        //escape colon for jsf
          var id = idOriginal.replace(/:/, '\\:');

        if ( jsf){
            Multi.removeHiddenField(id);
        }
        //get the main object
        var widget = $j('#' + id).parents('.multiSelectWrapper');
        widget.data('name', idOriginal);

        //generate UniqId for widget
        Multi.iniId(widget);

        if ( filterEnable){
            Multi.initFilter(widget);
        }

        //init mouse events for selecting items in the lists.
        Multi.initMouseSelect(widget, 'left');
        Multi.initMouseSelect(widget, 'right');

        //get the whole list of items ( this includes selected and not selected)
        var filteredList = widget.find('.list-left .item'),
            selectItemsList = filteredList.filter('.moved').remove(),
            selected = selectItemsList.length;

        var count = {
            left:{
                total: (filteredList.length-selected),
                selected: 0,
                msg: msgLeft
            },
            right:{
                total: selected,
                selected: 0,
                msg: msgRight
            }
        };
        widget.data('count', count);

        //check if dropDownFilter are available
        var dropDownfilters = widget.find('.filterDropDown').length>0;

        if (!filterDelay || filterDelay < 1){
            if (count.left.total>6000){
                filterDelay = 250;
            }
            else if (count.left.total>4000){
                filterDelay = 200;
            }
            else if (count.left.total>1500){
                filterDelay = 150;
            }
        }

        widget.data('options', {
            'filterStart':-1,
            'delay': filterDelay || count.left.total/80,
            'filterEnable':filterEnable,
            'jsf':jsf,
            'sort': sort,
            'dropDownFilter' :dropDownfilters
        });

        //update the hidden field to submit the values that are on the right list.
        Multi.copyToSubmit(widget);

        //update both msg left and right.
        Multi.displayMessageNumOfSelected(widget, count);
        Multi.displayMessageSelected(widget, count);

    },
    removeHiddenField: function(id){ /*this will get called when creating this widget using JSF tag. it will remove the extra hidden input which is used for binding*/
        var hiddenValue = $j('input[name="' + id+'"]').not('.listToSubmit');
        if (hiddenValue){
            hiddenValue.remove();
        }
    },
    /* generate Unique ID for each Widget*/
    iniId: function(widget){
        if ( !Multi.ids){
            Multi.ids = {};
        }

        var uniId = Multi.genUniqueID();
        while ( Multi.ids[uniId]){
            uniId = Multi.genUniqueID();
        }

        Multi.ids[uniId] = true;
        widget.prop("id", uniId);
    },
    /* init Text Field Filter box to capture onKeyUp event */
    initFilter: function(widget){
        widget.find('.filter').on('keyup', Multi.filter);
    },
    /*this method will get called when filtering is used. ( could happen from onKeyUp from Text Filed Box or from a DropDown Filter boxes.
    * this method will filter the left list according to the filter criteria */
    filter: function(e){
        var elm  = e.target || e,
            widget = $j(elm).parents('.multiSelectWrapper'),
            options = widget.data('options');

        if (options.filterStart){
            clearTimeout(options.filterStart);
        }

        options.filterStart = setTimeout(function () {
            var count = widget.data('count'),
                text = widget.find('input.filter').val().toUpperCase();
            text = $j.trim(text);

            var filter = widget.data('filter') || {history:{}};
            filter.oldTerm = filter.newTerm || "";
            filter.newTerm = text;
            //filter.history[text] = ++filter.history[text] || 1;

            var list = widget.find('.list-left').children();
            var rejectedList;
            //cache the results.
            if ( filter.history[text]){
                rejectedList = filter.history[text].list;
                filter.history[text].count = ++filter.history[text].count;
            }else{
                rejectedList = list.filter(function(a, b){
                    return $j(b).text().toUpperCase().indexOf(text)==-1;
                });
                filter.history[text] = {
                    count: (++filter.history[text] || 1),
                    list: rejectedList
                }
            }

            list.toggleClass('filtered', false);
            list.toggleClass('filteredByText', false);

            count.left.total = list.size() - rejectedList.size();
            count.left.selected = 0;
            widget.data('count', count);
            list.toggleClass('selected', false);

            rejectedList.toggleClass('filtered', true);
            rejectedList.toggleClass('filteredByText', true);

            widget.data('filter', filter);

            if ( options.dropDownFilter){
                Multi.filterByClass(widget, list);
            }

            Multi.selectAllCheckBoxState(elm, 'left');
            Multi.displayMessageNumOfSelected(widget,  widget.data('count'));


            clearTimeout(options.filterStart);
        }, options.delay);

        widget.data('options', options);
    },
    /*this will filter the lef list by the DropDownFilters */
    filterByClass : function(widget, list){
        var items = list.not('.filteredByText'),
            filterDropDown = widget.find('.filterDropDown'),
            filterClasses = "";

        filterDropDown.each(function(){
            var filterClass = $j(this).val();
            if (filterClass){
                filterClasses +="." + filterClass;
            }
        });

        var currentFilteredItemsByClass = items.filter('.filteredByClass');
        currentFilteredItemsByClass.toggleClass('filteredByClass', false);
        currentFilteredItemsByClass.toggleClass("filtered", false);

        if ($j.trim(filterClasses).length==0){
            filterClasses=".item";
        }

        var newFilterItems = items.filter(":not(" + filterClasses + ")");
        newFilterItems.toggleClass("filtered", true);
        newFilterItems.toggleClass("filteredByClass", true);

        var count = widget.data('count');
        count.left.total = items.length - newFilterItems.length;
        count.left.selected = 0;

        widget.data('count', count);
    },
    /*this method will select all the item in list*/
    selectAll: function(elm, side){
        var widget = $j(elm).parents('.multiSelectWrapper'),
            checked = elm.checked,
            list = widget.find('.list-' + side + ' .item').not('.filtered'),
            count = widget.data('count');

        list.toggleClass('selected', checked);
        if ( checked){
            count[side].selected = count[side].total;
        }else{
            count[side].selected = 0;
        }
        widget.data('count', count);

        if ( side ==='left'){
            Multi.displayMessageNumOfSelected(widget, count);
        }else{
            Multi.displayMessageSelected(widget, count);
        }


    },
    /*select one item in the list ( called by clicking an item)*/
    selectItem : function(elm, side, check){
        var option = $j(elm);

        //if 'check' parm is passed then do the following else 'check' is undefine so check toggle the class.
        if ( check===true || check === false ){
            //if no change then get out
            if ( option.hasClass('selected') === check){
                return;
            }else{
                option.toggleClass('selected', check);
            }

        }else{
            option.toggleClass('selected');
        }

        var widget = option.parents('.multiSelectWrapper'),
            value = option.is('.selected')?1:-1,
            count = widget.data('count');

        count[side].selected += value;
        widget.data('count',  count);

        Multi.selectAllCheckBoxState(elm, side);
        Multi.displayMessageNumOfSelected(widget, count);
        Multi.displayMessageSelected(widget, count);


    },/*this method creates a comma separated string of all the item in the selected(right) list
        and puts that string in the hidden input which is being submitted with the form */
    copyToSubmit: function(widget){
        var values = widget.find(".list-right .item").map(
            function(){
                return $j(this).attr("value");
            }).get();

        var name = widget.data('name');
        var inputs = [];
        if ( widget.data('options')['jsf']){ /*if jsf page, then one input that contains comma separated values*/
            inputs.push('<input type="hidden" name="' + name + '" value="' + values.join(',') + '" />');
        }else{ /*else create a hidden input for each value.*/
            for (var i= 0, len = values.length; i<len; i++) {
                var val = values[i];
                if (val.length > 0) { /*not to send empty values. */
                    inputs.push('<input type="hidden" name="' + name + '" value="' + val + '" />');
                }
            }
        }

        widget.find('.listToSubmitTr td').html(inputs.join(''));

    },/*will uncheck/check if all the items in the list are selected, and if all selected then it will select the 'select all' checkbox*/
    selectAllCheckBoxState: function(elm, side){
        var widget = $j(elm).parents('.multiSelectWrapper'),
            checkbox = widget.find('.list-selectAll-' + side + ' input[type="checkbox"]'),
            count = widget.data('count'),
            allSelected = count[side].total!==0 && count[side].selected === count[side].total;

        $j(checkbox).prop('checked', allSelected);

    },/*this will copy all the selected items from the left list to the right list.*/
    copyRight: function(elm, copyItem){
        var widget = $j(elm).parents('.multiSelectWrapper'),
            copyItems = copyItem || widget.find('.list-left .selected'),
            size = copyItems.length,
            count = widget.data('count');

        count.left.selected -= size;
        count.left.total -= size;
        count.right.total += size;
        widget.data('count', count);

        var listWrapper = widget.find('.list-wrapper-right'),
            listRight = listWrapper.find('.list-right').detach();

        listRight.append(copyItems);

        if ( widget.data('options').sort===true){
            var list =  listRight.children();
            list.sort(Multi.compare);
            listRight.html(list);
        }

        listWrapper.html(listRight);

        //delete the items and remove selected from them.
        copyItems.toggleClass('selected', false);

        Multi.selectAllCheckBoxState(elm, 'left');
        Multi.selectAllCheckBoxState(elm, 'right');
        Multi.displayMessageNumOfSelected(widget, count);
        Multi.displayMessageSelected(widget, count);
        Multi.copyToSubmit(widget);

    },/*this will copy all the selected items form the right list to the left list.*/
    copyLeft: function(elm, copyItem){
        var widget = $j(elm).parents('.multiSelectWrapper'),
            copyItems = copyItem || widget.find('.list-right .selected'),
            size = copyItems.length,
            count = widget.data('count');

        count.right.selected -= size;
        count.right.total -= size;
        count.left.total += size;
        widget.data('count', count);

        var listWrapper = widget.find('.list-wrapper-left'),
            listLeft = listWrapper.find('.list-left').detach();

        listLeft.append(copyItems);

        var list =  listLeft.children();
        list.sort(Multi.compare);
        listLeft.html(list);
        listWrapper.html(listLeft);

        //delete the items and remove selected from them.
        copyItems.toggleClass('selected', false);

        //check if filter is enabled ( then filter the results )
        if (widget.data('options').filterEnable){
            Multi.filter(elm);
        }

        Multi.selectAllCheckBoxState(elm, 'left');
        Multi.selectAllCheckBoxState(elm, 'right');
        Multi.displayMessageNumOfSelected(widget, count);
        Multi.displayMessageSelected(widget, count);
        Multi.copyToSubmit(widget);

    },
    /*this is a comparator function which will be used to sort the items in the list.*/
    compare: function (a1,a2) {
        var a  = a1.getAttribute("sortIndex"),
            b  = a2.getAttribute("sortIndex");

        return Number(a)-Number(b);
    },
    /*this will update the display message of of many items are selected in the left list*/
    displayMessageNumOfSelected : function(widget, count){
        var textArea = widget.find('.numofselected');
        textArea.text(Multi.format(count.left.msg, [count.left.selected.toLocaleString(), count.left.total.toLocaleString()]));
    },
    /*this will update the display message of of many items are selected in the right list*/
    displayMessageSelected: function(widget, count){
        var elm  = widget.find('.totalSelectedMessage');
        elm.text(Multi.format(count.right.msg, [count.right.selected.toLocaleString(), count.right.total.toLocaleString()]));
    },/*this is used by the dispalyMessage methods to format the string.*/
    format : function(msg, args){
        return msg.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]: match;
        });
    },/*this will ini the mouse event for selecting items in a list, which includes drag and shiftKey selection.*/
    initMouseSelect: function(widget, side){
        var items = widget.find('.list-'+side);

        items.on('mousedown', '.item', function(e){
            var elm = e.target,
                widget = $j(elm).parents('.multiSelectWrapper'),
                right = $j(elm).parents('.list-wrapper').hasClass('list-wrapper-right');

            Multi.side  = right?'right':'left';
            Multi.selectItem(elm, Multi.side);
            Multi.drag = true;
            Multi.check = $j(elm).hasClass('selected');
            Multi.lastHover = elm;
            Multi.currentWidgetId = widget.prop('id');
            if ( Multi.shiftKeyPress && Multi.startDrag){
                Multi.selectBetween();
            }else{
                Multi.startDrag = elm;
            }

            var items = widget.find('.list-' + Multi.side);
            Multi.filterStart = -1;

        });

        items.on('dblclick', '.item', function(e){
            "use strict";
            var elm = e.target,
                widget = $j(elm).parents('.multiSelectWrapper'),
                right = $j(elm).parents('.list-wrapper').hasClass('list-wrapper-right');

            var side  = right?'right':'left';
            var dbClickTracking = widget.data('dbClicked') || {"left":false, "right":false};

            if ( !dbClickTracking[side]){
                Multi.selectItem(elm, side, true);
                if ( right){
                    Multi.copyLeft(elm,$j(elm));
                }else{
                    Multi.copyRight(elm,$j(elm));
                }

                dbClickTracking[side] = false;
                widget.data('dbClicked', dbClickTracking)
            }/*else is already proccessing other dbClick ( we could que the items and process after ) */
        });
        items.on('mouseover', '.item', Multi.selectHover);

        //need to add event only once (if more then one multiselect i still need to create only one event on the body.)
        if ( !Multi.mouseSelectEnabled){
            $j('body').on('mouseup', function(e){
                if (Multi.drag ){
                    Multi.drag = false;
                }
            });

            $j('body').on('keydown', function(key) {
                if (key.which === 16) { //shift key
                    Multi.shiftKeyPress = true;
                }
            });

            $j('body').on('keyup', function(key) {
                if (key.which === 16) {//shift key
                    Multi.shiftKeyPress = false;
                }
            });

            Multi.mouseSelectEnabled = true;

        }
    },/*this method is called when a mouse click-> Drag occurs in a list. it will select/unselect all items*/
    selectHover: function(e){
        if (Multi.filterStart){
            clearTimeout(Multi.filterStart);
        }
        Multi.filterStart = setTimeout(function () {

            if ( Multi.drag ){
                var widget = $j(e.target).parents('.multiSelectWrapper');

                if ( widget.prop('id') === Multi.currentWidgetId){
                    var right = $j(e.target).parents('.list-wrapper').hasClass('list-wrapper-right');
                    var side = right?"right":"left";
                    if (side == Multi.side){
                        Multi.selectItem(e.target, Multi.side, Multi.check);
                        Multi.lastHover = e.target;
                        Multi.selectBetween();
                    }
                }
            }
            clearTimeout(Multi.filterStart);
        }, 15);

    },/*select all items between two location of items. */
    selectBetween: function(){
        var list = $j(Multi.startDrag.parentNode).find('.item').not(".filtered"),
            start = list.index(Multi.startDrag),
            end = list.index(Multi.lastHover);

        //if we are selecting backwards then reverse the order
        if ( start>end){
            var temp = start;
            start = end;
            end = temp;
        }
        for ( var i=start+1; i <end; i++){
            Multi.selectItem(list[i], Multi.side, Multi.check);
        }
    },/*this will move item(s) on the right list up*/
    moveUp: function(elm){
        Multi.moveItem(elm, -1);
    },/*this will move item(s) on the right list down*/
    moveDown: function(elm){
        Multi.moveItem(elm, 0);
    },/*method to sort the items in a list ( this will sort it based on the original order which came from server. NOT alphabetic or Numeric sort)*/
    sortList: function(elm, side){
        var widget = $j(elm).parents('.multiSelectWrapper'),
            wrapper = widget.find('.list-' + side),
            sorted = wrapper.find('.item').sort(Multi.compare);

        wrapper.html(sorted);
        Multi.copyToSubmit(widget);
    },/*the actual method which moves items up/down on the right list.*/
    moveItem: function(elm, move){
        var widget = $j(elm).parents('.multiSelectWrapper'),
            list = widget.find('.list-right .item'),
            listNotSelected = list.not('.selected'),
            copyItems = list.filter('.selected'),
            copyToSubmit = false;

        if (copyItems.length>0){
            var currentPosition = list.index(copyItems[0]),
                lastPosition = list.index(copyItems[copyItems.length-1]);

            currentPosition +=move;
            if ( currentPosition<0){
                copyItems.insertBefore(listNotSelected[0]);
                copyToSubmit = true;
            }else if (currentPosition >= listNotSelected.length){
                copyToSubmit = false;
            }else {
                copyItems.detach();
                if ( move === 0) {//move down
                    copyItems.insertAfter(listNotSelected[currentPosition]);
                }else{//move up
                    copyItems.insertBefore(listNotSelected[currentPosition]);
                }
                copyToSubmit = true;
            }
            if ( copyToSubmit){
                Multi.copyToSubmit(widget);
            }

        }
    },/*this will generate and assign a unique id for widget. ( this is needed for the mouse events to not cross between widgets)*/
    genUniqueID : function(){
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4();
    }
};





