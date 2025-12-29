// app/auth/register.tsx

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  Image,
} from "react-native";

import { supabase } from "../../supabase/client";
import { Link, useRouter } from "expo-router";

import Animated, {
  FadeInUp,
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Ionicons } from "@expo/vector-icons";

/* ---------- Expo Router Wrapper ---------- */
export default function Register() {
  return <RegisterScreen />;
}

/* ---------- Screen ---------- */
function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);

  /* ---------- ERROR SHAKE (UNCHANGED) ---------- */
  const errorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(shake ? 10 : 0, { duration: 80 }),
      },
    ],
  }));

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 150);
  };

  /* ---------- REGISTER LOGIC (UNCHANGED) ---------- */
  const handleRegister = async () => {
    if (loading) return;

    if (!email.trim() || !password || !confirm) {
      return triggerError("All fields are required");
    }

    if (password !== confirm) {
      return triggerError("Passwords do not match");
    }

    if (password.length < 6) {
      return triggerError("Password must be at least 6 characters");
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw new Error(error.message);

      const user = data.user;
      if (!user) throw new Error("User not created");

      await supabase.from("user_profiles").insert({
        user_id: user.id,
        username: "",
        referral_code: Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase(),
        created_at: new Date().toISOString(),
      });

      router.replace("/(onboarding)/profileSetup");
    } catch (err: any) {
      triggerError(err?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={styles.card}
      >
        {/* LOGO */}
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
        />

        {/* TITLE */}
        <Animated.Text entering={FadeInDown.delay(100)} style={styles.title}>
          Create Account
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(200)} style={styles.subtitle}>
          Start mining and earning rewards
        </Animated.Text>

        {/* ERROR */}
        {errorMsg ? (
          <Animated.Text style={[styles.error, errorStyle]}>
            {errorMsg}
          </Animated.Text>
        ) : null}

        {/* EMAIL */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#777"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </Animated.View>

        {/* PASSWORD */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.passwordWrap}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eye}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons
              name={passwordVisible ? "eye-off" : "eye"}
              size={20}
              color="#777"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* CONFIRM */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.passwordWrap}>
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#777"
            secureTextEntry={!confirmVisible}
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity
            style={styles.eye}
            onPress={() => setConfirmVisible(!confirmVisible)}
          >
            <Ionicons
              name={confirmVisible ? "eye-off" : "eye"}
              size={20}
              color="#777"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.button,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>
        </Animated.View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered?</Text>
          <Link href="/(auth)/login" style={styles.footerLink}>
            Login
          </Link>
        </View>
      </Animated.View>
    </View>
  );
}

/* ---------- STYLES ---------- */

const PURPLE = "#5b3deb";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070707",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#0e0e0e",
    borderRadius: 20,
    padding: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },

  subtitle: {
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#151515",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },

  passwordWrap: {
    position: "relative",
  },

  eye: {
    position: "absolute",
    right: 14,
    top: "35%",
  },

  button: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },

  footerText: {
    color: "#777",
    marginRight: 6,
  },

  footerLink: {
    color: PURPLE,
    fontWeight: "800",
  },

  error: {
    color: "#ff5c5c",
    textAlign: "center",
    marginBottom: 12,
  },
});
