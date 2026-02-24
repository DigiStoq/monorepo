import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/ui/Logo";
import { spacing, borderRadius, fontSize } from "../lib/theme";
import { MailIcon, ArrowLeftIcon, Lock01Icon } from "../components/ui/UntitledIcons";

const { height } = Dimensions.get("window");

interface LoginScreenProps {
  initialMode?: "login" | "signup";
  onBack?: () => void;
  onForgotPassword?: () => void;
}

export function LoginScreen({ initialMode = "login", onBack, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        Alert.alert("Error", error.message);
      } else if (isSignUp) {
        Alert.alert("Success", "Check your email for confirmation link");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Teal Header with branding */}
      <View
        style={{
          backgroundColor: colors.primary,
          height: height * 0.3,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "rgba(255,255,255,0.08)",
            top: -40,
            right: -30,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: "rgba(255,255,255,0.05)",
            bottom: 20,
            left: -40,
          }}
        />

        {/* Back button */}
        {onBack && (
          <TouchableOpacity
            style={{
              position: "absolute",
              top: spacing.xl,
              left: spacing.lg,
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeftIcon size={22} color="#ffffff" />
          </TouchableOpacity>
        )}

        <Animated.View
          style={{
            alignItems: "center",
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Logo size={64} color="#ffffff" />
          <Text
            style={{
              fontSize: 36,
              fontWeight: "bold",
              color: "#ffffff",
              marginTop: spacing.md,
            }}
          >
            DigiStoq
          </Text>
          <Text
            style={{
              fontSize: fontSize.md,
              color: "rgba(255, 255, 255, 0.8)",
              marginTop: spacing.xs,
            }}
          >
            {isSignUp ? "Create your account" : "Welcome back"}
          </Text>
        </Animated.View>
      </View>

      {/* Form Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.xxl,
            paddingTop: spacing.xxxl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Form Card */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: borderRadius.xl,
                padding: spacing.xxl,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: spacing.xxl,
                }}
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </Text>

              <View style={{ gap: spacing.lg }}>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  testID="email-input"
                  accessibilityLabel="Email"
                  icon={<MailIcon size={20} color={colors.textMuted} />}
                />

                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  testID="password-input"
                  accessibilityLabel="Password"
                  icon={<Lock01Icon size={20} color={colors.textMuted} />}
                />

                {!isSignUp && onForgotPassword && (
                  <TouchableOpacity
                    onPress={onForgotPassword}
                    activeOpacity={0.7}
                    style={{ alignSelf: "flex-end" }}
                  >
                    <Text
                      style={{
                        fontSize: fontSize.sm,
                        color: colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                )}

                <Button
                  variant="primary"
                  onPress={handleSubmit}
                  loading={loading}
                  block
                  size="lg"
                  className="mt-2"
                  label={isSignUp ? "Create Account" : "Sign In"}
                />
              </View>
            </View>

            {/* Toggle between Sign In / Sign Up */}
            <TouchableOpacity
              onPress={() => { setIsSignUp(!isSignUp); }}
              activeOpacity={0.7}
              style={{
                marginTop: spacing.xxl,
                alignItems: "center",
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ fontSize: fontSize.sm, color: colors.textMuted }}>
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
