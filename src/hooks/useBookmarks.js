import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabase";

export function useBookmarks(user) {
    const [bookmarks, setBookmarks] = useState([]);

    useEffect(() => {
        if (!user) return;

        const load = async () => {
            const { data } = await supabase
                .from("bookmarks")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            setBookmarks(data || []);
        };

        load();
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel("bookmarks-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "bookmarks" },
                (payload) => {
                    const { eventType, new: newRow, old: oldRow } = payload;
                    if (eventType === "INSERT" && newRow.user_id === user.id) {
                        setBookmarks((prev) => [newRow, ...prev]);
                    }
                    if (eventType === "DELETE") {
                        setBookmarks((prev) => prev.filter((b) => b.id !== oldRow.id));
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user]);

    const addBookmark = async (title, url) => {
        await supabase.from("bookmarks").insert({ title, url, user_id: user.id });
    };

    const deleteBookmark = async (id) => {
        await supabase.from("bookmarks").delete().eq("id", id);
    };

    return { bookmarks, addBookmark, deleteBookmark };
}