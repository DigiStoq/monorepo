// ============================================================================
// PDF TERMS & SIGNATURE COMPONENT
// ============================================================================

import type { Content } from "pdfmake/interfaces";
import type { PDFCompanyInfo, PDFGenerationOptions } from "../types";
import { PDF_THEME, FONT_SIZES } from "../constants";

/**
 * Build the terms & conditions section
 */
export function buildTerms(terms?: string): Content {
  if (!terms) {
    return { text: "", margin: [0, 0, 0, 0] };
  }

  return {
    stack: [
      {
        text: "Terms & Conditions",
        bold: true,
        fontSize: FONT_SIZES.normal,
        color: PDF_THEME.primaryColor,
        margin: [0, 0, 0, 5],
      },
      {
        text: terms,
        fontSize: FONT_SIZES.tiny,
        color: PDF_THEME.mutedColor,
        alignment: "justify",
      },
    ],
  };
}

/**
 * Build the signature section
 */
export function buildSignature(
  companyName: string,
  signatoryName?: string
): Content {
  return {
    stack: [
      {
        text: "Authorized Signatory",
        bold: true,
        fontSize: FONT_SIZES.normal,
        color: PDF_THEME.primaryColor,
        alignment: "center",
        margin: [0, 0, 0, 30],
      },
      {
        canvas: [
          {
            type: "line",
            x1: 20,
            y1: 0,
            x2: 140,
            y2: 0,
            lineWidth: 1,
            lineColor: PDF_THEME.textColor,
          },
        ],
      },
      {
        text: signatoryName ?? companyName,
        fontSize: FONT_SIZES.small,
        alignment: "center",
        margin: [0, 5, 0, 0],
      },
    ],
  };
}

/**
 * Build the bank details section
 */
export function buildBankDetails(
  options: PDFGenerationOptions
): Content | null {
  if (!options.showBankDetails || !options.bankDetails) {
    return null;
  }

  const { bankDetails } = options;

  return {
    stack: [
      {
        text: "Bank Details",
        bold: true,
        fontSize: FONT_SIZES.normal,
        color: PDF_THEME.primaryColor,
        margin: [0, 0, 0, 5],
      },
      {
        table: {
          widths: [80, "*"],
          body: [
            [
              { text: "Account Name:", fontSize: FONT_SIZES.tiny, bold: true },
              { text: bankDetails.accountName, fontSize: FONT_SIZES.tiny },
            ],
            [
              { text: "Account No:", fontSize: FONT_SIZES.tiny, bold: true },
              { text: bankDetails.accountNumber, fontSize: FONT_SIZES.tiny },
            ],
            [
              { text: "Bank:", fontSize: FONT_SIZES.tiny, bold: true },
              { text: bankDetails.bankName, fontSize: FONT_SIZES.tiny },
            ],
            ...(bankDetails.branchName
              ? [
                  [
                    { text: "Branch:", fontSize: FONT_SIZES.tiny, bold: true },
                    { text: bankDetails.branchName, fontSize: FONT_SIZES.tiny },
                  ],
                ]
              : []),
            ...(bankDetails.swiftCode
              ? [
                  [
                    { text: "SWIFT:", fontSize: FONT_SIZES.tiny, bold: true },
                    { text: bankDetails.swiftCode, fontSize: FONT_SIZES.tiny },
                  ],
                ]
              : []),
          ],
        },
        layout: "noBorders",
      },
    ],
  };
}

/**
 * Build the complete footer section with terms, bank details, and signature
 */
export function buildTermsAndSignature(
  terms: string | undefined,
  company: PDFCompanyInfo,
  options: PDFGenerationOptions
): Content {
  const leftContent: Content[] = [];
  const rightContent: Content[] = [];

  // Left side: Terms & Conditions
  if (options.showTerms && terms) {
    leftContent.push(buildTerms(terms));
  }

  // Left side: Bank details (below terms)
  const bankDetails = buildBankDetails(options);
  if (bankDetails) {
    // Wrap bank details with margin in a container
    leftContent.push({
      stack: [bankDetails],
      margin: [0, 15, 0, 0],
    });
  }

  // Right side: Signature
  if (options.showSignature) {
    rightContent.push(buildSignature(company.name, company.contactPerson));
  }

  // If nothing to show, return empty
  if (leftContent.length === 0 && rightContent.length === 0) {
    return { text: "", margin: [0, 0, 0, 0] };
  }

  return {
    columns: [
      {
        width: "*",
        stack: leftContent.length > 0 ? leftContent : [{ text: "" }],
      },
      {
        width: 180,
        stack: rightContent.length > 0 ? rightContent : [{ text: "" }],
        alignment: "right",
      },
    ],
    margin: [0, 10, 0, 0],
  };
}
