# Architecture

## Execution

The system runs entirely in GitHub Actions. A scheduled public-repository check runs every day at 03:30 JST (18:30 UTC on the previous day). A manual run can be started from the Actions tab.

1. Query the GitHub REST API for repositories owned by the configured account with public visibility.
2. Exclude this researcher repository to avoid self-analysis feedback loops.
3. Read repository metadata, README, language statistics, a bounded file tree, selected source/configuration files, and recent commit subjects.
4. Compare each public repository's fingerprint with its last successfully analyzed fingerprint. The fingerprint includes its last push time and relevant repository metadata.
5. If no repository changed and no previously public repository disappeared or became private, exit without invoking AI or rewriting reports.
6. Ask GitHub Copilot CLI to create one evidence-grounded profile per changed repository. Failed profiles remain pending and are retried on the next check.
7. Synthesize all cached profiles in small batches and generate a cross-project research report.
8. Commit the index, profiles, and report to this repository only when the output changes.

## Data flow

- `data/repository-index.json`: latest list of public repositories.
- `data/profiles.json`: cached profiles keyed by full repository name.
- `reports/weekly/YYYY-MM-DD.md`: dated research report.
- `reports/latest.md`: most recent report.

## Public-only boundary

The inventory query explicitly requests public repositories and the script also checks both `private === false` and `visibility === "public"`. If a repository becomes private or disappears from the public inventory, its cached profile is removed on the next successful run.

The source repositories are never modified. Only this repository receives commits.

## Collection limits

To keep Actions runs bounded, each run profiles up to 120 changed repositories. A profile reads the README, repository language metadata, up to five selected source/configuration files, a limited file tree, and up to three recent commit subjects. Individual files over 60 KB are skipped. The synthesis stage covers up to 120 cached profiles in batches.

These limits are intended for discovery, not a complete code audit. A future version can add targeted deep dives after an idea is selected.

## AI and trust boundaries

Repository content is untrusted input. The agent is instructed to ignore instructions embedded in source files and to use them only as evidence. The collection process does not execute repository code.

AI-generated profiles and reports can still contain mistakes. Every important claim should be checked against the linked source files before implementation or publication.

## Required GitHub configuration

- Actions enabled for this repository.
- Workflow permissions set to Read and write.
- The GitHub Copilot CLI must be available to the account and usable from Actions with the `copilot-requests: write` permission.
