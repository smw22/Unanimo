import { useAuthContext } from "@/hooks/use-auth-context";
import { useRoom } from "@/hooks/use-room";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

export function useProposalPhase(roomId: string | null) {
  const { profile, claims } = useAuthContext();
  const { room, participants } = useRoom(roomId);

  const [content, setContent] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [proposalCount, setProposalCount] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useMemo(
    () => profile?.id ?? claims?.id ?? claims?.sub ?? null,
    [claims?.id, claims?.sub, profile?.id],
  );

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

  useEffect(() => {
    if (!roomId || !participantId) return;

    const fetchOwnProposal = async () => {
      const { data, error: ownProposalError } = await supabase
        .from("proposals")
        .select("id")
        .eq("room_id", roomId)
        .eq("participant_id", participantId)
        .maybeSingle();

      if (ownProposalError) {
        setError(ownProposalError.message);
        return;
      }

      setHasSubmitted(!!data);
    };

    fetchOwnProposal();
  }, [participantId, roomId]);

  useEffect(() => {
    if (!roomId) return;

    const fetchProposalCount = async () => {
      const { count, error: countError } = await supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("room_id", roomId);

      if (countError) {
        setError(countError.message);
        return;
      }

      setProposalCount(count ?? 0);
    };

    fetchProposalCount();

    const proposalsSub = supabase
      .channel(`proposals:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchProposalCount();
        },
      )
      .subscribe();

    return () => {
      proposalsSub.unsubscribe();
    };
  }, [roomId]);

  const participantTotal = participants.length;
  const progressText = `${proposalCount} of ${participantTotal} proposal${participantTotal === 1 ? "" : "s"} added`;

  const submitProposal = async () => {
    if (!roomId || !participantId) {
      setError("You are not part of this room.");
      return;
    }

    if (!content.trim()) {
      setError("Please write a proposal before continuing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("proposals").insert({
        room_id: roomId,
        participant_id: participantId,
        content: content.trim(),
      });

      if (insertError) {
        if (insertError.message.toLowerCase().includes("duplicate key")) {
          setHasSubmitted(true);
          setError("You have already submitted a proposal.");
          return;
        }
        throw insertError;
      }

      setHasSubmitted(true);
      setContent("");
    } catch (submitError: any) {
      setError(submitError?.message ?? "Failed to submit proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    room,
    content,
    setContent,
    hasSubmitted,
    isSubmitting,
    error,
    proposalCount,
    participantTotal,
    progressText,
    submitProposal,
    shouldRedirectToVoting: room?.status === "voting",
  };
}
