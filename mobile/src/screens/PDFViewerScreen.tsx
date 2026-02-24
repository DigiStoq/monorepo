import { useRef } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, Alert } from 'react-native';
import Pdf from 'react-native-pdf';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronLeftIcon, Download01Icon, PrinterIcon } from '../components/ui/UntitledIcons';

export default function PDFViewerScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const pdfRef = useRef(null);

    const { uri, title } = route.params || {};

    const handleShare = async () => {
        try {
            await Sharing.shareAsync(uri);
        } catch (_error) {
            Alert.alert("Error", "Failed to share PDF");
        }
    };

    const handlePrint = async () => {
        try {
            await Print.printAsync({ uri });
        } catch (_error) {
            Alert.alert("Error", "Failed to open print dialog");
        }
    };

    if (!uri) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <Text style={{ color: colors.textMuted }}>No PDF URI provided</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Custom Header */}
            <View
                className="flex-row items-center justify-between px-4 pb-3 bg-surface border-b border-border"
                style={{ paddingTop: insets.top + 8 }}
            >
                <TouchableOpacity onPress={() => { navigation.goBack(); }} className="p-2">
                    <ChevronLeftIcon size={24} color={colors.primary} />
                </TouchableOpacity>

                <View className="flex-1 px-4">
                    <Text className="text-md font-bold text-text text-center" numberOfLines={1}>{title || 'PDF Preview'}</Text>
                </View>

                <View className="flex-row gap-2">
                    <TouchableOpacity onPress={handlePrint} className="p-2">
                        <PrinterIcon size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} className="p-2">
                        <Download01Icon size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <Pdf
                ref={pdfRef}
                source={{ uri: uri, cache: true }}
                style={{
                    flex: 1,
                    width: '100%',
                    backgroundColor: colors.background,
                }}
                onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`Number of pages: ${numberOfPages}`);
                }}
                onPageChanged={(page, numberOfPages) => {
                    console.log(`Current page: ${page}`);
                }}
                onError={(error) => {
                    console.error("PDF Error:", error);
                    Alert.alert("Error", "Failed to load PDF");
                }}
                trustAllCerts={false}
            />
        </View>
    );
}
