import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type OrbitPlannerHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  orbitHint: string;
  onPress: () => void;
};

export default function OrbitPlannerHero({
  eyebrow,
  title,
  subtitle,
  buttonLabel,
  orbitHint,
  onPress,
}: OrbitPlannerHeroProps) {
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const animatedDriver = Platform.OS !== "web";

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: animatedDriver,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [animatedDriver, orbitAnim]);

  const orbitRotation = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{orbitHint}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.stage}>
        <Animated.View style={[styles.orbitRing, { transform: [{ rotate: orbitRotation }] }]}>
          <View style={styles.planePill}>
            <Ionicons name="airplane" size={20} color="#fff" />
          </View>
        </Animated.View>

        <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.centerButtonShadow}>
          <LinearGradient colors={["#ea580c", "#f97316", "#fb7185"]} style={styles.centerButton}>
            <View style={styles.innerBadge}>
              <Text style={styles.innerBadgeText}>{eyebrow}</Text>
            </View>
            <Ionicons name="sparkles" size={34} color="#fff" />
            <Text style={styles.buttonLabel}>{buttonLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fffaf2",
    borderRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: "#fed7aa",
    ...Platform.select({
      web: {
        boxShadow: "0 12px 24px rgba(124,45,18,0.12)",
      } as any,
      default: {
        shadowColor: "#7c2d12",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 14,
      },
    }),
    overflow: "hidden",
    marginBottom: 24,
  },
  eyebrow: {
    color: "#f97316",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    color: "#0f172a",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    maxWidth: 260,
  },
  subtitle: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 320,
  },
  stage: {
    height: 310,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  orbitRing: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(249,115,22,0.35)",
    alignItems: "center",
  },
  planePill: {
    position: "absolute",
    top: -12,
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  centerButtonShadow: {
    ...Platform.select({
      web: {
        boxShadow: "0 16px 28px rgba(234,88,12,0.28)",
      } as any,
      default: {
        shadowColor: "#ea580c",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.28,
        shadowRadius: 18,
        elevation: 16,
      },
    }),
  },
  centerButton: {
    width: 210,
    height: 210,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 24,
  },
  innerBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  innerBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
  },
});
