// ============================================================================
// PDF HEADER COMPONENT
// ============================================================================

import type { Content } from "pdfmake/interfaces";
import type { PDFCompanyInfo } from "../types";
import { PDF_THEME, FONT_SIZES } from "../constants";

/**
 * Build the document title (Bill/ Cash Memo) - appears above the main border
 */
export function buildDocumentTitle(title: string): Content {
  return {
    text: title,
    fontSize: FONT_SIZES.documentTitle,
    bold: true,
    alignment: "center",
    margin: [0, 0, 0, 5],
  };
}

/**
 * Build the company header section
 * - Left side: Logo (if available) OR Company name in purple
 * - Right side: Address on line 1, Phone + Email on line 2
 */
export function buildHeader(
  company: PDFCompanyInfo,
  showLogo: boolean
): Content {
  const leftColumn: Content[] = [];
  const rightColumn: Content[] = [];

  // Left side: Logo or Company Name
  if (showLogo && company.logoBase64) {
    leftColumn.push({
      image: company.logoBase64,
      width: 120,
    });
  } else {
    // Show company name as large text
    leftColumn.push({
      text: company.name,
      fontSize: FONT_SIZES.title,
      bold: true,
      color: PDF_THEME.primaryColor,
    });
  }

  // Right side: Address on first row
  const addressParts: string[] = [];
  if (company.address?.street) addressParts.push(company.address.street);
  if (company.address?.city) addressParts.push(company.address.city);
  if (company.address?.state) addressParts.push(company.address.state);
  if (company.address?.postalCode)
    addressParts.push(company.address.postalCode);

  if (addressParts.length > 0) {
    rightColumn.push({
      text: addressParts.join(", "),
      fontSize: FONT_SIZES.small,
      alignment: "right",
    });
  }

  // Right side: Phone and Email on second row
  const contactParts: string[] = [];
  if (company.phone) contactParts.push(`Phone no.: ${company.phone}`);
  if (company.email) contactParts.push(`Email: ${company.email}`);

  if (contactParts.length > 0) {
    rightColumn.push({
      text: contactParts.join(" "),
      fontSize: FONT_SIZES.small,
      alignment: "right",
      margin: [0, 2, 0, 0],
    });
  }

  return {
    table: {
      widths: ["50%", "50%"],
      body: [
        [
          {
            stack: leftColumn,
            margin: [4, 4, 4, 4],
            border: [true, true, false, true],
          },
          {
            stack: rightColumn,
            margin: [4, 4, 4, 4],
            border: [false, true, true, true],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => PDF_THEME.borderColor,
      vLineColor: () => PDF_THEME.borderColor,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 0],
  };
}
