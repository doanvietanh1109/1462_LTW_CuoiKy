import { DEMO_ROOM_IMAGE_BY_ID } from "../data/demoRoomImageMap.js";

export const DEFAULT_ROOM_IMAGE = "/images/room1.jpg";

const LEGACY_PLACEHOLDER_PATTERN = /^\/images\/room(?:[1-9]|1[0-5])\.jpg$/i;

export const getRoomId = (room) => {
  const value = room?._id ?? room?.id;
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (value && typeof value === "object") {
    if (typeof value.$oid === "string") return value.$oid;
    if (typeof value.toString === "function") {
      const stringValue = value.toString();
      return stringValue === "[object Object]" ? "" : stringValue;
    }
  }
  return "";
};

export const resolveRoomImageUrl = (source) => {
  if (typeof source !== "string" || !source.trim()) return DEFAULT_ROOM_IMAGE;
  const value = source.trim();
  if (/^(https?:|data:|blob:)/i.test(value) || value.startsWith("/")) {
    return value;
  }
  return value.startsWith("images/") ? `/${value}` : `/images/${value}`;
};

export const isLegacyDemoRoomImage = (source) => {
  if (typeof source !== "string" || !source.trim()) return false;
  const value = source.trim();
  let pathname = value.split(/[?#]/, 1)[0];
  if (/^https?:\/\//i.test(value)) {
    try {
      pathname = new URL(value).pathname;
    } catch {
      return false;
    }
  }
  if (pathname.startsWith("images/")) pathname = `/${pathname}`;
  else if (!pathname.startsWith("/")) pathname = `/images/${pathname}`;
  return LEGACY_PLACEHOLDER_PATTERN.test(pathname);
};

export const getDemoRoomImage = (roomOrId) => {
  const room = roomOrId && typeof roomOrId === "object" ? roomOrId : null;
  const id = room ? getRoomId(room) : String(roomOrId ?? "").trim();
  return id ? DEMO_ROOM_IMAGE_BY_ID[id] || "" : "";
};

const unique = (values) => [...new Set(values)];

export const getRoomGalleryImages = (room) => {
  if (!room || typeof room !== "object") return [DEFAULT_ROOM_IMAGE];

  const configuredImages = [
    room.image,
    room.img,
    ...(Array.isArray(room.images) ? room.images : []),
  ].filter((source) => typeof source === "string" && source.trim());
  const realImages = unique(
    configuredImages
      .filter((source) => !isLegacyDemoRoomImage(source))
      .map(resolveRoomImageUrl),
  );

  // Keep real uploads/URLs intact; use the catalog only for known demo IDs
  // whose configured images are empty or the old shared roomN placeholders.
  if (realImages.length > 0) return realImages;

  const demoImage = getDemoRoomImage(room);
  if (demoImage) return [demoImage];

  const oldImage = configuredImages[0];
  return [oldImage ? resolveRoomImageUrl(oldImage) : DEFAULT_ROOM_IMAGE];
};

export const getRoomCoverImage = (room) => getRoomGalleryImages(room)[0];

export const getRoomImageFallback = (room) =>
  getDemoRoomImage(room) || DEFAULT_ROOM_IMAGE;

export const handleRoomImageError = (event, room) => {
  const image = event?.currentTarget;
  if (!image) return;
  const fallback = getRoomImageFallback(room);
  if (image.getAttribute("src") === fallback) {
    image.onerror = null;
    return;
  }
  image.src = fallback;
};
