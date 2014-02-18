import pytest
from django.contrib.auth.models import User, AnonymousUser

from omnibus.authenticators import UserAuthenticator
from omnibus.context_processors import omnibus


def test_context_processor_no_user(rf):
    request = rf.get('/')

    context = omnibus(request)

    assert context == {
        'OMNIBUS_ENDPOINT': 'ws://testserver:4242/ec',
        'OMNIBUS_AUTH_TOKEN': ''
    }


def test_context_processor_anonymous_user(rf):
    request = rf.get('/')
    request.user = AnonymousUser()

    context = omnibus(request)

    assert context == {
        'OMNIBUS_ENDPOINT': 'ws://testserver:4242/ec',
        'OMNIBUS_AUTH_TOKEN': ''
    }


@pytest.mark.django_db
def test_context_processor_user(rf):
    request = rf.get('/')
    request.user = User.objects.create(username='test123')

    context = omnibus(request)

    assert context == {
        'OMNIBUS_ENDPOINT': 'ws://testserver:4242/ec',
        'OMNIBUS_AUTH_TOKEN': '{0}:{1}'.format(
            request.user.pk, UserAuthenticator.get_auth_token(request.user.pk))
    }
