var Delicious = new Class({
	
	//Implements: Events,
	
	initialize: function(user, autosynch){
		this.user = user;
		this.autosynch = Boolean(parseInt(localStorage.autosynch) || 0);
		this.lastUpdate = null;
		
		this.isWorking = false;
		this.autoUpdateInterval = 900000; //Update Every 15 minutes
		
		this.posts = [];
		this.tags = [];
		
		this.updateIn(this.autoUpdateInterval);
	},
	
	isLoggedIn: function(){
		return this.user.isLoggedIn();
	},
	
	getURL: function(url, parameters){
		return this.user.getURL(url, parameters);
	},
	
	onComplete: function(){
		this.isWorking = false;
	},
	
	cancel: function(){
		if(this.currentRequest && this.currentRequest.running)
			this.currentRequest.cancel();
		this.currentRequest = null;
	},
	
	updateIn: function(time){
		$clear(this.autoUpdateID);
		this.autoUpdateID = this.autoUpdate.delay(time, this);
	},
	
	autoUpdate: function(){
		if(this.autosynch){
			this.update();
		}
		this.updateIn(this.autoUpdateInterval);
	},
	
	update: function(){
		if(this.isWorking || !this.autosynch)
			return this;
		
		//console.log('update');
		this.cancel();
		this.isWorking = true;
		var self = this;
		
		this.currentRequest = new Request({
			method: 'get',
			url: this.getURL('posts/update'),
			onSuccess: function(responseText, responseXML){
				if (responseXML.getElementsByTagName('update')[0].getAttribute('time')) {
					var time = responseXML.getElementsByTagName('update')[0].getAttribute('time');
				} else {
					var time = null;
				}
				if(time > (localStorage['lastUpdate'] || '')){
					self.load();
				}else{
					//console.log('no update');
					//self.fireEvent('noupdate');
					chrome.extension.sendRequest({'type': 'noupdate'});
					self.onComplete();
				}
				
			},
			onFailure: function(){
				//console.log('posts/update failed');
				//self.fireEvent('error');
				chrome.extension.sendRequest({'type': 'error'});
				self.onComplete();
			}
		}).send();
		
		return this;
	},
	
	load: function(){
		this.cancel();
		
		//console.log('load');
		this.isWorking = true;
		var self = this;
		
		this.currentRequest = new Request({
			method: 'get', 
			url: this.getURL('posts/all'),
			onSuccess: function(responseText, responseXML){
				var postsXML = responseXML.getElementsByTagName('post');
				var a = [];
				var tagIndex = {};
				var tags = [];
				
				for (var i = 0; i < postsXML.length; i++) {
					var postTags = postsXML[i].getAttribute('tag').split(' ');
					
					a.push({
						title: postsXML[i].getAttribute('description'),
						url: postsXML[i].getAttribute('href'),
						time: postsXML[i].getAttribute('time'),
						tags: postTags,
						hash: postsXML[i].getAttribute('hash'),
						notes: postsXML[i].getAttribute('extended'),
						shared: postsXML[i].getAttribute('shared')
					});
					
					postTags.each(function(item){
						tagIndex[item] = (tagIndex[item] || 0) + 1;
					});
				}
				
				$each(tagIndex, function(item, key){
					tags.push({name: key, count: item});
				});
				
				localStorage['posts'] = JSON.encode(a);
				localStorage['tags'] = JSON.encode(tags);
				localStorage['lastUpdate'] = formatDate(new Date());
				
				self.tags = tags;
				self.posts = a;
				self.onComplete();
				//self.fireEvent('update');
				chrome.extension.sendRequest({'type': 'updated'});
			},
			
			onFailure: function(xhr){
				//console.log('posts/all failed');
				//self.fireEvent('error');
				chrome.extension.sendRequest({'type': 'error'});
				self.onComplete();
			}
		}).send();
		
		return this;
	}
});

function formatDate(d){
	var pad = function(s){
		return ('' + s).length < 2 ? '0' + s : '' + s;
	}
	return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
}

var DeliciousUser = new Class({
	initialize: function(username, password){
		this.type = 'delicious';
		this.username = username;
		this.password = password;
	},
	
	getURL: function(url, parameters){
		return 'https://' + this.username + ':' + this.password + '@api.pinboard.in/v1/' + url;
	},
	
	isLoggedIn: function(){
		return this.username && this.password;
	},
	
	compare: function(user){
		return this.type == user.type && this.username == user.username && this.password == user.password;
	}
});

function getUser(){
	var username = localStorage.username;
	var password = decrypt_password(localStorage.password).replace(encrypt_password(localStorage.username),'');
	return new DeliciousUser(username, password);
}

function bookmarkURL(options,force){
	if (localStorage.keyboardshort == 1 || force == 1) {
		chrome.windows.getCurrent(function(w) {
		    chrome.tabs.getSelected(w.id,
		    function (response){
		
				if(response.title){
					url = 'http://pinboard.in/add?url=' + response.url + '&title=' + response.title;
				}else{
					url = 'http://pinboard.in/add?url=' + response.url;
				}
				url += '&v=5&noui=1&jump=doclose';
	
				//console.log(options);
				options = options || {};
				options.url = url;
				options.type = 'popup';
				options.left = options.left || undefined;
				options.top = options.top || undefined;
				options.width = options.width || 700;
				options.height = options.height || 350;
	
				chrome.windows.create(options);
			
			});
		});
	}
}
function openPopup(options){
	if (localStorage.keyboardshort == 1) {
		chrome.windows.getCurrent(function(win){
			options = options || {};
			options.url = chrome.extension.getURL('popup.html#popup');
			options.type = 'popup';
		
			options.left = options.left ||  win.left + win.width - 350;
			options.top = options.top || win.top + 50;
			options.width = options.width || 300;
			options.height = options.height || 475;
		
			chrome.windows.create(options);
		});
	}
}
function readLater(){
	if (localStorage.keyboardshort == 1) {
		chrome.windows.getCurrent(function(w) {
		    chrome.tabs.getSelected(w.id,
		    function (response){
				q=response.url;
				p=response.title;
				void(t=open('http://pinboard.in/add?later=yes&noui=yes&jump=close&url='+encodeURIComponent(q)+'&title='+encodeURIComponent(p),'Pinboard','toolbar=no,width=100,height=100'));t.blur();
		    });
		});
	}
}

var delicious;
var shortcutPopup = localStorage['shortcutPopup'] ? JSON.parse(localStorage['shortcutPopup']) : {};
var shortcutBookmark = localStorage['shortcutBookmark'] ? JSON.parse(localStorage['shortcutBookmark']) : {};
var shortcutReadLater = localStorage['shortcutReadLater'] ? JSON.parse(localStorage['shortcutReadLater']) : {};

document.addEvent('domready', function(){
	
	delicious = new Delicious(getUser(), localStorage.autosynch);
	delicious.posts = JSON.decode(localStorage.posts) || [];
	delicious.tags = JSON.decode(localStorage.tags) || [];
	delicious.update();
	
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
		if(request.type == 'update'){
			delicious.update();
		
		}else if(request.type == 'reload'){
			delicious.load();
		
		}else if(request.type == 'updateoptions'){
			delicious.cancel();
			
			var user = getUser();
			if(!user.compare(delicious.user)){
				delicious.user = user;
				localStorage.lastUpdate = ''; //reset last update time if user changed
			}
			
			shortcutPopup = localStorage.shortcutPopup ? JSON.parse(localStorage.shortcutPopup) : {};
			shortcutBookmark = localStorage.shortcutBookmark ? JSON.parse(localStorage.shortcutBookmark) : {};
			
			delicious.autosynch = Boolean(parseInt(localStorage.autosynch) || 0);
			delicious.updateIn(10000); //Update Bookmarks 10 seconds after options changed
			//console.log('options updated');
		}else if(request.type == 'popup'){
			openPopup();			
		}else if(request.type == 'bookmark'){
			bookmarkURL({},1);
			
		}else if(request.type == 'readlater'){
			readLater();
			
		}else if(request.type == 'shortcut'){
			if(compare(shortcutPopup, request.keyCombination)){
				openPopup({
					'left': Math.min(window.screen.width - 320, Math.max(0, request.window.x + request.window.width - 370)), 
					'top': request.window.y + 50, 
					'width': 300, 
					'height': 475
				});
			}else if(compare(shortcutBookmark, request.keyCombination)){
				bookmarkURL({
					'left': Math.round(Math.max(0, Math.min(window.screen.width - 550, request.window.x + request.window.width * .5 - 225))),
					'top': Math.round(Math.max(0, Math.min(window.screen.height - 550, request.window.y + request.window.height * .5 - 255))),
					'width': 700,
					'height': 350
				});
			}else if(compare(shortcutReadLater, request.keyCombination)){
				readLater();
			}
		
		}else if(request.type == 'getShortcut'){
			if(compare(shortcutPopup, request.keyCombination)){
				sendResponse('popup');
			}else if(compare(shortcutBookmark, request.keyCombination)){
				sendResponse('bookmark');
			}else if(compare(shortcutReadLater, request.keyCombination)){
				sendResponse('readlater');
			}
		}    
	});      
});

if (localStorage['hashed']==false||localStorage['hashed']==null||localStorage['hashed']==undefined||localStorage['hashed']!='true') {
	localStorage.password = encrypt_password(encrypt_password(localStorage.username)+localStorage.password);
	localStorage.hashed = true;
}
if (localStorage['keyboardshort']!=0&&localStorage['keyboardshort']!=1) {
	localStorage.keyboardshort = 1;
}