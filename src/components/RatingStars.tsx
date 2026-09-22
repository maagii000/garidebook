export default function RatingStars({
  value,
  size = "text-sm",
}: {
  value: number;
  size?: string;
}) {
  const full = Math.round(value);
  return (
    <span className={`${size} tracking-tight`} aria-label={`${value} од`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "text-accent" : "text-slate-300"}>
          ★
        </span>
      ))}
    </span>
  );
}
