import { useState, useEffect, forwardRef } from "react";
import { Input, type InputProps } from "./input";

export interface NumberInputProps extends Omit<
  InputProps,
  "onChange" | "value" | "type"
> {
  value: number | undefined | null;
  onChange: (value: number) => void;
  /** Allow empty string to represent 0 */
  placeholder?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, onBlur, ...props }, ref) => {
    const [inputValue, setInputValue] = useState<string>(
      value === 0 || value === undefined || value === null
        ? ""
        : value.toString()
    );

    useEffect(() => {
      // Sync with parent value if it changes externally
      const parsedCurrent = parseFloat(inputValue);

      // Handle edge case where inputValue is empty/invalid but parent is 0
      if ((inputValue === "" || isNaN(parsedCurrent)) && value === 0) {
        // Only override if we really want to force 0, but usually empty string implies 0 in our logic
        // If parent passes 0, and we have "", they match logically (0 -> ""), so don't update.
        return;
      }

      if (value !== parsedCurrent) {
        setInputValue(
          value === 0 || value === undefined || value === null
            ? ""
            : value.toString()
        );
      }
    }, [value, inputValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const val = e.target.value;

      // Allow usage of decimals and minus sign
      if (val === "" || val === "-" || val === "." || val === "-.") {
        setInputValue(val);
        // If empty, treat as 0 for parent state
        if (val === "") onChange(0);
        return;
      }

      // Regex to allow valid number typing (including multiple decimals prevention if needed, but parseFloat handles)
      // Check for valid number format partials
      const regex = /^-?\d*\.?\d*$/;
      if (regex.test(val)) {
        setInputValue(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
          onChange(num);
        }
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
      // On blur, format nicely? Or just leave as is?
      // Maybe ensure "0." becomes "0" or trailing decimals are handled?
      // For now, simple pass through
      if (onBlur) onBlur(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";
