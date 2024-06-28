import { prisma } from "../app";
import { ExchangeRateApiResponse } from "../types/ExchangeRateApiRes";

export async function updateCurrencyRates() {
    console.log('Started scheduled task');
    try {
        const fetchRates = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/USD`);
        const rates: ExchangeRateApiResponse = await fetchRates.json();

        if (rates.result === 'success') {
            const currencies = await prisma.currency.findMany();

            for (const currency of currencies) {
                await prisma.currency.update({
                    where: {
                        code: currency.code,
                    },
                    data: {
                        rate: rates.conversion_rates[currency.code]
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error in scheduled task:', error);
    }
}