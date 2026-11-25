import React from "react";
import {
  getRoomCoverImage,
  handleRoomImageError,
} from "../../utils/roomImages";

export const RoomImage = ({ room, src, alt, onError, ...imageProps }) => {
  const imageSource = src || getRoomCoverImage(room);
  const isIllustration = imageSource.startsWith("/images/demo-rooms/");
  const roomDescription = alt || room?.title || "phòng trọ";

  return (
    <img
      {...imageProps}
      src={imageSource}
      alt={
        isIllustration
          ? `Ảnh minh họa: ${roomDescription}`
          : alt || room?.title || "Ảnh phòng trọ"
      }
      onError={(event) => {
        handleRoomImageError(event, room);
        if (getRoomCoverImage(room).startsWith("/images/demo-rooms/")) {
          event.currentTarget.alt = `Ảnh minh họa: ${roomDescription}`;
        }
        onError?.(event);
      }}
    />
  );
};
