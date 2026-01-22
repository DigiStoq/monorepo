// ============================================================================
// PDF AMOUNT IN WORDS COMPONENT
// ============================================================================

import type { Content } from "pdfmake/interfaces";
import { PDF_THEME, FONT_SIZES } from "../constants";
import { numberToWords } from "../utils/number-to-words";

/**
 * Build the amount in words section
 */
export function buildAmountInWords(
  amount: number,
  currency = "Dollars",
  cents = "Cents"
): Content {
  const amountWords = numberToWords(amount, currency, cents);

  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: [
              {
                text: "Amount in Words: ",
                bold: true,
                fontSize: FONT_SIZES.small,
              },
              { text: amountWords, italics: true, fontSize: FONT_SIZES.small },
            ],
            margin: [8, 6, 8, 6],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => PDF_THEME.borderColor,
      vLineColor: () => PDF_THEME.borderColor,
    },
    margin: [0, 0, 0, 15],
  };
}

/**
 * Build amount in words without border
 */
export function buildAmountInWordsSimple(
  amount: number,
  currency = "Dollars",
  cents = "Cents"
): Content {
  const amountWords = numberToWords(amount, currency, cents);

  return {
    text: [
      { text: "Amount in Words: ", bold: true },
      { text: amountWords, italics: true },
    ],
    fontSize: FONT_SIZES.small,
    margin: [0, 5, 0, 15],
  };
}
