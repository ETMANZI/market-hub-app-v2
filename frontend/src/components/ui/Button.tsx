import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "default" | "outline";
};

export default function Button({
  children,
  className = "",
  variant = "default",
  ...props
}: Props) {
  const base =
    "rounded-2xl px-4 py-3 transition disabled:opacity-50";

  const variants = {
    default: "bg-slate-900 text-white hover:opacity-90",
    outline:
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}