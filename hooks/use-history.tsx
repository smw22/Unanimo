import { useAuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";

export type HistoryItem = {
  id: string;
  code: string;
  created_at: string;
  participant_count: number;
  winning_proposal: {
    id: string;
    content: string;
    yes_votes: number;
  };
  winning_creator: {
    id: string;
    username: string;
    avatar_url: string | null;
    color: string | null;
  };
};

export function useHistory() {
  const { profile } = useAuthContext();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get rooms where user is a participant and status is 'results'
        const { data: userRooms, error: roomsError } = await supabase
          .from("participants")
          .select("room_id")
          .eq("user_id", profile.id);

        if (roomsError) throw roomsError;

        if (!userRooms || userRooms.length === 0) {
          setHistory([]);
          return;
        }

        const roomIds = userRooms.map((r) => r.room_id);

        // Get completed rooms (status = 'results')
        const { data: rooms, error: completedRoomsError } = await supabase
          .from("rooms")
          .select("id, code, created_at")
          .in("id", roomIds)
          .eq("status", "results")
          .order("created_at", { ascending: false });

        if (completedRoomsError) throw completedRoomsError;

        if (!rooms || rooms.length === 0) {
          setHistory([]);
          return;
        }

        // For each room, get winning proposal and participant count
        const historyItems: HistoryItem[] = [];

        for (const room of rooms) {
          // Get participant count
          const { data: participants, error: partError } = await supabase
            .from("participants")
            .select("id")
            .eq("room_id", room.id);

          if (partError) throw partError;

          // Get all proposals with vote counts
          const { data: proposals, error: propError } = await supabase
            .from("proposals")
            .select(
              `
              id,
              content,
              participant_id,
              participants:participant_id (
                user_id,
                profiles:user_id (
                  id,
                  username,
                  avatar_url,
                  color
                )
              )
            `,
            )
            .eq("room_id", room.id);

          if (propError) throw propError;

          if (!proposals || proposals.length === 0) continue;

          // Count YES votes for each proposal
          const proposalIds = proposals.map((p) => p.id);
          const { data: votes, error: votesError } = await supabase
            .from("votes")
            .select("proposal_id")
            .in("proposal_id", proposalIds)
            .eq("vote_type", "yes");

          if (votesError) throw votesError;

          // Find winning proposal (most YES votes)
          const voteCountMap = new Map<string, number>();
          votes?.forEach((vote) => {
            voteCountMap.set(
              vote.proposal_id,
              (voteCountMap.get(vote.proposal_id) ?? 0) + 1,
            );
          });

          let winningProposal = proposals[0];
          let maxVotes = 0;

          proposals.forEach((prop) => {
            const voteCount = voteCountMap.get(prop.id) ?? 0;
            if (voteCount > maxVotes) {
              maxVotes = voteCount;
              winningProposal = prop;
            }
          });

          const participant = winningProposal.participants;
          const profile = participant?.profiles;

          historyItems.push({
            id: room.id,
            code: room.code,
            created_at: room.created_at,
            participant_count: participants?.length ?? 0,
            winning_proposal: {
              id: winningProposal.id,
              content: winningProposal.content,
              yes_votes: voteCountMap.get(winningProposal.id) ?? 0,
            },
            winning_creator: {
              id: profile?.id ?? "",
              username: profile?.username ?? "Unknown",
              avatar_url: profile?.avatar_url ?? null,
              color: profile?.color ?? null,
            },
          });
        }

        setHistory(historyItems);
      } catch (err: any) {
        console.error("[HISTORY ERROR]", err);
        setError(err?.message ?? "Failed to fetch history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [profile?.id]);

  return { history, isLoading, error };
}
