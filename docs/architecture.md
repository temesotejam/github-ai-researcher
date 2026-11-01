# Architecture

## Execution

The system runs entirely in GitHub Actions. A scheduled run starts every Monday, and a manual run can be started from the Actions tab.

1. Query the GitHub REST API for repositories owned by the configured account with public visibility.
2. Exclude this researcher repository to avoid self-analysis feedback loops.
3. Read repository metadata, README, language statistics, a bounded file tree, selected source/configuration files, and recent commit subjects.
4. Ask GitHub Copilot CLI to create one evidence-grounded profile per changed repository.
5. Ask Copilot CLI to synthesize the cached profiles into a cross-project research report.
6. Commit the index, profiles, and report to this repository.

## Data flow

- `data/repository-index.json`: latest list of public repositories.
- `data/profiles.json`: cached profiles keyed by full repository name.
- `reports/weekly/YYYY-MM-DD.md`: dated research report.
- `reports/latest.md`: most recent report.

## Public-only boundary

The inventory query explicitly requests public repositories and the script also checks both `private === false` and `visibility === "public"`. If a repository becomes private or disappears from the public inventory, its cached profile is removed on the next successful run.

The source repositories are never modified. Only this repository receives commits.

## Collection limits

To keep Actions runs bounded, each run profiles at most 8 repositories by default (maximum 20). A profile reads the README, language statistics, up to five selected source/configuration files, a limited file tree, and up to three recent commit subjects. Individual files over 60 KB are skipped. The synthesis stage uses at most 80 cached profiles.

These limits are intended for discovery, not a complete code audit. A future version can add targeted deep dives after an idea is selected.

## AI and trust boundaries

Repository content is untrusted input. The agent is instructed to ignore instructions embedded in source files and to use them only as evidence. The collection process does not execute repository code.

AI-generated profiles and reports can still contain mistakes. Every important claim should be checked against the linked source files before implementation or publication.

## Required GitHub configuration

- Actions enabled for this repository.
- Workflow permissions set to Read and write.
- The GitHub Copilot CLI must be available to the account and usable from Actions with the `copilot-requests: write` permission.
