import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    const fetchRoom = async () => {
      try {
        // Fetch room data (title, code, etc)
        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select(
            "id, code, title, status, host_id, created_at, closed_at, winner_proposal_id",
          )
          .eq("id", roomId)
          .single();

        if (roomError) throw roomError;

        // Fetch participants with user_id
        const { data: participantsData, error: participantsError } =
          await supabase
            .from("participants")
            .select("id, user_id, joined_at, room_id")
            .eq("room_id", roomId);

        if (participantsError) throw participantsError;

        // Fetch all profiles for these participants
        const userIds = participantsData?.map((p) => p.user_id) || [];
        let profilesData: any[] = [];

        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, color")
            .in("id", userIds);

          if (profilesError) throw profilesError;
          profilesData = profiles || [];
        }

        // Merge participants with profiles
        const enrichedParticipants =
          participantsData?.map((participant) => ({
            ...participant,
            profile: profilesData.find(
              (profile) => profile.id === participant.user_id,
            ),
          })) || [];

        setRoom(roomData);
        setParticipants(enrichedParticipants);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching room:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();

    // Subscribe to real-time updates on participants
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchRoom();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  return { room, participants, isLoading, error };
}
