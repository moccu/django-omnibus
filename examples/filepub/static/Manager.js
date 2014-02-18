var Manager = function(connection) {
	this._connection = connection;
	this._channel = this._connection.openChannel('files');
	this._channel.on('init', $.proxy(this._onInit, this));
};

Manager.prototype._onInit = function(event) {
	var name = event.data.payload.name;
	var channel = this._connection.openChannel(name);
	var receiver = new Receiver(channel);
};

Manager.prototype.send = function(file) {
	var self = this;
	var fileReader = new FileReader();
	fileReader.onload = function(event) {
		self._send(event.target.result, file.name);
	};
	fileReader.readAsDataURL(file);
};

Manager.prototype._send = function(fileData, fileName) {
	var self = this;
	var name = fileName.replace(/\W/g,'-') + (new Date()).getTime();
	var channel = this._connection.openChannel(name);

	channel.on(Omnibus.events.CHANNEL_SUBSCRIBED, function() {
		var sender = new Sender(channel);
		sender.send(fileData, fileName);
		self._channel.send('init', {name: name});
	});
};
