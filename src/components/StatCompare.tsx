interface StatCompareProps {
  label: string;
  myValue: number | null;
  oppValue: number | null;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
}

/**
 * 自分と相手のスタッツを並列比較表示するコンポーネント。
 */
export function StatCompare({
  label,
  myValue,
  oppValue,
  format = (v) => v.toFixed(1),
  higherIsBetter = true,
}: StatCompareProps) {
  const myStr = myValue != null ? format(myValue) : "-";
  const oppStr = oppValue != null ? format(oppValue) : "-";

  let myClass = "stat-neutral";
  if (myValue != null && oppValue != null) {
    const isBetter = higherIsBetter
      ? myValue > oppValue
      : myValue < oppValue;
    myClass = isBetter ? "stat-positive" : myValue === oppValue ? "stat-neutral" : "stat-negative";
  }

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/30">
      <span className={`font-bold text-sm w-16 text-right font-mono ${myClass}`}>
        {myStr}
      </span>
      <span className="text-xs text-muted-foreground flex-1 text-center">
        {label}
      </span>
      <span className="text-sm w-16 font-mono text-muted-foreground">
        {oppStr}
      </span>
    </div>
  );
}
