/* global describe, expect, it, beforeEach, spyOn */

var dependencies = [
	'../../omnibus/static/omnibus/src/EventBus'
];

define(dependencies, function(EventBus) {
	describe('eventbus', function() {
		var
			eventbus,
			handlers = {
				handlerA: function() {},
				handlerB: function() {},
				handlerC: function() {}
			}
		;

		beforeEach(function() {
			spyOn(handlers, 'handlerA');
			spyOn(handlers, 'handlerB');
			spyOn(handlers, 'handlerC');

			eventbus = new EventBus();
			eventbus
				.on('eventA', handlers.handlerA)
				.on('eventA', handlers.handlerB)
				.on('eventB', handlers.handlerB);
		});

		function trigger() {
			eventbus
				.trigger('eventA', {foo: 'bar'})
				.trigger('eventB');
		}

		it('should send events.', function() {
			trigger();
			expect(handlers.handlerA.calls.length).toBe(1);
			expect(handlers.handlerB.calls.length).toBe(2);
			expect(handlers.handlerC.calls.length).toBe(0);
		});

		it('should have a sender.', function() {
			trigger();
			expect(handlers.handlerA.calls[0].args[0].sender).toBe(eventbus);
			expect(handlers.handlerB.calls[0].args[0].sender).toBe(eventbus);
			expect(handlers.handlerB.calls[1].args[0].sender).toBe(eventbus);
		});

		it('should have a event name.', function() {
			trigger();
			expect(handlers.handlerA.calls[0].args[0].name).toBe('eventA');
			expect(handlers.handlerB.calls[0].args[0].name).toBe('eventA');
			expect(handlers.handlerB.calls[1].args[0].name).toBe('eventB');
		});

		it('should have event data.', function() {
			trigger();
			expect(handlers.handlerA.calls[0].args[0].data.foo).toBe('bar');
			expect(handlers.handlerB.calls[0].args[0].data.foo).toBe('bar');
			expect(handlers.handlerB.calls[1].args[0].data).toBe(undefined);
		});

		it('should support wildcard events.', function() {
			eventbus.on('*', handlers.handlerC);
			trigger();
			expect(handlers.handlerC.calls[0].args[0].name).toBe('eventA');
			expect(handlers.handlerC.calls[1].args[0].name).toBe('eventB');
		});

		it('should not trigger wildcard events twice.', function() {
			eventbus.on('*', handlers.handlerC);
			eventbus.trigger('*');
			expect(handlers.handlerC.calls.length).toBe(1);
		});

		it('should remove a single handlers.', function() {
			eventbus.off('eventB', handlers.handlerB);
			trigger();
			expect(handlers.handlerB.calls.length).toBe(1);

			eventbus.off('eventA', handlers.handlerB);
			trigger();
			expect(handlers.handlerB.calls.length).toBe(1);
		});

		it('should remove all registered handlers.', function() {
			eventbus.off();
			trigger();
			expect(handlers.handlerA).not.toHaveBeenCalled();
			expect(handlers.handlerB).not.toHaveBeenCalled();
			expect(handlers.handlerC).not.toHaveBeenCalled();
		});
	});
});
