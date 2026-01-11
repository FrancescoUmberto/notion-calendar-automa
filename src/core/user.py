import typing as T
from utils.encryption import encrypt_data, decrypt_data

class User:
    def __init__(
        self, 
        email: str, 
        is_active: bool,
        g_token: str,
        g_refresh_token: str,
        g_token_uri: str,
        g_client_id: str,
        g_client_secret: str,
        g_expiry: str,
        n_api_key: T.Optional[str] = None,
        n_db_id: T.Optional[str] = None,
        g_calendar_id: T.Optional[str] = None,
        last_sync: T.Optional[str] = None,
        last_login: T.Optional[str] = None
        ):
        self.email = email
        self.is_active = is_active
        self.g_token = g_token
        self.g_refresh_token = g_refresh_token
        self.g_token_uri = g_token_uri
        self.g_client_id = g_client_id
        self.g_client_secret = g_client_secret
        self.g_expiry = g_expiry
        self.n_api_key = n_api_key
        self.n_db_id = n_db_id
        self.g_calendar_id = g_calendar_id
        self.last_sync = last_sync
        self.last_login = last_login
        
    def to_dict(self) -> T.Dict[str, T.Any]:
        return {
            "email": self.email,
            "is_active": self.is_active,
            "g_token": self.g_token,
            "g_refresh_token": self.g_refresh_token,
            "g_token_uri": self.g_token_uri,
            "g_client_id": self.g_client_id,
            "g_client_secret": self.g_client_secret,
            "g_expiry": self.g_expiry,
            "n_api_key": self.n_api_key,
            "n_db_id": self.n_db_id,
            "g_calendar_id": self.g_calendar_id,
            "last_sync": self.last_sync,
            "last_login": self.last_login
        }
        
    def encrypt_sensitive_data(self):
        """Encrypt sensitive fields using the provided cipher."""
        self.g_token = encrypt_data(self.g_token)
        self.g_refresh_token = encrypt_data(self.g_refresh_token)
        self.g_client_secret = encrypt_data(self.g_client_secret)
        if self.n_api_key:
            self.n_api_key = encrypt_data(self.n_api_key)
            
    def decrypt_sensitive_data(self):
        """Decrypt sensitive fields using the provided cipher."""
        self.g_token = decrypt_data(self.g_token)
        self.g_refresh_token = decrypt_data(self.g_refresh_token)
        self.g_client_secret = decrypt_data(self.g_client_secret)
        if self.n_api_key:
            self.n_api_key = decrypt_data(self.n_api_key)
        
    @classmethod
    def from_dict(cls, data: T.Dict[str, T.Any]) -> "User":
        return cls(
            email=data["email"],
            is_active=data["is_active"],
            g_token=data["g_token"],
            g_refresh_token=data["g_refresh_token"],
            g_token_uri=data["g_token_uri"],
            g_client_id=data["g_client_id"],
            g_client_secret=data["g_client_secret"],
            g_expiry=data["g_expiry"],
            n_api_key=data.get("n_api_key"),
            n_db_id=data.get("n_db_id"),
            g_calendar_id=data.get("g_calendar_id"),
            last_sync=data.get("last_sync"),
            last_login=data.get("last_login")
        )
        
    def __repr__(self):
        """
        Rappresentazione stringa dell'oggetto per il debug.
        Maschera i dati sensibili per sicurezza.
        """
        return (
            f"<User(email='{self.email}', "
            f"is_active={self.is_active}, "
            f"g_token={self.g_token}, "
            f"g_refresh_token={self.g_refresh_token}, "
            f"expiry='{self.g_expiry}')>"
        )