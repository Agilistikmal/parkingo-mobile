import { TextInput, TextInputProps } from "react-native";
import { twMerge } from "tailwind-merge";

interface InputProps extends TextInputProps {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <TextInput
      className={twMerge(
        "px-5 py-3 bg-black/10 text-white rounded-3xl border border-black/20 focus:border-brand",
        className
      )}
      placeholderTextColor="rgba(53, 53, 53, 0.5)"
      {...props}
    />
  );
}
