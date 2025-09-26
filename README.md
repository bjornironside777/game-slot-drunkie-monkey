# Master Repository Template

🚀 **Darpha Studios** standard repository template.  
All new projects should be created from this template to ensure consistent structure, rules, and workflows.

---

## 📂 Included

This template provides the following structure:

- **README.md** - Project overview
- **LICENSE** - Darpha Proprietary License (All rights reserved)
- **.editorconfig** - Editor configuration for consistent coding style
- **.gitignore** - Ignore rules for Node.js / TypeScript projects
- **.husky/** - Git hooks (lint, tests, commit-msg validation)
- **.lintstagedrc.json** - Pre-commit configuration with lint-staged
- **.releaserc.json** - Semantic Release configuration
- **.drone.yml** - Drone CI pipeline skeleton
- **CODEOWNERS** - Default reviewers for pull requests
- **CONTRIBUTING.md** - Branch, commit, and PR guidelines
- **SECURITY.md** - Security reporting process
- **docs/** - Documentation for branching and commit conventions
- **.github/** (or `.gitea/`) - Issue and PR templates

---

## 🌳 Branch Model

- **main** - Production branch (protected)
- **release/** - Release branches for staging & GLI certification
- **feature/** - Short-lived feature branches
- **hotfix/** - Emergency fixes for production

**Direct push is disabled.**  
All changes must go through Pull Requests.

---

## 🔐 Tag Protection

- **v*** - Semantic Versioning tags (e.g. `v1.0.0`)  
  These are created automatically by CI/CD (Drone + Semantic Release).  
  Manual tag creation is strictly prohibited.

---

## ✅ Requirements

- Husky + Lint-Staged (commit hooks)
- Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)

---

## 🛠 Usage

When creating a new repository:

1. Select **Use this template** when creating the new repo.
2. Update `README.md` and `package.json` (or other project metadata).
3. Branch protection rules will be enforced by Forge automatically.
4. CI/CD (Drone) will run after the first commit.

---

## 📜 License

Darpha Proprietary License  
Copyright © 2025 Darpha Studios. All rights reserved.  

This repository and all associated code, assets, and documentation are the exclusive property of Darpha Studios.  

Unauthorized copying, modification, distribution, or use of this software, in whole or in part, via any medium, is strictly prohibited without the prior written consent of Darpha Studios.  

Use of this repository is permitted only for Darpha Studios employees and authorized contractors under the terms of their employment or service agreements.
