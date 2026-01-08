import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Switch, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Save, FileText, CreditCard, Palette, Hash } from "lucide-react-native";
import { useInvoiceSettings, InvoiceSettings } from "../../hooks/useSettings";

export function InvoiceSettingsScreen() {
    const navigation = useNavigation();
    const { settings, isLoading, updateInvoiceSettings } = useInvoiceSettings();
    const [formState, setFormState] = useState<InvoiceSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormState(JSON.parse(JSON.stringify(settings)));
        }
    }, [settings]);

    const handleSave = async () => {
        if (!formState) return;
        setIsSaving(true);
        try {
            await updateInvoiceSettings(formState);
            Alert.alert("Success", "Invoice settings updated successfully");
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const updateBankDetails = (field: string, value: string) => {
        setFormState(prev => prev ? ({
            ...prev,
            bankDetails: { ...prev.bankDetails!, [field]: value }
        }) : null);
    };

    if (isLoading || !formState) return <View style={styles.loadingContainer}><Text>Loading...</Text></View>;

    // Helpers
    const formatInvoiceNumber = () => `${formState.prefix}-${String(formState.nextNumber).padStart(formState.padding, '0')}`;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <ArrowLeft color="#0f172a" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Invoice Settings</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
                        <Save color={isSaving ? "#94a3b8" : "#0f766e"} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>

                    {/* Numbering */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Hash size={18} color="#64748b" />
                            <Text style={styles.sectionTitle}>Numbering</Text>
                        </View>
                        <View style={styles.card}>
                             <View style={styles.row}>
                                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                                    <Text style={styles.label}>Prefix</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={formState.prefix} 
                                        onChangeText={(t) => setFormState({...formState, prefix: t})}
                                    />
                                </View>
                                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                                    <Text style={styles.label}>Next Number</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={String(formState.nextNumber)} 
                                        onChangeText={(t) => setFormState({...formState, nextNumber: parseInt(t) || 0})}
                                        keyboardType="number-pad"
                                    />
                                </View>
                             </View>
                             <View style={styles.inputGroup}>
                                 <Text style={styles.label}>Padding (Digits)</Text>
                                 <TextInput
                                     style={styles.input}
                                     value={String(formState.padding)}
                                     onChangeText={(t) => setFormState({...formState, padding: parseInt(t) || 0})}
                                     keyboardType="number-pad"
                                     maxLength={1}
                                 />
                             </View>
                             <View style={styles.previewBox}>
                                 <Text style={styles.previewLabel}>Preview:</Text>
                                 <Text style={styles.previewText}>{formatInvoiceNumber()}</Text>
                             </View>
                        </View>
                    </View>

                    {/* Terms & Notes */}
                     <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FileText size={18} color="#64748b" />
                            <Text style={styles.sectionTitle}>Terms & Content</Text>
                        </View>
                        <View style={styles.card}>
                             <View style={styles.inputGroup}>
                                <Text style={styles.label}>Default Terms & Conditions</Text>
                                <TextInput 
                                    style={[styles.input, { height: 80 }]} 
                                    value={formState.termsAndConditions} 
                                    onChangeText={(t) => setFormState({...formState, termsAndConditions: t})}
                                    multiline
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Footer Notes</Text>
                                <TextInput 
                                    style={[styles.input, { height: 60 }]} 
                                    value={formState.notes} 
                                    onChangeText={(t) => setFormState({...formState, notes: t})}
                                    multiline
                                />
                            </View>
                        </View>
                    </View>

                    {/* Bank Details */}
                    <View style={styles.section}>
                         <View style={styles.sectionHeader}>
                            <CreditCard size={18} color="#64748b" />
                            <Text style={styles.sectionTitle}>Payment Details</Text>
                        </View>
                        <View style={styles.card}>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Show Bank Details on Invoice</Text>
                                <Switch 
                                    value={formState.showBankDetails} 
                                    onValueChange={(v) => setFormState({...formState, showBankDetails: v})}
                                    trackColor={{ false: "#e2e8f0", true: "#ccfbf1" }}
                                    thumbColor={formState.showBankDetails ? "#0f766e" : "#f1f5f9"}
                                />
                            </View>
                            
                            {formState.showBankDetails && (
                                <View style={{marginTop: 16}}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Bank Name</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            value={formState.bankDetails?.bankName} 
                                            onChangeText={(t) => updateBankDetails('bankName', t)}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Account Name</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            value={formState.bankDetails?.accountName} 
                                            onChangeText={(t) => updateBankDetails('accountName', t)}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Account Number</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            value={formState.bankDetails?.accountNumber} 
                                            onChangeText={(t) => updateBankDetails('accountNumber', t)}
                                        />
                                    </View>
                                     <View style={styles.row}>
                                         <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                                            <Text style={styles.label}>Routing / IFSC</Text>
                                            <TextInput 
                                                style={styles.input} 
                                                value={formState.bankDetails?.routingNumber} 
                                                onChangeText={(t) => updateBankDetails('routingNumber', t)}
                                            />
                                        </View>
                                         <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                                            <Text style={styles.label}>Swift Code</Text>
                                            <TextInput 
                                                style={styles.input} 
                                                value={formState.bankDetails?.swiftCode} 
                                                onChangeText={(t) => updateBankDetails('swiftCode', t)}
                                            />
                                        </View>
                                     </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* PDF Template */}
                    <View style={styles.section}>
                         <View style={styles.sectionHeader}>
                            <Palette size={18} color="#64748b" />
                            <Text style={styles.sectionTitle}>PDF Template</Text>
                        </View>
                        <View style={styles.card}>
                             {["classic", "modern", "minimal"].map((t) => (
                                 <TouchableOpacity 
                                    key={t} 
                                    style={[styles.templateOption, formState.pdfTemplate === t && styles.templateSelected]}
                                    onPress={() => setFormState({...formState, pdfTemplate: t as any})}
                                 >
                                     <Text style={[styles.templateText, formState.pdfTemplate === t && styles.templateTextSelected]}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                     </Text>
                                     {formState.pdfTemplate === t && <View style={styles.checkIcon} />}
                                 </TouchableOpacity>
                             ))}
                        </View>
                    </View>

                     <View style={{height: 40}} />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#e2e8f0", marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    saveBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
    content: { padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
    
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 15, color: '#0f172a', backgroundColor: '#fff' },
    row: { flexDirection: 'row' },
    
    previewBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, marginTop: 8 },
    previewLabel: { fontSize: 13, color: '#64748b', marginRight: 8 },
    previewText: { fontSize: 16, fontWeight: '700', color: '#0f766e', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    switchLabel: { fontSize: 15, color: '#0f172a', fontWeight: '500' },
    
    templateOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    templateSelected: { borderColor: '#0f766e', backgroundColor: '#f0fdfa' },
    templateText: { fontSize: 15, color: '#334155' },
    templateTextSelected: { color: '#0f766e', fontWeight: '600' },
    checkIcon: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0f766e' },
});
