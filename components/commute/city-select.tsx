"use client";

import { CITIES } from "@/config/cities";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CitySelectProps {
  value: string;
  onChange: (cityId: string) => void;
  disabled?: boolean;
}

export function CitySelect({ value, onChange, disabled }: CitySelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full" aria-label="도시 선택">
        <SelectValue placeholder="도시를 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {CITIES.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
