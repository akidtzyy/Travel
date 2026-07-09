import { createClient } from '@supabase/supabase-js';

// Tambahkan dua baris ini untuk cek di browser:
console.log("URL Supabase:", import.meta.env.VITE_SUPABASE_URL);
console.log("Anon Key:", import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default supabase;
