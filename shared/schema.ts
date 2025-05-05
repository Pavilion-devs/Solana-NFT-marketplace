import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { AnalysisResponse, Contract, Finding } from "./types";

// Contract table definition
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  contractId: text("contract_id").notNull().unique(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analysis results table definition
export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  contractId: text("contract_id").notNull().references(() => contracts.contractId),
  result: jsonb("result").$type<AnalysisResponse>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true });
export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({ id: true });

// Export types
export type InsertContract = z.infer<typeof insertContractSchema>;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;
export type ContractModel = typeof contracts.$inferSelect;
export type AnalysisResultModel = typeof analysisResults.$inferSelect;
