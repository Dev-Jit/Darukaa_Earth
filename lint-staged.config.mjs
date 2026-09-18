export default {
  "frontend/**/*.{js,jsx}": (files) => [
    `npm exec --prefix frontend -- prettier --write --config frontend/.prettierrc.json ${files.join(" ")}`,
    `npm exec --prefix frontend -- eslint --fix --max-warnings 0 --config frontend/eslint.config.js ${files.join(" ")}`,
  ],
  "frontend/**/*.css": (files) => [
    `npm exec --prefix frontend -- prettier --write --config frontend/.prettierrc.json ${files.join(" ")}`,
  ],
  "backend/**/*.py": (files) => [
    `node scripts/run-backend-tool.mjs black ${files.join(" ")}`,
    `node scripts/run-backend-tool.mjs ruff check --fix ${files.join(" ")}`,
  ],
};
