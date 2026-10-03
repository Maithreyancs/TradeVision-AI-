import prisma from '../database/prismaClient.js';
import { MarketQuote } from '../providers/MarketDataProvider.js';
import { broadcastAlertTriggered } from '../websocket/marketSocket.js';

export class AlertService {
  public static async checkAlertsForQuote(quote: MarketQuote) {
    try {
      const activeAlerts = await prisma.priceAlert.findMany({
        where: {
          symbol: quote.symbol,
          isActive: true,
          isTriggered: false,
        },
      });

      for (const alert of activeAlerts) {
        let isTriggered = false;

        switch (alert.condition) {
          case 'ABOVE':
            if (quote.price >= alert.targetValue) isTriggered = true;
            break;
          case 'BELOW':
            if (quote.price <= alert.targetValue) isTriggered = true;
            break;
          default:
            break;
        }

        if (isTriggered) {
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: {
              isTriggered: true,
              triggeredAt: new Date(),
              isActive: false,
            },
          });

          // Broadcast alert to connected socket clients
          broadcastAlertTriggered({
            alertId: alert.id,
            symbol: quote.symbol,
            condition: alert.condition,
            targetValue: alert.targetValue,
            currentPrice: quote.price,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (e: any) {
      console.warn('[AlertService] Error checking alerts:', e.message);
    }
  }
}
