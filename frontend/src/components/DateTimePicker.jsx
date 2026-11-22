import { useRef } from "react";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import useIsMobile from "../utils/useIsMobile";

export default function MyDateTimePicker({
  date,
  setDate,
  time,
  setTime,
  allowClear = true,
  // Optional, for pages that restyle or label the pickers (e.g. the
  // "lift-picker" look on Schedule a Ride). Defaults keep the old look.
  className = "",
  datePlaceholder = "Select date",
  timePlaceholder = "Select time",
  dateId,
  timeId,
  status,
  suffixIcon,
  // extra props for each picker, e.g. aria-label / aria-describedby /
  // format / popupClassName
  dateProps = {},
  timeProps = {},
}) {
  // on phones, tapping opens the picker without the on-screen keyboard
  const isMobile = useIsMobile();
  const wrapperRef = useRef(null);

  // On phones, scroll the field near the top before the popup positions, so it
  // opens below the input instead of flipping up past the top of the screen
  // (which hid the month/year header and arrows on iPhone).
  const handleOpenChange = (open) => {
    if (open && isMobile && wrapperRef.current) {
      wrapperRef.current.scrollIntoView({ block: "start" });
    }
  };

  const handleDateChange = (value) => {
    setDate(value);
  };

  const handleTimeChange = (value) => {
    setTime(value);
  };

  const disabledDate = (current) => {
    // Can't select days before today
    return current && current < dayjs().startOf("day");
  };

  const disabledTime = () => {
    if (date && date.isSame(dayjs(), "day")) {
      const now = dayjs();
      return {
        disabledHours: () => Array.from({ length: now.hour() }, (_, i) => i),
        disabledMinutes: (selectedHour) =>
          selectedHour === now.hour()
            ? Array.from({ length: now.minute() }, (_, i) => i)
            : [],
        disabledSeconds: (selectedHour, selectedMinute) =>
          selectedHour === now.hour() && selectedMinute === now.minute()
            ? Array.from({ length: now.second() }, (_, i) => i)
            : [],
      };
    }
    return {};
  };

  return (
    <div
      ref={wrapperRef}
      className={`flex max-md:w-full max-md:scroll-mt-16 ${className}`}
    >
      <DatePicker
        className="max-md:!h-11 max-md:flex-[1.2] max-md:!min-w-0"
        inputReadOnly={isMobile}
        onOpenChange={handleOpenChange}
        placement={isMobile ? "bottomLeft" : undefined}
        onChange={handleDateChange}
        id={dateId}
        status={status}
        suffixIcon={suffixIcon}
        placeholder={datePlaceholder}
        style={{ marginRight: "8px", height: "38px", minWidth: "120px" }}
        value={date}
        disabledDate={disabledDate}
        allowClear={allowClear}
        {...dateProps}
      />
      <TimePicker
        className="max-md:!h-11 max-md:flex-1 max-md:!min-w-0"
        inputReadOnly={isMobile}
        onOpenChange={handleOpenChange}
        placement={isMobile ? "bottomLeft" : undefined}
        format="h:mm A"
        onChange={handleTimeChange}
        id={timeId}
        status={status}
        suffixIcon={suffixIcon}
        placeholder={timePlaceholder}
        style={{ height: "38px", minWidth: "120px" }}
        value={time}
        allowClear={allowClear}
        disabledTime={disabledTime}
        {...timeProps}
      />
    </div>
  );
}
