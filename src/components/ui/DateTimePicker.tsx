"use client";

import { useRef } from "react";
import RDatePicker, { DateObject, DatePickerRef } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

interface Props {
  value: string | null; // ISO string or null
  onChange: (val: string | null) => void;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
}

function toISO(d: DateObject): string {
  return d.convert(gregorian, gregorian_en).toDate().toISOString();
}

function toPersian(iso: string | null): DateObject | null {
  if (!iso) return null;
  return new DateObject({ date: new Date(iso), calendar: gregorian })
    .convert(persian, persian_fa);
}

export default function DateTimePicker({ value, onChange, placeholder = "انتخاب تاریخ و ساعت", inputStyle }: Props) {
  const ref = useRef<DatePickerRef>(null);
  const parsed = toPersian(value);

  return (
    <RDatePicker
      ref={ref}
      calendar={persian}
      locale={persian_fa}
      value={parsed}
      format="YYYY/MM/DD HH:mm"
      plugins={[<TimePicker key="time" position="bottom" />]}
      onChange={(date) => {
        if (!date || Array.isArray(date)) { onChange(null); return; }
        onChange(toISO(date as DateObject));
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
            className="ti ti-clock"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none", fontSize: 15 }}
          />
        </div>
      )}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "8px 12px", borderTop: "1px solid #eee" }}>
        <button
          onClick={() => {
            onChange(new Date().toISOString());
            ref.current?.closeCalendar();
          }}
          style={{ background: "#0a2a5e", color: "#fff", border: "none", borderRadius: 6, padding: "5px 18px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          الان
        </button>
        {value && (
          <button
            onClick={() => { onChange(null); ref.current?.closeCalendar(); }}
            style={{ background: "transparent", color: "var(--text3, #888)", border: "1px solid #ddd", borderRadius: 6, padding: "5px 12px", fontFamily: "Vazirmatn", fontSize: 12, cursor: "pointer" }}
          >
            پاک‌کردن
          </button>
        )}
      </div>
    </RDatePicker>
  );
}
