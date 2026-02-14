
export interface PDFInvoiceData {
    documentTitle: string; // "INVOICE", "ESTIMATE", "RECEIPT"
    documentNumber: string;
    date: string;
    dueDate?: string;
    
    companyName: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyWebsite?: string;
    companyLogo?: string; // Base64 or URL

    customerName: string;
    customerAddress?: string;
    customerPhone?: string;
    customerEmail?: string;

    items: {
        description: string;
        quantity: number;
        rate: number;
        amount: number;
    }[];

    subtotal: number;
    taxTotal?: number;
    discountTotal?: number;
    total: number;
    amountPaid?: number;
    balanceDue?: number;

    currencySymbol: string;
    notes?: string;
    terms?: string;
}

export const generateInvoiceHTML = (data: PDFInvoiceData) => {
    const {
        documentTitle,
        documentNumber,
        date,
        dueDate,
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        companyLogo,
        customerName,
        customerAddress,
        customerPhone,
        customerEmail,
        items,
        subtotal,
        taxTotal,
        discountTotal,
        total,
        amountPaid,
        balanceDue,
        currencySymbol,
        notes,
        terms
    } = data;

    const formatMoney = (amount = 0) => {
        return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: 100%; }
        .invoice-box { width: 100%; max-width: 100%; margin: auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); background: #fff; box-sizing: border-box; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company-info { text-align: right; }
        .logo { max-width: 150px; max-height: 80px; margin-bottom: 10px; }
        .title { font-size: 32px; font-weight: bold; color: #333; text-transform: uppercase; margin: 0; }
        .subtitle { font-size: 14px; color: #777; margin-bottom: 20px; }
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .client-info, .invoice-details { flex: 1; }
        .invoice-details { text-align: right; }
        
        table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
        table td, table th { padding: 10px; vertical-align: top; }
        table th { background: #f8f9fa; font-weight: bold; border-bottom: 2px solid #ddd; text-transform: uppercase; font-size: 12px; color: #555; }
        table tr.item td { border-bottom: 1px solid #eee; }
        table tr.total td { border-top: 2px solid #eee; font-weight: bold; }
        
        .text-right { text-align: right; }
        .notes-section { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
        
        .status-stamp {
            position: absolute;
            top: 200px;
            right: 50px;
            font-size: 40px;
            font-weight: bold;
            color: #cc0000;
            border: 4px solid #cc0000;
            padding: 10px;
            text-transform: uppercase;
            opacity: 0.2;
            transform: rotate(-20deg);
        }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header">
            <div>
                 ${companyLogo ? `<img src="${companyLogo}" class="logo" />` : `<h1 style="margin:0">${companyName}</h1>`}
            </div>
            <div class="company-info">
                <h3>${companyName}</h3>
                ${companyAddress ? `<p>${companyAddress}</p>` : ''}
                ${companyPhone ? `<p>Phone: ${companyPhone}</p>` : ''}
                ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ''}
            </div>
        </div>

        <div style="border-bottom: 2px solid #eee; margin-bottom: 30px;">
            <h1 class="title">${documentTitle}</h1>
            <p class="subtitle">#${documentNumber}</p>
        </div>

        <div class="info-grid">
            <div class="client-info">
                <strong>Bill To:</strong><br>
                ${customerName}<br>
                ${customerAddress || ''}<br>
                ${customerPhone ? `Phone: ${customerPhone}<br>` : ''}
                ${customerEmail || ''}
            </div>
            <div class="invoice-details">
                <strong>Date:</strong> ${date}<br>
                ${dueDate ? `<strong>Due Date:</strong> ${dueDate}<br>` : ''}
                ${amountPaid !== undefined && total > 0 && amountPaid >= total ? '<strong style="color: green">PAID</strong>' : ''}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                <tr class="item">
                    <td>${item.description}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${currencySymbol}${formatMoney(item.rate)}</td>
                    <td class="text-right">${currencySymbol}${formatMoney(item.amount)}</td>
                </tr>
                `).join('')}
                
                <tr><td colspan="4" style="height: 20px;"></td></tr>

                <tr>
                    <td colspan="2"></td>
                    <td class="text-right">Subtotal:</td>
                    <td class="text-right">${currencySymbol}${formatMoney(subtotal)}</td>
                </tr>
                ${discountTotal ? `
                <tr>
                    <td colspan="2"></td>
                    <td class="text-right">Discount:</td>
                    <td class="text-right">-${currencySymbol}${formatMoney(discountTotal)}</td>
                </tr>` : ''}
                ${taxTotal ? `
                <tr>
                    <td colspan="2"></td>
                    <td class="text-right">Tax:</td>
                    <td class="text-right">${currencySymbol}${formatMoney(taxTotal)}</td>
                </tr>` : ''}
                <tr style="font-size: 18px; font-weight: bold;">
                    <td colspan="2"></td>
                    <td class="text-right">Total:</td>
                    <td class="text-right">${currencySymbol}${formatMoney(total)}</td>
                </tr>
                ${amountPaid !== undefined ? `
                <tr>
                    <td colspan="2"></td>
                    <td class="text-right">Amount Paid:</td>
                    <td class="text-right">${currencySymbol}${formatMoney(amountPaid)}</td>
                </tr>
                <tr style="background: #f8f9fa;">
                    <td colspan="2"></td>
                    <td class="text-right"><strong>Balance Due:</strong></td>
                    <td class="text-right"><strong>${currencySymbol}${formatMoney(balanceDue)}</strong></td>
                </tr>
                ` : ''}
            </tbody>
        </table>

        ${notes ? `
        <div class="notes-section">
            <strong>Notes:</strong>
            <p>${notes}</p>
        </div>` : ''}

        ${terms ? `
        <div class="notes-section">
            <strong>Terms & Conditions:</strong>
            <p>${terms}</p>
        </div>` : ''}

        <div class="footer">
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>
    `;
};
