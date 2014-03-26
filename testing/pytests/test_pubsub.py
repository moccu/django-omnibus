import json

import mock
import pytest
import zmq

from omnibus.exceptions import (
    OmnibusException, OmnibusPublisherException, OmnibusDataException,
    OmnibusSubscriberException)
from omnibus.pubsub import PubSub


class TestPubSub:
    @mock.patch('omnibus.pubsub.zmq.Context')
    def setup(self, cm):
        self.pubsub = PubSub()
        self.context = cm.return_value

    def test_init(self):
        assert isinstance(self.pubsub.context, mock.Mock)
        assert self.pubsub.connections == {}
        assert self.pubsub.bridges == {}

    @mock.patch('omnibus.pubsub.zmq_ioloop.install')
    def test_install_ioloop(self, install_mock):
        self.pubsub.install_ioloop() is True
        assert install_mock.call_count == 1

        # Dont call install_ioloop again
        self.pubsub.install_ioloop() is True
        assert install_mock.call_count == 1

    def test_get_connection(self):
        con = self.pubsub.get_connection(zmq.PUB, 'inproc://test')
        assert self.context.socket.call_count == 1
        assert con == self.context.socket.return_value

        # Get same connection again
        con = self.pubsub.get_connection(zmq.PUB, 'inproc://test')
        assert self.context.socket.call_count == 1
        assert con == self.context.socket.return_value

        # Get another connection
        con = self.pubsub.get_connection(zmq.SUB, 'inproc://test2', True)
        assert self.context.socket.call_count == 2
        assert con == self.context.socket.return_value

    def test_get_connection_error(self):
        self.context.socket.side_effect = zmq.ZMQError
        with pytest.raises(OmnibusException):
            self.pubsub.get_connection(zmq.PUB, 'inproc://test')

    def test_send(self):
        assert self.pubsub.send('testmsg') is True
        assert self.context.socket.return_value.send_unicode.call_count == 1
        assert self.context.socket.return_value.send_unicode.call_args[0] == (
            'testmsg',)

    def test_send_error(self):
        self.context.socket.return_value.send_unicode.side_effect = zmq.ZMQError

        with pytest.raises(OmnibusPublisherException):
            self.pubsub.send('testmsg')

    def test_publish_invalid_data(self):
        with pytest.raises(OmnibusDataException):
            self.pubsub.publish('test', 'test', 'test')

    def test_publish_invalid_payload(self):
        with pytest.raises(OmnibusDataException):
            self.pubsub.publish('test', 'test', {'test': object()})

    def test_publish(self):
        assert self.pubsub.publish(
            'test1', 'test2', {'test3': 'test4'}, 'test5') is True

        assert self.context.socket.return_value.send_unicode.call_count == 1

        msg = self.context.socket.return_value.send_unicode.call_args[0]
        command, args = msg[0].split(':', 1)
        assert command == 'test1'
        assert json.loads(args) == {'type': 'test2', 'sender': 'test5', 'payload': {'test3': 'test4'}}  # noqa

    @mock.patch('omnibus.pubsub.ZMQStream')
    def test_get_subscriber(self, stream_mock):
        cb = mock.Mock()
        subscriber = self.pubsub.get_subscriber(cb)
        assert subscriber.channels == []

        # Test socket
        assert self.context.socket.call_count == 1
        assert self.context.socket.call_args[0] == (zmq.SUB,)

        # Test connect
        sock = self.context.socket.return_value
        assert sock.connect.call_args[0][0] == 'tcp://127.0.0.1:4243'

        # Test stream
        assert stream_mock.call_args[0][0] == sock
        assert stream_mock.return_value.on_recv.call_args[0][0] == cb

        assert subscriber == stream_mock.return_value

    @mock.patch('omnibus.pubsub.ZMQStream')
    def test_get_subscriber_other_address(self, stream_mock):
        cb = mock.Mock()
        self.pubsub.get_subscriber(cb, 'inproc://test')

        # Test connect
        sock = self.context.socket.return_value
        assert sock.connect.call_args[0][0] == 'inproc://test'

    def test_get_subscriber_error(self):
        self.context.socket.side_effect = zmq.ZMQError
        with pytest.raises(OmnibusSubscriberException):
            self.pubsub.get_subscriber(None)

    def test_close_subscriber(self):
        subscriber_stream = mock.Mock()
        subscriber_stream.socket = mock.Mock()

        assert self.pubsub.close_subscriber(subscriber_stream) is True

        assert subscriber_stream.socket.close.called is True
        assert subscriber_stream.close.called is True

    def test_close_subscriber_error(self):
        subscriber_stream = mock.Mock()
        subscriber_stream.close = mock.Mock(side_effect=zmq.ZMQError)

        with pytest.raises(OmnibusSubscriberException):
            self.pubsub.close_subscriber(subscriber_stream)

    def test_subscribe_already_subscribed(self):
        subscriber = mock.Mock()
        subscriber.channels = ['mychan']

        assert self.pubsub.subscribe(subscriber, 'mychan') is False

    def test_subscribe_error(self):
        subscriber = mock.Mock()
        subscriber.channels = ['mychan2']
        subscriber.setsockopt.side_effect = zmq.ZMQError

        with pytest.raises(OmnibusSubscriberException):
            self.pubsub.subscribe(subscriber, 'mychan')

    def test_subscribe(self):
        subscriber = mock.Mock()
        subscriber.channels = ['mychan2']

        assert self.pubsub.subscribe(subscriber, 'mychan') is True

        assert 'mychan' in subscriber.channels
        assert subscriber.setsockopt.call_args[0] == (zmq.SUBSCRIBE, 'mychan')

    def test_unsubscribe_not_subscribed(self):
        subscriber = mock.Mock()
        subscriber.channels = ['mychan2']

        assert self.pubsub.unsubscribe(subscriber, 'mychan') is False

    def test_unsubscribe_error(self):
        subscriber = mock.Mock()
        subscriber.channels = ['mychan']
        subscriber.setsockopt.side_effect = zmq.ZMQError

        with pytest.raises(OmnibusSubscriberException):
            self.pubsub.unsubscribe(subscriber, 'mychan')

    def test_unsubscribe(self):
        subscriber = mock.Mock()
        subscriber.channels = ['mychan2', 'mychan']

        assert self.pubsub.unsubscribe(subscriber, 'mychan') is True

        assert 'mychan' not in subscriber.channels
        assert subscriber.setsockopt.call_args[0] == (zmq.UNSUBSCRIBE, 'mychan')

    def test_init_bridge_invalid_modes(self):
        # Invalid in and out
        with pytest.raises(AssertionError):
            self.pubsub.init_bridge('test', 'test', 'test', 'test')

        with pytest.raises(AssertionError):
            self.pubsub.init_bridge(self.pubsub.BIND, 'test', 'test', 'test')

    def test_init_bridge_error(self):
        self.context.socket.side_effect = zmq.ZMQError

        with pytest.raises(OmnibusException):
            self.pubsub.init_bridge(
                self.pubsub.BIND, 'test', self.pubsub.CONNECT, 'test2')

    @mock.patch('omnibus.pubsub.ZMQStream')
    def test_init_bridge(self, stream_mock):
        self.context.socket.side_effect = lambda s: mock.Mock()

        instances = self.pubsub.init_bridge(
            self.pubsub.BIND, 'inproc://t1', self.pubsub.CONNECT, 'inproc://t2')

        self.context.socket.call_args_list[0] == zmq.SUB
        assert instances['in'].bind.call_args[0][0] == 'inproc://t1'
        assert instances['in'].connect.called is False
        assert instances['in'].setsockopt.called is True

        self.context.socket.call_args_list[1] == zmq.PUB
        assert instances['out'].connect.call_args[0][0] == 'inproc://t2'
        assert instances['out'].bind.called is False

        assert stream_mock.call_args[0][0] == instances['in']

        assert self.context.socket.call_count == 2

        # Test double init.
        instances = self.pubsub.init_bridge(
            self.pubsub.BIND, 'inproc://t1', self.pubsub.CONNECT, 'inproc://t2')
        assert self.context.socket.call_count == 2

    @mock.patch('omnibus.pubsub.ZMQStream')
    def test_init_bridge_invert(self, stream_mock):
        self.context.socket.side_effect = lambda s: mock.Mock()

        instances = self.pubsub.init_bridge(
            self.pubsub.CONNECT, 'inproc://t1', self.pubsub.BIND, 'inproc://t2')

        self.context.socket.call_args_list[0] == zmq.SUB
        assert instances['in'].connect.call_args[0][0] == 'inproc://t1'
        assert instances['in'].bind.called is False
        assert instances['in'].setsockopt.called is True

        self.context.socket.call_args_list[1] == zmq.PUB
        assert instances['out'].bind.call_args[0][0] == 'inproc://t2'
        assert instances['out'].connect.called is False

        assert stream_mock.call_args[0][0] == instances['in']

        assert self.context.socket.call_count == 2

        # Test double init.
        instances = self.pubsub.init_bridge(
            self.pubsub.CONNECT, 'inproc://t1', self.pubsub.BIND, 'inproc://t2')
        assert self.context.socket.call_count == 2

    @mock.patch('omnibus.pubsub.PubSub.init_bridge')
    def test_init_director(self, init_mock):
        self.pubsub.init_director()

        assert init_mock.call_args[0] == (
            'bind', 'tcp://127.0.0.1:4244', 'bind', 'tcp://127.0.0.1:4243')

    @mock.patch('omnibus.pubsub.PubSub.init_bridge')
    def test_init_forwarder(self, init_mock):
        self.pubsub.init_forwarder()
        assert init_mock.call_args_list[0][0] == (
            'connect', None, 'bind', 'tcp://127.0.0.1:4243')
        assert init_mock.call_args_list[1][0] == (
            'bind', 'tcp://127.0.0.1:4244', 'connect', None)
