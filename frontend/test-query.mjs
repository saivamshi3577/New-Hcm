import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://wqnskzdnawpnxxefdxwn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnNremRuYXdwbnh4ZWZkeHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzE4NTUsImV4cCI6MjA5Nzg0Nzg1NX0.8x19QF57prWtLbtYmicD2gMEjrJ4l9q8t8BINfidi80';

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('activity_logs').select('*').limit(10).order('created_at', { ascending: false });
  console.log(JSON.stringify(data, null, 2));
}

run();
