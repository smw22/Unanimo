import { supabase } from "@/lib/supabase";
import { File } from "expo-file-system";

export async function uploadAvatar(
  fileUri: string,
  userId: string,
): Promise<string> {
  try {
    console.log("📷 Starting avatar upload:", { fileUri, userId });

    // Read file as bytes (no base64 encoding needed)
    const file = new File(fileUri);
    console.log("📁 File object created:", file.uri);

    const fileBytes = await file.bytes();
    console.log("📊 File bytes read:", fileBytes.length, "bytes");

    // Create a unique filename
    const fileName = `${Date.now()}.jpg`;
    const filePath = `${userId}/${fileName}`;
    console.log("🏷️ Upload path:", filePath);

    // Upload to Supabase storage (Uint8Array works directly)
    console.log("⬆️ Uploading to Supabase...");
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, fileBytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("❌ Upload error:", error);
      throw error;
    }

    console.log("✅ Upload successful:", data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    console.log("🔗 Public URL:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error("💥 Upload failed:", error);
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }
}
