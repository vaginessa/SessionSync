'use strict';


// *****************************************************************************
// SDK Modules

const { setTimeout, clearTimeout } = require("sdk/timers");

// *****************************************************************************
// Custom Modules

const { WindowEvents, GlobalEvents } = require('../utils/global-events');
const { HTMLCreator } = require('../utils/dom');

const { SessionSyncModel } = require('../session-sync-model');

// *****************************************************************************
// API

/*
 * SearchBar
 */

function SearchBar(document)
{
	var window = document.ownerGlobal;
	var DomElem = HTMLCreator(document);

	// ------------------------------------------------------------------------
	// Create UI

	var panel = DomElem('div', {class: 'search-bar'});

	var createSession = DomElem('div', {class: 'create-session' });
	panel.appendChild(createSession);

	var close = DomElem('div', {class: 'close' });
	panel.appendChild(close);

	var searchInput = DomElem('input', {type: 'text', class: 'search', placeholder:'Filter sessions...'});
	panel.appendChild(searchInput);

	 // Set css rules that will be overwritten by the CSS Overlay
	 // BUG: Some CSS rules don't work in Firefox if inline style is not configured  
	searchInput.style.padding = '0';
	searchInput.style.border = '1px solid #CCC'; 
	searchInput.style.borderRadius = '1em';

	// ------------------------------------------------------------------------
	// Methods

	var timeOut = null;
	
	var attachShortCuts = function attachShortCuts(e) {
		if (e.keyCode == 70 && e.ctrlKey == true) // CTRL + F was pressed
		{
			e.preventDefault();
			searchInput.focus();
			onFocus();
		}
	};

	var dismiss = function dismiss()
	{
		clearTimeout(timeOut);
		if (searchInput.value.length) {
			searchInput.value = "";
			WindowEvents.emit(document, 'FilterSessions', searchInput.value.toLowerCase());		
		} else {
			searchInput.blur();
			onBlur();
		}
		
		panel.setAttribute('content', searchInput.value != "");
	};
	
	var onKeyDown = function(e) 
	{
		if (e.keyCode == 27)
		{	// ESC was pressed in the search bar
			dismiss();
			return;
		}

		clearTimeout(timeOut);
		timeOut = setTimeout(function () {
			WindowEvents.emit(document, 'FilterSessions', searchInput.value.toLowerCase());
			panel.setAttribute('content', searchInput.value != "");
		}, 200);
	};

	var onFocus = function onFocus() {
		panel.setAttribute('active', true);
		document.addEventListener('keyup', onKeyDown);
	};

	var onBlur = function onBlur() {
		if (searchInput.value == "") {
			panel.setAttribute('active', false);
		}
		document.removeEventListener('keyup', onKeyDown);
	};
	
	// ------------------------------------------------------------------------
	// Events

	// Tooltip events
	createSession.addEventListener('mouseover', function(e) {
		WindowEvents.emit(document, 'ShowTooltip', {
			node: e.target,
			message: 'Create session',
		});
	});

	createSession.addEventListener('mouseleave', function(e) {
		WindowEvents.emit(document, 'HideTooltip');
	});		

	createSession.addEventListener('click', function() {
		GlobalEvents.emit('CreateNewSession', searchInput.value);
		WindowEvents.emit(document, 'HideTooltip');
	});

	close.addEventListener('click', dismiss);
	
	searchInput.addEventListener('focus', onFocus);
	searchInput.addEventListener('blur', onBlur);
	
	WindowEvents.on(document, 'FilterSessionsExactMatch', function(isMatch) {
		panel.setAttribute('content', !isMatch);
	});
	
	WindowEvents.on(document, 'UIToggledOff', function() {
		window.removeEventListener("keydown", attachShortCuts);
	});
	
	WindowEvents.on(document, 'UIToggledOn', function() {
		window.addEventListener("keydown", attachShortCuts);
	});

	WindowEvents.on(document, 'InstanceDestroy', function() {
		window.removeEventListener("keydown", attachShortCuts);
	});
	
	// ------------------------------------------------------------------------
	// Public properties

	this.DOMRoot = panel;		
};

// Public API
exports.SearchBar = SearchBar;