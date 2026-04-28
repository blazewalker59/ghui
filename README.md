# ghui

<img width="1420" height="856" alt="image" src="https://github.com/user-attachments/assets/5e560a4a-5887-4baa-a6d4-e1f4f0410c70" />

Terminal UI for browsing and acting on your open GitHub pull requests across repositories.

## Install

```bash
npm install -g @kitlangton/ghui
```

Requires `bun` and an authenticated GitHub CLI (`gh auth login`).

## Install Locally

Clone, install, and link:

```bash
git clone https://github.com/kitlangton/ghui.git
cd ghui
bun install
bun link
```

Run from anywhere:

```bash
ghui
```

## Publish

This package publishes from GitHub Releases using npm Trusted Publishing.

The first npm publish has already created the package. Configure npm Trusted Publishing:

- Package: `@kitlangton/ghui`
- Publisher: GitHub Actions
- Owner: `kitlangton`
- Repository: `ghui`
- Workflow filename: `publish.yml`

After that, publish by creating a GitHub Release whose tag matches `package.json` version, for example `v0.1.1`.

## Configuration

- `GHUI_AUTHOR`: author passed to `gh search prs`, defaults to `@me`
- `GHUI_PR_FETCH_LIMIT`: max PRs fetched, defaults to `200`
- `GHUI_INCLUDE_REVIEW_REQUESTED`: include PRs requesting your review, defaults to `false`
- `GHUI_SHOW_PR_SOURCE`: show authored/review-requested source in the UI, defaults to `false`

Example:

```bash
GHUI_AUTHOR=@me ghui
```

You can also copy `.env.example` to `.env` and edit the values locally.

## Keybindings

- `up` / `down`: move selection
- `k` / `j`: move selection
- `gg` / `G`: jump to first or last pull request
- `ctrl-u` / `ctrl-d`: page up or down
- `/`: filter
- `enter`: expand details
- `esc`: return from expanded details or close modal
- `r`: refresh
- `d`: toggle draft
- `l`: manage labels
- `o`: open PR in browser
- `y`: copy PR metadata
- `q`: quit
