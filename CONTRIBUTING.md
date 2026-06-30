# Contributing

Thank you for your interest in contributing! Here are the basics:

## Getting Started

1. Fork the repository and clone it locally.
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Install dependencies (see README → Manual Setup).
4. Make your changes with clear, focused commits.
5. Test your changes manually (API via `/docs`, UI in browser).
6. Open a Pull Request against `main`.

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     new feature
fix:      bug fix
docs:     documentation only
refactor: code restructure without functional change
style:    formatting, no logic change
test:     adding tests
chore:    build tooling, dependencies
```

## Code Style

- **Backend**: follow PEP 8, use type hints, keep router functions thin (business logic in services).
- **Frontend**: functional React components, keep pages as thin orchestrators.

## Issues

For bugs, open an issue with reproduction steps. For features, open a discussion first.
