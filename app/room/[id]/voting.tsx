import { useVoting } from "@/hooks/use-voting";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type VoteDirection = "left" | "right" | "skip";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_X = SCREEN_WIDTH * 1.2;

function getInitials(username: string | undefined): string {
  if (!username) return "?";
  return username
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function AvatarDisplay({
  avatar_url,
  username,
  color,
}: {
  avatar_url: string | null | undefined;
  username: string | undefined;
  color: string | null | undefined;
}) {
  if (avatar_url) {
    return (
      <Image
        source={{ uri: avatar_url }}
        className="w-full h-full rounded-full"
      />
    );
  }

  return (
    <View
      className="w-full h-full items-center justify-center rounded-full"
      style={{ backgroundColor: color ?? "#7b2fff" }}
    >
      <Text className="text-xs font-bold text-white">
        {getInitials(username)}
      </Text>
    </View>
  );
}

export default function VotingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const roomId = id ?? null;

  const {
    room,
    proposals: dbProposals,
    participants,
    votedProposalIds,
    isLoading,
    error,
    isSubmittingVote,
    submitVote,
    votesTotalCount,
    finishedVotingCount,
    updateRoomStatusToResults,
  } = useVoting(roomId);

  const [proposals, setProposals] = useState<typeof dbProposals>([]);
  const [votedCount, setVotedCount] = useState(0);
  const [totalSwipes, setTotalSwipes] = useState(0);
  const [totalVotableProposals, setTotalVotableProposals] = useState(0);

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

  // Update proposals list when dbProposals changes
  useMemo(() => {
    if (dbProposals.length > 0 && proposals.length === 0) {
      setProposals(dbProposals);
    }
    if (dbProposals.length > 0) {
      setTotalVotableProposals(dbProposals.length);
    }
  }, [dbProposals]);

  const finishSwipe = (
    direction: VoteDirection,
    currentProposal: (typeof proposals)[0] | undefined,
  ) => {
    setProposals((currentProposals) => {
      const [proposal, ...restProposals] = currentProposals;

      if (!proposal) {
        return currentProposals;
      }

      if (direction === "skip") {
        return [...restProposals, proposal];
      }

      return restProposals;
    });

    setTotalSwipes((prev) => prev + 1);

    if (direction !== "skip" && currentProposal) {
      // Increment count immediately for responsive UI
      setVotedCount((prev) => prev + 1);
      // Submit vote to database
      submitVote(currentProposal.id);
    }

    position.setValue({ x: 0, y: 0 });
  };

  const forceSwipe = (
    direction: VoteDirection,
    proposal: (typeof proposals)[0] | undefined,
  ) => {
    if (direction === "skip") {
      Animated.timing(position, {
        toValue: { x: 0, y: 24 },
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        finishSwipe("skip", proposal);
      });
      return;
    }

    const x = direction === "right" ? SWIPE_OUT_X : -SWIPE_OUT_X;

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      finishSwipe(direction, proposal);
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
          forceSwipe("right", proposals[0]);
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left", proposals[0]);
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  const activeProposal = proposals[0];
  const nextProposal = proposals[1];

  const cardsFinished = !activeProposal;

  // Auto-redirect to results when all participants finish voting
  useEffect(() => {
    if (
      cardsFinished &&
      finishedVotingCount > 0 &&
      finishedVotingCount === participants.length &&
      roomId
    ) {
      // All participants finished, update room status and redirect
      const transitionToResults = async () => {
        await updateRoomStatusToResults();
        router.replace({
          pathname: "/room/[id]/results",
          params: { id: roomId },
        });
      };
      transitionToResults();
    }
  }, [
    cardsFinished,
    finishedVotingCount,
    participants.length,
    roomId,
    updateRoomStatusToResults,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 px-container-spacing bg-dark-bg items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView className="flex-1 px-container-spacing bg-dark-bg items-center justify-center">
        <Text className="text-text-secondary">Room not found</Text>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 px-container-spacing bg-dark-bg">
      <View className="py-4 border-b border-border">
        <Text className="text-lg font-bold text-white text-center">Voting</Text>
      </View>

      <View className="gap-5 mt-4">
        <View className="items-center gap-3">
          <Text className="px-4 py-1 text-xs rounded-full text-text-secondary bg-card">
            code: {room.code}
          </Text>
          <View className="flex-row items-center justify-between w-full">
            <View className="flex-row items-center">
              {participants.slice(0, 5).map((participant, index) => (
                <View
                  key={participant.user_id}
                  className="items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-dark-bg"
                  style={{
                    marginLeft: index === 0 ? 0 : -10,
                  }}
                >
                  <AvatarDisplay
                    avatar_url={participant.profile?.avatar_url}
                    username={participant.profile?.username}
                    color={participant.profile?.color}
                  />
                </View>
              ))}

              {participants.length > 5 && (
                <View className="items-center justify-center h-8 px-2 ml-2 rounded-full bg-card">
                  <Text className="text-xs text-text-secondary">
                    +{participants.length - 5}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center gap-2 px-3 py-1 rounded-full bg-card">
              <View className="w-2 h-2 rounded-full bg-success" />
              <Text className="text-xs text-text-secondary">
                {finishedVotingCount} of {participants.length} finished
              </Text>
            </View>
          </View>

          <View className="w-full h-1 rounded-full bg-border">
            <View
              className="h-1 rounded-full bg-primary"
              style={{
                width: `${Math.min(
                  (finishedVotingCount / Math.max(1, participants.length)) *
                    100,
                  100,
                )}%`,
              }}
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
              <Text className="mt-6 text-sm text-text-secondary">
                Waiting for others to finish...
              </Text>
            </View>
          ) : (
            <>
              {!!nextProposal && (
                <View className="absolute inset-0 translate-y-2 border rounded-3xl border-border bg-card" />
              )}

              <Animated.View
                {...panResponder.panHandlers}
                className="absolute inset-0 p-5 border rounded-3xl border-primary"
                style={cardAnimatedStyle}
              >
                <View className="items-center justify-center flex-1 rounded-3xl bg-card">
                  {/* Proposal Creator Avatars */}
                  <View className="w-16 h-16 rounded-full items-center justify-center bg-dark-bg border-2 border-primary overflow-hidden">
                    <AvatarDisplay
                      avatar_url={activeProposal.profile?.avatar_url}
                      username={activeProposal.profile?.username}
                      color={activeProposal.profile?.color}
                    />
                  </View>

                  <Text className="mt-6 text-4xl font-bold text-white text-center px-4">
                    {activeProposal.content}
                  </Text>

                  <Text className="mt-2 text-base text-text-secondary">
                    Proposed by {activeProposal.profile?.username}
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
            {votedCount} of {totalVotableProposals} proposals
          </Text>

          <View className="flex-row items-end justify-center gap-6 mt-1">
            <Pressable
              onPress={() =>
                !cardsFinished && forceSwipe("left", activeProposal)
              }
              disabled={cardsFinished || isSubmittingVote}
              className={`items-center ${cardsFinished || isSubmittingVote ? "opacity-40" : "opacity-100"}`}
            >
              <View className="items-center justify-center w-16 h-16 border-2 rounded-full border-danger">
                {isSubmittingVote ? (
                  <ActivityIndicator color="#ff6b6b" size="small" />
                ) : (
                  <Text className="text-2xl">👎</Text>
                )}
              </View>
              <Text className="mt-2 text-xs text-text-secondary">pass</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                !cardsFinished && forceSwipe("skip", activeProposal)
              }
              disabled={cardsFinished}
              className={`items-center ${cardsFinished ? "opacity-40" : "opacity-100"}`}
            >
              <View className="items-center justify-center w-12 h-12 rounded-full bg-card border border-border">
                <Text className="text-lg">⏭️</Text>
              </View>
              <Text className="mt-2 text-xs text-text-secondary">skip</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                !cardsFinished && forceSwipe("right", activeProposal)
              }
              disabled={cardsFinished || isSubmittingVote}
              className={`items-center ${cardsFinished || isSubmittingVote ? "opacity-40" : "opacity-100"}`}
            >
              <View className="items-center justify-center w-16 h-16 border-2 rounded-full border-success">
                {isSubmittingVote ? (
                  <ActivityIndicator color="#36c95e" size="small" />
                ) : (
                  <Text className="text-2xl">👍</Text>
                )}
              </View>
              <Text className="mt-2 text-xs text-text-secondary">yes</Text>
            </Pressable>
          </View>
        </View>

        {error && (
          <Text className="text-sm font-semibold text-danger text-center">
            {error}
          </Text>
        )}

        <Text className="text-xs text-center text-text-muted">
          Swipes made: {totalSwipes}
        </Text>
      </View>
    </SafeAreaView>
  );
}
