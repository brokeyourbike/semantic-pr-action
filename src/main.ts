import * as core from "@actions/core";
import * as github from "@actions/github";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIOutputSchema } from "./types";

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });
    const apiKey = core.getInput("gemini-api-key", { required: true });
    const modelName = core.getInput("model-name");
    const octokit = github.getOctokit(token);

    // Grab the PR number and the current title directly from the context payload
    const { owner, repo, number } = github.context.issue;
    const currentTitle = github.context.payload.pull_request?.title || "";

    // 1. Get the Diff (Requires a specific mediaType, so it returns raw text, not a JSON object)
    const { data: diff } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: number,
      mediaType: { format: "diff" },
    });

    // 2. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Update the prompt to evaluate the current title
    const prompt = `
      Analyze this git diff and return a JSON object with a "title" and a "description".
      
      CURRENT PR TITLE: "${currentTitle}"
      
      RULES FOR TITLE:
      1. Must follow Conventional Commits format (e.g., feat:, fix:, chore:, etc.).
      2. If the CURRENT PR TITLE is already formatted correctly AND accurately describes the diff, return it EXACTLY as-is.
      3. If it is inaccurate or improperly formatted, generate a new, better title.
      
      RULES FOR DESCRIPTION:
      Provide a concise summary of the 'What' and 'Why' of these changes.

      Diff: 
      ${String(diff).substring(0, 15000)}
    `;

    const result = await model.generateContent(prompt);
    const jsonResponse = JSON.parse(
      result.response
        .text()
        .replace(/```json|```/g, "")
        .trim(),
    );

    // 3. Validate
    const validated = AIOutputSchema.parse(jsonResponse);

    // 4. Determine what needs updating
    const titleChanged = validated.title !== currentTitle;

    if (titleChanged) {
      core.info(
        `Title requires update. Changing from "${currentTitle}" to "${validated.title}"`,
      );
    } else {
      core.info(
        `Current title "${currentTitle}" is semantic and accurate. Keeping it.`,
      );
    }

    // 5. Update PR
    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: number,
      // Only send the title in the payload if it actually changed
      ...(titleChanged && { title: validated.title }),
      body: validated.description,
    });

    core.info(`PR description updated successfully.`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : "Unknown error");
  }
}

run();
