import { describe, it, expect, vi, beforeEach } from "vitest";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { run } from "../src/main";

// 1. Mock dependencies
vi.mock("@actions/core");

// 2. Setup reusable mock functions for APIs
const mockPullsGet = vi.fn();
const mockPullsUpdate = vi.fn();
export const mockGenerateContent = vi.fn();

// 3. Mock GitHub Context & Octokit
vi.mock("@actions/github", () => ({
  context: {
    issue: { owner: "test-owner", repo: "test-repo", number: 42 },
    payload: { pull_request: { title: "old unstructured title" } },
  },
  getOctokit: vi.fn(() => ({
    rest: { pulls: { get: mockPullsGet, update: mockPullsUpdate } },
  })),
}));

// 4. Mock Gemini (Returns nested objects to mimic class instantiation)
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = vi.fn(() => ({
        generateContent: mockGenerateContent,
      }));
    },
  };
});

describe("main.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset GitHub context state safely between tests
    github.context.issue = { owner: "test-owner", repo: "test-repo", number: 42 } as any;
    github.context.payload = { pull_request: { title: "old unstructured title" } } as any;

    // Default Inputs
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "github-token") return "fake-token";
      if (name === "gemini-api-key") return "fake-api-key";
      if (name === "model-name") return "gemini-1.5-flash";
      return "";
    });

    // Default API Responses
    mockPullsGet.mockResolvedValue({ data: "fake git diff" });
    mockPullsUpdate.mockResolvedValue({});
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '```json\n{"title": "feat: updated code", "description": "This is a detailed description of the changes."}\n```',
      },
    });
  });

  it("successfully fetches diff, calls Gemini, and updates the title", async () => {
    // Explicitly call the function and await it (No more timeout hacks!)
    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.getInput).toHaveBeenCalledWith("github-token", { required: true });
    
    expect(mockPullsGet).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pull_number: 42,
      mediaType: { format: "diff" },
    });

    expect(mockPullsUpdate).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pull_number: 42,
      title: "feat: updated code",
      body: "This is a detailed description of the changes.",
    });
  });

  it("keeps the current title if it is already semantic and matches AI output", async () => {
    // Inject a perfect title into the PR context payload
    github.context.payload.pull_request!.title = "feat: updated code";

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();

    // Verify only the body was updated
    expect(mockPullsUpdate).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pull_number: 42,
      body: "This is a detailed description of the changes.",
    });

    // Verify title was NOT sent
    expect(mockPullsUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.anything() })
    );
  });

  it("fails gracefully and calls core.setFailed on error", async () => {
    // Force a runtime error
    vi.mocked(core.getInput).mockImplementation(() => {
      throw new Error("Missing input test");
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith("Missing input test");
  });
});
