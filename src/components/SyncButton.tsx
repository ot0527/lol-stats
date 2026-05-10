"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncButtonProps {
  onSyncComplete?: () => void;
}

/**
 * 試合データを同期するボタン。
 * 同期中はスピナーと進捗を表示する。
 */
export function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    added: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 20 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "同期に失敗しました");
        return;
      }

      setResult({ added: data.added, skipped: data.skipped });
      onSyncComplete?.();
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleSync}
        disabled={syncing}
        className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "同期中..." : "データ更新"}
      </Button>

      {result && (
        <span className="text-sm text-muted-foreground">
          <span className="text-green-400 font-bold">+{result.added}</span> 件追加,{" "}
          <span className="text-muted-foreground">{result.skipped} 件スキップ</span>
        </span>
      )}

      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  );
}
