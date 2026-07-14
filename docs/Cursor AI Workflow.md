Cursor AI Workflow 
GuideTo guarantee success when using Cursor AI with these guidelines, follow this exact workflow:Step 
1: System RulesCopy the contents of docs/00-AI_RULES.md and save it as .cursorrules in the root of your project directory. 
Cursor will read this automatically before every prompt.Step 

2: Use Cursor ComposerDo not use the standard chat for large feature generation. Press Cmd/Ctrl + I to open Composer. Composer allows the AI to create, edit, and link multiple files intelligently.Step 

3: Execute Sprints SequentiallyOpen docs/13-SPRINTS.md.Copy the text block for Sprint 1.Paste it into Composer and submit.Review the generated files. Check for errors.Commit to Git (e.g., git commit -m "feat: complete sprint 1").Move to the next Sprint. DO NOT combine multiple sprints into a single prompt.Step 

4: Context AwarenessIf a sprint specifically requires referencing an existing file, mention it using the @ symbol in the prompt (e.g., @AssignmentService.php ensure the UI matches the required payload).