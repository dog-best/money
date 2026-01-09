import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Action = {
  label: "Fund" | "Send" | "Withdraw";
  icon: IconName;
  disabled?: boolean;
};

const actions: Action[] = [
  { label: "Fund", icon: "add-circle-outline" },
  { label: "Send", icon: "arrow-up-circle-outline" },
  { label: "Withdraw", icon: "arrow-down-circle-outline" },
];

export default function WalletActions({
  onAction,
}: {
  onAction?: (action: Action["label"]) => void;
}) {
  return (
    <View style={styles.container}>
      {actions.map((item) => (
        <Pressable
          key={item.label}
          disabled={item.disabled}
          onPress={() => onAction?.(item.label)}
          style={({ pressed }) => [
            styles.action,
            pressed && styles.pressed,
            item.disabled && styles.disabled,
          ]}
        >
          <View style={styles.iconWrap}>
            <Ionicons
              name={item.icon}
              size={24}
              color={item.disabled ? "#6B7280" : "#6D28D9"}
            />
          </View>

          <Text
            style={[
              styles.text,
              item.disabled && { color: "#6B7280" },
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },

  action: {
    width: "30%",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "#14141B",
  },

  pressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: "#1B1B24",
  },

  disabled: {
    opacity: 0.5,
  },

  iconWrap: {
    height: 40,
    width: 40,
    borderRadius: 999,
    backgroundColor: "rgba(109,40,217,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
  },
});
