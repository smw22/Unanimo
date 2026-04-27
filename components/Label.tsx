import { Text } from "react-native";

import React from "react";

export default function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text className="ml-2 text-xs font-semibold text-dark-text dark:text-text-primary">
      {children}
    </Text>
  );
}
