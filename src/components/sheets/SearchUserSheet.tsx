"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSearchSheet } from "@/stores/sheets-store";
import { User } from "@prisma/client";
import axios from "axios";
import { Loader2, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import Link from "next/link";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { suggestedUsers } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

export default function SearchUserSheet() {
  const state = useSearchSheet();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [debouncedQuery] = useDebounce(query, 500); // 500ms debounce
  // Query to fetch messages
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["suggested-users"],
    queryFn: suggestedUsers,
    retry: (failureCount, error) => {
      return false;
    },
  });

  const handleSearch = async (q: string) => {
    setLoading(true);
    setError("");
    setUsers([]);
    try {
      const res = await axios.get(`/api/search?q=${query}`);
      if (res.status != 200) throw new Error(res.data.error);
      setUsers(res.data.users);
    } catch (e) {
      console.error("Error fetching user:", e);
      setError("Something went wrong while fetching the user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <Sheet open={state.isOpen} onOpenChange={() => state.onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Find Users</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search users..."
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-8rem)] py-2">
            {query === "" ? (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2">
                  Suggested Users
                </h2>
                <div className="space-y-4">
                  {suggestions?.map((user) => (
                    <UserItem key={user.id} user={user} />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2">
                  Search Results
                </h2>
                {users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <UserItem key={user.id} user={user} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No users found
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
          {error && !loading && (
            <div className="text-red-500 mt-2">{error}</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UserItem({ user }: { user: User }) {
  const state = useSearchSheet();
  return (
    <Link href={`/u/${user.username}`} onClick={() => state.onClose()}>
      <div className="flex items-center justify-between w-full py-2 hover:bg-secondary/90 rounded-md transition-colors">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={user.image ?? ""} alt={user.username} />
            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
