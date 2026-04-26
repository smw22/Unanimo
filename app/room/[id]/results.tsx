// filepath: /Users/mikkelruby/Desktop/Eksamen 2026/Unanimo/app/room/[id]/results.tsx
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

export default function Results() {
  const { id: roomId } = useLocalSearchParams<{ id?: string }>();
  const [room, setRoom] = useState<any | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!roomId) return;

    const fetchAll = async () => {
      try {
        // Fetch room
        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select("id, title, code, winner_proposal_id")
          .eq("id", roomId)
          .single();
        if (roomError) throw roomError;
        setRoom(roomData);

        // Fetch proposals for room
        const { data: proposalsData, error: proposalsError } = await supabase
          .from("proposals")
          .select("id, room_id, user_id, text, created_at")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false });
        if (proposalsError) throw proposalsError;
        const proposalsList = proposalsData || [];

        // Fetch votes for these proposals
        const proposalIds = proposalsList.map((p: any) => p.id);
        let votesData: any[] = [];
        if (proposalIds.length > 0) {
          const { data: vdata, error: votesError } = await supabase
            .from("votes")
            .select("id, proposal_id, user_id, approved")
            .in("proposal_id", proposalIds);
          if (votesError) throw votesError;
          votesData = vdata || [];
        }

        // Fetch proposer profiles
        const proposerIds = Array.from(
          new Set(proposalsList.map((p: any) => p.user_id).filter(Boolean)),
        );
        let profilesMap: Record<string, any> = {};
        if (proposerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", proposerIds);
          if (profilesError) throw profilesError;
          (profilesData || []).forEach((pr: any) => {
            profilesMap[pr.id] = pr;
          });
        }

        // Aggregate votes per proposal (count approved === true)
        const votesByProposal: Record<string, number> = {};
        votesData.forEach((v: any) => {
          if (!v.approved) return;
          votesByProposal[v.proposal_id] =
            (votesByProposal[v.proposal_id] || 0) + 1;
        });

        // Enhance proposals with vote counts and proposer username
        const enhanced = proposalsList.map((p: any) => ({
          ...p,
          votes: votesByProposal[p.id] || 0,
          proposer: profilesMap[p.user_id]?.username ?? null,
        }));

        setProposals(enhanced);
        setProfiles(profilesMap);
      } catch (err: any) {
        console.error("Results fetch error:", err);
      }
    };

    fetchAll();
  }, [roomId]);

  const totalVotes = proposals.reduce((s, p) => s + (p.votes || 0), 0);
  const maxVotes = proposals.length
    ? Math.max(...proposals.map((p) => p.votes || 0))
    : 0;

  // Prefer room.winner_proposal_id if set otherwise pick max
  const winner =
    (room?.winner_proposal_id &&
      proposals.find((p) => p.id === room.winner_proposal_id)) ||
    proposals.find((p) => p.votes === maxVotes) ||
    null;

  return (
    <div className="max-w-md min-h-screen px-6 py-8 mx-auto text-white bg-black">
      <div className="relative mb-8 text-center">
        <h1 className="relative text-2xl font-bold">Results</h1>
        <p className="mt-1 text-sm text-gray-400">
          {room?.title ?? "Room"} · {totalVotes} votes
        </p>
      </div>

      {winner ? (
        <div className="p-6 mb-10 text-center border-2 border-purple-500 rounded-2xl bg-purple-950/40">
          <div className="mb-2 text-3xl">👑</div>
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest text-purple-100 uppercase rounded-full bg-purple-700/60">
            Winner
          </span>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-3xl">🏆</span>
            <h2 className="text-3xl font-bold">{winner.text}</h2>
          </div>
          <p className="mt-3 text-sm text-gray-300">
            {winner.votes} out of {totalVotes} voted yes
          </p>
          <p className="mt-1 text-xs text-gray-400">
            suggested by {winner.proposer ?? "Unknown"}
          </p>
          <button className="mt-4 bg-purple-700/60 hover:bg-purple-700 text-purple-100 text-sm px-4 py-1.5 rounded-full transition">
            share result
          </button>
        </div>
      ) : (
        <div className="p-6 mb-10 text-center border-2 border-gray-700 rounded-2xl bg-gray-900/40">
          <p className="text-sm text-gray-300">No winner yet</p>
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-4 text-sm text-gray-400">all suggestions</h3>
        <ul className="space-y-4">
          {proposals.map((p, i) => {
            const isWinner = winner && p.id === winner.id;
            const widthPct =
              maxVotes > 0 ? Math.round((p.votes / maxVotes) * 100) : 0;
            return (
              <li key={p.id || i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍽️</span>
                    <span
                      className={isWinner ? "font-semibold" : "text-gray-300"}
                    >
                      {p.text}
                    </span>
                  </div>
                  <span
                    className={`text-sm ${isWinner ? "text-purple-400" : "text-gray-500"}`}
                  >
                    {p.votes} {p.votes === 1 ? "vote" : "votes"}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isWinner ? "bg-purple-500" : "bg-gray-600"}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  suggested by {p.proposer ?? "Unknown"}
                </div>
              </li>
            );
          })}
          {proposals.length === 0 && (
            <li className="text-sm text-gray-400">No proposals yet.</li>
          )}
        </ul>
      </div>

      <div className="p-5 mb-6 text-center border-2 border-dashed border-green-500/60 rounded-2xl bg-gray-900/60">
        <p className="mb-3 text-sm text-gray-300">Got a tie? Settle it fast.</p>
        <button className="bg-green-500 hover:bg-green-400 text-black font-bold tracking-wider px-6 py-2.5 rounded-full transition">
          ⚡ TIEBREAKER
        </button>
      </div>

      <button
        onClick={async () => {
          // navigate back to room root or create new room — keep simple
          window.location.href = "/";
        }}
        className="w-full border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 font-semibold py-3.5 rounded-full transition"
      >
        Start new room
      </button>
    </div>
  );
}
