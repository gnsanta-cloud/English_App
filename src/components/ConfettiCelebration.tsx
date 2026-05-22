export function ConfettiCelebration() {
  return (
    <div className="confetti-overlay" role="presentation">
      <img
        src="https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif"
        alt="축하 축포"
        className="confetti-gif"
      />
      <div className="confetti-css" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${(i * 2.5) % 100}%`,
              animationDelay: `${(i % 10) * 0.12}s`,
              backgroundColor: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'][i % 5],
            }}
          />
        ))}
      </div>
    </div>
  );
}
