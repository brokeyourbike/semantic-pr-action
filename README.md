# 🤖 Semantic PR Action

![GitHub release (latest by date)](https://img.shields.io/github/v/release/brokeyourbike/semantic-pr-action)
[![codecov](https://codecov.io/gh/brokeyourbike/semantic-pr-action/graph/badge.svg?token=yQdh76sUDg)](https://codecov.io/gh/brokeyourbike/semantic-pr-action)

**Semantic PR Action** uses Google's Gemini AI to automatically review your Pull Request code changes and ensure your PR titles and descriptions are highly accurate and formatted correctly.

Tired of PRs named "fixed stuff" with an empty description? This action reads the actual git diff and acts as an automated, intelligent PR architect.

## Features

- If a contributor already wrote a perfect, Semantic PR title (e.g., `feat(api): add login endpoint`), the AI recognizes it and leaves it alone.
- Generates a concise "What and Why" summary of the code changes directly in the PR body.
- Enforces the [Conventional Commits](https://www.conventionalcommits.org/) specification for titles (feat, fix, chore, docs, etc.).
- Powered by Google's `gemini-3-flash-preview` model for high-speed, cost-effective analysis.

## Usage

Create a new file in your repository at `.github/workflows/semantic-pr.yml` and add the following configuration:

```yaml
name: Semantic PR

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  optimize-pr:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write 
      contents: read       

    steps:
      - name: Checkout Code
        uses: actions/checkout@v6
        with:
          fetch-depth: 0 
      - name: Run Semantic PR Action
        uses: brokeyourbike/semantic-pr-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
```

## Inputs

| Input | Required | Description |
| --- | --- | --- |
| `github-token` | **Yes** | The standard GitHub token used to fetch the PR diff and apply updates. Use `${{ secrets.GITHUB_TOKEN }}`. |
| `gemini-api-key` | **Yes** | Your Google Gemini API Key. Store this in your repository's Secrets. |
| `model-name` | No | The specific Gemini model to use. Defaults to `gemini-3-flash-preview`. |

## Authors
- [Ivan Stasiuk](https://github.com/brokeyourbike) | [Twitter](https://twitter.com/brokeyourbike) | [LinkedIn](https://www.linkedin.com/in/brokeyourbike) | [stasi.uk](https://stasi.uk)

## License
[BSD-3-Clause License](https://github.com/brokeyourbike/semantic-pr-action/blob/main/LICENSE)
