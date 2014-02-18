import logging

from django.conf import settings
from django.core.management.base import BaseCommand
from omnibus import api
from twython import TwythonStreamer


logger = logging.getLogger(__name__)


class TweetPublisher(TwythonStreamer):
    def on_success(self, data):
        if 'coordinates' in data and data['coordinates']:
            tweet = {
                'tweet_id': data['id_str'],
                'coordinates': data['coordinates']['coordinates']
            }

            logger.info('Tweet {0} from {1}'.format(
                tweet['tweet_id'], tweet['coordinates']))
            api.publish('tweets', 'tweet', tweet)


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        assert all([
            settings.TWITTER_APP_TOKEN, settings.TWITTER_APP_SECRET,
            settings.TWITTER_OAUTH_TOKEN, settings.TWITTER_OAUTH_SECRET
        ]), 'Please configure Twitter api credentials.'

        streamer = TweetPublisher(
            settings.TWITTER_APP_TOKEN, settings.TWITTER_APP_SECRET,
            settings.TWITTER_OAUTH_TOKEN, settings.TWITTER_OAUTH_SECRET
        )
        streamer.statuses.filter(locations='-180,-90,180,90')
