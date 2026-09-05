import type { ThemeAppearance } from "@/types/theme";

import { interpretDeterministicThemeInstruction } from "./deterministic";
import { createThemeAiPrompt, THEME_AI_SYSTEM_INSTRUCTION } from "./prompt";
import {
  parseThemeAiResponse,
  ThemeStudioInstructionSchema,
  type ThemeAiResponse,
} from "./schema";

export type GenerateThemeAiStructured = (input: {
  jsonSchema: Record<string, unknown>;
  prompt: string;
  systemInstruction: string;
}) => Promise<string>;

export async function generateThemeStyleInterpretation(
  input: {
    currentAppearance: ThemeAppearance;
    instruction: unknown;
    layoutKey: string;
    themeName: string;
  },
  generate: GenerateThemeAiStructured,
  jsonSchema: Record<string, unknown>,
): Promise<ThemeAiResponse | null> {
  const instruction = ThemeStudioInstructionSchema.safeParse(input.instruction);

  if (!instruction.success) {
    return null;
  }

  const deterministic = interpretDeterministicThemeInstruction(
    instruction.data,
  );
  if (deterministic) return deterministic;

  try {
    const response = await generate({
      jsonSchema,
      prompt: createThemeAiPrompt({
        ...input,
        instruction: instruction.data,
      }),
      systemInstruction: THEME_AI_SYSTEM_INSTRUCTION,
    });
    const generated = parseThemeAiResponse(response);

    return (
      generated ??
      interpretDeterministicThemeInstruction(instruction.data, {
        allowRecognizedSubset: true,
      })
    );
  } catch (error) {
    const fallback = interpretDeterministicThemeInstruction(instruction.data, {
      allowRecognizedSubset: true,
    });

    if (fallback) return fallback;
    throw error;
  }
}
