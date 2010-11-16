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
	var key = hexToByteArray('**enter your private hexadecimal key here**');
	var salt = '**enter your salt here**';
	var ciphertext = byteArrayToHex(rijndaelEncrypt(plaintext+salt,key,'ECB'));
	return ciphertext;
}

function decrypt_password(ciphertext){
	var key = hexToByteArray('**enter your private hexadecimal key here**');
	var salt = '**enter your salt here**';
	var plaintext = byteArrayToString(rijndaelDecrypt(hexToByteArray(ciphertext),key,'ECB'));
	plaintext = plaintext.replace(salt,'')
	return plaintext;
}