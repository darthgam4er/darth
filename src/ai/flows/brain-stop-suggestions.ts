'use server';
/**
 * @fileOverview An AI agent that provides personalized suggestions to overcome mental blocks during study sessions.
 *
 * - getBrainStopSuggestions - A function that takes the questionnaire answers and returns AI-powered suggestions.
 * - BrainStopSuggestionsInput - The input type for the getBrainStopSuggestions function.
 * - BrainStopSuggestionsOutput - The return type for the getBrainStopSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BrainStopSuggestionsInputSchema = z.object({
  isTaskTooBig: z
    .boolean()
    .describe('Whether the user feels the task is too big.'),
  isFeelingBored: z
    .boolean()
    .describe('Whether the user is feeling bored with the task.'),
  isFeelingTired: z
    .boolean()
    .describe('Whether the user is feeling tired.'),
  isDistractedByThoughts: z
    .boolean()
    .describe('Whether the user is distracted by thoughts.'),
  userDefinedMethods: z
    .string()
    .describe('List of user defined study methods, if any.'),
});
export type BrainStopSuggestionsInput = z.infer<
  typeof BrainStopSuggestionsInputSchema
>;

const BrainStopSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of personalized suggestions to overcome the mental block.'),
});
export type BrainStopSuggestionsOutput = z.infer<
  typeof BrainStopSuggestionsOutputSchema
>;

export async function getBrainStopSuggestions(
  input: BrainStopSuggestionsInput
): Promise<BrainStopSuggestionsOutput> {
  return brainStopSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'brainStopSuggestionsPrompt',
  input: {schema: BrainStopSuggestionsInputSchema},
  output: {schema: BrainStopSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to provide personalized suggestions to students experiencing mental blocks during study sessions.

  Based on the student's answers to the "Why Am I Stuck?" questionnaire, offer targeted solutions to help them overcome their mental block and get back to studying.

  Consider the following:

  - If the task is too big, suggest breaking it down into smaller, more manageable steps.
  - If the student is feeling bored, suggest switching tasks or using a different study method. If the student provided user defined study methods, use those in the suggestions.
  - If the student is feeling tired, remind them of their next scheduled longer break or suggest taking a short "total off" break.
  - If the student is distracted by thoughts, offer a digital "parking lot" to jot down thoughts to address later.

  Here's the student's input:

  Is the task too big? {{{isTaskTooBig}}}
  Feeling bored? {{{isFeelingBored}}}
  Feeling tired? {{{isFeelingTired}}}
  Distracted by thoughts? {{{isDistractedByThoughts}}}
  User Defined Study Methods? {{{userDefinedMethods}}}

  Provide 3-5 suggestions to help the student overcome their mental block:
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const brainStopSuggestionsFlow = ai.defineFlow(
  {
    name: 'brainStopSuggestionsFlow',
    inputSchema: BrainStopSuggestionsInputSchema,
    outputSchema: BrainStopSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
