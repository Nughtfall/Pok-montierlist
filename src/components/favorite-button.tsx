"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export function FavoriteButton({ pokemonId, initialFavorite = false }: { pokemonId: string; initialFavorite?: boolean }) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [message, setMessage] = useState("");
  async function toggle() {
    const response = await fetch(`/api/favorites/${pokemonId}`, { method: favorite ? "DELETE" : "POST" });
    if (response.ok) { setFavorite(!favorite); setMessage(favorite ? "Removed from favorites" : "Added to favorites"); }
    else setMessage(response.status === 401 ? "Sign in to manage favorites" : "Could not update favorite");
  }
  return <div><button onClick={() => void toggle()} className="button button-secondary" aria-pressed={favorite}><Heart size={16} fill={favorite ? "currentColor" : "none"}/>{favorite ? "Favorited" : "Favorite"}</button><p className="muted mt-2 text-xs" aria-live="polite">{message}</p></div>;
}
