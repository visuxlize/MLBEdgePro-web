import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";

export const BUCKET_NAME = "app-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

export type UploadResult = {
  path: string | null;
  error: string | null;
};

/**
 * Generate signed URLs for multiple image paths.
 * Pass the Supabase client (server or browser) to use.
 * Returns a Map of imagePath -> signedUrl (or null if error).
 */
export async function getSignedUrls(
  supabase: SupabaseClient,
  imagePaths: string[]
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  if (imagePaths.length === 0) {
    return results;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrls(imagePaths, SIGNED_URL_EXPIRY);

  if (error || !data) {
    // Return null for all paths on error
    imagePaths.forEach((path) => results.set(path, null));
    return results;
  }

  // Map results back to paths
  data.forEach((item, index) => {
    const path = item.path ?? imagePaths[index];
    if (item.error || !path) {
      if (path) results.set(path, null);
    } else {
      results.set(path, item.signedUrl);
    }
  });

  return results;
}

/**
 * Validate an image file before upload.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Allowed: JPEG, PNG, GIF, WebP";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 5MB";
  }

  return null;
}

/**
 * Upload an image to Supabase storage from the client.
 * Returns the file path (not URL) to store in the database.
 */
export async function uploadTodoImage(
  file: File,
  userId: string
): Promise<UploadResult> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { path: null, error: validationError };
  }

  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { path: null, error: "Failed to upload image" };
  }

  return { path: fileName, error: null };
}

/**
 * Delete an image from Supabase storage from the client.
 */
export async function deleteTodoImageClient(imagePath: string): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([imagePath]);

  if (error) {
    console.error("Delete error:", error);
    return { error: "Failed to delete image" };
  }

  return { error: null };
}
