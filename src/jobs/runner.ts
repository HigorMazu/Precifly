/**
 * Jobs arquitetura — tarefas locais/mock não bloqueiam requests HTTP
 */
import prisma from "@/lib/prisma";
import { logJob, logError } from "@/lib/logger";

export async function jobUpdatePrices() {
  logJob("updatePrices iniciado");
  try {
    const products = await prisma.product.findMany({ include: { offers: true } });
    for (const p of products) {
      for (const o of p.offers) {
        // simula variação +-3%
        const current = Number(o.price);
        const variation = (Math.random() - 0.5) * 0.06;
        const newPrice = Number((current * (1 + variation)).toFixed(2));
        await prisma.offer.update({ where: { id: o.id }, data: { price: newPrice, collectedAt: new Date() } });
        await prisma.priceHistory.create({ data: { productId: p.id, storeId: o.storeId, price: newPrice } });
      }
    }
    logJob("updatePrices concluído", { products: products.length });
  } catch (e) {
    logError("updatePrices falhou", e);
  }
}

export async function jobCheckAlerts() {
  logJob("checkAlerts iniciado");
  try {
    const alerts = await prisma.priceAlert.findMany({ where: { isActive: true }, include: { product: { include: { offers: true } } } });
    for (const alert of alerts) {
      const minPrice = Math.min(...alert.product.offers.map((o) => Number(o.price)));
      let triggered = false;
      if (alert.type === "PRICE_BELOW" && minPrice <= Number(alert.threshold)) triggered = true;
      if (alert.type === "PERCENT_DROP") {
        // threshold é percentual, ex: 10 => dispara se preço caiu 10% vs média 30d
        // simplificado
        const avg = alert.product.offers.reduce((s, o) => s + Number(o.price), 0) / alert.product.offers.length;
        const drop = ((avg - minPrice) / avg) * 100;
        if (drop >= Number(alert.threshold)) triggered = true;
      }
      if (triggered) {
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: "PRICE_ALERT",
            title: `Alerta: ${alert.product.name}`,
            message: `Preço atingiu ${minPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — seu limite é ${Number(alert.threshold).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
          },
        });
      }
    }
    logJob("checkAlerts concluído", { alerts: alerts.length });
  } catch (e) {
    logError("checkAlerts falhou", e);
  }
}

// Para chamada via API route /api/jobs (opcional)
export async function runAllJobs() {
  await jobUpdatePrices();
  await jobCheckAlerts();
}
