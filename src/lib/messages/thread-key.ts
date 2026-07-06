const EMPTY_THREAD_PART = '-';
const THREAD_SEPARATOR = '|';

export type MessageThreadKeyParts = {
  otherId: string;
  listingId: string | null;
  wantedListingId: string | null;
};

export function makeMessageThreadKey({
  otherId,
  listingId,
  wantedListingId,
}: MessageThreadKeyParts): string {
  return [
    otherId,
    listingId ?? EMPTY_THREAD_PART,
    wantedListingId ?? EMPTY_THREAD_PART,
  ].join(THREAD_SEPARATOR);
}

export function parseMessageThreadKey(key: string): MessageThreadKeyParts | null {
  const parts = key.split(THREAD_SEPARATOR);
  if (parts.length !== 3 || !parts[0]) return null;

  return {
    otherId: parts[0],
    listingId: parts[1] === EMPTY_THREAD_PART ? null : parts[1],
    wantedListingId: parts[2] === EMPTY_THREAD_PART ? null : parts[2],
  };
}
