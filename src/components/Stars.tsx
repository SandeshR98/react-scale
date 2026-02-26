export function Stars({
  rating,
  fontSize = "0.78rem",
  gap = 0,
}: {
  rating: number;
  fontSize?: string;
  gap?: number;
}) {
  const filled = Math.round(rating);
  return (
    <span style={{ display: "inline-flex", gap, lineHeight: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < filled ? "#f59e0b" : "#d1d5db", fontSize }}>
          ★
        </span>
      ))}
    </span>
  );
}
