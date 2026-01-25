"""
EMS API Views
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .services import (
    get_live_telemetry,
    get_kpis,
    get_charts,
    get_analytics,
    get_alerts,
    get_tariff,
    get_weather,
    get_sites,
    get_site_charts,
)


@api_view(['GET'])
def health_check(request):
    """
    GET /api/health
    Health check endpoint - returns 200 OK if backend is running
    """
    return Response({
        'status': 'healthy',
        'service': 'EMS API',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def live_telemetry(request):
    """
    GET /api/ems/live
    Returns real-time power values and battery SOC
    """
    try:
        data = get_live_telemetry()
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def kpis(request):
    """
    GET /api/ems/kpis
    Returns accumulated business metrics and KPIs
    """
    try:
        data = get_kpis()
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def charts(request):
    """
    GET /api/ems/charts
    Returns time-series data for charts
    """
    try:
        data = get_charts()
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def analytics(request):
    """
    GET /api/ems/analytics
    Returns analytics and consumption breakdown
    """
    try:
        data = get_analytics()
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def alerts(request):
    """
    GET /api/ems/alerts
    Returns system alerts
    """
    try:
        data = get_alerts()
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def tariff(request):
    """
    GET /api/ems/tariff
    Returns tariff information and cost analysis
    """
    try:
        data = get_tariff()
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def weather(request):
    """
    GET /api/ems/weather
    Returns weather information
    """
    try:
        data = get_weather()
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def sites_list(request):
    """
    GET /api/ems/sites
    Returns list of all sites with metrics
    """
    try:
        data = get_sites()
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def site_charts(request, site_id):
    """
    GET /api/ems/sites/{site_id}/charts
    Returns chart data for a specific site
    """
    try:
        data = get_site_charts(site_id)
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

