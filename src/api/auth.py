import os
import json
import typing as T
import datetime
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1' 
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
from flask import Flask, redirect, request, url_for, session, render_template_string
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from core.auth import CalendarAuth, SCOPES
from utils.log import Logger
import storage

_log = Logger("auth-api")
CREDENTIALS_FILE = 'credentials.json'

auth_manager = CalendarAuth()

# NOTE: Ensure you have set a secret_key for Flask sessions if you want to track multiple users
# app.secret_key = 'your_secret_key' 

def login():
    """
    Starts Google OAuth2 flow.
    """
    flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES,
        redirect_uri=url_for('oauth2callback', _external=True)
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent' 
    )
    
    return redirect(authorization_url)

def oauth2callback():
    """Rotta di ritorno da Google."""
    state = request.args.get('state')
    code = request.args.get('code')
    
    try:
        flow = Flow.from_client_secrets_file(
            CREDENTIALS_FILE,
            scopes=SCOPES,
            redirect_uri=url_for('oauth2callback', _external=True)
        )
        
        flow.fetch_token(code=code)
        
        # 1. Login nel Core (Salva/Aggiorna DB)
        email = auth_manager.login_user(flow.credentials)
        
        # 2. SALVA NELLA SESSIONE (Il Browser ora ricorderà chi è)
        session['user_email'] = email
        session.permanent = True # Opzionale: la sessione dura anche se chiudi il browser (default 31 giorni)
            
        return redirect(url_for('index'))
        
    except Exception as e:
        _log.error(f"Auth Error: {e}")
        return f"Errore: {e}"
    
def index():
    """Pagina Home protetta."""
    
    # 1. CONTROLLA LA SESSIONE
    # Se non c'è 'user_email' nella sessione, l'utente è anonimo.
    user_email = session.get('user_email')
    
    if not user_email:
        # Nessun cookie -> Nessun accesso -> Mostra link login
        return 'Non sei autenticato. <a href="/login">Clicca qui per fare il login con Google</a>'
    
    # 2. CARICA L'UTENTE SPECIFICO
    # Ora passiamo l'email specifica. Se l'email non è nel DB (caso raro), creds sarà None.
    creds = auth_manager.load_credentials(email=user_email)
    
    if not creds or not creds.valid:
        # Sessione vecchia o token revocato -> Pulisci sessione e ri-login
        session.clear()
        return 'Sessione scaduta o invalida. <a href="/login">Rifai il login</a>'
    
    # Se siamo qui, sei TU e sei loggato.
    html_out = f"<p>Benvenuto, <b>{user_email}</b>! <a href='/logout'>Logout</a></p>"
    html_out += get_upcoming_events(creds)
    return html_out

def logout():
    session.clear() # Cancella il cookie
    return redirect(url_for('index'))

def get_upcoming_events(creds):
    """Helper to display events."""
    try:
        service = build("calendar", "v3", credentials=creds)
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        events_result = service.events().list(
            calendarId="primary", timeMin=now,
            maxResults=10, singleEvents=True,
            orderBy="startTime"
        ).execute()
        
        events = events_result.get("items", [])
        
        if not events:
            return "Login effettuato (DB)! Nessun evento trovato prossimamente."
            
        output = "<h1>Prossimi 10 Eventi (da MongoDB):</h1><ul>"
        for event in events:
            start = event["start"].get("dateTime", event["start"].get("date"))
            output += f"<li>{start} - {event['summary']}</li>"
        output += "</ul>"
        
        return output

    except Exception as error:
        return f"An error occurred calling API: {error}"