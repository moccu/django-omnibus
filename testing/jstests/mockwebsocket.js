var dependencies = [
	'../../omnibus/static/omnibus/src/Constants'
];

define(dependencies,function(Constants) {
	var MockWebSocket = function() {
		var self = this;
		setTimeout(function() {
			if (typeof self.onopen === 'function') {
				self.onopen();
			}
		}, this.timeout);
	};

	// Default Eventhandlers:
	MockWebSocket.prototype.onopen = null;
	MockWebSocket.prototype.onclose = null;
	MockWebSocket.prototype.onmessage = null;
	MockWebSocket.prototype.timeout = 100;

	MockWebSocket.prototype.send = function(data) {
		if (typeof this.onmessage === 'function' && typeof data === 'string') {
			var
				delimiter = data.indexOf(Constants.DELIMITER),
				channel = data.substring(0, delimiter),
				message = data.substring(delimiter + 1)
			;

			if (channel.indexOf(Constants.INDICATOR) === 0) {
				this._handleCommandResponse(channel, message);
			} else {
				this._handleEventResponse(channel, message);
			}
		}
	};

	MockWebSocket.prototype._handleCommandResponse = function(name, message) {
		switch (name) {
			case Constants.INDICATOR + Constants.AUTHENTICATE:
				this._handleCommandIdentifyResponse();
				break;
			case Constants.INDICATOR + Constants.SUBSCRIBE:
				this._handleCommandSubscribeResponse(message);
				break;
			case Constants.INDICATOR + Constants.UNSUBSCRIBE:
				this._handleCommandUnsubscribeResponse(message);
				break;
		}
	};


	MockWebSocket.prototype._handleCommandIdentifyResponse = function() {
		this.onmessage({
			data: Constants.INDICATOR + Constants.AUTHENTICATE + Constants.DELIMITER + JSON.stringify({
				type: Constants.AUTHENTICATE,
				success: true
			})
		});
	};

	MockWebSocket.prototype._handleCommandSubscribeResponse = function(channel) {
		this.onmessage({
			data: Constants.INDICATOR + Constants.SUBSCRIBE + Constants.DELIMITER + JSON.stringify({
				type: Constants.SUBSCRIBE,
				success: (channel !== 'no-privileges'),
				payload: {
					channel: channel
				}
			})
		});
	};

	MockWebSocket.prototype._handleCommandUnsubscribeResponse = function(channel) {
		this.onmessage({
			data: Constants.INDICATOR + Constants.UNSUBSCRIBE + Constants.DELIMITER + JSON.stringify({
				type: Constants.UNSUBSCRIBE,
				success: true,
				payload: {
					channel: channel
				}
			})
		});
	};

	MockWebSocket.prototype._handleEventResponse = function(channel, message) {
		var data = JSON.parse(message);
		this.onmessage({
			data: channel + Constants.DELIMITER + JSON.stringify({
				type: data.type + '-response',
				sender: undefined,
				payload: data.payload
			})
		});
	};

	MockWebSocket.prototype.close = function() {
		if (typeof this.onclose === 'function') {
			this.onclose();
		}
	};

	// Just return a value to define the module export.
	return MockWebSocket;
});
