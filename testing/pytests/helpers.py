import os
import time
import unittest

from tornado import ioloop
from zmq.eventloop.ioloop import ZMQPoller


class PuritanicalIOLoop(ioloop.PollIOLoop):
    """
    A loop that quits when it encounters an Exception.
    """
    def handle_callback_exception(self, callback):
        exc_type, exc_value, tb = sys.exc_info()
        raise exc_value


class AssertEventuallyTest(object):
    def setup(self):
        # Callbacks registered with assertEventuallyEqual()
        self.assert_callbacks = set()

        # So any function that calls IOLoop.instance() gets the
        # PuritanicalIOLoop instead of the default loop.
        if not ioloop.IOLoop.initialized():
            loop = PuritanicalIOLoop(impl=ZMQPoller())
            loop.install()
        else:
            loop = ioloop.IOLoop.instance()
            assert isinstance(loop, PuritanicalIOLoop), 'Couldn\'t install PuritanicalIOLoop'

    def assertEventuallyEqual(self, expected, fn, msg=None, timeout_sec=None):
        if timeout_sec is None:
            timeout_sec = 5
        timeout_sec = max(timeout_sec, int(os.environ.get('TIMEOUT_SEC', 0)))
        start = time.time()
        loop = ioloop.IOLoop.instance()

        def callback():
            try:
                assert fn() == expected, msg

                # Passed
                self.assert_callbacks.remove(callback)
                if not self.assert_callbacks:
                    # All asserts have passed
                    loop.stop()
            except AssertionError:
                # Failed -- keep waiting?
                if time.time() - start < timeout_sec:
                    # Try again in about 0.1 seconds
                    loop.add_timeout(time.time() + 0.1, callback)
                else:
                    # Timeout expired without passing test
                    loop.stop()
                    raise

        self.assert_callbacks.add(callback)

        # Run this callback on the next I/O loop iteration
        loop.add_callback(callback)
