from __future__ import absolute_import

__version__ = "2.5.2"


def get_instance():
    from . import instance

    return instance.instance
