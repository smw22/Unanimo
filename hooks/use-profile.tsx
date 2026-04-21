import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  color: string | null;
}

export function useProfile(userId: string | string[]) {
  const [data, setData] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || Array.isArray(userId)) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, color")
          .eq("id", userId)
          .single();

        if (error) throw error;
        setData(data);
      } catch (err: any) {
        setError(err.message);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { data, isLoading, error };
}
