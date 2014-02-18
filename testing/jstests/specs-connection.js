/* global describe, expect, it, beforeEach, spyOn, waits, runs */

var dependencies = [
	'./factory',
	'../../omnibus/static/omnibus/src/Connection'
];

define(dependencies, function(getConnection, Connection) {
	describe('connection', function() {
		var connection;

		beforeEach(function() {
			connection = getConnection();
		});

		it('should throw an error when no transport is supplied.', function() {
			expect(function() {
				new Connection('http://fakedomain:1234');
			}).toThrow();
		});

		it('should create unique ids.', function() {
			var otherConnection = getConnection();
			expect(connection.getId())
				.not.toBe(otherConnection.getId());
		});

		it('should be connected and identified at remote.', function() {
			spyOn(connection, 'sendCommandMessage').andCallThrough();

			waits(connection._socket.timeout + 10);
			runs(function() {
				expect(connection.sendCommandMessage).toHaveBeenCalled();
				expect(connection.sendCommandMessage.calls[0].args[0]).toBe('authenticate');
				expect(connection.sendCommandMessage.calls[0].args[1]).toBe(connection.getId().toString());
				expect(connection.isConnected()).toBe(true);
				expect(connection.isAuthenticated()).toBe(true);
			});
		});

		it('should send an event when connected.', function() {
			var handlers = {onconnect: function() {}};
			spyOn(handlers, 'onconnect');
			connection.on(Connection.events.CONNECTION_CONNECTED, handlers.onconnect);

			waits(connection._socket.timeout + 10);
			runs(function() {
				expect(handlers.onconnect.calls.length).toBe(1);
				expect(handlers.onconnect.calls[0].args[0].name).toBe(Connection.events.CONNECTION_CONNECTED);
			});
		});

		it('should send an event when identified.', function() {
			var handlers = {onidentify: function() {}};
			spyOn(handlers, 'onidentify');
			connection.on(Connection.events.CONNECTION_AUTHENTICATED, handlers.onidentify);

			waits(connection._socket.timeout + 10);
			runs(function() {
				expect(handlers.onidentify.calls.length).toBe(1);
				expect(handlers.onidentify.calls[0].args[0].name).toBe(Connection.events.CONNECTION_AUTHENTICATED);
			});
		});

		it('should send an event when connection is closed by websocket.', function() {
			var handlers = {ondisconnect: function() {}};

			spyOn(handlers, 'ondisconnect');
			connection.on(Connection.events.CONNECTION_DISCONNECTED, handlers.ondisconnect);

			waits(connection._socket.timeout + 10);
			runs(function() {
				// Trigger close via socket...
				connection._socket.close();

				expect(handlers.ondisconnect.calls.length).toBe(1);
				expect(handlers.ondisconnect.calls[0].args[0].name).toBe(Connection.events.CONNECTION_DISCONNECTED);
				expect(connection.isConnected()).toBe(false);
				expect(connection.isAuthenticated()).toBe(false);
			});
		});

		it('should reconnect automatically when connection is closed.', function() {
			var
				handlers = {
					onconnect: function() {},
					onsubscribe: function() {},
					onunsubscribe: function() {}
				},
				channel
			;

			spyOn(handlers, 'onconnect');
			spyOn(handlers, 'onsubscribe');
			spyOn(handlers, 'onunsubscribe');
			connection.on(Connection.events.CONNECTION_CONNECTED, handlers.onconnect);
			channel = connection.openChannel('test');
			channel.on(Connection.events.CHANNEL_SUBSCRIBED, handlers.onsubscribe);
			channel.on(Connection.events.CHANNEL_UNSUBSCRIBED, handlers.onunsubscribe);

			waits(connection._socket.timeout + 10);
			runs(function() {
				// Test connection:
				expect(connection.isConnected()).toBe(true);
				expect(connection.isAuthenticated()).toBe(true);
				expect(handlers.onconnect.calls.length).toBe(1);
				expect(handlers.onconnect.calls[0].args[0].name).toBe(Connection.events.CONNECTION_CONNECTED);
				// Test channel:
				expect(handlers.onsubscribe.calls.length).toBe(1);
				expect(handlers.onsubscribe.calls[0].args[0].name).toBe(Connection.events.CHANNEL_SUBSCRIBED);

				// Trigger close via socket...
				connection._socket.close();

				// Test connection:
				expect(connection.isConnected()).toBe(false);
				expect(connection.isAuthenticated()).toBe(false);
				// Test channel:
				expect(handlers.onunsubscribe.calls.length).toBe(1);
				expect(handlers.onunsubscribe.calls[0].args[0].name).toBe(Connection.events.CHANNEL_UNSUBSCRIBED);
			});

			waits(connection._socket.timeout + Connection.defaults.autoReconnectTimeout + 10);
			runs(function() {
				// Test connection:
				expect(handlers.onconnect.calls.length).toBe(2);
				expect(handlers.onconnect.calls[1].args[0].name).toBe(Connection.events.CONNECTION_CONNECTED);
				expect(connection.isConnected()).toBe(true);
				expect(connection.isAuthenticated()).toBe(true);

				// Test channel:
				expect(handlers.onsubscribe.calls.length).toBe(2);
				expect(handlers.onsubscribe.calls[1].args[0].name).toBe(Connection.events.CHANNEL_SUBSCRIBED);
			});
		});

		it('should open a channel only once.', function() {
			var
				first = connection.openChannel('test'),
				second = connection.openChannel('test')
			;

			expect(typeof first).toBe('object');
			expect(first).toBe(second);
		});

		it('should throw an error when channelname is not a string.', function() {
			expect(function() {
				connection.openChannel(1);
			}).toThrow();

			expect(function() {
				connection.openChannel(true);
			}).toThrow();

			expect(function() {
				connection.openChannel({});
			}).toThrow();

			expect(function() {
				connection.openChannel([]);
			}).toThrow();

			expect(function() {
				connection.openChannel(undefined);
			}).toThrow();

			expect(function() {
				connection.openChannel(null);
			}).toThrow();
		});

		it('should throw an error when channelname contains invalid characters.', function() {
			expect(function() {
				connection.openChannel('hello:world');
			}).toThrow();
		});

		it('should return an registered channel or "undefined".', function() {
			var
				first = connection.openChannel('test'),
				second = connection.getChannel('test'),
				third = connection.getChannel('other')
			;

			expect(first).toBe(second);
			expect(typeof second).toBe('object');
			expect(third).toBe(undefined);
		});

		it('should close a registered channel.', function() {
			var
				first = connection.openChannel('test1'),
				second = connection.openChannel('test2'),
				third = connection.openChannel('test3'),
				fourth = connection.openChannel('test4'),
				handlers = {onconnect: function() {}}
			;

			spyOn(handlers, 'onconnect');

			// Test to destroy first and second channel before connection established:
			// Test preconditions:
			expect(connection.isConnected()).toBe(false);
			expect(connection.isAuthenticated()).toBe(false);
			expect(first.isSubscribed()).toBe(false);
			expect(second.isSubscribed()).toBe(false);

			waits(connection._socket.timeout + 10);
			runs(function() {
				// Test to destroy...
				expect(connection.closeChannel('test1')).toBe(true); // by string
				expect(connection.closeChannel(second)).toBe(true); // by reference

				// Test to destroy a second time which sould fail:
				expect(connection.closeChannel('test1')).toBe(false); // by string
				expect(connection.closeChannel(second)).toBe(false); // by reference
			});

			// Test to destroy third and fourth channel after connection established:
			waits(connection._socket.timeout + 10);
			runs(function() {
				// Test preconditions:
				expect(connection.isConnected()).toBe(true);
				expect(connection.isAuthenticated()).toBe(true);
				expect(third.isSubscribed()).toBe(true);
				expect(fourth.isSubscribed()).toBe(true);

				// Test to destroy...
				expect(connection.closeChannel('test3')).toBe(true); // by string
				expect(connection.closeChannel(fourth)).toBe(true); // by reference

				// Test to destroy a second time which sould fail:
				expect(connection.closeChannel('test3')).toBe(false); // by string
				expect(connection.closeChannel(fourth)).toBe(false); // by reference
			});
		});

		it('should throw an error when closing channel with incorrect parameters.', function() {
			expect(function() {
				connection.closeChannel(1);
			}).toThrow();

			expect(function() {
				connection.closeChannel(true);
			}).toThrow();

			expect(function() {
				connection.closeChannel({});
			}).toThrow();

			expect(function() {
				connection.closeChannel([]);
			}).toThrow();

			expect(function() {
				connection.closeChannel(undefined);
			}).toThrow();

			expect(function() {
				connection.closeChannel(null);
			}).toThrow();
		});
	});
});
