/*******************************************************************************************************

  Copyright (C) Sebastian Loncar, Web: http://loncar.de

  MIT License:

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
  associated documentation files (the "Software"), to deal in the Software without restriction, 
  including without limitation the rights to use, copy, modify, merge, publish, distribute,
  sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial
  portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
  NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
  OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*******************************************************************************************************/

$(document).ready(function () {

	// --- debug ---

	var logCount = 0;
	var debug = false;

	var log = function (txt) {
		var txt = (++logCount) + " " + txt;
		console.log(txt);
		$("#log").prepend(txt + "<br>");
	};

	// --- handle touch events ----

	jQuery.event.special.touchstart = {
		bindType: "touchstart",
		delegateType: "touchstart",
		handle: function (event) {
			if (event.originalEvent.touches.length > 1) return;

			var handleObj = event.handleObj;
			var targetData = jQuery.data(this);
			var ret = null;

			targetData.prevTouchDown = targetData.lastTouchDown;
			targetData.lastTouchDown = new Date().getTime();

			if (targetData.prevTouchDown && targetData.lastTouchDown - targetData.prevTouchDown < 300) {
				targetData.wheelEventPossible = true;
			}
			else {
				delete targetData.wheelEventPossible;
			}

			log(event.type);

			fixEvent(event, event.originalEvent.touches[0]);
			event.type = "mousedown";
			event.which = 1;
			ret = jQuery(event.target).trigger(event);
			event.type = handleObj.type;

			return ret;
		}
	};

	jQuery.event.special.touchend = {
		bindType: "touchend",
		delegateType: "touchend",
		handle: function (event) {
			log(event.type);

			var handleObj = event.handleObj;
			var targetData = jQuery.data(this);
			delete targetData.wheelEventPossible;
			var ret = null;

			if (event.originalEvent.touches.length > 0) return;

			event.preventDefault();

			var time = new Date().getTime();

			fixEvent(event, event.originalEvent.changedTouches[0]);
			event.type = "mouseup";
			event.which = 1;
			ret = jQuery(event.target).trigger(event);
			event.type = handleObj.type;

			if (targetData.prevTouchDown && time - targetData.prevTouchDown < 300) {
				event.type = "dblclick";
				ret = jQuery(event.target).trigger(event);
				event.type = handleObj.type;
			}
			else {
				event.type = "click";
				ret = jQuery(event.target).trigger(event);
				event.type = handleObj.type;
			}

			delete targetData.oldScreenX;
			delete targetData.oldScreenY;
			delete targetData.minPixelDistance

			return ret;

		}
	};

	jQuery.event.special.touchmove = {
		bindType: "touchmove",
		delegateType: "touchmove",
		handle: function (event) {
			log(event.type);
			if (event.originalEvent.touches.length > 1) return;

			var handleObj = event.handleObj;
			var targetData = jQuery.data(this);
			var ret = null;

			if (!targetData.touchMousewheelEventInstalled || targetData.touchMousemoveEventInstalled || targetData.wheelEventPossible) {
				event.preventDefault();
			}

			var touch = event.originalEvent.touches[0];

			if (!targetData.oldScreenX) {
				targetData.oldScreenX = touch.screenX;
				targetData.oldScreenY = touch.screenY;
				targetData.minPixelDistance = 10;
			}

			log("s:" + touch.screenX);

			if (targetData.oldScreenX) {
				if (Math.abs(touch.screenX - targetData.oldScreenX) < targetData.minPixelDistance && Math.abs(touch.screenY - targetData.oldScreenY) < targetData.minPixelDistance) {
					return true;
				}
				targetData.minPixelDistance = 2;
			}

			var delta = touch.screenY - targetData.oldScreenY;

			targetData.oldScreenX = touch.screenX;
			targetData.oldScreenY = touch.screenY;

			fixEvent(event, touch);
			if (targetData.wheelEventPossible) {
				event.type = "mousewheel";
				event.wheelDelta = delta;
				event.wheelDeltaY = delta;
			}
			else {
				event.type = "mousemove";
				log(event.pageX);
			}
			//ret = jQuery(event.target).trigger(event);
			fireEvent(this, event);


			event.type = handleObj.type;

			return ret;
		}
	};

	var fixEvent = function (e, touch) {
		e.pageX = touch.pageX;
		e.pageY = touch.pageY;
		e.clientX = touch.clientX;
		e.clientY = touch.clientY;
		e.screenX = touch.screenX;
		e.screenY = touch.screenY;
		e.which = 1;
	}

	var fireEvent = function (el, e) {
		var events = $._data(el, "events");
		if (events && events[e.type]) {
			var handlers = events[e.type];
			for (var i = 0; i < handlers.length; i++) {
				handlers[i].handler.call(el, e)
			}
		}
	}

	// --- bind touch events ---

	var emptyFunction = function () { };

	var events = ["click", "dblclick", "mousedown", "mouseup", "mousemove", "mousewheel", "contextmenu"];
	for (var i = 0; i < events.length; i++) {

		$.each(events, function (i, type) {
			jQuery.event.special[type] = {
				bindType: type,
				delegateType: type,
				setup: function (handleObj) {
					log("setup " + type);

					var j = $(this);

					var data = j.data();

					if (!data.touchEventInstalled) data.touchEventInstalled = 0;

					if (data.touchEventInstalled === 0) {
						j.on("touchstart", emptyFunction);
						j.on("touchend", emptyFunction);
					}

					++data.touchEventInstalled;

					//--

					if (type === "mousemove" || type === "mousewheel") {
						if (!data.touchMoveEventInstalled) data.touchMoveEventInstalled = 0;

						if (data.touchMoveEventInstalled === 0) {
							j.on("touchmove", emptyFunction);
						}

						++data.touchMoveEventInstalled;

						if (type === "mousemove") {
							if (!data.touchMousemoveEventInstalled) data.touchMousemoveEventInstalled = 0;
							data.touchMousemoveEventInstalled++;
						}

						if (type === "mousewheel") {
							if (!data.touchMousewheelEventInstalled) data.touchMousewheelEventInstalled = 0;
							data.touchMousewheelEventInstalled++;
						}
					}

					return false;
				},

				teardown: function () {
					var j = $(this);

					var data = j.data();

					if (data.touchEventInstalled && --data.touchEventInstalled === 0) {
						j.off("touchstart", emptyFunction);
						j.off("touchend", emptyFunction);
						delete data.touchEventInstalled;
					}

					if (type === "mousemove" || type === "mousewheel") {
						if (data.touchMoveEventInstalled && --data.touchMoveEventInstalled === 0) {
							j.off("touchmove", emptyFunction);
							delete touchMoveEventInstalled;
						}

						if (type === "mousemove") {
							if (data.touchMousemoveEventInstalled && --data.touchMousemoveEventInstalled === 0) {
								delete touchMousemoveEventInstalled;
							}
						}

						if (type === "mousewheel") {
							if (data.touchMousewheelEventInstalled && --data.touchMousewheelEventInstalled === 0) {
								delete touchMousewheelEventInstalled;
							}
						}

					}

				}

			};

			//// --- normalize wheel event ----

			if (type === "mousewheel") {
				jQuery.event.special[type].handle = function (event) {
					if (type === "mousewheel")
						if (event.wheelDelta.originalEvent) {
							if (event.wheelDelta === undefined) {
								event.wheelDelta = event.originalEvent.wheelDelta;
							}
						}
					return event.handleObj.handler.apply(this, arguments);;
				}

			}

		});
	}

	// --- testing ----

	var testEvents = function () {
		//debug = true;

		//var events = ["click", "dblclick", "mousedown", "mouseup", "mousemove", "mousewheel", "contextmenu"/*, "tab", "touchstart", "touch", "touchend", "touchmove",*/];

		////$("#box").css("user-scalable", "no");

		$("#box").draggable();

		//for (var i = 0; i < events.length; i++) {
		//	var type = events[i];

		//	$("#box").on(type, null, type, function (e) {
		//		var type = e.data;

		//		//if (type == "touchmove")
		//		//	e.preventDefault();

		//		log(type);
		//		log(e.pageX);
		//	});
		//}
	}
	//testEvents();

});