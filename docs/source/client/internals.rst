.. _client-internals:

Internals / behind the scenes
=============================

All sources of the JavaScript client library are located at
``omnibus/static/omnibus/src/``. If you want to change or add any feature be
sure to edit only those JavaScript files. The files are organized as
`AMD Modules` and will be packed into a single file using the build process.

Utils
-----

`utils` are located inside the source folder. Each file is a simple function to
help simplify the rest of the JavaScript code.

The ``extend()`` function is a simpler reimplementation of the
`jQuery extend() <http://api.jquery.com/jquery.extend/>`_ function. It's used to
simplify the `prototypal inheritance <http://javascript.crockford.com/prototypal.html>`_.
For example:

.. code-block:: javascript

    var Mother = function() {};
    var Child = function() {};

    // Child inherts Mother and gets some extra properties 'foo' and 'bar':
    extend(Child.prototype, Mother.prototype, {
        foo: 'baz',
        bar: function() {
            return this.foo();
        }
    });

The ``proxy()`` function is another reimplementation of the
`jQuery proxy() <http://api.jquery.com/jQuery.proxy/>`_ function. It's described
as a function which `"takes a function and returns a new one that will always
have a particular context"`. It's used to keep the current instance context and
not to use such code like ``var self = this;``.

.. code-block:: javascript

    extend(Child.prototype, Mother.prototype, {
        baz: 'foo bar baz',
        foo: function() { //without proxy()
            var self = this;
            window.setTimeout(function() {
                window.alert(self.baz);
            }, 1000);
        },
        bar; function() {
            window.setTimeout(proxy(
                function() {
                    window.alert(this.baz);
                },
                this
            ), 1000);
        }
    });

EventBus
--------

The EventBus implements the pubsub/observer pattern. The Connection_ and
Channel_ instances inherits from the EventBus. To add and remove handlers for a
certain `event name` use the ``on()`` and ``off()`` functions. To notify those
handlers the ``trigger()`` function is used.

Registration
````````````

All registered handlers are stored in an Array property of the ``_events``
property. To access all registered handlers for a certain ``eventName`` can be
done by ``this._events[eventName]``.

Wildcard handlers
`````````````````

To add a function which will be executed for all triggered events use the
``'*'`` String.

Event instances
```````````````

The executed functions are parametrized by an instance of the Event Class.
The instance contains 3 properties ``name``, ``data`` and ``sender``:

 * ``name`` is the event name which was triggered
 * ``data`` contains `optinal` extra data which is transported through the event.
 * ``sender`` is the reference to the instance which triggered the event.

Connection
----------

Channel reference storage
`````````````````````````

All references to previously opened channels using ``openChannel()`` are stored
using the dictionary object ``_channels``. Each channel can be accessed by their
``channelName`` via ``this._channels[channelName]``. Each name/channel
combination is handled as single instance. There won't be two different
instances of the same channel through the same connection. Only when a channel
was closed before, the reference form the ``_channels`` dictionary is removed
also.

The send queue
``````````````

The send queue allows the user of the JavaScript library simply to start sending
messages without taking care whether the connection is already established and
authenticated or not. They are able to open channels and send messages and don't
have to wait for events which allow further activities.

The send queue is represented by the ``_sendQueue`` property of a connection
instance. Its a simple Array which stores the messages which wasn't send, because
the connection is not connected to the remote or authenticated. When both
conditions are complied, the ``_flushQueue()`` function synchronously sends the
queued messages to the remote.

Channel
-------

Closing a Channel
`````````````````

To close a channel can be achieved in different ways. It can be called through
the channel instance using ``channel.close()`` or through the connection where
the channel was created with ``connection.closeChannel(channel)``.

When a channel is closed, its instance will be destroyed afterwards.

 #. When calling ``channel.close()`` the channel triggers the `"close"` event
 #. An unsubscribtion command will be send to the remote by the ``closeChannel()`` function
 #. The remote will answer
 #. The channel will fire the `"unsubscribed"` event
 #. The channel will be removed from the connection
 #. The channel will be detroyed and fires the `"destroy"` event

GruntJS Taskrunner
------------------

Configurations
``````````````

The GruntJS task configurations are not as usual stored in the ``Gruntfile.js``.
They are located in ``resources/grunt-configs/``. Each task is represented in a
single file with the tasks name. The `grunt-`prefix is not mentioned in the
filename for the reason that all tasks have the same prefix. For example the
configuration for the `"grunt-contrib-jshint"`-Task is located in
``resources/grunt-configs/contrib-jshint.js``.

Build a new release
```````````````````

To build a release we pack all `AMD Modules` into a single file. For this
workflow we use the `grunt-contrib-requirejs <https://github.com/gruntjs/grunt-contrib-requirejs>`_
task and hook into it, using the ``onBuildWrite`` and ``onModuleBundleComplete``
callbacks.

Inside the ``onBuildWrite`` we remove the typical ``define()`` and ``return``
statements which defines each single module. For example this sample ``Foo``
module looks without the ``onBuildWrite`` callback like this:

.. code-block:: javascript

    define('./Foo', [], function() {
        var Foo = function() {};
        Foo.prototype.bar = function() {
            window.alert('baz');
        }

        return Foo;
    });

The callback removes the statements which results in:

.. code-block:: javascript

    var Foo = function() {};
    Foo.prototype.bar = function() {
        window.alert('baz');
    };

In the ``onModuleBundleComplete`` we wrap some additonal code around our
output. To wrap the code we use a template located in
``/omnibus/static/omnibus/src/wrapper/wrapper.js.tpl``. It contains the code to
allow the library to use as `AMD Module`, as `CommonJS Module` or with plain
JavaScript.

This approach has some pitfalls. When using for example module ``Foo`` in another
module ``Bar``, then **it's important to use the same module names in both
files**. This example should show why:

Without the ``onBuildWrite`` task the output looks like this:

.. code-block:: javascript

    // The result from Foo.js:
    define('./Foo', [], function() {
        var Foo = function() {};
        Foo.prototype.bar = function() {
            window.alert('baz');
        };

        return Foo;
    });

    // The result from Bar.js:
    define('./Bar', ['./Foo'], function(Foo) {
        var Bar = function() {};
        Bar.prototype.go = function() {
            return new Foo();
        };

        return Bar;
    });

When removing the wrapped statements it results in:

.. code-block:: javascript

    // The result from Foo.js:
    var Foo = function() {};
    Foo.prototype.bar = function() {
        window.alert('baz');
    };

    // The result from Bar.js:
    var Bar = function() {};
    Bar.prototype.go = function() {
        return new Foo();
    }

As you can see, the ``Bar`` module needs the same name for the ``Foo`` reference
as the ``Foo`` module uses itself.
