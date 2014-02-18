django-omnibus documentation
============================

Django/JavaScript WebSocket Connections.

What is django-omnibus
----------------------

`django-omnibus` is a Django library which helps to create websocket-based
connections between a browser and a server to deliver messages.

Some use cases could be:
 * Chat systems
 * Real-time stream updates
 * Inter-browser communication
 * file transfers
 * and so on..

`django-omnibus` is quite extensible. The connection handler, the
Tornado web application and the authenticator can be replaced by just changing
the settings. See :ref:`server-extension` for more detailed information.

For browser compatibility `django-omnibus` also supports SockJS (which
provides fallbacks for older browsers).

On the client side, django-omnibus provides a library which handles
the connection, authentication and channel subscription (multiple channels can
be subscribed using one connection).

Contents
--------

.. toctree::

   server/index
   client/index
   contribution

Indices and tables
==================

* :ref:`genindex`
* :ref:`search`
