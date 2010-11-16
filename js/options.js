document.addEvent('domready', function(){
		
	//init form values
	$('username').value = localStorage.username || '';
	$('password').value = '';
	$('autosynch').checked = Boolean(parseInt(localStorage.autosynch) || 0);
	
	//register events
	$('saveuser').addEventListener('click', function(){
		localStorage.username = document.getElementById('username').value;
		localStorage.password = encrypt_password(encrypt_password(document.getElementById('username').value)+document.getElementById('password').value);
		localStorage.hashed = 'true';		
		$('password').value = '';
		$('savemessage').addClass('show');
		update();
	});
	
	$('autosynch').addEventListener('change', function(){
		localStorage.autosynch = this.checked ? 1 : 0;
		update();
	});
	
	$('synchnow').addEventListener('click', function(){
		chrome.extension.sendRequest({'type': 'reload'});
		$('synchnow').addClass('working');
		$('synchnow').removeClass('error');
	});
	
	chrome.extension.onRequest.addListener(function(request){
		if(request.type == 'error'){
			if($('synchnow').hasClass('working')){
				$('synchnow').removeClass('working');
				$('synchnow').addClass('error');
			}
		}else if(request.type == 'updated'){
			$('synchnow').removeClass('working');
		}
	});
	
	//helper functions
	function selectLoginType(){
		update();
	}

	function update(){
		chrome.extension.sendRequest({'type': 'updateoptions'});
	}
	
	var shortcutPopup = new ShortcutButtonLocalStorage('shortcutPopup', 'shortcutPopup').addEvent('changed', update);
	var shortcutBookmark = new ShortcutButtonLocalStorage('shortcutBookmark', 'shortcutBookmark').addEvent('changed', update);
	var shortcutReadLater = new ShortcutButtonLocalStorage('shortcutReadLater', 'shortcutReadLater').addEvent('changed', update)
});

var ShortcutButton = new Class({
	
	Implements: Events,
	
	initialize: function(el, shortcut){
		this.element = $(el);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.shortcut;
		this.setShortcut(shortcut);
		
		this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
		this.element.addEventListener('click', this.handleClick.bind(this));
		this.element.addEventListener('blur', this.handleBlur.bind(this));
	},
	
	setShortcut: function(shortcut){
		this.shortcut = shortcut;
		this.updateLabel();
		this.fireEvent('changed');
	},
	
	updateLabel: function(shortcut){
		var shortcut = shortcut || this.shortcut;
		this.element.value = !shortcut ? 'undefined' : [
			shortcut.altKey ? 'alt' : undefined, 
			shortcut.ctrlKey ? 'ctrl' : undefined, 
			shortcut.metaKey ? 'meta' : undefined, 
			shortcut.shiftKey ? 'shift' : undefined, 
			ShortcutButton.Keys[shortcut.keyCode] || String.fromCharCode(shortcut.keyCode).toLowerCase() || undefined
		].clean().join(' + ');
	},
	
	handleClick: function(){
		this.element.focus();
		this.element.value = 'press key';
	},
	
	handleBlur: function(){
		this.updateLabel();
	},
	
	handleKeyDown: function(event){
		event.preventDefault();
		
		if(event.keyCode == 27 || event.keyCode == 46){ //escape or delete
			this.clear();
			return;
		}
		
		var shortcut = {
			altKey: event.altKey,
			ctrlKey: event.ctrlKey,
			metaKey: event.metaKey,
			shiftKey: event.shiftKey,
			keyCode: event.keyCode
		};
		
		for(var i in shortcut){
			if(!shortcut[i])
				delete shortcut[i];
		}
		
		this.setShortcut(shortcut);
	},
	
	clear: function(){
		this.setShortcut(undefined);
	}
});

var ShortcutButtonLocalStorage = new Class({

	Extends: ShortcutButton,
	
	initialize: function(el, localStorageKey){
		this.parent(el, localStorage[localStorageKey] ? JSON.parse(localStorage[localStorageKey]) : {});
		this.localStorageKey = localStorageKey;
		this.addEvent('changed', this.handleChange.bind(this));
	},
	
	handleChange: function(){
		if(this.shortcut){
			localStorage[this.localStorageKey] = JSON.stringify(this.shortcut);
		}else{
			localStorage.removeItem(this.localStorageKey);
		}
	}
});

ShortcutButton.Keys = {
	13: 'enter',
	38: 'up',
	40: 'down',
	37: 'left',
	39: 'right',
	27: 'esc',
	32: 'space',
	8: 'backspace',
	9: 'tab',
	46: 'delete'
}