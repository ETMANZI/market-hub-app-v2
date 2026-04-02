import type{ InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: Props) {
  return <input className={`w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700 ${className}`} {...props} />;
}