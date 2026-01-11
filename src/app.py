from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return "Notion-GCal Sync is Live! (Verifica Google OK)"

@app.route('/webhook', methods=['POST', 'GET'])
def webhook():
    return jsonify(status="listening"), 200

app.debug = True