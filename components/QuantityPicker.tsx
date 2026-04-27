import React from "react";
import { Pressable, Text, View } from "react-native";

export type QuantityPickerProps = {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

export default function QuantityPicker({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  className = "",
}: QuantityPickerProps) {
  const increase = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  const decrease = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const isMin = value <= min;
  const isMax = value >= max;

  return (
    <View
      className={`flex-row  items-center py-1 px-4 border-2 rounded-full bg-border-bg border-input-border ${className}`}
    >
      <Pressable
        onPress={decrease}
        disabled={isMin}
        className={`${isMin ? "opacity-30" : "active:opacity-70"}`}
      >
        <Text className="text-2xl text-primary">−</Text>
      </Pressable>

      <Text className="mx-4 text-lg font-medium text-dark-text dark:text-text-primary">
        {value}
      </Text>

      <Pressable
        onPress={increase}
        disabled={isMax}
        className={`${isMax ? "opacity-30" : "active:opacity-70"}`}
      >
        <Text className="text-2xl text-primary">+</Text>
      </Pressable>
    </View>
  );
}
