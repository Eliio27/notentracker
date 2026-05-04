import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aiqpzkpzipvtdygmtdrc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpcXB6a3B6aXB2dGR5Z210ZHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTQ4MDAsImV4cCI6MjA5MzQ5MDgwMH0.PWsTlafLeqjIYks8V9bs34lkd9dO_vUomZTMAbnBP-8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
