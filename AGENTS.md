# AGENTS.md

Guidance for AI agents and developers working in this repository.

## Repository status

**SecretLair-** is currently a greenfield repository. The only tracked file is `README.md` (project title). There is no application source code, dependency manifests, Docker configuration, CI workflows, or documented run/lint/test commands.

When application code is added, update this file with service-specific startup and testing notes.

## Cursor Cloud specific instructions

### Services

| Service | Required | Notes |
|---------|----------|-------|
| *(none)* | — | No runnable services are defined in this repository yet. |

### Environment setup

- **Dependencies:** None to install. The VM update script is a no-op (`true`).
- **Lint / test / build:** Not applicable until a stack and tooling are added (e.g. `package.json`, `Makefile`, `pyproject.toml`).
- **Run:** No dev server or application process exists yet.

### Verification

To confirm the workspace is usable before code lands:

```bash
git status
test -f README.md && echo "README present"
```

### When code is added

Document here (do not duplicate full README setup):

- Which services must run for end-to-end development
- Non-obvious startup caveats (ports, env files, local databases)
- Preferred package manager and dev commands (reference `package.json` scripts or Makefile targets rather than copying them)
