const CLOUD_NAME = "qbdar9fk";
const UPLOAD_PRESET = "jastip_preset";

/**
 * Upload gambar ke Cloudinary ke folder tertentu.
 *
 * @param {File} file - File gambar yang akan diupload
 * @param {"products" | "banners" | "requests"} folder - Nama folder tujuan di Cloudinary
 * @returns {Promise<string>} URL gambar yang sudah diupload (secure_url)
 * @throws {Error} Jika upload gagal
 *
 * @example
 * // Upload ke folder products
 * const url = await uploadImage(file, "products");
 *
 * // Upload ke folder requests
 * const url = await uploadImage(file, "requests");
 */
export const uploadImage = async (file, folder) => {
  if (!file) throw new Error("File tidak boleh kosong");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error(
      data.error?.message || "Gagal mendapatkan URL gambar dari Cloudinary",
    );
  }

  return data.secure_url;
};
