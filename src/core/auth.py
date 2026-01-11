import os
import json
import datetime
import typing as T

# Disabilita HTTPS per localhost
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from google.auth.exceptions import RefreshError

import storage
from core.user import User
from utils.log import Logger

# Configurazione
SCOPES = [
    "https://www.googleapis.com/auth/calendar", 
    "https://www.googleapis.com/auth/userinfo.email",
    "openid"
]

_log = Logger("calendar-auth")

class CalendarAuth:
    def __init__(self):
        self.db = storage.get()
        self.collection = "users"

    def _get_user_email(self, creds) -> str:
        """Helper to fetch the email address associated with the credentials."""
        try:
            service = build('oauth2', 'v2', credentials=creds)
            user_info = service.userinfo().get().execute()
            return user_info.get('email')
        except Exception as e:
            print(f"Error fetching user email: {e}")
            raise e

    def login_user(self, creds: Credentials):
        """
        Creates a User object from Google Credentials, encrypts it, 
        and saves/updates it in MongoDB.
        """
        # Fetch the email (Identifier)
        email = self._get_user_email(creds)
        
        # Create the User Object
        user = User(
            email=email,
            is_active=True,
            g_token=creds.token,
            g_refresh_token=creds.refresh_token,
            g_token_uri=creds.token_uri,
            g_client_id=creds.client_id,
            g_client_secret=creds.client_secret,
            g_expiry=creds.expiry.isoformat() if creds.expiry else None,
            last_login=datetime.datetime.utcnow().isoformat()
        )

        # 3. Encrypt Sensitive Data
        user.encrypt_sensitive_data()

        # 4. Prepare data for DB
        user_data = user.to_dict()

        # 5. Upsert into MongoDB (Update if exists, Insert if new)
        existing_user = self.db.read(self.collection, {"email": email})
        
        if existing_user:
            self.db.update(self.collection, {"email": email}, user_data)
            _log.info(f"User {email} updated successfully.")
        else:
            self.db.create(self.collection, user_data)
            _log.info(f"User {email} created successfully.")
            
        return email

    def load_credentials(self, email: str) -> T.Optional[Credentials]:
        if not email:
            _log.error("ERRORE: Email è None in load_credentials")
            return None

        # 1. Verifica lettura DB
        query = {"email": email}
        user_data = self.db.read(self.collection, query)
        
        if not user_data:
            _log.error(f"ERRORE: Utente {email} non trovato nel database.")
            return None

        user = User.from_dict(user_data)
        # 2. Verifica Decriptazione
        try:
            user.decrypt_sensitive_data()   
            _log.debug(f"User after decryption: {user}")

        except Exception as e:
            _log.error(f"ERRORE CRITICO DECRIPTAZIONE per {email}: {e}")
            _log.error("Suggerimento: La chiave di criptazione è cambiata rispetto a quando hai salvato i dati?")
            return None