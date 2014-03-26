# django-omnibus

Django/JavaScript WebSocket Connections.

[![Coverage Status](https://coveralls.io/repos/moccu/django-omnibus/badge.png)](https://coveralls.io/r/moccu/django-omnibus)
[![Travis Status](https://travis-ci.org/moccu/django-omnibus.png?branch=master)](https://travis-ci.org/moccu/django-omnibus)

## What is django-omnibus

*django-omnibus* is a Django library which helps to create websocket-based
connections between a browser and a server to deliver messages.

Some use cases could be:

* Chat systems
* Realtime stream updates
* Inter-browser communication
* file transfers
* and so on..

*django-omnibus* is quite extensible. The connection handler, the
Tornado web application and the authenticator can be replaced by just changing
the setting.

For browser compatibility *django-omnibus* also supports
[SockJS](https://github.com/sockjs/sockjs-client) (which provides fallbacks for
older browsers).

On the client side, django-omnibus provides a library which handles
the connection, authentication and channel subscription (multiple channels can
be subscribed using one connection).

## Installation & Documentation

All documentation is in the "docs/source" directory and online at
[Read the Docs](https://django-omnibus.readthedocs.org/).

## License
*django-omnibus* is licenced under the [BSD License](LICENSE.md).
