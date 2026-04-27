import { supabase } from "@/lib/supabase";

/**
 * Host: create a tiebreaker row and attach tied participants.
 * tiedParticipants: Array<{ participant_id: string, proposal_id: string }>
 */
export async function createTiebreaker(
  roomId: string,
  tiedParticipants: { participant_id: string; proposal_id: string }[],
) {
  // create tiebreaker row
  const { data: tdata, error: terr } = await supabase
    .from("tiebreakers")
    .insert({ room_id: roomId, status: "pending" })
    .select()
    .single();

  if (terr) throw terr;
  if (!tdata) throw new Error("Failed to create tiebreaker");

  const tiebreakerId = tdata.id;

  // insert participants
  const rows = tiedParticipants.map((tp) => ({
    tiebreaker_id: tiebreakerId,
    participant_id: tp.participant_id,
    proposal_id: tp.proposal_id,
  }));

  const { error: pErr } = await supabase
    .from("tiebreaker_participants")
    .insert(rows);
  if (pErr) throw pErr;

  return tdata;
}

/**
 * Small helper to check whether a given participant id is included in a tiebreaker.
 */
export async function isParticipantInTiebreaker(
  tiebreakerId: string,
  participantId: string,
) {
  const { data, error } = await supabase
    .from("tiebreaker_participants")
    .select("participant_id")
    .eq("tiebreaker_id", tiebreakerId)
    .eq("participant_id", participantId)
    .maybeSingle();

  if (error) {
    console.error("isParticipantInTiebreaker error:", error);
    return false;
  }
  return !!data;
}
