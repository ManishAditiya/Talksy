import { supabase } from "../config/supabase";


const upload = async (file) => {
  if (!file) throw new Error("No file provided");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
  const filePath = `images/${fileName}`;

  // Upload file to Supabase Storage
  const { error } = await supabase.storage
    .from('avatars') // Change 'avatars' to your bucket name if different
    .upload(filePath, file);

  if (error) throw error;

  // Get public URL
  const { data } = supabase.storage
    .from('avatars') // Change 'avatars' to your bucket name if different
    .getPublicUrl(filePath);

  if (!data?.publicUrl) throw new Error("Failed to get public URL");

  return data.publicUrl;
};

export default upload;