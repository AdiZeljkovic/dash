import confetti from "canvas-confetti";

export function useConfetti() {
  const burst = () => {
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["var(--accent-500)", "#ffffff", "#fbbf24", "#60a5fa"],
    });
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["var(--accent-500)", "#ffffff", "#fbbf24", "#60a5fa"],
    });
  };

  const pop = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return { burst, pop };
}
