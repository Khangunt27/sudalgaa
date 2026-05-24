import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet, Platform, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type MonGoTripLogoProps = {
  subtitle?: string;
};

export default function MonGoTripLogo({ subtitle }: MonGoTripLogoProps) {
  const tilt = useRef(new Animated.Value(0)).current;
  const animatedDriver = Platform.OS !== "web";

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tilt, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: animatedDriver,
        }),
        Animated.timing(tilt, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: animatedDriver,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animatedDriver, tilt]);

  const rotate = tilt.interpolate({
    inputRange: [0, 1],
    outputRange: ["-8deg", "8deg"],
  });

  const floatY = tilt.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.iconShell, { transform: [{ rotate }, { translateY: floatY }] }]}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Image 
              source={require("../assets/logo_square.png")} 
              style={{ width: 40, height: 40 }} 
              resizeMode="contain"
            />
          </View>
      </Animated.View>
      <View>
        <Text style={styles.wordmark}>MonGoTrip</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconShell: {
    width: 44,
    height: 44,
    borderRadius: 16,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  innerTile: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: "#ea580c",
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginTop: 3,
  },
});
