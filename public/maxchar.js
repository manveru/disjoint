/**
* maxChar jQuery plugin
* @author Mitch Wilson
* @version 0.3.0
* @requires jQuery 1.3.2 (only version tested)
* @see http://mitchwilson.net/2009/08/03/new-jquery-plugin-maxchar/
* @param {Boolean}	debug				Specify whether to send message updates to the Firebug console. Default is false.
* @param {String}	indicator 			Specify alternate indicator element by id. Default is indicator created dynamically.
* @param {String}	label				Specify a default label displayed when input element is not in focus. Default is blank.
* @param {String}	pluralMessage 		Set the plural form of the remaining count message. Default is ' remaining'.
* @param {Number}	rate 				Set the update rate in milliseconds. Default is 200.
* @param {String}	singularMessage 	Set the singular form of the remaining count message. Default is ' remaining'.
* @param {String}	spaceBeforeMessage 	Set spacing in front of (to the left of) the indicator message. Default is ' '.
* @param {Boolean}	truncate			Truncate submitted value down to limit on form submit. Default is true.
* @description Enforces max character limit on any input or textarea HTML element and provides user feedback and many options. 
* New features added in 0.3.0 are: 
* 1) Feature change: Displays negative characters when past limit rather than truncating characters in form input.
* 2) New option: truncate - If true, on form submit truncates submitted value down specified by limit. Does not change (respects) user text in form field. Default is true.
* 3) Bug fixes: Fixed serveral issues related to removing over-the-limit characters in the form field.
*/

(function($){
	$.fn.maxChar = function(limit, options) {
		
		// Define default settings and override w/ options.	
		settings = jQuery.extend({
			debug: false,
			indicator: 'indicator',
			label: '',
			pluralMessage:' remaining',
			rate: 200,
			singularMessage: ' remaining',
			spaceBeforeMessage: ' ',
			truncate: true
		}, options);
		
		// Get maxChar target element.
		var target = $(this); // Must get target first, since it is used in setting other local variables.
		
		// Get settings.
		var debug = settings.debug;
		var indicatorId = settings.indicator;
		var label = settings.label;
		var pluralMessage = settings.pluralMessage;
		var rate = settings.rate;
		var singularMessage = settings.singularMessage;
		var spaceBeforeMessage = settings.spaceBeforeMessage;
		var truncate = settings.truncate;
		
		// Set additional local variables.
		var currentMessage = ''; // Current message to display to the user.
		var indicator = getIndicator(indicatorId); // Element to display count, messages and label.
		var limit = limit; // Character limit.
		var remaining = limit; // Characters remaining.
		var timer = null; // Timer to run update.
		
		// Initialize on page ready.
		if(label) {
			indicator.text(label);
		} else {
			// Call update once on code initialization to update view if text is already in textarea,
			// eg, if user relaoads page or hits back button and form textarea retains previoulsy entered text.
			update(limit);
		}
		
		// When user focuses on the target element, do the following.
		$(this).focus(function(){
			if(timer == null) {
				if(label) {
					indicator.fadeOut(function(){indicator.text('')}).fadeIn(function(){start()});					
				} else {
					start();
				}
			}
		});
		
		// When user removes focus from the target element, do the following.
		$(this).blur(function() {
			// Stop timer that updates count and the indicator message.
			stop();
			// Update view.
			if(label) {
				indicator.fadeOut(function(){indicator.text(label)}).fadeIn();
			}
		});
		
		function getIndicator(id){
			// Get indicator element in the dom.
			var indicator = $('#'+id);
			// If indicator element does not already exist in the dom, create it.
			if(indicator.length == 0) {
				target.after(spaceBeforeMessage + '<span id="'+id+'"></span>');
				indicator = $('#'+id)
			}
			// Return reference to indicator element.
			return indicator;
		}

		// Create helper functions.
		function log(message) {
			// Display 
			if(debug) {
				try {
					if(console) {
						console.log(message);
					}
				} catch(e) {
					// Do nothing on error.
				}
			}
		}
		
		// Start the timer that updates indicator.
		function start() {
			timer = setInterval(function(){update(limit)}, rate);
		}
		
		// Stop the timer that updates the indicator.
		function stop() {
			if(timer != null) {
				clearInterval(timer);
				timer = null;
			}
		}
		
		// Truncate submitted value down to limit on form submit.
		if(truncate) {
			var form_id = '#' + $(this).closest("form").attr("id");
			$(form_id).submit(function(){
				target.val(target.val().slice(0,limit));
			});
		}
		
		// Update the indicator.
		function update(limit){
			var remaining = limit - target.val().length;
			// Update remaining count and message.
			if(remaining == 1) {
				currentMessage = remaining + singularMessage;
			} else {
				currentMessage = remaining + pluralMessage;
			}
			// Update indicator.
			indicator.text(currentMessage);
			log(currentMessage);
		}
	};
})(jQuery);
