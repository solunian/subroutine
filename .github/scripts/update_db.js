import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";

const supabase_url = process.env.SUPABASE_URL;
const supabase_key = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabase_url, supabase_key);

async function run() {
  try {
    // Get the last n commits with Hash and ISO Timestamp
    const log_output = execSync('git log -n 1 --format="%H|%ai"', { encoding: "utf-8" });

    // Parse the output into snake_case properties
    const git_commits = log_output
      .trim()
      .split("\n")
      .map((line) => {
        const [hash, timestamp] = line.split("|");
        return {
          hash,
          timestamp,
        };
      });

    const commit = git_commits[0];
    const hash = commit.hash;
    const timestamp = commit.timestamp;

    console.log("latest commit hash:", hash);
    console.log("timestamp:", timestamp);

    // UPDATE SUPABASE HERE
    const { error } = await supabase
      .from("globals")
      .update({ value: { hash }, updated_at: timestamp })
      .eq("key", "latest_gitcommit_hash");

    if (error) {
      console.error("failed to update data:", error);
      process.exit(1);
    }
    console.log("successfully updated data");
  } catch (script_error) {
    console.error("error fetching commits:", script_error.message);
  }
}

run();
