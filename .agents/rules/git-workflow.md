# Automated Git Push Workflow (SOP)

When the user says **"PUSH"** or **"push"**:

1. **Autonomous Execution**:
   - Proceed directly without asking for confirmation.
   - Follow all best-practice and safety checks automatically.

2. **Zero-Secret Leak / Security Audit**:
   - Verify `.env.local`, `.data/`, and credentials remain excluded via `.gitignore`.
   - Ensure only safe files (like `.env.example`) are tracked.
   - Grep-check for any accidental hardcoded credentials before staging.

3. **Pre-flight Production Validation**:
   - Run `pnpm run build` to verify TypeScript, Turbopack, and Next.js compilation.
   - Run `pnpm run lint` to ensure code quality standards.

4. **Conventional Commits**:
   - Group and stage files cleanly (`git add`).
   - Write a professional Conventional Commit message (e.g. `feat: ...`, `fix: ...`, `refactor: ...`) with clear bullet points.

5. **Push to Remote**:
   - Push to `origin main`.
   - Verify `git status` indicates a clean working tree up to date with `origin/main`.

6. **Comprehensive Report**:
   - Present a clear, structured summary in Indonesian detailing:
     - Changes & new components/APIs committed.
     - Security audit status (files protected).
     - Build & lint validation results.
     - Commit hash and GitHub sync link.
