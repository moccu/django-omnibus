import time
import json
import multiprocessing

import pytest
from tornado import ioloop
from ws4py.client.tornadoclient import TornadoWebSocketClient

from omnibus.daemon import spawn_omnibusd
from omnibus.pubsub import PubSub

from .helpers import AssertEventuallyTest


class WebsocketClient(TornadoWebSocketClient):
    def opened(self):
        print('opened, send authenticate')
        self.send('!authenticate:123456')
        time.sleep(.1)

    def received_message(self, message):
        print('received message', message, message.data)

        type, payload = message.data.split(':', 1)

        if type == '!authenticate' and json.loads(payload).get('success', False):
            self.send('!subscribe:channel')
        elif type == '!subscribe' and json.loads(payload).get('success', False):
            self.send('channel:{"type": "type", "sender": null, "payload": {"test": "works!"}}')
            time.sleep(.2)
            self.send('channel:{"type": "type", "sender": null, "payload": {"test": "works2!"}}')
            time.sleep(.2)
            self.close()

    def closed(self, code, reason=None):
        self.io_loop.stop()


@pytest.mark.parametrize('run', [1, 2, 3, 4, 5, 6])
class TestOmnibusD(AssertEventuallyTest):
    def setup(self):
        AssertEventuallyTest.setup(self)

        self.process = multiprocessing.Process(target=spawn_omnibusd)
        self.process.daemon = False
        self.process.start()

        # Wait for the process to get up properly.
        time.sleep(1)

        assert self.process.is_alive()

        self.ioloop = ioloop.IOLoop.instance()

    def teardown(self):
        assert self.process.is_alive()
        self.process.terminate()

    def test_simple(self, run):
        print('initialize pubsub')

        bus = PubSub(self.ioloop)

        messages = []

        def callback(msg):
            messages.append(msg)

        print('initialize websocket client')

        ws = WebsocketClient(
            'ws://127.0.0.1:4242/ec',
            io_loop=self.ioloop)

        print('connect websocket client')

        ws.connect()

        print('initialize subscriber')

        subscriber = bus.get_subscriber(callback)

        print('connect subscriber')

        assert bus.subscribe(subscriber, u'channel')

        print('start loop')

        self.assertEventuallyEqual([
            ['channel:{"type": "type", "sender": null, "payload": {"test": "works2!"}}']
        ], lambda: messages)

        self.ioloop.start()
