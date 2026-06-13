"use client";

import { useRef } from "react";
import RDatePicker, { DateObject, DatePickerRef } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

interface Props {
  value: string; // YYYY-MM-DD Gregorian, or ""
  onChange: (val: string) => void;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
}

function toGregorianYMD(d: DateObject): string {
  return d.convert(gregorian, gregorian_en).format("YYYY-MM-DD");
}

function toPersian(ymd: string): DateObject | null {
  if (!ymd) return null;
  return new DateObject({ date: new Date(ymd + "T12:00:00"), calendar: gregorian })
    .convert(persian, persian_fa);
}

export default function DatePicker({ value, onChange, placeholder = "انتخاب تاریخ", inputStyle }: Props) {
  const ref = useRef<DatePickerRef>(null);

  return (
    <RDatePicker
      ref={ref}
      calendar={persian}
      locale={persian_fa}
      value={toPersian(value)}
      onChange={(date) => {
        if (!date || Array.isArray(date)) { onChange(""); return; }
        onChange(toGregorianYMD(date as DateObject));
      }}
      calendarPosition="bottom-right"
      fixMainPosition
      render={(val: string, openCalendar: () => void) => (
        <div style={{ position: "relative", display: "block", width: "100%" }}>
          <input
            readOnly
            value={val}
            onClick={openCalendar}
            placeholder={placeholder}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-sm, 8px)",
              fontFamily: "Vazirmatn",
              fontSize: 13,
              background: "var(--surface, #fff)",
              cursor: "pointer",
              outline: "none",
              boxSizing: "border-box",
              ...inputStyle,
            }}
          />
          <i
            className="ti ti-calendar"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none", fontSize: 15 }}
          />
        </div>
      )}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "8px 12px", borderTop: "1px solid #eee" }}>
        <button
          onClick={() => {
            const today = new DateObject({ date: new Date(), calendar: gregorian });
            onChange(toGregorianYMD(today));
            ref.current?.closeCalendar();
          }}
          style={{ background: "#0a2a5e", color: "#fff", border: "none", borderRadius: 6, padding: "5px 18px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          امروز
        </button>
        {value && (
          <button
            onClick={() => { onChange(""); ref.current?.closeCalendar(); }}
            style={{ background: "transparent", color: "var(--text3, #888)", border: "1px solid #ddd", borderRadius: 6, padding: "5px 12px", fontFamily: "Vazirmatn", fontSize: 12, cursor: "pointer" }}
          >
            پاک‌کردن
          </button>
        )}
      </div>
    </RDatePicker>
  );
}
