from pymongo import MongoClient
from storage.adapter import DatabaseAdapter

from utils.log import Logger

_log = Logger("mongodb-adapter")

class MongoAdapter(DatabaseAdapter):
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, uri):
        if self._initialized:
            return
            
        super().__init__()
        self.uri = uri
        self._client = None
        self._db = None
        self._initialized = True

    def connect(self):
        if not self._client:
            self._client = MongoClient(self.uri)
            self._db = self._client["notion_calendar_sync"]
            self.log.debug("Connected to MongoDB")
        return self._db

    def disconnect(self):
        if self._client:
            self._client.close()
            self._client = None
            self.log.debug("Disconnected from MongoDB")

    # --- CRUD OPERATIONS ---    
    def create(self, collection_name, data):
        db = self.connect()
        try:
            db[collection_name].insert_one(data) # type: ignore
            _log.debug(f"Document inserted into {collection_name}")
        except Exception as e:
            _log.error(f"Error inserting document into {collection_name}: {e}")
            raise e

    def read(self, collection_name, query):
        db = self.connect()
        try:
            result = db[collection_name].find_one(query) # type: ignore
            _log.debug(f"Document read from {collection_name} with query {query}")
            return result
        except Exception as e:
            _log.error(f"Error reading document from {collection_name}: {e}")
            raise e
    
    def update(self, collection_name, query, update_data):
        db = self.connect()
        try:
            result = db[collection_name].update_one(query, {"$set": update_data}) # type: ignore
            _log.debug(f"Document updated in {collection_name} with query {query}")
            return result
        except Exception as e:
            _log.error(f"Error updating document in {collection_name}: {e}")
            raise e
    
    def delete(self, collection_name, query):
        db = self.connect()
        try:
            result = db[collection_name].delete_one(query) # type: ignore
            _log.debug(f"Document deleted from {collection_name} with query {query}")
            return result
        except Exception as e:
            _log.error(f"Error deleting document from {collection_name}: {e}")
            raise e
        
    # --- ADDITIONAL OPERATIONS ---
    def exists(self, collection_name, query) -> bool:
        db = self.connect()
        try:
            count = db[collection_name].count_documents(query) # type: ignore
            exists = count > 0
            _log.debug(f"Existence check in {collection_name} with query {query}: {exists}")
            return exists
        except Exception as e:
            _log.error(f"Error checking existence in {collection_name}: {e}")
            raise e
        
    def list_elements(self, collection_name, query=None) -> list:
        db = self.connect()
        try:
            if query is None:
                query = {}
            results = list(db[collection_name].find(query)) # type: ignore
            _log.debug(f"Listed elements from {collection_name} with query {query}")
            return results
        except Exception as e:
            _log.error(f"Error listing elements from {collection_name}: {e}")
            raise e