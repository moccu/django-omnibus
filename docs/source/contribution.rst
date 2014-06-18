Contribution
============

If you like to contribute to this project please read the following guides and
read the internals sections for :ref:`Server <server-internals>` and
:ref:`Client <client-internals>` code.

Django Code
-----------

To install all requirements for development and testing, you can use the provided
requirements file.

.. code-block:: bash

    $ pip install -e .[tests]

Testing the code
````````````````

`django-omnibus` uses ``py.test`` for testing. Please ensure that all tests pass
before you submit a pull request. ``py.test`` also runs PEP8 and PyFlakes checks
on every run.

This is how you execute the tests and checks from the repository root directory.

.. code-block:: bash

    $ py.test

If you want to generate a coverage report, you can use the following command.

.. code-block:: bash

    $ py.test --cov=omnibus --cov-report=html .

Documentation
`````````````

`django-omnibus` uses Sphinx for documentation. You find all the sources files
in the ``docs/source`` folder.

To update/generate the html output of the documentation, use the following
command inside the ``docs`` folder.

.. code-block:: bash

    $ make html

Please make sure that you don't commit the build files inside ``docs/build``.

JavaScript Code
---------------

The client side development depends on the GruntJS_ Taskrunner.
If you haven't used grunt before, be sure to check out the
`Getting Started <http://gruntjs.com/getting-started>`_ guide.

To setup your local environment call ``npm install`` in the projects root. This
downloads all necessary dependencies to run the taskrunner.

.. _GruntJS: http://gruntjs.com

Change the code
```````````````

A build of the JavaScript library will be made on each new release.

The release is based on the `AMD Modules` located in the source directory `"src"`
inside the `"static"` folder. For these circumstances it's not meant to
made changes in the JavaScript files outside the `"src"` folder, cause they are
overwritten by the build output. If you wan't to contribute to this project
please commit only the `src`-files.

To run the build process you can call the grunt taskrunner using:

.. code-block:: bash

    $ grunt

This starts `validation`, `testing`, `building` and `documention` processes
in a row as default task of the taskrunner. The build process creates the
library itself and a minified version of them, using the extention ``.min.js``.

Generate a documentation
````````````````````````

The client code is fully documented using JSDoc_. To get an overview about the
classes and functions generate your own JSDoc running the following command.
The generated documentation will open immediately.

.. code-block:: bash

    $ grunt doc

.. _JSDoc: http://usejsdoc.org/

Validation & testing
````````````````````

Before you commit your code changes and offer a pull request run the following
tasks via grunt:

To validate the code according our JSHint_, JSCS_ and indentation rules run:

.. _JSHint: http://www.jshint.com/about/
.. _JSCS: https://github.com/mdevils/node-jscs

.. code-block:: bash

    $ grunt validate

To finally test your JavaScript code run:

.. code-block:: bash

    $ grunt test

The tests are written using Jasmine_. The test specs are located at ``testing/jstests/``.

.. _Jasmine: http://pivotal.github.io/jasmine/

Code declaration
````````````````

The most JavaScript code will be validated as described above using JSHint_
and JSCS_. But there are some rules which won't be checked:

* To declare a private property, add a leading underscore ``_`` to the properties name, for example: ``_isValid: true``.
* To declare a constant, use uppercase letters and underscores like: ``THIS_IS_A_CONSTANT = 'value'``.
