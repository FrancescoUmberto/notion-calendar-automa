"""Singleton object storage"""

from storage.database import Database

__storage = None


def get():
    global __storage
    if __storage is None:
        __storage = Database()
    return __storage
