import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-4xl font-bold text-center mb-2 text-text">DigiStoq</Text>
        <Text className="text-base text-center mb-10 text-text-muted">
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </Text>

        <View className="gap-4">
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="email-input"
            accessibilityLabel="Email"
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            testID="password-input"
            accessibilityLabel="Password"
          />

          <Button
            variant="secondary"
            onPress={handleSubmit}
            loading={loading}
            block
            className="mt-2"
            label={isSignUp ? "Sign Up" : "Sign In"}
          />

          <Button
            variant="ghost"
            onPress={() => { setIsSignUp(!isSignUp); }}
            className="mt-4"
            label={isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
