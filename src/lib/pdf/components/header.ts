// ============================================================================
// PDF HEADER COMPONENT
// ============================================================================

import type { Content } from "pdfmake/interfaces";
import type { PDFCompanyInfo } from "../types";
import { PDF_THEME, FONT_SIZES } from "../constants";
import { formatAddress } from "../utils/format-helpers";

/**
 * Build the company header section
 * - Left side: Logo (if available) OR Company name in purple
 * - Right side: Contact person, phone, email
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
      margin: [0, 0, 0, 5],
    });
    // Also show company name below logo
    leftColumn.push({
      text: company.name,
      fontSize: FONT_SIZES.header,
      bold: true,
      color: PDF_THEME.primaryColor,
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

  // Add legal name if different
  if (company.legalName && company.legalName !== company.name) {
    leftColumn.push({
      text: company.legalName,
      fontSize: FONT_SIZES.small,
      color: PDF_THEME.mutedColor,
      margin: [0, 2, 0, 0],
    });
  }

  // Add company address
  if (company.address) {
    const addressStr = formatAddress(company.address);
    if (addressStr) {
      leftColumn.push({
        text: addressStr,
        fontSize: FONT_SIZES.small,
        color: PDF_THEME.mutedColor,
        margin: [0, 5, 0, 0],
      });
    }
  }

  // Right side: Contact info
  if (company.contactPerson) {
    rightColumn.push({
      text: company.contactPerson,
      fontSize: FONT_SIZES.normal,
      alignment: "right",
      bold: true,
    });
  }

  if (company.phone) {
    rightColumn.push({
      text: company.phone,
      fontSize: FONT_SIZES.small,
      alignment: "right",
      color: PDF_THEME.mutedColor,
      margin: [0, 2, 0, 0],
    });
  }

  if (company.email) {
    rightColumn.push({
      text: company.email,
      fontSize: FONT_SIZES.small,
      alignment: "right",
      color: PDF_THEME.mutedColor,
      margin: [0, 2, 0, 0],
    });
  }

  if (company.taxId) {
    rightColumn.push({
      text: `Tax ID: ${company.taxId}`,
      fontSize: FONT_SIZES.small,
      alignment: "right",
      color: PDF_THEME.mutedColor,
      margin: [0, 5, 0, 0],
    });
  }

  return {
    columns: [
      { width: "60%", stack: leftColumn },
      { width: "40%", stack: rightColumn },
    ],
    margin: [0, 0, 0, 15],
  };
}
