import NavigationHeader from "@/components/NavigationHeader";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type VoteDirection = "left" | "right" | "skip";

type Suggestion = {
  id: string;
  emoji: string;
  title: string;
  suggestedBy: string;
};

const SUGGESTIONS: Suggestion[] = [
  { id: "1", emoji: "🍕", title: "Pizza place", suggestedBy: "Alex" },
  { id: "2", emoji: "🍜", title: "Ramen bar", suggestedBy: "Mia" },
  { id: "3", emoji: "🌮", title: "Taco truck", suggestedBy: "Jonas" },
  { id: "4", emoji: "🍔", title: "Burger spot", suggestedBy: "Sofia" },
  { id: "5", emoji: "🥗", title: "Salad studio", suggestedBy: "Noah" },
];

const PARTICIPANTS = ["A", "M", "J", "S", "N"];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_X = SCREEN_WIDTH * 1.2;

export default function VotingScreen() {
  const [suggestions, setSuggestions] = useState(SUGGESTIONS);
  const [votedCount, setVotedCount] = useState(3);
  const [totalSwipes, setTotalSwipes] = useState(0);

  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const yesOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const cardAnimatedStyle = useMemo(
    () => ({
      transform: [
        { translateX: position.x },
        { translateY: position.y },
        { rotate },
      ],
    }),
    [position.x, position.y, rotate],
  );

  const finishSwipe = (direction: VoteDirection) => {
    setSuggestions((currentSuggestions) => {
      const [currentSuggestion, ...restSuggestions] = currentSuggestions;

      if (!currentSuggestion) {
        return currentSuggestions;
      }

      if (direction === "skip") {
        return [...restSuggestions, currentSuggestion];
      }

      return restSuggestions;
    });

    setTotalSwipes((prev) => prev + 1);

    if (direction !== "skip") {
      setVotedCount((prev) => Math.min(prev + 1, 6));
    }

    position.setValue({ x: 0, y: 0 });
  };

  const forceSwipe = (direction: VoteDirection) => {
    if (direction === "skip") {
      Animated.timing(position, {
        toValue: { x: 0, y: 24 },
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        finishSwipe("skip");
      });
      return;
    }

    const x = direction === "right" ? SWIPE_OUT_X : -SWIPE_OUT_X;

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      finishSwipe(direction);
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        {
          useNativeDriver: false,
        },
      ),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe("right");
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left");
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  const activeSuggestion = suggestions[0];
  const nextSuggestion = suggestions[1];

  const cardsFinished = !activeSuggestion;

  return (
    <SafeAreaView className="flex-1 px-container-spacing bg-dark-bg">
      <NavigationHeader title="Friday plans" />

      <View className="gap-5 mt-4">
        <View className="items-center gap-3">
          <Text className="px-4 py-1 text-xs rounded-full text-text-secondary bg-card">
            code: XK92
          </Text>
          <View className="flex-row items-center justify-between w-full">
            <View className="flex-row items-center">
              {PARTICIPANTS.map((initial, index) => (
                <View
                  key={initial}
                  className="items-center justify-center w-8 h-8 rounded-full"
                  style={{
                    marginLeft: index === 0 ? 0 : -10,
                    backgroundColor: [
                      "#7b2fff",
                      "#36c95e",
                      "#ff6b6b",
                      "#ffb347",
                      "#4f91ff",
                    ][index],
                  }}
                >
                  <Text className="text-xs font-bold text-white">
                    {initial}
                  </Text>
                </View>
              ))}

              <View className="items-center justify-center h-8 px-2 ml-2 rounded-full bg-card">
                <Text className="text-xs text-text-secondary">+2</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 px-3 py-1 rounded-full bg-card">
              <View className="w-2 h-2 rounded-full bg-success" />
              <Text className="text-xs text-text-secondary">
                {votedCount} of 6 voted
              </Text>
            </View>
          </View>

          <View className="w-full h-1 rounded-full bg-border">
            <View
              className="h-1 rounded-full bg-primary"
              style={{ width: `${Math.min((votedCount / 6) * 100, 100)}%` }}
            />
          </View>
        </View>

        <View className="relative h-[460px]">
          {cardsFinished ? (
            <View className="items-center justify-center h-full border rounded-3xl border-primary/40 bg-card">
              <Text className="text-5xl">🎉</Text>
              <Text className="mt-4 text-3xl font-bold text-white">
                All done
              </Text>
              <Text className="mt-2 text-base text-text-secondary">
                You reviewed all suggestions.
              </Text>
            </View>
          ) : (
            <>
              {!!nextSuggestion && (
                <View className="absolute inset-0 translate-y-2 border rounded-3xl border-border bg-card" />
              )}

              <Animated.View
                {...panResponder.panHandlers}
                className="absolute inset-0 p-5 border rounded-3xl border-primary"
                style={cardAnimatedStyle}
              >
                <View className="items-center justify-center flex-1 rounded-3xl bg-card">
                  <Text className="text-5xl">{activeSuggestion.emoji}</Text>

                  <Text className="mt-6 text-4xl font-bold text-white">
                    {activeSuggestion.title}
                  </Text>

                  <Text className="mt-2 text-base text-text-secondary">
                    Suggested by {activeSuggestion.suggestedBy}
                  </Text>

                  <View className="flex-row justify-between w-full px-6 mt-8">
                    <Animated.View
                      className="px-4 py-1 rounded-full"
                      style={{
                        backgroundColor: "#471919",
                        opacity: nopeOpacity,
                      }}
                    >
                      <Text className="font-bold text-danger">NOPE</Text>
                    </Animated.View>

                    <Animated.View
                      className="px-4 py-1 rounded-full"
                      style={{
                        backgroundColor: "#183a25",
                        opacity: yesOpacity,
                      }}
                    >
                      <Text className="font-bold text-success">YES!</Text>
                    </Animated.View>
                  </View>
                </View>
              </Animated.View>
            </>
          )}
        </View>

        <View className="items-center gap-2">
          <Text className="text-sm text-text-secondary">
            {Math.min(totalSwipes + 1, SUGGESTIONS.length)} of{" "}
            {SUGGESTIONS.length} suggestions
          </Text>

          <View className="flex-row items-end justify-center gap-6 mt-1">
            <Pressable
              onPress={() => !cardsFinished && forceSwipe("left")}
              disabled={cardsFinished}
              className={`items-center ${cardsFinished ? "opacity-40" : "opacity-100"}`}
            >
              <View className="items-center justify-center w-16 h-16 border-2 rounded-full border-danger">
                <Text className="text-2xl">👎</Text>
              </View>
              <Text className="mt-2 text-xs text-text-secondary">pass</Text>
            </Pressable>

            <Pressable
              onPress={() => !cardsFinished && forceSwipe("skip")}
              disabled={cardsFinished}
              className={`items-center ${cardsFinished ? "opacity-40" : "opacity-100"}`}
            >
              <View className="items-center justify-center w-12 h-12 rounded-full bg-card border border-border">
                <Text className="text-lg">⏭️</Text>
              </View>
              <Text className="mt-2 text-xs text-text-secondary">skip</Text>
            </Pressable>

            <Pressable
              onPress={() => !cardsFinished && forceSwipe("right")}
              disabled={cardsFinished}
              className={`items-center ${cardsFinished ? "opacity-40" : "opacity-100"}`}
            >
              <View className="items-center justify-center w-16 h-16 border-2 rounded-full border-success">
                <Text className="text-2xl">👍</Text>
              </View>
              <Text className="mt-2 text-xs text-text-secondary">yes</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-xs text-center text-text-muted">
          Swipes made: {totalSwipes}
        </Text>
      </View>
    </SafeAreaView>
  );
}
