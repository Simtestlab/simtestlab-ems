import { Alert, AlertSeverity, AlertCategory, AlertStats } from '@/domain/entities/alert.entity';
import { RealtimeMetrics } from '@/domain/entities/metrics.entity';

export class MockAlertsGenerator {
  private alerts: Alert[] = [];
  private alertIdCounter = 1;

  generateAlerts(metrics: RealtimeMetrics | null, siteId: string = 'site-1'): Alert[] {
    if (!metrics) return this.alerts;
    
    const newAlerts: Alert[] = [];
    const timestamp = new Date();

    // Critical: Battery SOC below 20%
    if (metrics.storage.soc < 20) {
      newAlerts.push({
        id: `alert-${this.alertIdCounter++}`,
        timestamp,
        severity: 'critical',
        category: 'battery',
        title: 'Critical Battery Level',
        message: `Battery SOC at ${Math.round(metrics.storage.soc)}%. Immediate charging required.`,
        acknowledged: false,
        siteId,
      });
    }

    // Warning: Battery SOC below 30%
    if (metrics.storage.soc >= 20 && metrics.storage.soc < 30) {
      newAlerts.push({
        id: `alert-${this.alertIdCounter++}`,
        timestamp,
        severity: 'warning',
        category: 'battery',
        title: 'Low Battery Level',
        message: `Battery SOC at ${Math.round(metrics.storage.soc)}%. Consider charging soon.`,
        acknowledged: false,
        siteId,
      });
    }

    // Critical: Battery temperature above 45°C
    if (metrics.storage.temperature > 45) {
      newAlerts.push({
        id: `alert-${this.alertIdCounter++}`,
        timestamp,
        severity: 'critical',
        category: 'battery',
        title: 'High Battery Temperature',
        message: `Battery temperature at ${Math.round(metrics.storage.temperature)}°C. Risk of damage.`,
        acknowledged: false,
        siteId,
      });
    }

    // Warning: Battery temperature above 40°C
    if (metrics.storage.temperature > 40 && metrics.storage.temperature <= 45) {
      newAlerts.push({
        id: `alert-${this.alertIdCounter++}`,
        timestamp,
        severity: 'warning',
        category: 'battery',
        title: 'Elevated Battery Temperature',
        message: `Battery temperature at ${Math.round(metrics.storage.temperature)}°C. Monitor closely.`,
        acknowledged: false,
        siteId,
      });
    }

    // Warning: High grid import (> 400 kW)
    if (metrics.grid.activePower > 400) {
      newAlerts.push({
        id: `alert-${this.alertIdCounter++}`,
        timestamp,
        severity: 'warning',
        category: 'grid',
        title: 'High Grid Import',
        message: `Importing ${metrics.grid.activePower.toFixed(1)} kW from grid. Check solar production.`,
        acknowledged: false,
        siteId,
      });
    }

    // Info: High solar production (> 350 kW)
    if (metrics.solar.activePower > 350) {
      newAlerts.push({
        id: `alert-${this.alertIdCounter++}`,
        timestamp,
        severity: 'info',
        category: 'solar',
        title: 'Excellent Solar Production',
        message: `Solar generating ${metrics.solar.activePower.toFixed(1)} kW. Peak performance.`,
        acknowledged: false,
        siteId,
      });
    }

    // Warning: High consumption (> 350 kW)
    if (metrics.consumption.activePower > 350) {
      newAlerts.push({
        id: `alert-${this.alertIdCounter++}`,
        timestamp,
        severity: 'warning',
        category: 'consumption',
        title: 'High Power Consumption',
        message: `Load at ${metrics.consumption.activePower.toFixed(1)} kW. Above normal levels.`,
        acknowledged: false,
        siteId,
      });
    }

    // Add new alerts to the list and keep last 20
    this.alerts = [...newAlerts, ...this.alerts].slice(0, 20);
    
    return this.alerts;
  }

  getAlertStats(): AlertStats {
    const critical = this.alerts.filter(a => !a.acknowledged && a.severity === 'critical').length;
    const warning = this.alerts.filter(a => !a.acknowledged && a.severity === 'warning').length;
    const info = this.alerts.filter(a => !a.acknowledged && a.severity === 'info').length;

    return {
      critical,
      warning,
      info,
      total: critical + warning + info,
    };
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  clearAcknowledged(): void {
    this.alerts = this.alerts.filter(a => !a.acknowledged);
  }
}

export const mockAlertsGenerator = new MockAlertsGenerator();
