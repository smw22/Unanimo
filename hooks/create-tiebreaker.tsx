import { supabase } from "@/lib/supabase";

/**
 * Host: create a tiebreaker row and attach tied participants.
 * tiedParticipants: Array<{ participant_id: string, proposal_id: string }>
 */
export async function createTiebreaker(
  roomId: string,
  tiedParticipants: { participant_id: string; proposal_id: string }[],
) {
  try {
    console.log("🔵 createTiebreaker called");

    const { data: tdata, error: terr } = await supabase
      .from("tiebreakers")
      .insert({ room_id: roomId, status: "pending" })
      .select()
      .single();

    if (terr) {
      console.error("❌ tiebreaker INSERT error:", terr);
      throw terr;
    }

    console.log("✅ Tiebreaker created:", tdata.id);
    const tiebreakerId = tdata.id;

    const rows = tiedParticipants.map((tp) => ({
      tiebreaker_id: tiebreakerId,
      participant_id: tp.participant_id,
      proposal_id: tp.proposal_id,
    }));

    const { error: pErr } = await supabase
      .from("tiebreaker_participants")
      .insert(rows);

    if (pErr) {
      console.error("❌ tiebreaker_participants INSERT error:", pErr);
      throw pErr;
    }

    return tdata;
  } catch (e) {
    console.error("❌ createTiebreaker failed:", e);
    throw e;
  }
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
