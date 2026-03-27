import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm'

const supabaseUrl = 'https://fzrsrwsnuhtnopxrboag.supabase.co';
const supabaseKey = 'sb_publishable_6r6Nrn89onwwjNEZCsBg6w_Qg4aeK6X';

export const supabase = createClient(supabaseUrl, supabaseKey);