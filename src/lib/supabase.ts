import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export const uploadFile = async (bucket: string, path: string, file: File): Promise<string> => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) {
    if (error.message.includes('row-level security policy')) {
      throw new Error(`Supabase Storage RLS Error: Make sure your bucket '${bucket}' has an INSERT policy for public/anon users. Run this SQL in your Supabase dashboard:
      
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = '${bucket}');
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = '${bucket}');`);
    }
    throw error;
  }
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
};
