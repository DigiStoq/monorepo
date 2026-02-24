import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import type { PDFInvoiceData } from "../lib/pdf/htmlTemplates";
import { generateInvoiceHTML } from "../lib/pdf/htmlTemplates";
import { useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

export function usePDFGenerator() {
    const [isGenerating, setIsGenerating] = useState(false);
    const navigation = useNavigation<any>();

    const generatePDF = async (html: string, filename: string): Promise<string> => {
        try {
            setIsGenerating(true);
            const { uri } = await Print.printToFileAsync({
                html: html,
                base64: false
            });

            // Rename file to meaningful name
            const newUri = FileSystem.documentDirectory + filename;
            await FileSystem.moveAsync({
                from: uri,
                to: newUri
            });
            return newUri;
        } catch (error) {
            console.error("PDF Generation Error:", error);
            throw error;
        } finally {
            setIsGenerating(false);
        }
    };

    const sharePDF = async (uri: string) => {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(uri);
        } else {
            Alert.alert("Success", `PDF saved to ${uri}`);
        }
    };

    const generateInvoicePDF = async (data: PDFInvoiceData) => {
        const html = generateInvoiceHTML(data);
        const filename = `Invoice_${data.documentNumber}.pdf`;
        const uri = await generatePDF(html, filename);
        await sharePDF(uri);
    };

    const generateEstimatePDF = async (data: PDFInvoiceData) => {
        // Use same template but change title
        const html = generateInvoiceHTML({ ...data, documentTitle: "ESTIMATE" });
        const filename = `Estimate_${data.documentNumber}.pdf`;
        const uri = await generatePDF(html, filename);
        await sharePDF(uri);
    };

    const previewInvoicePDF = async (data: PDFInvoiceData) => {
        const html = generateInvoiceHTML(data);
        const filename = `Invoice_${data.documentNumber}.pdf`;
        const uri = await generatePDF(html, filename);
        await previewPDF(uri, `Invoice #${data.documentNumber}`);
    };

    const previewEstimatePDF = async (data: PDFInvoiceData) => {
        const html = generateInvoiceHTML({ ...data, documentTitle: "ESTIMATE" });
        const filename = `Estimate_${data.documentNumber}.pdf`;
        const uri = await generatePDF(html, filename);
        await previewPDF(uri, `Estimate #${data.documentNumber}`);
    };

    const generatePurchaseInvoicePDF = async (data: PDFInvoiceData) => {
        const html = generateInvoiceHTML({ ...data, documentTitle: "PURCHASE INVOICE" });
        const filename = `PurchaseInvoice_${data.documentNumber}.pdf`;
        const uri = await generatePDF(html, filename);
        await sharePDF(uri);
    };

    const previewPurchaseInvoicePDF = async (data: PDFInvoiceData) => {
        const html = generateInvoiceHTML({ ...data, documentTitle: "PURCHASE INVOICE" });
        const filename = `PurchaseInvoice_${data.documentNumber}.pdf`;
        const uri = await generatePDF(html, filename);
        await previewPDF(uri, `Purchase Invoice #${data.documentNumber}`);
    };

    const generateCreditNotePDF = async (data: PDFInvoiceData) => {
        const html = generateInvoiceHTML({ ...data, documentTitle: "CREDIT NOTE" });
        const filename = `CreditNote_${data.documentNumber}.pdf`;
        const uri = await generatePDF(html, filename);
        await sharePDF(uri);
    };

    const previewCreditNotePDF = async (data: PDFInvoiceData) => {
        const html = generateInvoiceHTML({ ...data, documentTitle: "CREDIT NOTE" });
        const filename = `CreditNote_${data.documentNumber}.pdf`;
        const uri = await generatePDF(html, filename);
        await previewPDF(uri, `Credit Note #${data.documentNumber}`);
    };

    const previewPDF = async (uri: string, title?: string) => {
        navigation.navigate('PDFViewer', { uri, title });
    };

    return {
        generateInvoicePDF,
        generateEstimatePDF,
        generatePurchaseInvoicePDF,
        generateCreditNotePDF,
        previewInvoicePDF,
        previewEstimatePDF,
        previewPurchaseInvoicePDF,
        previewCreditNotePDF,
        generatePDF,
        sharePDF,
        previewPDF,
        isGenerating
    };
}
