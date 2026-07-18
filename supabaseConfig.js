import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sgygbqahrvvarimebdsb.supabase.co'
// මෙතනට ඔයාගේ පරණ ANON KEY එක (Publishable Key) දාන්න
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneWdicWFocnZ2YXJpbWViZHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTkxMjIsImV4cCI6MjA5MDYzNTEyMn0.HcsyhB_JWAoobPyENj6W3rjO4iHtYV-HT0xjlbf_pgA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)