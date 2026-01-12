// ============================================================================
// NUMBER TO WORDS CONVERTER
// ============================================================================

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertHundreds(num: number): string {
  if (num === 0) return "";

  if (num < 20) {
    return ones[num] ?? "";
  }

  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return (tens[ten] ?? "") + (one ? " " + (ones[one] ?? "") : "");
  }

  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  return (
    (ones[hundred] ?? "") + " Hundred" + (remainder ? " " + convertHundreds(remainder) : "")
  );
}

function convertWholeNumber(num: number): string {
  if (num === 0) return "Zero";

  let result = "";

  // Crores (10 million)
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    result += convertHundreds(crores) + " Crore ";
    num %= 10000000;
  }

  // Lakhs (100 thousand)
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    result += convertHundreds(lakhs) + " Lakh ";
    num %= 100000;
  }

  // Thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    result += convertHundreds(thousands) + " Thousand ";
    num %= 1000;
  }

  // Hundreds and below
  if (num > 0) {
    result += convertHundreds(num);
  }

  return result.trim();
}

/**
 * Convert a number to words for currency display
 * @param amount - The amount to convert
 * @param currency - Currency name (default: "Dollars")
 * @param cents - Cents/paise name (default: "Cents")
 * @returns Amount in words (e.g., "Five Thousand Two Hundred Dollars and Fifty Cents Only")
 */
export function numberToWords(
  amount: number,
  currency = "Dollars",
  cents = "Cents"
): string {
  if (amount === 0) return `Zero ${currency} Only`;

  const wholePart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - wholePart) * 100);

  let result = convertWholeNumber(wholePart) + ` ${currency}`;

  if (decimalPart > 0) {
    result += ` and ${convertWholeNumber(decimalPart)} ${cents}`;
  }

  return result + " Only";
}

/**
 * Convert a number to words for PKR (Pakistani Rupees)
 */
export function numberToWordsPKR(amount: number): string {
  return numberToWords(amount, "Rupees", "Paisa");
}

/**
 * Convert a number to words for INR (Indian Rupees)
 */
export function numberToWordsINR(amount: number): string {
  return numberToWords(amount, "Rupees", "Paise");
}

/**
 * Convert a number to words for USD
 */
export function numberToWordsUSD(amount: number): string {
  return numberToWords(amount, "Dollars", "Cents");
}
