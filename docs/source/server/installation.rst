.. _server-installation:

Installation
============

Quickstart
----------

To install `django-omnibus` just use your preferred Python package installer::

    pip install django-omnibus

Add ``omnibus`` to your Django settings

.. code-block:: python

    INSTALLED_APPS = (
        # other apps
        'omnibus',
    )

Add the context processor to your Django settings

.. code-block:: python

    TEMPLATE_CONTEXT_PROCESSORS = (
        # other context processors
        'omnibus.context_processors.omnibus',
    )

This enables `django-omnibus` with normal websocket support.

.. hint::

    The context processor adds the two variables ``OMNIBUS_ENDPOINT`` and
    ``OMNIBUS_AUTH_TOKEN`` to the template context. You can use these variables
    to configure the JS library.

Using SockJS
------------

To use SockJS as the underlying transport layer, you have to change some bits.

Install `tornado-sockjs` using your preffered Python package installer::

    pip install sockjs-tornado

Change the following configurations in your Django settings:

.. code-block:: python

    OMNIBUS_ENDPOINT_SCHEME = 'http'  # 'ws' is used for websocket connections
    OMNIBUS_WEBAPP_FACTORY = 'omnibus.factories.sockjs_webapp_factory'
    OMNIBUS_CONNECTION_FACTORY = 'omnibus.factories.sockjs_connection_factory'
