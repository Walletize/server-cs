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

export function getStartDateOfCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = '01'; // The first day of the month

    return `${year}-${month}-${day}`;
};

export function getPreviousPeriod(startDateStr: string, endDateStr: string): { startDate: string, endDate: string } {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const periodDuration = endDate.getTime() - startDate.getTime();

    const prevEndDate = new Date(startDate.getTime() - 1); // One day before the original start date
    const prevStartDate = new Date(prevEndDate.getTime() - periodDuration);

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        startDate: formatDate(prevStartDate),
        endDate: formatDate(prevEndDate),
    };
}

export function getPreviousMonthPeriod() {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    if (month === 0) {
        month = 11;
        year--;
    } else {
        month--;
    }

    const startDate = new Date(year, month, 1);

    const endDate = new Date(year, month + 1, 0); 

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
    };
}