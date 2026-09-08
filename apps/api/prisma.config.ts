import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  // Docs: https://pris.ly/d/prisma-config - ensures Prisma LSP picks up schema
});
