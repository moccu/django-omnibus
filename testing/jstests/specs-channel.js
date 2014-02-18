/* global describe, expect, it, beforeEach, spyOn, waits, runs */

var dependencies = [
	'./factory',
	'../../omnibus/static/omnibus/src/Channel',
	'../../omnibus/static/omnibus/src/Connection'
];

define(dependencies, function(getConnection, Channel, Connection) {
	describe('channel', function() {
		var
			connection,
			channel
		;

		beforeEach(function() {
			connection = getConnection();
			channel = connection.openChannel('test');
		});

		it('should have the correct name.', function() {

			expect(function() {
				connection.openChannel(':foo');
			}).toThrow();

			expect(function() {
				connection.openChannel('foo:');
			}).toThrow();

			expect(function() {
				connection.openChannel('foo:bar');
			}).toThrow();

			expect(function() {
				connection.openChannel('!bar');
			}).toThrow();

			expect(function() {
				connection.openChannel('bar!');
			}).toThrow();

			expect(function() {
				connection.openChannel('foo!bar');
			}).toThrow();
		});

		it('should be subscribed at remote.', function() {
			var handlers = {
				onconnect: function() {},
				onsubscribed: function() {}
			};

			spyOn(handlers, 'onconnect');
			spyOn(handlers, 'onsubscribed');

			connection.on(Connection.events.CONNECTION_CONNECTED, handlers.onconnect);
			channel.on(Connection.events.CHANNEL_SUBSCRIBED, handlers.onsubscribed);

			waits(connection._socket.timeout + 10);
			runs(function() {
				expect(handlers.onconnect.calls.length).toBe(1);
				expect(handlers.onsubscribed.calls.length).toBe(1);
				expect(handlers.onsubscribed.calls[0].args[0].name).toBe(Connection.events.CHANNEL_SUBSCRIBED);
			});
		});

		it('should not be subscribed when user has no privileges.', function() {
			var
				handlers = {onsubscribed: function() {}},
				second = connection.openChannel('no-privileges')
			;

			spyOn(handlers, 'onsubscribed');
			second.on(Connection.events.CHANNEL_SUBSCRIBED, handlers.onsubscribed);

			waits(connection._socket.timeout + 10);
			runs(function() {
				expect(handlers.onsubscribed.calls.length).toBe(0);
			});
		});

		it('should destroy completely.', function() {
			waits(connection._socket.timeout + 10);
			runs(function() {
				expect(channel.isSubscribed()).toBe(true);
				expect(channel._destroy()).toBe(true);
				expect(channel.isSubscribed()).toBe(false);

				// destroy at a second time should return false:
				expect(channel._destroy()).toBe(false);
			});
		});

		it('should trigger event when destroyed.', function() {
			var handlers = {ondestroy: function() {}};

			spyOn(handlers, 'ondestroy');
			channel.on(Connection.events.CHANNEL_DESTROY, handlers.ondestroy);

			waits(connection._socket.timeout + 10);
			runs(function() {
				channel._destroy();
				expect(handlers.ondestroy.calls.length).toBe(1);
				expect(handlers.ondestroy.calls[0].args[0].sender).toBe(channel);
				expect(handlers.ondestroy.calls[0].args[0].name).toBe(Connection.events.CHANNEL_DESTROY);

				channel._destroy();
				expect(handlers.ondestroy.calls.length).toBe(1);
			});
		});

		it('should trigger events when closed.',  function() {
			var handlers = {
				onclose: function() {},
				onunsubscribe: function() {},
				ondestroy: function() {},
			};

			spyOn(handlers, 'onclose');
			spyOn(handlers, 'onunsubscribe');
			spyOn(handlers, 'ondestroy');

			channel.on(Connection.events.CHANNEL_CLOSE, handlers.onclose);
			channel.on(Connection.events.CHANNEL_UNSUBSCRIBED, handlers.onunsubscribe);
			channel.on(Connection.events.CHANNEL_DESTROY, handlers.ondestroy);

			waits(connection._socket.timeout + 10);
			runs(function() {
				channel.close();

				expect(handlers.onclose.calls.length).toBe(1);
				expect(handlers.onclose.calls[0].args[0].sender).toBe(channel);
				expect(handlers.onclose.calls[0].args[0].name).toBe(Connection.events.CHANNEL_CLOSE);

				expect(handlers.onunsubscribe.calls.length).toBe(1);
				expect(handlers.onunsubscribe.calls[0].args[0].sender).toBe(channel);
				expect(handlers.onunsubscribe.calls[0].args[0].name).toBe(Connection.events.CHANNEL_UNSUBSCRIBED);

				expect(handlers.ondestroy.calls.length).toBe(1);
				expect(handlers.ondestroy.calls[0].args[0].sender).toBe(channel);
				expect(handlers.ondestroy.calls[0].args[0].name).toBe(Connection.events.CHANNEL_DESTROY);

				channel._destroy();
				expect(handlers.ondestroy.calls.length).toBe(1);
			});
		});

		it('should send and receive events.', function() {
			var	handlers = {onresponse: function() {}};

			spyOn(handlers, 'onresponse');
			channel.on('test-response', handlers.onresponse);

			waits(connection._socket.timeout + 10);
			runs(function() {
				channel.send('test', {message: 'test message'});
				expect(handlers.onresponse.calls.length).toBe(1);
				expect(handlers.onresponse.calls[0].args[0].name).toBe('test-response');
				expect(handlers.onresponse.calls[0].args[0].sender).toBe(channel);
				expect(handlers.onresponse.calls[0].args[0].data.type).toBe('test-response');
				expect(handlers.onresponse.calls[0].args[0].data.payload.message).toBe('test message');

				// ToDo: Test other types of event data such as String and Boolean
				// which is send through the channel...
			});
		});
	});
});
