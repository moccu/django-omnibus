var Sender = function(channel) {
	this._channel = channel;
	this._channel.on('listen', $.proxy(this._onListen, this));
	this._progress = $('<div class="progress" />').appendTo($('body'));
};

Sender.prototype.send = function(fileData, fileName) {
	this._fileData = fileData;
	this._fileName = fileName;
};

Sender.prototype._onListen = function(event) {
	this._send();
};

Sender.prototype._send = function() {
	var i = 0;
	var self = this;
	var size = 1024 * 10;
	var count = Math.ceil(this._fileData.length / size);
	var interval = setInterval(function() {
		if(i < count) {
			self._channel.send('send', {
				index: i,
				count: count,
				packet: self._fileData.substr(i * size, size),
				name: self._fileName
			});
			i++;
			self._updateProgress(self._fileName, i / count * 100)
		} else {
			clearInterval(interval);
			self._channel.send('done', {
				name: self._fileName
			});
			self._channel.close();
			self._removeProgress(self._fileName);
		}
	}, 1);
};

Sender.prototype._updateProgress = function(fileName, percentage) {
	percentage = Math.round(percentage);
	this._progress.css({
		width: percentage +'%'
	}).html('Sending "'+ fileName +'" @ '+ percentage +'%');
};

Sender.prototype._removeProgress = function(fileName) {
	var self = this;
	this._progress
		.html('Receiving "'+ fileName +'" @ 100%')
		.fadeOut(500, function() {
			self._progress.remove();
		});
};