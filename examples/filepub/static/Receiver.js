var Receiver = function(channel) {
	this._channel = channel;
	this._channel.on(Omnibus.events.CHANNEL_SUBSCRIBED, $.proxy(this._onSubscribe, this));
	this._progress = $('<div class="progress" />').appendTo($('body'));
};

Receiver.prototype._onSubscribe = function(event) {
	this._data = [];
	this._channel
		.on('send', $.proxy(this._onReceive, this))
		.on('done', $.proxy(this._onDone, this))
		.send('listen');
};

Receiver.prototype._onReceive = function(event) {
	var index = event.data.payload.index;
	var packet = event.data.payload.packet;
	var fileName = event.data.payload.name || 'file';
	var count = event.data.payload.count;
	this._data[index] = packet;
	this._updateProgress(fileName, index / count * 100);
};

Receiver.prototype._onDone = function(event) {
	var data = this._data.join('');
	var blob = this._decodeToBlob(data);
	this._saveAsFile(blob);
	this._removeProgress(event.data.payload.name);
	this._channel.close();
};

Receiver.prototype._decodeToBlob = function(dataURI) {
	// convert base64 to raw binary data held in a string
	// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
	var byteString = atob(dataURI.split(',')[1]);

	// separate out the mime component
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

	// write the bytes of the string to an ArrayBuffer
	var ab = new ArrayBuffer(byteString.length);
	var ia = new Uint8Array(ab);
	for (var i = 0; i < byteString.length; i++) {
	  ia[i] = byteString.charCodeAt(i);
	}

	// write the ArrayBuffer to a blob, and you're done
	return new Blob([ab], {type: mimeString});
};

Receiver.prototype._saveAsFile = function(blob) {
	var link = document.createElement('a');
	link.href = window.webkitURL.createObjectURL(blob);
	link.download = 'download';
	link.click();
};

Receiver.prototype._updateProgress = function(fileName, percentage) {
	percentage = Math.round(percentage);
	this._progress.css({
		width: percentage +'%'
	}).html('Receiving "'+ fileName +'" @ '+ percentage +'%');
};

Receiver.prototype._removeProgress = function(fileName) {
	var self = this;
	this._progress
		.html('Receiving "'+ fileName +'" @ 100%')
		.fadeOut(500, function() {
			self._progress.remove();
		});
};