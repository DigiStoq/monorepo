import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Save, Building2, MapPin, Phone, FileText, Globe } from "lucide-react-native";
import { useCompanySettings, CompanySettings } from "../../hooks/useSettings";

export function CompanySettingsScreen() {
    const navigation = useNavigation();
    const { settings, isLoading, updateCompanySettings } = useCompanySettings();
    const [formState, setFormState] = useState<CompanySettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormState(JSON.parse(JSON.stringify(settings))); // Deep copy
        }
    }, [settings]);

    const handleSave = async () => {
        if (!formState) return;
        setIsSaving(true);
        try {
            await updateCompanySettings(formState);
            Alert.alert("Success", "Company settings updated successfully");
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const updateAddress = (field: keyof CompanySettings['address'], value: string) => {
        setFormState(prev => prev ? ({
            ...prev,
            address: { ...prev.address, [field]: value }
        }) : null);
    };

    const updateContact = (field: keyof CompanySettings['contact'], value: string) => {
        setFormState(prev => prev ? ({
            ...prev,
            contact: { ...prev.contact, [field]: value }
        }) : null);
    };

    const updateRegistration = (field: keyof CompanySettings['registration'], value: string) => {
        setFormState(prev => prev ? ({
            ...prev,
            registration: { ...prev.registration, [field]: value }
        }) : null);
    };

    if (isLoading || !formState) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <ArrowLeft color="#0f172a" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Company Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
                        <Save color={isSaving ? "#94a3b8" : "#0f766e"} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    
                    {/* Basic Info */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Building2 size={18} color="#64748b" />
                            <Text style={styles.sectionTitle}>Basic Information</Text>
                        </View>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Business Name</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={formState.name} 
                                    onChangeText={(text) => setFormState({...formState, name: text})}
                                    placeholder="e.g. Acme Corp"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Legal Name</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={formState.legalName} 
                                    onChangeText={(text) => setFormState({...formState, legalName: text})}
                                    placeholder="Registered Legal Name"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Address */}
                    <View style={styles.section}>
                         <View style={styles.sectionHeader}>
                            <MapPin size={18} color="#64748b" />
                            <Text style={styles.sectionTitle}>Business Address</Text>
                        </View>
                        <View style={styles.card}>
                             <View style={styles.inputGroup}>
                                <Text style={styles.label}>Street Address</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={formState.address.street} 
                                    onChangeText={(text) => updateAddress('street', text)}
                                />
                            </View>
                             <View style={styles.row}>
                                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                                    <Text style={styles.label}>City</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={formState.address.city} 
                                        onChangeText={(text) => updateAddress('city', text)}
                                    />
                                </View>
                                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                                    <Text style={styles.label}>State</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={formState.address.state} 
                                        onChangeText={(text) => updateAddress('state', text)}
                                    />
                                </View>
                             </View>
                             <View style={styles.row}>
                                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                                    <Text style={styles.label}>Postal Code</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={formState.address.postalCode} 
                                        onChangeText={(text) => updateAddress('postalCode', text)}
                                    />
                                </View>
                                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                                    <Text style={styles.label}>Country</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={formState.address.country} 
                                        onChangeText={(text) => updateAddress('country', text)}
                                    />
                                </View>
                             </View>
                        </View>
                    </View>

                    {/* Contact */}
                     <View style={styles.section}>
                         <View style={styles.sectionHeader}>
                            <Phone size={18} color="#64748b" />
                            <Text style={styles.sectionTitle}>Contact Details</Text>
                        </View>
                        <View style={styles.card}>
                             <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={formState.contact.email} 
                                    onChangeText={(text) => updateContact('email', text)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={formState.contact.phone} 
                                    onChangeText={(text) => updateContact('phone', text)}
                                    keyboardType="phone-pad"
                                />
                            </View>
                             <View style={styles.inputGroup}>
                                <Text style={styles.label}>Website</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={formState.contact.website} 
                                    onChangeText={(text) => updateContact('website', text)}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Registration */}
                     <View style={styles.section}>
                         <View style={styles.sectionHeader}>
                            <FileText size={18} color="#64748b" />
                            <Text style={styles.sectionTitle}>Registration</Text>
                        </View>
                        <View style={styles.card}>
                             <View style={styles.inputGroup}>
                                <Text style={styles.label}>Tax ID</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={formState.registration.taxId} 
                                    onChangeText={(text) => updateRegistration('taxId', text)}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EIN</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={formState.registration.ein} 
                                    onChangeText={(text) => updateRegistration('ein', text)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Regional */}
                    <View style={styles.section}>
                         <View style={styles.sectionHeader}>
                            <Globe size={18} color="#64748b" />
                            <Text style={styles.sectionTitle}>Regional</Text>
                        </View>
                        <View style={styles.card}>
                             <View style={styles.inputGroup}>
                                <Text style={styles.label}>Currency Code</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={formState.currency} 
                                    onChangeText={(text) => setFormState({...formState, currency: text})}
                                    maxLength={3}
                                    autoCapitalize="characters"
                                />
                            </View>
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
    loadingText: { color: '#64748b' },
    
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
    
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 15, color: '#0f172a', backgroundColor: '#fff' },
    row: { flexDirection: 'row' },
});
