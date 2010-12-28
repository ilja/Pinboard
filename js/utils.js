function compare(obj1, obj2){
	var keys = {};
	var i;
	
	for(i in obj1)
		keys[i] = undefined;
	for(i in obj2)
		keys[i] = undefined;
	
	for(i in keys){
		if(obj1[i] != obj2[i])
			return false;
	}
	return true;
}

function getKeyCombination(event){
	var keyCombination = {
		altKey: event.altKey,
		ctrlKey: event.ctrlKey,
		metaKey: event.metaKey,
		shiftKey: event.shiftKey,
		keyCode: event.keyCode
	};
	
	for(var i in keyCombination){
		if(!keyCombination[i]){
			delete keyCombination[i];
		}
	}
	
	return keyCombination;
}

function encrypt_password(plaintext){
	var key = hexToByteArray('5b235e7539234932715b78487243553a');
	var salt = 'b250b081a55b11054c0b4ec3873aba31';
	var ciphertext = byteArrayToHex(rijndaelEncrypt(plaintext+salt,key,'ECB'));
	return ciphertext;
}

function decrypt_password(ciphertext){
	var key = hexToByteArray('5b235e7539234932715b78487243553a');
	var salt = 'b250b081a55b11054c0b4ec3873aba31';
	var plaintext = byteArrayToString(rijndaelDecrypt(hexToByteArray(ciphertext),key,'ECB'));
	plaintext = plaintext.replace(salt,'');
	return plaintext;
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.method == "getSelection") {
		sendResponse({text: window.getSelection().toString()});
	}
});
