"use client";
import { InstantSwitch } from "@/components/admin/Switch";
import { setCategoryVisible } from "./actions";

export function VisibleSwitch({ id, name, visible }: { id: string; name: string; visible: boolean }) {
  return (
    <InstantSwitch
      checked={visible}
      label={`Show ${name} in the shop`}
      save={(next) => setCategoryVisible(id, next)}
      onMessage={`${name} is shown in the shop.`}
      offMessage={`${name} is hidden from the shop.`}
    />
  );
}
