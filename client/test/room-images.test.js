import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import {
  DEMO_ROOM_IMAGES,
  DEMO_ROOM_ASSIGNABLE_IMAGES,
} from "../src/data/demoRoomImages.js";
import { DEMO_ROOM_IMAGE_BY_ID } from "../src/data/demoRoomImageMap.js";
import {
  DEFAULT_ROOM_IMAGE,
  getDemoRoomImage,
  getRoomCoverImage,
  getRoomGalleryImages,
  getRoomId,
  getRoomImageFallback,
  handleRoomImageError,
  isLegacyDemoRoomImage,
  resolveRoomImageUrl,
} from "../src/utils/roomImages.js";

test("manifest lists valid public paths for all 43 supplied images", async () => {
  assert.equal(DEMO_ROOM_IMAGES.length, 43);
  assert.equal(new Set(DEMO_ROOM_IMAGES.map((image) => image.fileName)).size, 43);
  assert.ok(DEMO_ROOM_IMAGES.every((image) => image.src.startsWith("/images/demo-rooms/")));
  await Promise.all(
    DEMO_ROOM_IMAGES.map((image) =>
      access(new URL(`../public${image.src}`, import.meta.url)),
    ),
  );
});

test("300 demo room IDs map stably and evenly across visually distinct assets", () => {
  assert.equal(Object.keys(DEMO_ROOM_IMAGE_BY_ID).length, 300);
  assert.equal(DEMO_ROOM_ASSIGNABLE_IMAGES.length, 42);
  const counts = new Map();
  for (const src of Object.values(DEMO_ROOM_IMAGE_BY_ID)) {
    assert.ok(DEMO_ROOM_ASSIGNABLE_IMAGES.some((image) => image.src === src));
    counts.set(src, (counts.get(src) || 0) + 1);
  }
  assert.equal(counts.size, 42);
  assert.equal(Math.max(...counts.values()) - Math.min(...counts.values()), 1);

  const [roomId] = Object.keys(DEMO_ROOM_IMAGE_BY_ID);
  assert.equal(getDemoRoomImage(roomId), DEMO_ROOM_IMAGE_BY_ID[roomId]);
  assert.equal(getDemoRoomImage({ _id: { $oid: roomId } }), DEMO_ROOM_IMAGE_BY_ID[roomId]);
  assert.equal(getDemoRoomImage({ _id: { toString: () => roomId } }), DEMO_ROOM_IMAGE_BY_ID[roomId]);
});

test("demo placeholders use the mapped cover while real uploads and galleries win", () => {
  const [roomId] = Object.keys(DEMO_ROOM_IMAGE_BY_ID);
  const mapped = DEMO_ROOM_IMAGE_BY_ID[roomId];
  const demoRoom = {
    _id: roomId,
    image: "/images/room2.jpg",
    images: ["/images/room2.jpg"],
  };
  assert.equal(getRoomCoverImage(demoRoom), mapped);
  assert.deepEqual(getRoomGalleryImages(demoRoom), [mapped]);

  const uploadedRoom = {
    _id: roomId,
    image: "https://cdn.example.test/room-cover.webp",
    images: [
      "https://cdn.example.test/room-cover.webp",
      "https://cdn.example.test/room-bedroom.webp",
    ],
  };
  assert.deepEqual(getRoomGalleryImages(uploadedRoom), [
    "https://cdn.example.test/room-cover.webp",
    "https://cdn.example.test/room-bedroom.webp",
  ]);

  const mixedRoom = {
    _id: roomId,
    image: "/images/room1.jpg",
    images: ["/images/room1.jpg", "/uploads/user-room.jpg"],
  };
  assert.deepEqual(getRoomGalleryImages(mixedRoom), ["/uploads/user-room.jpg"]);
});

test("unknown or invalid IDs do not receive arbitrary demo photos", () => {
  const room = { _id: "not-a-demo-room", image: "https://cdn.example.test/room.jpg" };
  assert.equal(getRoomCoverImage(room), "https://cdn.example.test/room.jpg");
  assert.equal(getDemoRoomImage({}), "");
  assert.equal(getRoomCoverImage({ _id: null, images: [] }), DEFAULT_ROOM_IMAGE);
  assert.equal(getRoomImageFallback(room), DEFAULT_ROOM_IMAGE);
  assert.equal(getRoomId({ _id: { $oid: "demo-id" } }), "demo-id");
});

test("legacy placeholder detection and public URL normalization are safe", () => {
  assert.equal(isLegacyDemoRoomImage("/images/room1.jpg"), true);
  assert.equal(isLegacyDemoRoomImage("images/room8.jpg"), true);
  assert.equal(isLegacyDemoRoomImage("https://cdn.example.test/images/room3.jpg"), true);
  assert.equal(isLegacyDemoRoomImage("/uploads/room1.jpg"), false);
  assert.equal(resolveRoomImageUrl("images/room1.jpg"), "/images/room1.jpg");
  assert.equal(resolveRoomImageUrl("photo.jpg"), "/images/photo.jpg");
});

test("broken room image falls back once to its mapped image or shared fallback", () => {
  const [roomId] = Object.keys(DEMO_ROOM_IMAGE_BY_ID);
  const room = { _id: roomId };
  const fakeImage = {
    src: "/broken.jpg",
    onerror: () => {},
    getAttribute(name) {
      return name === "src" ? this.src : null;
    },
  };
  handleRoomImageError({ currentTarget: fakeImage }, room);
  assert.equal(fakeImage.src, DEMO_ROOM_IMAGE_BY_ID[roomId]);
  handleRoomImageError({ currentTarget: fakeImage }, room);
  assert.equal(fakeImage.onerror, null);

  const noIdImage = {
    src: "/broken.jpg",
    onerror: () => {},
    getAttribute(name) {
      return name === "src" ? this.src : null;
    },
  };
  handleRoomImageError({ currentTarget: noIdImage }, {});
  assert.equal(noIdImage.src, DEFAULT_ROOM_IMAGE);
});

test("room image UI is shared by public, detail, landlord dashboard, and tenant screens", async () => {
  const files = [
    "../src/components/rooms/RoomCard.jsx",
    "../src/pages/RoomDetailPage.jsx",
    "../src/pages/ComparePage.jsx",
    "../src/pages/TenantPortalPage.jsx",
    "../src/pages/landlord/LandlordDashboardPage.jsx",
  ];
  const source = await Promise.all(
    files.map((file) => readFile(new URL(file, import.meta.url), "utf8")),
  );
  for (const content of source) assert.match(content, /RoomImage/);

  const [home, search, bookmarks] = await Promise.all(
    ["GuestHomePage.jsx", "SearchPage.jsx", "BookmarksPage.jsx"].map((file) =>
      readFile(new URL(`../src/pages/${file}`, import.meta.url), "utf8"),
    ),
  );
  for (const content of [home, search, bookmarks]) {
    assert.match(content, /components\/rooms\/RoomCard/);
  }
});
