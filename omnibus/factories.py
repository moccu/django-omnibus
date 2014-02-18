from tornado import web

from .connection import MessageConnection
from .settings import SERVER_BASE_URL


def noopauthenticator_factory():
    """
    `noopauthenticator_factory` returns the Authenticator class with no checks.
    Should not be used in production!
    """
    from .authenticators import NoOpAuthenticator
    return NoOpAuthenticator


def userauthenticator_factory():
    """
    `userauthenticator_factory` returns a Authenticator class which verifies
    that the connections belongs to a registered user.
    """
    from .authenticators import UserAuthenticator
    return UserAuthenticator


def websocket_connection_factory(auth_class, pubsub_instance):
    """
    `websocket_connection_factory` returns a generated MessageConnection class
    with the provided pubsub instance and authenticator class.
    """
    from tornado.websocket import WebSocketHandler

    class GeneratedMessageConnection(MessageConnection, WebSocketHandler):
        authenticator_class = auth_class
        pubsub = pubsub_instance

        def open(self):
            self.on_open(None)

        def send(self, msg):
            self.log('debug', u'OUT: {0}'.format(len(msg)))
            self.write_message(msg)

    return GeneratedMessageConnection


def websocket_webapp_factory(connection):
    """
    `websocket_webapp_factory` returns the Tornado web application with the
    provided connction handler.
    """
    return web.Application([(SERVER_BASE_URL, connection)])


def sockjs_connection_factory(auth_class, pubsub_instance):
    """
    `sockjs_connection_factory` returns a generated message connection with
    sockjs support.
    """
    from sockjs.tornado import SockJSConnection

    class GeneratedMessageConnection(MessageConnection, SockJSConnection):
        authenticator_class = auth_class
        pubsub = pubsub_instance

    return GeneratedMessageConnection


def sockjs_webapp_factory(connection):
    """
    `sockjs_webapp_factory` provied a Tornado web application with a sockjs
    handler for incoming connections.
    """
    from sockjs.tornado import SockJSRouter

    return web.Application(SockJSRouter(connection, SERVER_BASE_URL).urls)
