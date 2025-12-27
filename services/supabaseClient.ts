
import { createClient } from '@supabase/supabase-js';

// Prioritize environment variables, fallback to demo keys if not present
const supabaseUrl = process.env.SUPABASE_URL || "https://pmgavolicjjhdfkkvrzt.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZ2F2b2xpY2pqaGRma2t2cnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODQ4MzAsImV4cCI6MjA3OTc2MDgzMH0.-BtfM6eEVC6tiv1H5q0IYsM5ndOJFert3XptSb5IqH0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
