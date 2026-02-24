import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import type { ViewStyle } from "react-native";
import { cn } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { CalendarIcon } from "./UntitledIcons";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

interface DateInputProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  containerClassName?: string;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const monthIndex = parseInt(parts[1], 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  return `${parseInt(parts[2], 10)} ${MONTH_SHORT[monthIndex]} ${parts[0]}`;
}

function toYYYYMMDD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function parseValue(value: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1,
    day: parseInt(parts[2], 10),
  };
}

export function DateInput({
  label,
  value,
  onChange,
  placeholder = "Select date",
  error,
  minimumDate,
  maximumDate,
  containerClassName,
  containerStyle,
  disabled,
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { colors } = useTheme();

  const parsed = parseValue(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? now.getMonth());

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
    const prevMonthDays = getDaysInMonth(
      viewMonth === 0 ? viewYear - 1 : viewYear,
      viewMonth === 0 ? 11 : viewMonth - 1
    );

    const days: Array<{ day: number; month: number; year: number; isCurrentMonth: boolean }> = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
    }

    // Next month leading days (fill to 42 cells = 6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayPress = (day: number, month: number, year: number) => {
    const dateStr = toYYYYMMDD(year, month, day);

    if (minimumDate) {
      const min = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());
      const selected = new Date(year, month, day);
      if (selected < min) return;
    }
    if (maximumDate) {
      const max = new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate());
      const selected = new Date(year, month, day);
      if (selected > max) return;
    }

    onChange(dateStr);
    setShowPicker(false);
  };

  const isSelected = (day: number, month: number, year: number): boolean => {
    if (!parsed) return false;
    return parsed.day === day && parsed.month === month && parsed.year === year;
  };

  const isToday = (day: number, month: number, year: number): boolean => {
    return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  const isDisabledDay = (day: number, month: number, year: number): boolean => {
    const date = new Date(year, month, day);
    if (minimumDate) {
      const min = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());
      if (date < min) return true;
    }
    if (maximumDate) {
      const max = new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate());
      if (date > max) return true;
    }
    return false;
  };

  const openPicker = () => {
    if (disabled) return;
    // Reset view to selected date or current month
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    } else {
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
    setShowPicker(true);
  };

  const displayText = value ? formatDisplayDate(value) : placeholder;

  return (
    <View className={cn("gap-1.5", containerClassName)} style={containerStyle}>
      {label && (
        <Text className="text-sm font-medium text-text-secondary ml-1">
          {label}
        </Text>
      )}

      <TouchableOpacity
        className={cn(
          "flex-row items-center border border-border rounded-xl bg-surface px-3 py-3",
          error ? "border-danger" : "",
          disabled ? "bg-surface-hover opacity-60" : ""
        )}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Text
          className={cn(
            "flex-1 text-base",
            value ? "text-text" : "text-text-muted"
          )}
        >
          {displayText}
        </Text>
        <CalendarIcon size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {error && (
        <Text className="text-xs text-danger ml-1">{error}</Text>
      )}

      {/* Calendar Modal */}
      {showPicker && (
        <Modal
          visible={showPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 40,
              }}
              onStartShouldSetResponder={() => true}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
                  {label || "Select Date"}
                </Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary }}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Month/Year Navigation */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <TouchableOpacity
                  onPress={goToPrevMonth}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ChevronLeft size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity
                  onPress={goToNextMonth}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View style={{ flexDirection: "row", paddingHorizontal: 8 }}>
                {DAY_LABELS.map((d) => (
                  <View key={d} style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
                {Array.from({ length: 6 }).map((_, rowIndex) => (
                  <View key={rowIndex} style={{ flexDirection: "row" }}>
                    {calendarDays.slice(rowIndex * 7, rowIndex * 7 + 7).map((item, colIndex) => {
                      const selected = isSelected(item.day, item.month, item.year);
                      const today = isToday(item.day, item.month, item.year);
                      const dayDisabled = isDisabledDay(item.day, item.month, item.year);

                      return (
                        <TouchableOpacity
                          key={`${rowIndex}-${colIndex}`}
                          onPress={() => {
                            if (!dayDisabled) {
                              handleDayPress(item.day, item.month, item.year);
                            }
                          }}
                          activeOpacity={dayDisabled ? 1 : 0.6}
                          style={{
                            flex: 1,
                            aspectRatio: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            margin: 2,
                            borderRadius: 10,
                            backgroundColor: selected
                              ? colors.primary
                              : today
                                ? colors.primaryMuted || colors.primary + "15"
                                : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: selected || today ? "700" : "400",
                              color: selected
                                ? "#ffffff"
                                : dayDisabled
                                  ? colors.textMuted + "50"
                                  : !item.isCurrentMonth
                                    ? colors.textMuted
                                    : today
                                      ? colors.primary
                                      : colors.text,
                            }}
                          >
                            {item.day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Today shortcut */}
              <TouchableOpacity
                onPress={() => {
                  const todayStr = toYYYYMMDD(now.getFullYear(), now.getMonth(), now.getDate());
                  onChange(todayStr);
                  setShowPicker(false);
                }}
                style={{
                  alignSelf: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
                  Today
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
