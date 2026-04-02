import { useEffect, useState } from "react";

type AnimatedTextProps = {
  text: string;
  typingSpeed?: number;
  highlightSpeed?: number;
  className?: string;
};

export default function AnimatedText({
  text,
  typingSpeed = 70,
  highlightSpeed = 220,
  className = "",
}: AnimatedTextProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    if (visibleCount < text.length) {
      const timeout = setTimeout(() => {
        setVisibleCount((prev) => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else {
      setTypingDone(true);
    }
  }, [visibleCount, text.length, typingSpeed]);

  useEffect(() => {
    if (!typingDone) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % text.length);
    }, highlightSpeed);

    return () => clearInterval(interval);
  }, [typingDone, text.length, highlightSpeed]);

  return (
    <div className={`whitespace-normal break-words ${className}`}>
      {text.slice(0, visibleCount).split("").map((char, index) => {
        const isActive = typingDone && index === activeIndex;

        return (
          <span
            key={index}
            className={`inline-block transition-all duration-300 ${
              isActive
                ? "bg-yellow-400 text-slate-900 px-[2px] rounded shadow-md"
                : ""
            }`}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
      {!typingDone && <span className="ml-1 animate-pulse text-yellow-400">|</span>}
    </div>
  );
}