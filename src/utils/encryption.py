import os
import json
from dotenv import load_dotenv
from cryptography.fernet import Fernet

load_dotenv()

# --- SECURITY (Encryption) ---
def _get_cipher():
    """Retrieves the encryption key from the environment"""
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise ValueError("ENCRYPTION_KEY environment variable is missing for security")
    return Fernet(key.encode())

def encrypt_data(data_dict):
    """Takes a dictionary, converts it to a string, and encrypts it"""
    cipher = _get_cipher()
    json_str = json.dumps(data_dict)
    return cipher.encrypt(json_str.encode()).decode()

def decrypt_data(encrypted_str):
    """Takes an encrypted string and returns the original dictionary"""
    if not encrypted_str:
        return None
    cipher = _get_cipher()
    decrypted_json = cipher.decrypt(encrypted_str.encode()).decode()
    return json.loads(decrypted_json)