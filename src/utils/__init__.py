"""
Logging module for simulation core engine
"""

import datetime

DISABLED = -1
"""Disable logging"""

ERROR = 0
"""Error logging level"""

WARN = 1
"""Warning logging level"""

WARNING = 1
"""Warning logging level"""

INFO = 2
"""Info logging level"""

INFORMATION = 2
"""Info logging level"""

DEBUG = 3
"""Debug logging level"""

_level = 3
"""Private variable to store the current logging level. Debug level should be set with set_level()"""


def set_level(level: int) -> None:
    """
    Set the logging level

    :param level: The logging level
    """
    global _level
    _level = level


def log(logger: str, level: int, msg: str) -> None:
    """
    Log a message. This is the base function. If you wish to personalize log format
    you can modify this function
    The message will be logged only if the level is greater than or equal to the current logging level

    :param logger: The logger name
    :param level: The logging level
    :param msg: The message to log
    """
    level_str = (
        "ERROR"
        if level == 0
        else "INFO" if level == 1 else "WARN" if level == 2 else "DEBUG"
    )
    print(f"{datetime.datetime.now()} | {logger} | {level_str} | {msg}")


def error(logger: str, msg: str) -> None:
    """
    Log an error message

    :param logger: The logger name
    :param msg: The message to log
    """
    if _level >= ERROR:
        log(logger, 0, msg)


def err(logger: str, msg: str) -> None:
    """
    Log an error message (alias of error())

    :param logger: The logger name
    :param msg: The message to log
    """
    if _level >= ERROR:
        log(logger, 0, msg)


def info(logger: str, msg: str) -> None:
    """
    Log an info message

    :param logger: The logger name
    :param msg: The message to log
    """
    if _level >= INFO:
        log(logger, 1, msg)


def warn(logger: str, msg: str) -> None:
    """
    Log a warning message (alias of warning())

    :param logger: The logger name
    :param msg: The message to log
    """
    if _level >= WARN:
        log(logger, 2, msg)


def warning(logger: str, msg: str) -> None:
    """
    Log a warning message

    :param logger: The logger name
    :param msg: The message to log
    """
    if _level >= WARN:
        log(logger, 2, msg)


def debug(logger: str, msg: str) -> None:
    """
    Log a debug message

    :param logger: The logger name
    :param msg: The message to log
    """
    if _level >= DEBUG:
        log(logger, 3, msg)


class Logger:
    """Logger class for simulation core engine"""

    def __init__(self, name: str, level: int = _level) -> None:
        """
        Initialize the logger. This logger does not respect global logging level,
        instead it uses the level passed to the constructor

        :param name: The logger name
        :param level: The logging level (default: _level)
        """

        self.name = name
        """Stores the logger name"""

        self.level = level
        """Stores the logging level"""

    def err(self, msg: str) -> None:
        """
        Log an error message

        :param msg: The message to log
        """
        if self.level >= ERROR:
            err(self.name, msg)

    def error(self, msg: str) -> None:
        """
        Log an error message (alias of err())

        :param msg: The message to log
        """
        if self.level >= ERROR:
            err(self.name, msg)

    def info(self, msg: str) -> None:
        """
        Log an info message

        :param msg: The message to log
        """
        if self.level >= INFO:
            info(self.name, msg)

    def warn(self, msg: str) -> None:
        """
        Log a warning message (alias of warning())

        :param msg: The message to log
        """
        if self.level >= WARN:
            warn(self.name, msg)

    def warning(self, msg: str) -> None:
        """
        Log a warning message

        :param msg: The message to log
        """
        if self.level >= WARN:
            warn(self.name, msg)

    def debug(self, msg: str) -> None:
        """
        Log a debug message

        :param msg: The message to log
        """
        if self.level >= DEBUG:
            debug(self.name, msg)