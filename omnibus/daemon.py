import logging

from tornado import ioloop
from django.utils.module_loading import import_by_path

from .settings import (
    SERVER_PORT, AUTHENTICATOR_FACTORY, CONNECTION_FACTORY, WEBAPP_FACTORY,
    PUBSUB_FACTORY)


logger = logging.getLogger(__name__)


def spawn_omnibusd():
    pubsub_factory = import_by_path(PUBSUB_FACTORY)
    authenticator_factory = import_by_path(AUTHENTICATOR_FACTORY)
    connection_factory = import_by_path(CONNECTION_FACTORY)
    webapp_factory = import_by_path(WEBAPP_FACTORY)

    # Create app and listen on SEVER_PORT
    pubsub = pubsub_factory()

    app = webapp_factory(connection_factory(authenticator_factory(), pubsub))
    app.listen(SERVER_PORT)

    loop = ioloop.IOLoop().instance()
    try:
        logger.info('Starting omnibusd.')
        loop.start()
    except KeyboardInterrupt:
        logger.info('Received KeyboardInterrupt, stopping omnibusd.')
        pubsub.shutdown()
        loop.stop()
