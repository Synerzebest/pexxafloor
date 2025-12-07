"use client";

import { Autocomplete } from "@react-google-maps/api";
import { useState, useRef } from "react";


type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GooglePlaceResult = {
  formatted_address?: string;
  address_components?: GoogleAddressComponent[];
};

type AddressData = {
  address: string;
  postalCode: string;
  city: string;
  country: string;
};

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (data: AddressData) => void;
};


export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
}: AddressAutocompleteProps) {
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const onLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  const onPlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace() as GooglePlaceResult;

    const formatted = place.formatted_address ?? "";
    const components = place.address_components ?? [];

    const extract = (type: string): string =>
      components.find((c) => c.types.includes(type))?.long_name ?? "";

    const data: AddressData = {
      address: formatted,
      postalCode: extract("postal_code"),
      city: extract("locality") || extract("postal_town"),
      country: extract("country"),
    };

    onChange(formatted);
    onPlaceSelected(data);
  };

  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Ex. 123 Rue du Tracé, 1000 Bruxelles"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                   shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                   transition-all outline-none bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Autocomplete>
  );
}
