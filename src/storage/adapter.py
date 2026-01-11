from abc import ABC, abstractmethod
import os
from utils.log import Logger

class DatabaseAdapter(ABC):
    """
    Abstract Base Class for Database Adapters.
    """
    def __init__(self):
        self.log = Logger("storage")

    @abstractmethod
    def connect(self):
        """Establishes the connection to the database"""
        pass

    @abstractmethod
    def disconnect(self):
        """Closes the connection to the database"""
        pass
        
    @abstractmethod
    def create(self, collection: str, data: dict):
        """Inserts a new document/record into the specified collection/table"""
        pass
    
    @abstractmethod
    def read(self, collection: str, query: dict):
        """Reads documents/records from the specified collection/table based on the query"""
        pass
    
    @abstractmethod
    def update(self, collection: str, query: dict, update_data: dict):
        """Updates documents/records in the specified collection/table based on the query"""
        pass
    
    @abstractmethod
    def delete(self, collection: str, query: dict):
        """Deletes documents/records from the specified collection/table based on the query"""
        pass
    
    @abstractmethod
    def exists(self, collection: str, query: dict) -> bool:
        """Checks if a document/record exists in the specified collection/table based on the query"""
        pass
    
    @abstractmethod
    def list_elements(self, collection: str, query: dict = None) -> list:
        """Lists all documents/records in the specified collection/table optionally filtered by a query"""
        pass
    