import { supabase } from "@/lib/supabase";
import { useAuthContext } from "./use-auth-context";

function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase();
}

export function useJoinRoom() {
  const { claims, profile } = useAuthContext();

  const joinRoomByCode = async (roomCode: string) => {
    const normalizedCode = normalizeRoomCode(roomCode);
    const userId = profile?.id ?? claims?.id ?? claims?.sub;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    if (!normalizedCode) {
      throw new Error("Please enter a room code.");
    }

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, code, status, max_participants")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (roomError) {
      throw roomError;
    }

    if (!room) {
      throw new Error("This room doesn't exist, write another code.");
    }

    if (room.status !== "waiting") {
      throw new Error("This room is no longer accepting new participants.");
    }

    const { data: existingParticipant, error: participantLookupError } =
      await supabase
        .from("participants")
        .select("id")
        .eq("room_id", room.id)
        .eq("user_id", userId)
        .maybeSingle();

    if (participantLookupError) {
      throw participantLookupError;
    }

    if (!existingParticipant) {
      const { error: participantInsertError } = await supabase
        .from("participants")
        .insert({
          room_id: room.id,
          user_id: userId,
        });

      if (participantInsertError) {
        throw participantInsertError;
      }
    }

    return {
      id: room.id,
      code: room.code,
    };
  };

  return { joinRoomByCode };
}
