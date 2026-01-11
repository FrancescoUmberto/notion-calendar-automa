import os
from dotenv import load_dotenv
from storage.mongodb import MongoAdapter

load_dotenv()

class Database:
    """
    Agnostic Database Singleton Class.
    """
    _instance = None
    _adapter = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        db_type = os.getenv("DATABASE_TYPE", "mongodb").lower()
        db_uri = os.getenv("DATABASE_URI")
        
        # Initialize the correct adapter
        if db_type == "mongodb":
            if not db_uri:
                raise ValueError("DATABASE_URI missing for Mongo")
            self._adapter = MongoAdapter(db_uri)
        elif db_type == "sql":
             raise NotImplementedError("SQL Adapter not implemented yet")
        else:
            raise ValueError(f"Database type '{db_type}' not supported")

        # Perform initial setup
        self._adapter.connect()
        self._initialized = True

    # --- Proxy Methods ---
    # These connect your application to the underlying adapter
    
    def get_connection(self):
        return self._adapter.connect() # type: ignore
        
    def close(self):
        return self._adapter.disconnect() # type: ignore

    # FORWARD CRUD OPERATIONS TO THE ADAPTER
    def create(self, collection: str, data: dict):
        return self._adapter.create(collection, data)
    
    def read(self, collection: str, query: dict):
        return self._adapter.read(collection, query)
    
    def update(self, collection: str, query: dict, update_data: dict):
        return self._adapter.update(collection, query, update_data)
    
    def delete(self, collection: str, query: dict):
        return self._adapter.delete(collection, query)