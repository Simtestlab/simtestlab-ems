"""
EMS Mock Data Services
Replicates the simulation logic from Next.js frontend
"""
import math
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any


class EMSSimulation:
    """Singleton simulation state manager"""
    _instance = None
    _state = None
    _last_update = 0
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._initialize_state()
        return cls._instance
    
    @classmethod
    def _initialize_state(cls):
        """Initialize simulation state"""
        now = time.time() * 1000  # milliseconds
        cls._state = {
            'power': {
                'grid': 0,
                'solar': 0,
                'battery': 0,
                'load': 0,
            },
            'kpis': {
                'batterySOC': 75.0,
                'energyToday': 0,
                'peakPowerToday': 0,
                'costSavings': 0,
                'carbonAvoided': 0,
                'activeSites': 6,
            },
            'charts': {
                'grid': [],
                'solar': [],
                'load': [],
                'battery': [],
            },
            'lastUpdated': now,
        }
        cls._last_update = now
    
    @classmethod
    def _advance_simulation(cls, delta_ms: float):
        """Advance simulation by delta milliseconds"""
        current_time = time.time() * 1000
        now = datetime.now()
        hour = now.hour + now.minute / 60
        
        # Solar generation (6 AM to 6 PM with peak at noon)
        solar_factor = 0
        if 6 <= hour <= 18:
            normalized_time = (hour - 6) / 12
            solar_factor = math.sin(normalized_time * math.pi)
        
        solar_power = 50 * solar_factor * (0.9 + math.sin(current_time / 10000) * 0.1)
        
        # Load consumption (base + time variation)
        base_load = 80
        time_factor = 0.7 + 0.3 * math.sin((hour - 6) / 12 * math.pi)
        load_power = base_load * time_factor * (0.95 + math.sin(current_time / 8000) * 0.05)
        
        # Battery control
        soc = cls._state['kpis']['batterySOC']
        net_power = solar_power - load_power
        
        if net_power > 5 and soc < 95:
            battery_power = min(net_power * 0.8, 25)
            soc += (battery_power * delta_ms / 1000 / 3600) / 100 * 2
        elif net_power < -5 and soc > 15:
            battery_power = max(net_power * 0.8, -25)
            soc += (battery_power * delta_ms / 1000 / 3600) / 100 * 2
        else:
            battery_power = 0
        
        soc = max(10, min(100, soc))
        
        # Grid power (balance)
        grid_power = load_power - solar_power - battery_power
        
        # Update state
        cls._state['power'] = {
            'grid': round(grid_power, 2),
            'solar': round(solar_power, 2),
            'battery': round(battery_power, 2),
            'load': round(load_power, 2),
        }
        cls._state['kpis']['batterySOC'] = round(soc, 2)
        
        # Update KPIs
        delta_hours = delta_ms / 1000 / 3600
        cls._state['kpis']['energyToday'] += load_power * delta_hours
        cls._state['kpis']['peakPowerToday'] = max(
            cls._state['kpis']['peakPowerToday'], 
            load_power
        )
        cls._state['kpis']['costSavings'] += solar_power * delta_hours * 0.15
        cls._state['kpis']['carbonAvoided'] += solar_power * delta_hours * 0.82
        
        # Add to charts
        timestamp = now.isoformat()
        for key in ['grid', 'solar', 'load', 'battery']:
            cls._state['charts'][key].append({
                'timestamp': timestamp,
                'value': cls._state['power'][key]
            })
            # Keep only last 100 points
            if len(cls._state['charts'][key]) > 100:
                cls._state['charts'][key].pop(0)
        
        cls._state['lastUpdated'] = current_time
        cls._last_update = current_time
    
    @classmethod
    def get_state(cls) -> Dict[str, Any]:
        """Get current state, advancing simulation if needed"""
        current_time = time.time() * 1000
        if cls._state is None:
            cls._initialize_state()
        
        delta = current_time - cls._last_update
        if delta > 100:  # Update every 100ms minimum
            cls._advance_simulation(delta)
        
        return cls._state


def get_live_telemetry() -> Dict[str, Any]:
    """Get live telemetry data"""
    state = EMSSimulation.get_state()
    return {
        'gridPower': state['power']['grid'],
        'solarPower': state['power']['solar'],
        'loadPower': state['power']['load'],
        'batteryPower': state['power']['battery'],
        'batterySOC': state['kpis']['batterySOC'],
        'timestamp': datetime.fromtimestamp(state['lastUpdated'] / 1000).isoformat(),
    }


def get_kpis() -> Dict[str, Any]:
    """Get accumulated KPIs"""
    state = EMSSimulation.get_state()
    return {
        'energyToday': round(state['kpis']['energyToday'], 2),
        'peakPower': round(state['kpis']['peakPowerToday'], 2),
        'costSavings': round(state['kpis']['costSavings'], 2),
        'carbonAvoided': round(state['kpis']['carbonAvoided'], 2),
        'activeSites': state['kpis']['activeSites'],
        'timestamp': datetime.fromtimestamp(state['lastUpdated'] / 1000).isoformat(),
    }


def get_charts() -> Dict[str, Any]:
    """Get chart time-series data"""
    state = EMSSimulation.get_state()
    return {
        'grid': state['charts']['grid'],
        'solar': state['charts']['solar'],
        'load': state['charts']['load'],
        'battery': state['charts']['battery'],
        'timestamp': datetime.fromtimestamp(state['lastUpdated'] / 1000).isoformat(),
    }


def get_analytics() -> Dict[str, Any]:
    """Get analytics data"""
    state = EMSSimulation.get_state()
    now = datetime.now()
    
    total_consumption = state['power']['load']
    energy_today = state['kpis']['energyToday']
    peak_demand = state['kpis']['peakPowerToday']
    
    # Consumption breakdown
    consumption_breakdown = {
        'hvac': round(total_consumption * 0.45, 2),
        'lighting': round(total_consumption * 0.25, 2),
        'equipment': round(total_consumption * 0.20, 2),
        'other': round(total_consumption * 0.10, 2),
    }
    
    # Historical comparison
    yesterday_consumption = energy_today * 0.92
    week_consumption = energy_today * 6.5
    last_week_consumption = week_consumption * 0.88
    month_consumption = energy_today * 22
    last_month_consumption = month_consumption * 0.95
    
    daily_change = ((energy_today - yesterday_consumption) / yesterday_consumption) * 100 if yesterday_consumption > 0 else 0
    weekly_change = ((week_consumption - last_week_consumption) / last_week_consumption) * 100 if last_week_consumption > 0 else 0
    monthly_change = ((month_consumption - last_month_consumption) / last_month_consumption) * 100 if last_month_consumption > 0 else 0
    
    # Historical data (last 7 days)
    historical_data = []
    for i in range(6, -1, -1):
        date = now - timedelta(days=i)
        historical_data.append({
            'timestamp': date.isoformat(),
            'value': round(energy_today * (0.9 + (i % 3) * 0.1), 2),
            'category': 'consumption',
        })
    
    return {
        'todayConsumption': round(energy_today, 2),
        'yesterdayConsumption': round(yesterday_consumption, 2),
        'weekConsumption': round(week_consumption, 2),
        'lastWeekConsumption': round(last_week_consumption, 2),
        'monthConsumption': round(month_consumption, 2),
        'lastMonthConsumption': round(last_month_consumption, 2),
        'peakDemand': round(peak_demand, 2),
        'peakDemandTime': now.replace(hour=13, minute=30, second=0).isoformat(),
        'averageLoadFactor': round((total_consumption / peak_demand * 100) if peak_demand > 0 else 0, 2),
        'trends': {
            'daily': {
                'period': 'day',
                'current': round(energy_today, 2),
                'previous': round(yesterday_consumption, 2),
                'change': round(daily_change, 1),
                'isPositive': daily_change > 0,
            },
            'weekly': {
                'period': 'week',
                'current': round(week_consumption, 2),
                'previous': round(last_week_consumption, 2),
                'change': round(weekly_change, 1),
                'isPositive': weekly_change > 0,
            },
            'monthly': {
                'period': 'month',
                'current': round(month_consumption, 2),
                'previous': round(last_month_consumption, 2),
                'change': round(monthly_change, 1),
                'isPositive': monthly_change > 0,
            },
        },
        'historicalData': historical_data,
        'consumptionBreakdown': consumption_breakdown,
    }


def get_alerts() -> List[Dict[str, Any]]:
    """Get system alerts"""
    state = EMSSimulation.get_state()
    now = datetime.now()
    alerts = []
    
    soc = state['kpis']['batterySOC']
    
    # Battery alerts
    if soc < 20:
        alerts.append({
            'id': 'alert-battery-critical',
            'timestamp': now.isoformat(),
            'severity': 'critical',
            'category': 'battery',
            'title': 'Critical Battery Level',
            'message': f'Battery SOC at {round(soc)}%. Immediate charging required.',
            'acknowledged': False,
        })
    elif soc < 30:
        alerts.append({
            'id': 'alert-battery-warning',
            'timestamp': now.isoformat(),
            'severity': 'warning',
            'category': 'battery',
            'title': 'Low Battery Level',
            'message': f'Battery SOC at {round(soc)}%. Consider charging.',
            'acknowledged': False,
        })
    
    # Grid alerts
    grid_power = state['power']['grid']
    if abs(grid_power) > 50:
        alerts.append({
            'id': 'alert-grid-high',
            'timestamp': now.isoformat(),
            'severity': 'warning',
            'category': 'grid',
            'title': 'High Grid Power',
            'message': f'Grid power at {round(abs(grid_power))} kW.',
            'acknowledged': False,
        })
    
    return alerts


def get_tariff() -> Dict[str, Any]:
    """Get tariff information"""
    state = EMSSimulation.get_state()
    now = datetime.now()
    current_hour = now.hour
    
    # Tamil Nadu TANGEDCO commercial rates
    tariff_structure = {
        'peak': 8.5,
        'normal': 6.2,
        'offPeak': 4.5,
        'export': 3.5,
        'demandCharge': 350,
        'fixedCharge': 120,
    }
    
    def get_current_rate(hour):
        if (6 <= hour < 10) or (18 <= hour < 22):
            return tariff_structure['peak'], 'peak'
        elif 22 <= hour or hour < 6:
            return tariff_structure['offPeak'], 'off-peak'
        else:
            return tariff_structure['normal'], 'mid-peak'
    
    current_rate, period_type = get_current_rate(current_hour)
    energy_today = state['kpis']['energyToday']
    cost_savings = state['kpis']['costSavings']
    peak_power_kw = state['kpis']['peakPowerToday']
    
    # Calculate costs
    avg_tariff = (tariff_structure['peak'] + tariff_structure['normal'] + tariff_structure['offPeak']) / 3
    today_cost = max(0, energy_today * avg_tariff * 0.3)
    month_to_date_cost = today_cost * 15
    projected_month_cost = today_cost * 30
    
    # Demand charges
    demand_charge = (peak_power_kw * tariff_structure['demandCharge']) / 30
    peak_demand_cost = demand_charge
    
    # Billing projection
    energy_charges = projected_month_cost
    demand_charges = peak_power_kw * tariff_structure['demandCharge']
    fixed_charges = tariff_structure['fixedCharge']
    taxes = (energy_charges + demand_charges + fixed_charges) * 0.18  # 18% GST
    total = energy_charges + demand_charges + fixed_charges + taxes
    
    # Savings calculation
    baseline_cost = today_cost + cost_savings
    savings_percentage = (cost_savings / baseline_cost * 100) if baseline_cost > 0 else 0
    
    # Tariff schedule
    tariff_schedule = [
        {
            'name': 'Peak Hours',
            'startHour': 6,
            'endHour': 10,
            'rate': tariff_structure['peak'],
            'type': 'peak',
        },
        {
            'name': 'Normal Hours',
            'startHour': 10,
            'endHour': 18,
            'rate': tariff_structure['normal'],
            'type': 'mid-peak',
        },
        {
            'name': 'Peak Hours',
            'startHour': 18,
            'endHour': 22,
            'rate': tariff_structure['peak'],
            'type': 'peak',
        },
        {
            'name': 'Off-Peak Hours',
            'startHour': 22,
            'endHour': 6,
            'rate': tariff_structure['offPeak'],
            'type': 'off-peak',
        },
    ]
    
    # Determine start/end hour for current period
    if period_type == 'peak':
        start_hour = 6 if current_hour < 12 else 18
        end_hour = 10 if current_hour < 12 else 22
    elif period_type == 'mid-peak':
        start_hour = 10
        end_hour = 18
    else:
        start_hour = 22
        end_hour = 6
    
    return {
        'currentRate': {
            'name': f"{period_type.replace('-', ' ').title()} Hours",
            'startHour': start_hour,
            'endHour': end_hour,
            'rate': current_rate,
            'type': period_type,
        },
        'todayCost': round(today_cost, 2),
        'monthToDateCost': round(month_to_date_cost, 2),
        'projectedMonthCost': round(projected_month_cost, 2),
        'savingsVsGrid': round(cost_savings, 2),
        'savingsPercentage': round(savings_percentage, 1),
        'demandCharge': round(demand_charge, 2),
        'peakDemandCost': round(peak_demand_cost, 2),
        'billing': {
            'energyCharges': round(energy_charges, 2),
            'demandCharges': round(demand_charges, 2),
            'fixedCharges': round(fixed_charges, 2),
            'taxes': round(taxes, 2),
            'total': round(total, 2),
            'projectedMonthly': round(total, 2),
        },
        'tariffSchedule': tariff_schedule,
        'costBreakdown': {
            'solar': round(cost_savings * 0.7, 2),  # 70% of savings from solar
            'grid': round(today_cost, 2),
            'battery': round(cost_savings * 0.3, 2),  # 30% of savings from battery
        },
    }


def get_weather() -> Dict[str, Any]:
    """Get weather information"""
    state = EMSSimulation.get_state()
    now = datetime.now()
    current_hour = now.hour
    
    base_temp = 30
    hour_variation = math.sin((current_hour - 6) / 12 * math.pi) * 5
    temperature = base_temp + hour_variation
    
    # Derive cloud cover from solar output
    solar_power = state['power']['solar']
    expected_solar = 50 * (math.sin((current_hour - 6) / 12 * math.pi) if 6 <= current_hour <= 18 else 0)
    cloud_cover = 0 if expected_solar == 0 else max(0, min(100, (1 - solar_power / expected_solar) * 100))
    
    def get_condition(cc, hr):
        if hr < 6 or hr > 19:
            return 'clear'
        if cc < 20:
            return 'clear'
        if cc < 50:
            return 'partly_cloudy'
        if cc < 80:
            return 'cloudy'
        return 'rainy'
    
    def calc_solar_irradiance(hr, cc):
        if hr < 6 or hr > 19:
            return 0
        hour_angle = (hr - 12) / 6
        base_irradiance = 1000 * math.cos(hour_angle * math.pi / 2)
        cloud_factor = 1 - (cc / 100) * 0.7
        return max(0, base_irradiance * cloud_factor)
    
    current = {
        'temperature': round(temperature, 1),
        'feelsLike': round(temperature + 2, 1),
        'humidity': 75,
        'cloudCover': round(cloud_cover),
        'windSpeed': 15,
        'windDirection': 'SE',
        'condition': get_condition(cloud_cover, current_hour),
        'solarIrradiance': round(calc_solar_irradiance(current_hour, cloud_cover)),
        'uvIndex': min(11, round((1 - cloud_cover / 100) * 8 + 3)) if 6 <= current_hour <= 19 else 0,
    }
    
    # Hourly forecast
    hourly_forecast = []
    for i in range(1, 13):
        forecast_hour = (current_hour + i) % 24
        forecast_temp = base_temp + math.sin((forecast_hour - 6) / 12 * math.pi) * 5
        forecast_cc = max(0, min(100, cloud_cover + math.sin(i / 3) * 20))
        
        hourly_forecast.append({
            'hour': f"{forecast_hour:02d}:00",
            'temperature': round(forecast_temp, 1),
            'cloudCover': round(forecast_cc),
            'solarIrradiance': round(calc_solar_irradiance(forecast_hour, forecast_cc)),
        })
    
    return {
        'location': 'Chennai, Tamil Nadu',
        'city': 'Chennai',
        'state': 'Tamil Nadu',
        'timestamp': now.isoformat(),
        'current': current,
        'hourlyForecast': hourly_forecast,
        'sunrise': now.replace(hour=6, minute=30, second=0).isoformat(),
        'sunset': now.replace(hour=18, minute=30, second=0).isoformat(),
    }


def get_sites() -> List[Dict[str, Any]]:
    """Get all sites data"""
    state = EMSSimulation.get_state()
    now = datetime.now()
    
    sites = [
        {'id': 'site-001', 'name': 'Hyderabad Data Center', 'capacity': 1200},
        {'id': 'site-002', 'name': 'Mumbai Manufacturing', 'capacity': 800},
        {'id': 'site-003', 'name': 'Pune Office Complex', 'capacity': 500},
        {'id': 'site-004', 'name': 'Bangalore Tech Park', 'capacity': 1500},
        {'id': 'site-005', 'name': 'Chennai Industrial', 'capacity': 900},
        {'id': 'site-006', 'name': 'Delhi Campus', 'capacity': 600},
    ]
    
    result = []
    for idx, site in enumerate(sites):
        # Vary metrics per site
        variance = 0.8 + (idx * 0.05)
        current_power = state['power']['load'] * variance / len(sites)
        soc = state['kpis']['batterySOC'] + (idx - 3) * 2
        soc = max(10, min(100, soc))
        
        result.append({
            'siteId': site['id'],
            'name': site['name'],
            'currentPower': round(current_power, 2),
            'soc': round(soc, 1),
            'efficiency': round(85 + idx * 2, 1),
            'status': 'online' if soc > 20 else 'warning',
            'timestamp': now.isoformat(),
        })
    
    return result


def get_site_charts(site_id: str) -> Dict[str, Any]:
    """Get charts for a specific site"""
    # For now, return the same chart data as global
    # In production, this would be site-specific
    return get_charts()
