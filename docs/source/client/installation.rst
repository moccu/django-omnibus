.. _client-installation:

Installation and integration
============================

Quickstart
----------

The JavaScript client implementation is shipped with the django module. After
you've installed the ``django-omnibus`` according the documentation_
you are able to insert the script as followed

.. code-block:: html

    {% load static %}
    <script type="text/javascript" src="{% static 'omnibus/omnibus.min.js' %}"></script>

All JavaScript sources are available as non-minified or minified version.
The minified scripts uses ``.min.js`` as extension.

``django-omnibus`` gives you the possibility to use them as an AMD_
module to use with RequireJS_ or as CommonJS_-like environments that support
``module.exports`` such as browserify_.

.. _documentation: _server-installation
.. _AMD: https://github.com/amdjs/amdjs-api/wiki/AMD
.. _CommonJS: http://www.commonjs.org
.. _RequireJS: http://requirejs.org
.. _Browserify: http://browserify.org

Dependencies
------------

The client library is *dependency free*. When you want to support older Browsers
which don't support WebSockets_ and/or JSON_ by default, embed the following
libraries. These are also shipped with the `django-omnibus` module:

.. _WebSockets: http://caniuse.com/#search=Web%20Sockets
.. _JSON: http://caniuse.com/#search=JSON

SockJS
``````

SockJS can be used as alternative transport implementation. It delivers the
same API as the browsers standart Web Websockets.

.. code-block:: html

    <script type="text/javascript" src="{% static 'omnibus/sockjs.min.js' %}"></script>

or get the latest version from `SockJS via GitHub <https://github.com/sockjs/sockjs-client>`_

JSON2
`````

JSON2 implements the functions ``JSON.parse`` and ``JSON.stringify`` for
browsers without the standard JSON API.

.. code-block:: html

    <script type="text/javascript" src="{% static 'omnibus/json2.min.js' %}"></script>

or get the latest version from `JSON2 via GitHub <https://github.com/douglascrockford/JSON-js>`_

Setup
-----

After inserting the ``django-omnibus`` JavaScript library as described
above, you can follow these steps to setup a connection

.. code-block:: javascript

    // Select a transport implementation:
    var transport = WebSocket; // SockJS can be used alternatively

    // Receive the path for the connection from the django template context:
    var endpoint = '{{ OMNIBUS_ENDPOINT }}';

    // Define connection options:
    var options = {
        // Get the omnibus authentication token:
        authToken: '{{ OMNIBUS_AUTH_TOKEN }}'
    };

    // Create a new connection using transport, endpoint and options
    var connection = new Omnibus(transport, endpoint, options);

After you've created an instance, it will automatically open a connection and
identify itself through them. For more informations about the connection
instance visit the :ref:`usage <client-usage>` site.

The communication between client and server takes place through a channel. You
can easily open a channel instance and send a *ping* using the following lines
of code

.. code-block:: javascript

    var channel = connection.openChannel('ping-channel');
    channel.send('ping-event', {
        message: 'hello world'
    });

For more information about the use of a channel instance take a look at the
:ref:`usage <client-usage>` site or visit the examples.
