"use client";

import { useEffect, useMemo, useRef } from "react";
import { addDays, toDateKey } from "@/lib/date";

const DAYS_BEFORE = 60; // 往前顯示 60 天
const DAYS_AFTER = 7; // 往後顯示 7 天（方便先記未來的預定支出）
const WHEEL_THRESHOLD = 60; // 滾輪累積的量要超過這個門檻才切換一天，避免滾一下就跳好幾天

type Props = {
  selected: string; // 目前選中的日期，格式 "YYYY-MM-DD"
  onSelect: (dateKey: string) => void;
};

export default function DateStrip({ selected, onSelect }: Props) {
  // 這個 ref 指向「可以橫向捲動的整個容器」，滑鼠滾輪事件要綁在這上面
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 這個 ref 指向「目前被選中那個日期按鈕」，選到新日期時把它捲到畫面正中央
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // 下面的原生 wheel 事件監聽器只會註冊一次（deps 是 []），
  // 但每次滾動時都要知道「現在選的是哪一天」才能算出下一天是誰，
  // 所以用 ref 存最新的 selected / onSelect，監聽器裡讀 ref 就一定是最新值。
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    selectedRef.current = selected;
    onSelectRef.current = onSelect;
  }, [selected, onSelect]);

  // 產生一份固定範圍的日期清單（今天往前 60 天到往後 7 天）
  // 用 useMemo 是因為這份清單只跟「今天」有關，不需要每次 render 都重新算
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list: { key: string; day: string; weekday: string; isToday: boolean }[] = [];

    for (let offset = -DAYS_BEFORE; offset <= DAYS_AFTER; offset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      list.push({
        key: toDateKey(d),
        day: String(d.getDate()),
        weekday: d.toLocaleDateString("zh-TW", { weekday: "short" }), // 例如「一」「二」
        isToday: offset === 0,
      });
    }
    return list;
  }, []);

  // 每次選中的日期變了（包含一進頁面時的預設值），就把該按鈕捲動到可視範圍置中，
  // 這樣使用者用手指滑動或滾輪選日期時，選中的那顆永遠會停在畫面中間
  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selected]);

  // 滑鼠滾輪支援：往下滾＝切換到下一天，往上滾＝切換到前一天。
  // 這裡刻意用原生 addEventListener + { passive: false }，
  // 因為只有這樣才能呼叫 preventDefault() 擋掉瀏覽器預設的「頁面往下捲動」，
  // 讓使用者滑鼠停在日期列上滾動時，改變的是日期而不是捲動整個頁面。
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let accumulated = 0; // 累積尚未消耗的滾動量（讓小幅度滾動不會太敏感）
    const minKey = days[0]?.key;
    const maxKey = days[days.length - 1]?.key;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      accumulated += event.deltaY;

      if (Math.abs(accumulated) < WHEEL_THRESHOLD) return;

      const direction = accumulated > 0 ? 1 : -1;
      accumulated = 0;

      let next = addDays(selectedRef.current, direction);
      // 不要滾出 DateStrip 有顯示的日期範圍，否則畫面上會找不到對應的按鈕
      if (minKey && next < minKey) next = minKey;
      if (maxKey && next > maxKey) next = maxKey;

      if (next !== selectedRef.current) {
        onSelectRef.current(next);
      }
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [days]);

  return (
    // overflow-x-auto：手機上可以直接用手指左右滑動捲動，桌機則可用滑鼠滾輪（見上方 effect）
    // [scrollbar-width:none] 等：隱藏捲軸，看起來更像原生 App 的日期選擇列
    <div
      ref={scrollContainerRef}
      className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {days.map((day) => {
        const isSelected = day.key === selected;
        return (
          <button
            key={day.key}
            ref={isSelected ? activeButtonRef : undefined}
            type="button"
            onClick={() => onSelect(day.key)}
            className={`flex shrink-0 scroll-mx-4 snap-center flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-colors ${
              isSelected
                ? "bg-accent text-accent-foreground shadow-md shadow-accent/30" // 選中：品牌強調色 + 淡淡的色暈陰影
                : "bg-card text-muted" // 未選中
            }`}
          >
            <span className="text-[11px]">{day.weekday}</span>
            <span className="text-base font-semibold leading-none">{day.day}</span>
            {/* 小圓點：標示「今天」，選中/未選中時用不同顏色維持對比度 */}
            <span
              className={`h-1 w-1 rounded-full ${
                day.isToday ? (isSelected ? "bg-accent-foreground" : "bg-accent") : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
