"""
Entrypoint of flask application
"""
import os
from flask_restful import Api
from flask import redirect, Flask, jsonify
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS

from api import RESOURCES, ENDPOINTS

SWAGGER_URL = "/docs"
API_URL = "/docs/swagger.json"

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super_secret_dev_key_change_me")
"""Flask application"""

api = Api(app, default_mediatype="application/xml")
"""Flask RESTful API"""

CORS(app)
"""Enable CORS for application"""

# For each resource defined, add the corresponding endpoint for CRUD operations
# plus the docs into openapi
for res in RESOURCES:
    api.add_resource(
        res, f"/{res.resource_type}", f"/{res.resource_type}" "/<resource_id>"
    )

# For each endpoint defined, add it into the application endpoints
for k, v in ENDPOINTS.items():
    app.route(k[0], methods=[k[1]])(v)


# Add swagger documentation into the application
@app.route("/")
def home():
    """
    Redirect to swagger documentation
    """
    return redirect("/docs", code=302)

# Add swagger documentation into the application using flask_swagger_ui
swagger_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        "docExpansion": "None",
    },
)
app.register_blueprint(swagger_blueprint, url_prefix=SWAGGER_URL)


if __name__ == "__main__":
    app.run(debug=True, port=8000, host="0.0.0.0")
