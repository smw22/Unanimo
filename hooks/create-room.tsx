import { supabase } from "@/lib/supabase";
import { useAuthContext } from "./use-auth-context";

export function useCreateRoom() {
  const { claims } = useAuthContext();

  const createRoom = async (
    title: string,
    options?: {
      isAnonymous?: boolean;
      isTimeLimited?: boolean;
      maxParticipants?: number;
    },
  ) => {
    let userId = claims?.id;

    if (!userId) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id;
    }

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          host_id: userId,
          title: title,
          status: "waiting",
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-add host as participant
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

  return { createRoom };
}
