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
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/ui/Logo";
import { spacing, borderRadius, fontSize } from "../lib/theme";
import {
  MailIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "../components/ui/UntitledIcons";
import { supabase } from "../lib/supabase";

const { height } = Dimensions.get("window");

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setSuccess(true);
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
            Reset your password
          </Text>
        </Animated.View>
      </View>

      {/* Content Section */}
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
            {/* Card */}
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
              {success ? (
                /* Success State */
                <View style={{ alignItems: "center", gap: spacing.lg }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "#f0fdf4",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <CheckCircleIcon size={32} color="#22c55e" />
                  </View>
                  <Text
                    style={{
                      fontSize: fontSize.xl,
                      fontWeight: "700",
                      color: colors.text,
                      textAlign: "center",
                    }}
                  >
                    Check your email
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.textMuted,
                      textAlign: "center",
                      lineHeight: 22,
                    }}
                  >
                    We've sent a password reset link to{" "}
                    <Text style={{ fontWeight: "600", color: colors.text }}>
                      {email}
                    </Text>
                    . Click the link in the email to reset your password.
                  </Text>
                  <TouchableOpacity
                    onPress={onBack}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.xs,
                      marginTop: spacing.sm,
                    }}
                  >
                    <ArrowLeftIcon size={16} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: fontSize.sm,
                        color: colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      Back to sign in
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Form State */
                <>
                  <Text
                    style={{
                      fontSize: fontSize.xl,
                      fontWeight: "700",
                      color: colors.text,
                      marginBottom: spacing.sm,
                    }}
                  >
                    Reset Password
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.textMuted,
                      marginBottom: spacing.xxl,
                      lineHeight: 20,
                    }}
                  >
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </Text>

                  <View style={{ gap: spacing.lg }}>
                    <Input
                      label="Email"
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      icon={<MailIcon size={20} color={colors.textMuted} />}
                    />

                    <Button
                      variant="primary"
                      onPress={handleSubmit}
                      loading={loading}
                      block
                      size="lg"
                      label="Send Reset Link"
                    />
                  </View>
                </>
              )}
            </View>

            {/* Back to sign in link (shown in form state) */}
            {!success && (
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={{
                  marginTop: spacing.xxl,
                  alignItems: "center",
                  paddingVertical: spacing.sm,
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: spacing.xs,
                }}
              >
                <ArrowLeftIcon size={16} color={colors.textMuted} />
                <Text
                  style={{ fontSize: fontSize.sm, color: colors.textMuted }}
                >
                  Back to sign in
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
