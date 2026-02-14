import { useEffect } from "react";
import { Logo } from "../components/ui/Logo";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
    onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
    const { colors } = useTheme();
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.8);

    useEffect(() => {
        // Fade in and scale animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto-advance after 2 seconds
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                onFinish();
            });
        }, 2000);

        return () => { clearTimeout(timer); };
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.primary }]}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <View style={styles.logoContainer}>
                    <Logo size={80} color="#ffffff" />
                </View>
                <Text style={styles.title}>DigiStoq</Text>
                <Text style={styles.subtitle}>Inventory Made Simple</Text>
            </Animated.View>

            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <Text style={styles.footerText}>Powered by PowerSync</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 30,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    logoText: {
        fontSize: 60,
    },
    title: {
        fontSize: 42,
        fontWeight: "bold",
        color: "#ffffff",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: "rgba(255, 255, 255, 0.8)",
        letterSpacing: 1,
    },
    footer: {
        position: "absolute",
        bottom: 50,
    },
    footerText: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.6)",
    },
});
