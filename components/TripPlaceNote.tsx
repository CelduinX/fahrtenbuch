export function tripPlaceText(originFullName: string, destinationFullName: string) {
  if (!originFullName && !destinationFullName) return "";
  return originFullName && destinationFullName
    ? `${originFullName} → ${destinationFullName}`
    : originFullName ? `Start: ${originFullName}` : `Ziel: ${destinationFullName}`;
}

export function TripPlaceNote({ originFullName, destinationFullName }: {
  originFullName: string;
  destinationFullName: string;
}) {
  const text = tripPlaceText(originFullName, destinationFullName);
  if (!text) return null;
  return <span data-testid="trip-place-note" className="mt-1 block whitespace-normal break-words text-[0.85em] font-normal leading-snug text-[#475569]">{text}</span>;
}
