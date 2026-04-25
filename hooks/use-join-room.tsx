import { supabase } from "@/lib/supabase";
import { useAuthContext } from "./use-auth-context";

function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase();
}

type RoomLookupResult = {
  id: string;
  code: string;
  status: string;
  max_participants: number | null;
};

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
      .rpc("join_room_by_code", { room_code: normalizedCode })
      .maybeSingle<RoomLookupResult>();

    if (roomError) {
      throw roomError;
    }

    if (!room) {
      throw new Error("This room doesn't exist, write another code.");
    }

    if (room.status !== "waiting") {
      throw new Error("This room is no longer accepting new participants.");
    }

    return {
      id: room.id,
      code: room.code,
    };
  };

  return { joinRoomByCode };
}
