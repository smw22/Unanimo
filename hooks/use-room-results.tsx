import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export type RoomResultsData = {
  id: string;
  code: string;
  created_at: string;
  participant_count: number;
  total_proposals: number;
  proposals: Array<{
    id: string;
    content: string;
    participant_id: string;
    yes_votes: number;
    no_votes: number;
    creator: {
      id: string;
      username: string;
      avatar_url: string | null;
      color: string | null;
    };
  }>;
  members: Array<{
    id: string;
    user_id: string;
    username: string;
    avatar_url: string | null;
    color: string | null;
    voted_proposals: { proposal_id: string; vote_type: string }[];
  }>;
};

export function useRoomResults(roomId: string | null) {
  const [data, setData] = useState<RoomResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomResults = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get room
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("id, code, created_at")
          .eq("id", roomId)
          .single();

        if (roomError) throw roomError;

        if (!room) {
          setError("Room not found");
          return;
        }

        // Get participants
        const { data: participants, error: partError } = await supabase
          .from("participants")
          .select(
            `
            id,
            user_id,
            profiles:user_id (
              id,
              username,
              avatar_url,
              color
            )
          `,
          )
          .eq("room_id", roomId);

        if (partError) throw partError;

        // Get all proposals
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
          .eq("room_id", roomId);

        if (propError) throw propError;

        // Get all votes
        const { data: votes, error: votesError } = await supabase
          .from("votes")
          .select("proposal_id, participant_id, vote_type")
          .in("proposal_id", proposals?.map((p) => p.id) ?? []);

        if (votesError) throw votesError;

        // Count votes per proposal and type
        const voteMap = new Map<string, { yes: number; no: number }>();
        votes?.forEach((vote) => {
          const current = voteMap.get(vote.proposal_id) || { yes: 0, no: 0 };
          if (vote.vote_type === "yes") {
            current.yes += 1;
          } else if (vote.vote_type === "no") {
            current.no += 1;
          }
          voteMap.set(vote.proposal_id, current);
        });

        // Get participant votes
        const participantVotes = new Map<
          string,
          { proposal_id: string; vote_type: string }[]
        >();
        votes?.forEach((vote) => {
          const current = participantVotes.get(vote.participant_id) || [];
          current.push({
            proposal_id: vote.proposal_id,
            vote_type: vote.vote_type,
          });
          participantVotes.set(vote.participant_id, current);
        });

        // Transform proposals
        const transformedProposals = proposals
          ?.map((prop: any) => {
            const voteCounts = voteMap.get(prop.id) || { yes: 0, no: 0 };
            const participant = prop.participants;
            const profile = participant?.profiles;

            return {
              id: prop.id,
              content: prop.content,
              participant_id: prop.participant_id,
              yes_votes: voteCounts.yes,
              no_votes: voteCounts.no,
              creator: {
                id: profile?.id ?? "",
                username: profile?.username ?? "Unknown",
                avatar_url: profile?.avatar_url ?? null,
                color: profile?.color ?? null,
              },
            };
          })
          .sort((a, b) => b.yes_votes - a.yes_votes);

        // Transform members
        const transformedMembers = participants?.map((part: any) => {
          const profile = part.profiles;
          return {
            id: part.id,
            user_id: part.user_id,
            username: profile?.username ?? "Unknown",
            avatar_url: profile?.avatar_url ?? null,
            color: profile?.color ?? null,
            voted_proposals: participantVotes.get(part.id) || [],
          };
        });

        setData({
          id: room.id,
          code: room.code,
          created_at: room.created_at,
          participant_count: participants?.length ?? 0,
          total_proposals: proposals?.length ?? 0,
          proposals: transformedProposals || [],
          members: transformedMembers || [],
        });
      } catch (err: any) {
        console.error("[ROOM RESULTS ERROR]", err);
        setError(err?.message ?? "Failed to fetch room results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomResults();
  }, [roomId]);

  return { data, isLoading, error };
}
