import mock

from omnibus.authenticators import NoOpAuthenticator
from omnibus.connection import MessageConnection, LOG_LEVELS


class MockConnection(object):
    def prepare_mock(self):
        self.authenticator_class = NoOpAuthenticator
        self.send_mock = mock.Mock()
        self.pubsub = mock.Mock()
        self.command_testcommand = mock.Mock()

    def send(self, *args, **kwargs):
        self.send_mock(*args, **kwargs)


class MockedMessageConnection(MessageConnection, MockConnection):
    pass


class TestConnection:
    def setup(self):
        self.con = MockedMessageConnection()
        self.con.prepare_mock()

    def test_init(self):
        assert self.con.authenticator is None
        assert self.con.subscriber is None

    def test_log(self):
        LOG_LEVELS['debug'] = mock.Mock()
        LOG_LEVELS['info'] = mock.Mock()
        LOG_LEVELS['error'] = mock.Mock()

        self.con.log('debug', 'test')
        assert LOG_LEVELS['debug'].called is True

        self.con.log('info', 'test')
        assert LOG_LEVELS['info'].called is True

        self.con.log('error', 'test')
        assert LOG_LEVELS['error'].called is True

    def test_on_open(self):
        self.con.on_open(None)
        self.con.pubsub.get_subscriber.called is True
        assert self.con.subscriber == self.con.pubsub.get_subscriber.return_value

    def test_on_close(self):
        self.con.subscriber = mock.Mock()
        self.con.on_close()
        assert self.con.pubsub.close_subscriber.called is True
        assert self.con.pubsub.close_subscriber.call_args[0] == (
            self.con.subscriber,)

    def test_on_error(self):
        self.con.subscriber = mock.Mock()
        self.con.on_error(Exception())
        assert self.con.pubsub.close_subscriber.called is True
        assert self.con.pubsub.close_subscriber.call_args[0] == (
            self.con.subscriber,)

    @mock.patch('omnibus.connection.MessageConnection.on_channel_message')
    @mock.patch('omnibus.connection.MessageConnection.on_command_message')
    def test_on_message(self, command_mock, channel_mock):
        self.con.on_message('test123:test')
        assert channel_mock.call_count == 0
        assert command_mock.call_count == 0

        self.con.on_message('!test123:test:456')
        assert channel_mock.call_count == 0
        assert command_mock.call_count == 1
        assert command_mock.call_args[0] == ('test123', 'test:456')

        self.con.authenticator = True
        self.con.on_message('test123:test')
        assert channel_mock.call_count == 1
        assert command_mock.call_count == 1
        assert channel_mock.call_args[0] == ('test123', 'test123:test')

    def test_on_subscriber_message(self):
        self.con.on_subscriber_message(['test123:test'])
        assert self.con.send_mock.call_count == 1
        assert self.con.send_mock.call_args[0] == ('test123:test',)

    def test_on_command_message_unkown(self):
        self.con.on_command_message('nocommand', 'test')
        assert self.con.send_mock.call_count == 1
        assert self.con.send_mock.call_args[0] == (
            '!nocommand:{"type": "nocommand", "payload": null, "success": false}',)

    def test_on_command_message_kown(self):
        self.con.on_command_message('testcommand', 'test')
        assert self.con.send_mock.call_count == 0
        assert self.con.command_testcommand.call_count == 1
        assert self.con.command_testcommand.call_args[0] == ('test',)

    def test_on_channel_message_no_subscribed(self):
        self.con.subscriber = mock.Mock()
        self.con.subscriber.channels = []
        self.con.on_channel_message('mychan', 'test')
        assert self.con.pubsub.send.call_count == 0

    def test_on_channel_message_no_allowed(self):
        self.con.subscriber = mock.Mock()
        self.con.subscriber.channels = ['mychan']
        self.con.authenticator = mock.Mock()
        self.con.authenticator.can_publish.return_value = False

        self.con.on_channel_message('mychan', 'test')
        assert self.con.pubsub.send.call_count == 0
        assert self.con.authenticator.can_publish.call_count == 1

    def test_on_channel_message_allowed(self):
        self.con.subscriber = mock.Mock()
        self.con.subscriber.channels = ['mychan']
        self.con.authenticator = mock.Mock()
        self.con.authenticator.can_publish.return_value = True

        self.con.on_channel_message('mychan', 'test')
        assert self.con.authenticator.can_publish.call_count == 1
        assert self.con.pubsub.send.call_count == 1
        assert self.con.pubsub.send.call_args[0] == ('test',)

    def test_is_authenticated(self):
        assert self.con.is_authenticated() is False

        self.con.authenticator = 'test'
        assert self.con.is_authenticated() is True

    def test_authenticate_error(self):
        self.con.authenticator_class = mock.Mock()
        self.con.authenticator_class.authenticate.return_value = None
        self.con.command_authenticate('test')

        assert self.con.authenticator_class.authenticate.call_args[0] == (
            'test',)
        assert self.con.send_mock.call_count == 1
        assert self.con.send_mock.call_args[0] == (
            '!authenticate:{"type": "authenticate", "payload": null, "success": false}',)

    def test_authenticate_success(self):
        self.con.authenticator_class = mock.Mock()
        self.con.command_authenticate('test')

        assert self.con.authenticator_class.authenticate.call_args[0] == (
            'test',)
        assert self.con.send_mock.call_count == 1
        assert self.con.send_mock.call_args[0] == (
            '!authenticate:{"type": "authenticate", "payload": null, "success": true}',)

    def test_subscribe_already_subscribed(self):
        self.con.subscriber = mock.Mock()
        self.con.subscriber.channels = ['mychan']

        self.con.command_subscribe('mychan')
        assert self.con.pubsub.subscribe.call_count == 0
        assert self.con.send_mock.call_args[0] == (
            '!subscribe:{"type": "subscribe", "payload": {"channel": "mychan"}, '
            '"success": false}',)

    def test_subscribe_no_allowed(self):
        self.con.subscriber = mock.Mock()
        self.con.subscriber.channels = []
        self.con.authenticator = mock.Mock()
        self.con.authenticator.can_subscribe.return_value = False

        self.con.command_subscribe('mychan')
        assert self.con.pubsub.subscribe.call_count == 0
        assert self.con.authenticator.can_subscribe.call_count == 1
        assert self.con.send_mock.call_args[0] == (
            '!subscribe:{"type": "subscribe", "payload": {"channel": "mychan"}, '
            '"success": false}',)

    def test_subscribe_allowed(self):
        self.con.subscriber = mock.Mock()
        self.con.subscriber.channels = []
        self.con.authenticator = mock.Mock()
        self.con.authenticator.can_subscribe.return_value = True
        self.con.pubsub.subscribe.return_value = True

        self.con.command_subscribe('mychan')
        assert self.con.authenticator.can_subscribe.call_count == 1
        assert self.con.pubsub.subscribe.call_count == 1
        assert self.con.pubsub.subscribe.call_args[0] == (
            self.con.subscriber, 'mychan',)

    def test_unsubscribe_not_subscribed(self):
        self.con.subscriber = mock.Mock()
        self.con.subscriber.channels = ['mychan2']

        self.con.command_unsubscribe('mychan')
        assert self.con.pubsub.unsubscribe.call_count == 0
        assert self.con.send_mock.call_args[0] == (
            '!unsubscribe:{"type": "unsubscribe", "payload": {"channel": "mychan"}, '
            '"success": false}',)

    def test_unsubscribe_no_allowed(self):
        self.con.subscriber = mock.Mock()
        self.con.subscriber.channels = ['mychan']
        self.con.authenticator = mock.Mock()
        self.con.authenticator.can_unsubscribe.return_value = False

        self.con.command_unsubscribe('mychan')
        assert self.con.pubsub.unsubscribe.call_count == 0
        assert self.con.authenticator.can_unsubscribe.call_count == 1
        assert self.con.send_mock.call_args[0] == (
            '!unsubscribe:{"type": "unsubscribe", "payload": {"channel": "mychan"}, '
            '"success": false}',)

    def test_unsubscribe_allowed(self):
        self.con.subscriber = mock.Mock()
        self.con.subscriber.channels = ['mychan']
        self.con.authenticator = mock.Mock()
        self.con.authenticator.can_unsubscribe.return_value = True
        self.con.pubsub.unsubscribe.return_value = True

        self.con.command_unsubscribe('mychan')
        assert self.con.authenticator.can_unsubscribe.call_count == 1
        assert self.con.pubsub.unsubscribe.call_count == 1
        assert self.con.pubsub.unsubscribe.call_args[0] == (
            self.con.subscriber, 'mychan',)
