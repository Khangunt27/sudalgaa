import React from "react";
import {
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

type AppModalProps = {
  isVisible: boolean;
  children: React.ReactNode;
  onBackdropPress?: () => void;
  avoidKeyboard?: boolean;
  style?: StyleProp<ViewStyle>;
  backdropOpacity?: number;
};

export default function AppModal({
  isVisible,
  children,
  onBackdropPress,
  avoidKeyboard = false,
  style,
  backdropOpacity = 0.45,
}: AppModalProps) {
  const content = (
    <View style={{ flex: 1, justifyContent: "flex-end" }}>
      <Pressable
        style={{ flex: 1, backgroundColor: `rgba(15,23,42,${backdropOpacity})` }}
        onPress={onBackdropPress}
      />
      <View pointerEvents="box-none" style={style}>
        {children}
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onBackdropPress}
      statusBarTranslucent
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
}
