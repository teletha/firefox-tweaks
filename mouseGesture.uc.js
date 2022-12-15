// ==UserScript==
// @name         Mouse Gestures (with Wheel Gesture and Rocker Gesture)
// @namespace    http://www.xuldev.org/
// @description  Lightweight customizable mouse gestures.
// @include      main
// @author       Gomita
// @version      1.0.20080201
// @homepage     http://www.xuldev.org/misc/ucjs.php
// ==/UserScript==

var ucjsMouseGestures = {

    // options
    enableWheelGestures: true,    // Wheel Gesturess (Scroll wheel with holding right-click)
    enableRockerGestures: true,    // Rocker Gesturess (Left-click with holding right-click and vice versa)

    _lastX: 0,
    _lastY: 0,
    _directionChain: "",
    _isMac: false,    // for Mac

    init: function()
    {
        this._isMac = navigator.platform.indexOf("Mac") == 0;
        gBrowser.tabpanels.addEventListener("mousedown", this, false);
        gBrowser.tabpanels.addEventListener("mousemove", this, false);
        gBrowser.tabpanels.addEventListener("mouseup", this, false);
        gBrowser.tabpanels.addEventListener("contextmenu", this, true);
        if (this.enableRockerGestures)
            gBrowser.tabpanels.addEventListener("draggesture", this, true);
        if (this.enableWheelGestures)
            gBrowser.tabpanels.addEventListener("DOMMouseScroll", this, false);
    },

    uninit: function()
    {
        gBrowser.tabpanels.removeEventListener("mousedown", this, false);
        gBrowser.tabpanels.removeEventListener("mousemove", this, false);
        gBrowser.tabpanels.removeEventListener("mouseup", this, false);
        gBrowser.tabpanels.removeEventListener("contextmenu", this, true);
        if (this.enableRockerGestures)
            gBrowser.tabpanels.removeEventListener("draggesture", this, true);
        if (this.enableWheelGestures)
            gBrowser.tabpanels.removeEventListener("DOMMouseScroll", this, false);
    },

    _isMouseDownL: false,
    _isMouseDownR: false,
    _suppressContext: false,
    _shouldFireContext: false,    // for Linux

    handleEvent: function(event)
    {
        switch (event.type) {
            case "mousedown":
                if (event.button == 2) {
                    this._isMouseDownR = true;
                    this._suppressContext = false;
                    this._startGesture(event);
                    if (this.enableRockerGestures && this._isMouseDownL) {
                        this._isMouseDownR = false;
                        this._suppressContext = true;
                        this._directionChain = "L>R";
                        this._stopGesture(event);
                    }
                }
                else if (this.enableRockerGestures && event.button == 0) {
                    this._isMouseDownL = true;
                    if (this._isMouseDownR) {
                        this._isMouseDownL = false;
                        this._suppressContext = true;
                        this._directionChain = "L<R";
                        this._stopGesture(event);
                    }
                }
                break;
            case "mousemove":
                if (this._isMouseDownR) {
                    this._progressGesture(event);
                }
                break;
            case "mouseup":
                if ((this._isMouseDownR && event.button == 2) ||
                    (this._isMouseDownR && this._isMac && event.button == 0 && event.ctrlKey)) {
                    this._isMouseDownR = false;
                    if (this._directionChain)
                        this._suppressContext = true;
                    this._stopGesture(event);
                    if (this._shouldFireContext) {
                        this._shouldFireContext = false;
                        this._displayContextMenu(event);
                    }
                }
                else if (this.enableRockerGestures && event.button == 0 && this._isMouseDownL) {
                    this._isMouseDownL = false;
                }
                break;
            case "contextmenu":
                if (this._suppressContext || this._isMouseDownR) {
                    this._suppressContext = false;
                    event.preventDefault();
                    event.stopPropagation();
                    if (this._isMouseDownR) {
                        this._shouldFireContext = true;
                    }
                }
                break;
            case "DOMMouseScroll":
                if (this.enableWheelGestures && this._isMouseDownR) {
                    event.preventDefault();
                    event.stopPropagation();
                    this._suppressContext = true;
                    this._directionChain = "W" + (event.detail > 0 ? "+" : "-");
                    this._stopGesture(event);
                }
                break;
            case "draggesture":
                this._isMouseDownL = false;
                break;
        }
    },

    _displayContextMenu: function(event)
    {
        var evt = event.originalTarget.ownerDocument.createEvent("MouseEvents");
        evt.initMouseEvent(
            "contextmenu", true, true, event.originalTarget.defaultView, 0,
            event.screenX, event.screenY, event.clientX, event.clientY,
            false, false, false, false, 2, null
        );
        event.originalTarget.dispatchEvent(evt);
    },

    _startGesture: function(event)
    {
        this._lastX = event.screenX;
        this._lastY = event.screenY;
        this._directionChain = "";
    },

    _progressGesture: function(event)
    {
        var x = event.screenX;
        var y = event.screenY;
        var distanceX = Math.abs(x - this._lastX);
        var distanceY = Math.abs(y - this._lastY);
        // minimal movement where the gesture is recognized
        const tolerance = 10;
        if (distanceX < tolerance && distanceY < tolerance)
            return;
        // determine current direction
        var direction;
        if (distanceX > distanceY)
            direction = x < this._lastX ? "L" : "R";
        else
            direction = y < this._lastY ? "U" : "D";
        // compare to last direction
        var lastDirection = this._directionChain.charAt(this._directionChain.length - 1);
        if (direction != lastDirection) {
            this._directionChain += direction;
        }
        // save current position
        this._lastX = x;
        this._lastY = y;
    },

    _stopGesture: function(event)
    {
        try {
            if (this._directionChain) {
                this._performAction(event);
          }
        }
        catch(ex) {
        }
        this._directionChain = "";
    },

    _performAction: function(event)
    {
        // These are the mouse gesture mappings. Customize this as you like.
        switch (this._directionChain) {
            // Back
            case "L": document.getElementById("Browser:Back").doCommand(); break;
            // Forward
            case "R": document.getElementById("Browser:Forward").doCommand(); break;
            // Reload (Skip Cache)
            case "U": document.getElementById("Browser:ReloadSkipCache").doCommand(); break;
            // Undo Close Tab
            case "D": document.getElementById("History:UndoCloseTab").doCommand(); break;
            // Extension Page
            case "DU": gBrowser.addTab("about:addons"); break;
            // Restart
            case "DUD": BrowserUtils.restartApplication(); break;
            // Unknown Gesture
            default: throw "Unknown Gesture: " + this._directionChain;
        }
    }

};


ucjsMouseGestures.init();
window.addEventListener("unload", function(){ ucjsMouseGestures.uninit(); }, false);
