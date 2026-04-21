import { supabase } from "@/lib/supabase";
import { useAuthContext } from "./use-auth-context";

export function useCreateRoom() {
  const { claims, profile } = useAuthContext();

  const createRoom = async (
    roomName: string,
    options?: {
      isAnonymous: boolean;
      isTimeLimited: boolean;
      maxParticipants: number;
    },
  ) => {
    const userId = claims?.sub;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Generate unique room code (6 characters)
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          code: roomCode,
          host_id: userId,
          status: "waiting",
        })
        .select()
        .single();

      if (error) throw error;

      const { error: participantError } = await supabase
        .from("participants")
        .insert({
          room_id: data.id,
          user_id: userId,
        });

      if (participantError) throw participantError;

      return {
        id: data.id,
        code: data.code,
        hostId: data.host_id,
      };
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  };

  return { createRoom, profile };
}
