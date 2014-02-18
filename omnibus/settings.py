from django.conf import settings


ENDPOINT_SCHEME = getattr(settings, 'OMNIBUS_ENDPOINT_SCHEME', 'ws')

SERVER_HOST = getattr(settings, 'OMNIBUS_SERVER_HOST', None)
SERVER_PORT = getattr(settings, 'OMNIBUS_SERVER_PORT', 4242)
SERVER_BASE_URL = getattr(settings, 'OMNIBUS_SERVER_BASE_URL', '/ec')

DIRECTOR_ENABLED = getattr(settings, 'OMNIBUS_DIRECTOR_ENABLED', True)
FORWARDER_ENABLED = getattr(settings, 'OMNIBUS_FORWARDER_ENABLED', False)

SUBSCRIBER_ADDRESS = getattr(
    settings, 'OMNIBUS_SUBSCRIBER_ADDRESS', 'tcp://127.0.0.1:4243')
PUBLISHER_ADDRESS = getattr(
    settings, 'OMNIBUS_PUBLISHER_ADDRESS', 'tcp://127.0.0.1:4244')

DIRECTOR_SUBSCRIBER_ADDRESS = getattr(
    settings, 'OMNIBUS_DIRECTOR_SUBSCRIBER_ADDRESS', None)
DIRECTOR_PUBLISHER_ADDRESS = getattr(
    settings, 'OMNIBUS_DIRECTOR_PUBLISHER_ADDRESS', None)

AUTHENTICATOR_FACTORY = getattr(
    settings,
    'OMNIBUS_AUTHENTICATOR_FACTORY',
    'omnibus.factories.noopauthenticator_factory'
)
WEBAPP_FACTORY = getattr(
    settings,
    'OMNIBUS_WEBAPP_FACTORY',
    'omnibus.factories.websocket_webapp_factory'
)
CONNECTION_FACTORY = getattr(
    settings,
    'OMNIBUS_CONNECTION_FACTORY',
    'omnibus.factories.websocket_connection_factory'
)
