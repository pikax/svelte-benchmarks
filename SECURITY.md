# Security policy

## Supported versions

This repository is a benchmark harness, not a shipped runtime. Security fixes apply to the latest commit on `main`.

## Reporting a vulnerability

Do not publish exploitable details in an issue. Use GitHub **Security → Report a vulnerability** when available, or contact the maintainers listed in the repository profile. Include the affected script, reproduction steps, and impact.

## Scope notes

- The harness executes third-party JavaScript, CLIs, native binaries, and VS Code extensions declared by `package.json`. Review dependency advisories and lockfile changes.
- Real-world fetching checks immutable commit SHAs and copies source only. It does not install or execute third-party project dependencies or lifecycle scripts.
- Generated fixtures, cloned corpora, `work/`, `work-real/`, and local results are ephemeral. Do not place secrets in them.
- CI artifacts may contain machine paths and timing data; they must not contain credentials.
