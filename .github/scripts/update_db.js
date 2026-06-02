import { createClient } from "@supabase/supabase-js";
import { Octokit, App } from "octokit";

const supabase_url = process.env.SUPABASE_URL;
const supabase_key = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabase_url, supabase_key);

const github_token = process.env.ACCESS_TOKEN;
const octokit = new Octokit({ auth: github_token });

async function run() {
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/commits", {
      owner: "solunian",
      repo: "subroutine",
      sha: "main",
      per_page: 1, // we only need the most recent commit
    });

    const commit = response.data[0];
    const hash = commit.sha;
    const timestamp = commit.commit.author.date;

    console.log("latest commit hash:", hash);
    console.log("timestamp:", timestamp);

    // UPDATE SUPABASE HERE
    const { data, error } = await supabase
      .from("globals")
      .update({ value: { hash }, updated_at: timestamp })
      .eq("key", "latest_gitcommit_hash");

    if (error) {
      console.error("failed to update data:", error);
      process.exit(1);
    }
    console.log("successfully updated data:", data);
  } catch (error) {
    console.error("error fetching commits:", error);
  }
}

run();
