import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from "react-native";
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { spacing, borderRadius, fontSize, fontWeight } from "../lib/theme";
import { Logo } from "../components/ui/Logo";
import { ChartIcon, PhoneIcon, LockIcon } from "../components/ui/Icons";

const { width, height } = Dimensions.get("window");

interface WelcomeScreenProps {
    onSignIn: () => void;
    onSignUp: () => void;
}

export function WelcomeScreen({ onSignIn, onSignUp }: WelcomeScreenProps) {
    const { colors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
                <View style={[styles.heroBackground, { backgroundColor: colors.primary }]}>
                    <View style={styles.heroPattern}>
                        {/* Decorative circles */}
                        <View style={[styles.circle, styles.circle1, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
                        <View style={[styles.circle, styles.circle2, { backgroundColor: "rgba(255,255,255,0.05)" }]} />
                    </View>

                    <Animated.View
                        style={[
                            styles.heroContent,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        <View style={{ marginBottom: spacing.lg }}>
                            <Logo size={100} color="#ffffff" />
                        </View>
                        <Text style={styles.heroTitle}>DigiStoq</Text>
                        <Text style={styles.heroSubtitle}>
                            Manage your inventory, sales, and purchases — all in one app
                        </Text>
                    </Animated.View>
                </View>
            </View>

            {/* Features Section */}
            <Animated.View
                style={[
                    styles.featuresSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.featureRow}>
                    <FeatureItem icon={<ChartIcon size={32} color={colors.primary} />} text="Real-time sync" colors={colors} />
                    <FeatureItem icon={<PhoneIcon size={32} color={colors.primary} />} text="Works offline" colors={colors} />
                    <FeatureItem icon={<LockIcon size={32} color={colors.primary} />} text="Secure data" colors={colors} />
                </View>
            </Animated.View>

            {/* Buttons Section */}
            <Animated.View
                style={[
                    styles.buttonsSection,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={onSignIn}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.primary }]}
                    onPress={onSignUp}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                        Create Account
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

function FeatureItem({ icon, text, colors }: { icon: React.ReactNode; text: string; colors: any }) {
    return (
        <View style={styles.featureItem}>
            <View style={{ marginBottom: spacing.sm }}>{icon}</View>
            <Text style={[styles.featureText, { color: colors.textMuted }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroSection: {
        flex: 1,
        minHeight: height * 0.5,
    },
    heroBackground: {
        flex: 1,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: "hidden",
    },
    heroPattern: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    circle: {
        position: "absolute",
        borderRadius: 500,
    },
    circle1: {
        width: 300,
        height: 300,
        top: -100,
        right: -50,
    },
    circle2: {
        width: 200,
        height: 200,
        bottom: 50,
        left: -50,
    },
    heroContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.xxl,
    },
    logoEmoji: {
        fontSize: 80,
        marginBottom: spacing.lg,
    },
    heroTitle: {
        fontSize: 48,
        fontWeight: "bold",
        color: "#ffffff",
        marginBottom: spacing.sm,
    },
    heroSubtitle: {
        fontSize: fontSize.lg,
        color: "rgba(255, 255, 255, 0.85)",
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 280,
    },
    featuresSection: {
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.xl,
    },
    featureRow: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    featureItem: {
        alignItems: "center",
    },
    featureIcon: {
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    featureText: {
        fontSize: fontSize.sm,
        fontWeight: "500",
    },
    buttonsSection: {
        paddingHorizontal: spacing.xxl,
        paddingBottom: spacing.xxl,
        gap: spacing.md,
    },
    primaryButton: {
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#ffffff",
        fontSize: fontSize.lg,
        fontWeight: "600",
    },
    secondaryButton: {
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: "center",
        borderWidth: 2,
    },
    secondaryButtonText: {
        fontSize: fontSize.lg,
        fontWeight: "600",
    },
});
