"""
EMS API URLs
"""
from django.urls import path
from . import views

app_name = 'ems_api'

urlpatterns = [
    path('live', views.live_telemetry, name='live'),
    path('kpis', views.kpis, name='kpis'),
    path('charts', views.charts, name='charts'),
    path('analytics', views.analytics, name='analytics'),
    path('alerts', views.alerts, name='alerts'),
    path('tariff', views.tariff, name='tariff'),
    path('weather', views.weather, name='weather'),
    path('sites', views.sites_list, name='sites'),
    path('sites/<str:site_id>/charts', views.site_charts, name='site_charts'),
]
