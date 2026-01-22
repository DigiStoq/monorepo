import { useCallback } from "react";
import { useCompanySettings } from "./useSettings";
import { useUserPreferences } from "./useUserPreferences";

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "ILS", symbol: "₪", name: "Israeli New Shekel" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
];

export function useCurrency(): {
  currencyCode: string;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
  symbol: string;
} {
  const { settings, isLoading } = useCompanySettings();

  const currencyCode = settings?.currency ?? "USD";
  const locale = settings?.locale ?? "en-US";

  const { preferences } = useUserPreferences();

  const formatCurrency = useCallback(
    (value: number) => {
      try {
        const decimals = preferences?.numberFormat?.decimalPlaces ?? 2; // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- preferences may be loading
        // prettier-ignore
        const decimalSeparator = preferences?.numberFormat?.decimalSeparator ?? "."; // eslint-disable-line @typescript-eslint/no-unnecessary-condition
        // prettier-ignore
        const thousandsSeparator = preferences?.numberFormat?.thousandsSeparator ?? ","; // eslint-disable-line @typescript-eslint/no-unnecessary-condition

        const formatter = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currencyCode,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });

        // If no custom separators are set (or defaults), just use standard formatter
        // Actually, we should always respect the robust preferences if we want consistency
        // But 'preferences' might be loading.
        // We can use formatToParts for precise control.

        const parts = formatter.formatToParts(value);

        return parts
          .map((part) => {
            if (part.type === "decimal") return decimalSeparator;
            if (part.type === "group") return thousandsSeparator;
            return part.value;
          })
          .join("");
      } catch (error) {
        // Fallback for invalid currency codes
        console.warn(`Invalid currency code: ${currencyCode}`, error);
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "USD",
        }).format(value);
      }
    },
    [currencyCode, locale, preferences]
  );

  return {
    currencyCode,
    formatCurrency,
    isLoading,
    symbol:
      SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? "$",
  };
}
