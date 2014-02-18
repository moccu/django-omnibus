import mock

from omnibus.api import publish


@mock.patch('omnibus.api.pubsub.publish')
def test_publish(publish_mock):
    result = publish('mychan', 'thetype', payload={1: 2}, sender='snd')

    assert result == publish_mock.return_value
    assert publish_mock.call_args[0] == ('mychan', 'thetype', {1: 2}, 'snd')
