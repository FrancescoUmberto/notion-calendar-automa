import typing as T
import flask

import api.auth

ResourceName = str
EndpointName = str
EndpointMethod = (
    T.Literal["POST"]
    | T.Literal["GET"]
    | T.Literal["DELETE"]
    | T.Literal["PUT"]
    | T.Literal["PATCH"]
)
EndpointSpec = T.Tuple[EndpointName, EndpointMethod]
EndpointFunction = T.Callable[..., flask.Response]

RESOURCES = []
"""Resources: files to witch the system exposes CRUD operations"""

ENDPOINTS: T.Dict[EndpointSpec, EndpointFunction] = {
    ("/login", "GET"): api.auth.login,
    ("/oauth2callback", "GET"): api.auth.oauth2callback,
    ("/logout", "GET"): api.auth.logout,
    ("/", "GET"): api.auth.index,
}
"""List of endpoints not associated with a specific resource"""