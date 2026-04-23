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
        // Room
        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select(
            "id, code, title, status, host_id, created_at, closed_at, winner_proposal_id",
          )
          .eq("id", roomId)
          .single();

        if (roomError) throw roomError;

        // Participants (ordered)
        const { data: participantsData, error: participantsError } =
          await supabase
            .from("participants")
            .select("id, user_id, joined_at, room_id")
            .eq("room_id", roomId)
            .order("joined_at", { ascending: true });

        if (participantsError) throw participantsError;

        // Dedupe user ids
        const userIds = Array.from(
          new Set((participantsData || []).map((p) => p.user_id)),
        );
        let profilesData: any[] = [];

        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, color")
            .in("id", userIds);

          if (profilesError) {
            // Don't fail entire fetch if profiles can't be fetched; log and continue
            console.error("Profiles error:", profilesError);
          } else {
            profilesData = profiles || [];
          }
        }

        // Merge participants with matching profile (id === user_id)
        const enrichedParticipants = (participantsData || []).map(
          (participant) => ({
            ...participant,
            profile:
              profilesData.find((p) => p.id === participant.user_id) || null,
          }),
        );

        setRoom(roomData);
        setParticipants(enrichedParticipants);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching room:", err);
        setError(err.message ?? String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();

    // Subscriptions for realtime updates (participants + room)
    const participantsSub = supabase
      .channel(`participants:${roomId}`)
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

    const roomSub = supabase
      .channel(`rooms:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        () => {
          fetchRoom();
        },
      )
      .subscribe();

    return () => {
      participantsSub.unsubscribe();
      roomSub.unsubscribe();
    };
  }, [roomId]);

  return { room, participants, isLoading, error };
}
