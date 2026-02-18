"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabase";
import { useRouter } from "next/navigation";
import { useBookmarks } from "@/hooks/useBookmarks";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const { bookmarks, addBookmark, deleteBookmark } = useBookmarks(user);

    useEffect(() => {
        const checkUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) router.push("/login");
            else setUser(user);
        };
        checkUser();
    }, [router]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT") {
                router.push("/login");
            }
            if (event === "SIGNED_IN") {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleAdd = async () => {
        if (!title || !url || !user) return;
        await addBookmark(title, url);
        setTitle("");
        setUrl("");
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="border-b bg-white px-6 py-4 flex justify-between items-center">
                <span className="font-semibold text-gray-800 tracking-tight">
                    📎 Bookmarks
                </span>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-10 space-y-8">
                <div className="bg-white rounded-2xl border p-6 space-y-3 shadow-sm">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        New Bookmark
                    </h2>
                    <input
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black transition"
                    />
                    <input
                        placeholder="https://"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black transition"
                    />
                    <button
                        onClick={handleAdd}
                        className="w-full bg-black text-white text-sm py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                        Add
                    </button>
                </div>

                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Saved — {bookmarks.length}
                    </h2>

                    {bookmarks.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-10">
                            No bookmarks yet.
                        </p>
                    )}

                    {bookmarks.map((b) => (
                        <div
                            key={b.id}
                            className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center shadow-sm hover:shadow-md transition"
                        >
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    {b.title}
                                </p>
                                <a
                                    href={b.url}
                                    target="_blank"
                                    className="text-xs text-blue-500 hover:underline truncate block"
                                >
                                    {b.url}
                                </a>
                            </div>
                            <button
                                onClick={() => deleteBookmark(b.id)}
                                className="ml-4 text-gray-300 hover:text-red-500 transition text-lg"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
