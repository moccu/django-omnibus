import codecs
import os
from setuptools import setup, find_packages


def read(fname):
    return codecs.open(os.path.join(os.path.dirname(__file__), fname)).read()


setup(
    name='django-omnibus',
    version='0.0.1',
    description='Django/JavaScript WebSocket Connections',
    long_description=read('README.md'),
    author='Stephan Jaekel, Norman Rusch',
    author_email='info@moccu.com',
    url='https://github.com/moccu/django-omnibus/',
    packages=find_packages(exclude=[
        'testing',
        'testing.pytests',
        'examples',
    ]),
    package_data={
        'omnibus': ['static/omnibus/*.js'],
    },
    install_requires=[
        'tornado>=3.1.1',
        'pyzmq>=14.0.1'
    ],
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Framework :: Django',
    ],
    zip_safe=False,
)
