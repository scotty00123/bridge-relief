import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qmikmnkjgbrwjkezmvoy.supabase.co";
const supabaseKey = "sb_publishable_5ufFztB3ikk7w0yHsqF3lQ_kWsWr0UH";

export const supabase = createClient(supabaseUrl, supabaseKey);
