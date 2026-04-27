import { useAuthContext } from "@/hooks/use-auth-context";
import { useRoom } from "@/hooks/use-room";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

export type ProposalWithProfile = {
  id: string;
  content: string;
  participant_id: string;
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    color: string | null;
  };
  vote_count?: number;
};

export function useVoting(roomId: string | null) {
  const { profile, claims } = useAuthContext();
  const { room, participants } = useRoom(roomId);

  const [proposals, setProposals] = useState<ProposalWithProfile[]>([]);
  const [votedProposalIds, setVotedProposalIds] = useState<Set<string>>(
    new Set(),
  );
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [finishedVotingCount, setFinishedVotingCount] = useState(0);

  const userId = useMemo(
    () => profile?.id ?? claims?.id ?? claims?.sub ?? null,
    [claims?.id, claims?.sub, profile?.id],
  );

  // Get current participant ID
  useEffect(() => {
    if (!roomId || !userId) return;

    const fetchParticipant = async () => {
      const { data, error: participantError } = await supabase
        .from("participants")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .maybeSingle();

      if (participantError) {
        setError(participantError.message);
        return;
      }

      setParticipantId(data?.id ?? null);
    };

    fetchParticipant();
  }, [roomId, userId]);

  // Fetch proposals with profile info and vote counts
  const fetchProposals = async () => {
    if (!roomId) return;

    try {
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("proposals")
        .select(
          `id, 
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
           )`,
        )
        .eq("room_id", roomId);

      if (proposalsError) throw proposalsError;

      if (proposalsData) {
        // Get vote counts for each proposal
        const { data: voteCounts, error: voteError } = await supabase
          .from("votes")
          .select("proposal_id", { count: "exact", head: false })
          .in(
            "proposal_id",
            proposalsData.map((p) => p.id),
          );

        if (voteError) throw voteError;

        const voteCountMap = new Map<string, number>();
        voteCounts?.forEach((vote) => {
          voteCountMap.set(
            vote.proposal_id,
            (voteCountMap.get(vote.proposal_id) ?? 0) + 1,
          );
        });

        // Transform proposals
        const transformed = proposalsData.map((proposal: any) => {
          const participant = proposal.participants;
          const profile = participant?.profiles;

          return {
            id: proposal.id,
            content: proposal.content,
            participant_id: proposal.participant_id,
            profile: {
              id: profile?.id,
              username: profile?.username,
              avatar_url: profile?.avatar_url,
              color: profile?.color,
            },
            vote_count: voteCountMap.get(proposal.id) ?? 0,
          };
        });

        setProposals(transformed);
      }
    } catch (err: any) {
      console.error("Error fetching proposals:", err);
      setError(err.message ?? String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch proposals on mount and when room changes
  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchProposals();
  }, [roomId]);

  // Fetch votes by current user
  useEffect(() => {
    if (!participantId || !roomId) return;

    const fetchUserVotes = async () => {
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("proposal_id")
        .eq("participant_id", participantId);

      if (votesError) {
        console.error("Error fetching user votes:", votesError);
        return;
      }

      const votedIds = new Set<string>(
        votesData?.map((v) => v.proposal_id) ?? [],
      );
      setVotedProposalIds(votedIds);
    };

    fetchUserVotes();
  }, [participantId]);

  // Subscribe to proposal changes
  useEffect(() => {
    if (!roomId) return;

    const proposalsSub = supabase
      .channel(`proposals:voting:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchProposals();
        },
      )
      .subscribe();

    return () => {
      proposalsSub.unsubscribe();
    };
  }, [roomId]);

  // Filter out user's own proposal
  const votableProposals = useMemo(() => {
    return proposals.filter((p) => p.participant_id !== participantId);
  }, [proposals, participantId]);

  // Subscribe to vote changes and track participant completion
  useEffect(() => {
    if (!roomId) return;

    let participantProgressInterval: NodeJS.Timeout;

    const fetchParticipantProgress = async () => {
      try {
        const { data: participantsData, error: partsError } = await supabase
          .from("participants")
          .select("id")
          .eq("room_id", roomId);

        if (partsError) throw partsError;

        if (participantsData) {
          // Use total proposals count (not votable) to determine if someone finished
          const { data: allProposals } = await supabase
            .from("proposals")
            .select("id, participant_id")
            .eq("room_id", roomId);

          if (!allProposals || allProposals.length === 0) return;

          // Count participants who have voted on all proposals except their own
          const finishedCount = await Promise.all(
            participantsData.map(async (participant) => {
              const votableForParticipant = allProposals.filter(
                (p) => p.participant_id !== participant.id,
              ).length;

              if (votableForParticipant === 0) return true;

              const { count, error: countError } = await supabase
                .from("votes")
                .select("id", { count: "exact", head: true })
                .eq("participant_id", participant.id);

              if (countError) return false;
              return (count ?? 0) >= votableForParticipant;
            }),
          );

          const finished = finishedCount.filter((v) => v).length;
          setFinishedVotingCount(finished);
        }
      } catch (err) {
        console.error("Error fetching participant progress:", err);
      }
    };

    // Fetch immediately
    fetchParticipantProgress();

    // Also poll every 2 seconds for real-time feel
    participantProgressInterval = setInterval(fetchParticipantProgress, 2000);

    const votesSub = supabase
      .channel(`votes:voting:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
        },
        () => {
          fetchParticipantProgress();
        },
      )
      .subscribe();

    return () => {
      votesSub.unsubscribe();
      clearInterval(participantProgressInterval);
    };
  }, [roomId, votableProposals.length]);

  const submitVote = async (proposalId: string) => {
    if (!participantId) {
      setError("You are not part of this room.");
      return false;
    }

    setIsSubmittingVote(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("votes").insert({
        proposal_id: proposalId,
        participant_id: participantId,
      });

      if (insertError) {
        if (insertError.message.toLowerCase().includes("duplicate key")) {
          setError("You already voted for this proposal.");
          return false;
        }
        throw insertError;
      }

      // Update local state
      setVotedProposalIds((prev) => new Set([...prev, proposalId]));
      return true;
    } catch (err: any) {
      setError(err?.message ?? "Failed to submit vote.");
      return false;
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const votesTotalCount = useMemo(() => {
    return proposals.reduce((sum, p) => sum + (p.vote_count ?? 0), 0);
  }, [proposals]);

  const expectedTotalVotes = useMemo(() => {
    return participants.length * (proposals.length - 1); // Each participant votes on all except their own
  }, [participants.length, proposals.length]);

  return {
    room,
    proposals: votableProposals,
    participants,
    votedProposalIds,
    isLoading,
    error,
    isSubmittingVote,
    submitVote,
    votesTotalCount,
    expectedTotalVotes,
    finishedVotingCount,
  };
}
