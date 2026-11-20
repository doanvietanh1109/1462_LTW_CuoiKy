export const slugifyBlogHeading = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/gi, "d")
  .toLocaleLowerCase("vi-VN")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
