import mock
from tornado import web

from omnibus import factories
from omnibus import authenticators


def test_noopauthenticator_factory():
    assert factories.noopauthenticator_factory() == (
        authenticators.NoOpAuthenticator)


def test_userauthenticator_factory():
    assert factories.userauthenticator_factory() == (
        authenticators.UserAuthenticator)


def test_websocket_connection_factory():
    auth_class = mock.Mock()
    pubsub_instance = mock.Mock()

    conn_class = factories.websocket_connection_factory(
        auth_class, pubsub_instance)

    assert conn_class.authenticator_class == auth_class
    assert conn_class.pubsub == pubsub_instance

    assert hasattr(conn_class, 'open') is True
    assert hasattr(conn_class, 'send') is True


def test_websocket_webapp_factory():
    conn_class = mock.Mock()

    webapp = factories.websocket_webapp_factory(conn_class)

    assert isinstance(webapp, web.Application)
    assert webapp.handlers[0][1][0].handler_class == conn_class


def test_sockjs_connection_factory():
    auth_class = mock.Mock()
    pubsub_instance = mock.Mock()

    conn_class = factories.sockjs_connection_factory(
        auth_class, pubsub_instance)

    assert conn_class.authenticator_class == auth_class
    assert conn_class.pubsub == pubsub_instance


def test_sockjs_webapp_factory():
    conn_class = mock.Mock()

    webapp = factories.sockjs_webapp_factory(conn_class)

    assert isinstance(webapp, web.Application)
    assert webapp.handlers[0][1][0].kwargs[
        'server'].get_connection_class() == conn_class
