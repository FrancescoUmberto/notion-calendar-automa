import os
import json
from dotenv import load_dotenv
from cryptography.fernet import Fernet

load_dotenv()

def get_cipher():
    """Recupera la chiave di cifratura dall'ambiente"""
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise ValueError("Manca la variabile d'ambiente ENCRYPTION_KEY per la sicurezza")
    return Fernet(key.encode())

def encrypt_data(data_dict):
    """Prende un dizionario, lo trasforma in stringa e lo cifra"""
    cipher = get_cipher()
    json_str = json.dumps(data_dict)
    return cipher.encrypt(json_str.encode()).decode()

def decrypt_data(encrypted_str):
    """Prende una stringa cifrata e restituisce il dizionario originale"""
    if not encrypted_str:
        return None
    cipher = get_cipher()
    decrypted_json = cipher.decrypt(encrypted_str.encode()).decode()
    return json.loads(decrypted_json)


if __name__ == "__main__":
    # Test the encryption and decryption functions
    sample_data = {"email": "user@example.com"}
    encrypted = encrypt_data(sample_data)
    print(f"Encrypted: {encrypted}")
    decrypted = decrypt_data(encrypted)
    print(f"Decrypted: {decrypted}")