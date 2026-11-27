from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.models import Provider
from app.middleware.roles import roles_required
from app.services.analytics_service import (
    parse_reporting_period,
    build_provider_analytics
)


analytics_bp = Blueprint(
    "analytics",
    __name__,
    url_prefix="/api/provider/analytics"
)


@analytics_bp.route("", methods=["GET"])
@roles_required("provider")
def get_analytics():
    user_id = int(get_jwt_identity())

    provider = Provider.query.filter_by(
        user_id=user_id
    ).first()

    if provider is None:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    try:
        start, end = parse_reporting_period(request.args)
    except (ValueError, OverflowError) as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    analytics = build_provider_analytics(
        provider.id,
        start,
        end
    )

    return jsonify({
        "success": True,
        "provider": {
            "id": provider.id,
            "business_name": provider.business_name
        },
        "analytics": analytics
    }), 200
