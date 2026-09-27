import fs from 'fs';
import path from 'path';
import readline from 'readline';

const LOG_FILE = 'C:\\Users\\nisch\\.gemini\\antigravity-ide\\brain\\2ef76c26-78d4-4929-b5b2-0d4ae0677658\\.system_generated\\logs\\transcript_full.jsonl';
const OUTPUT_FILE = path.resolve(process.cwd(), 'TRANSCRIPT.md');

async function generateTranscript() {
  if (!fs.existsSync(LOG_FILE)) {
    console.error('Log file not found:', LOG_FILE);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(LOG_FILE, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const turns = [];
  let currentTurn = null;

  for await (const line of rl) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.type === 'USER_INPUT') {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      
      let rawContent = entry.content || '';
      let promptText = '';
      const userReqMatch = rawContent.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
      if (userReqMatch) {
        promptText = userReqMatch[1].trim();
      } else {
        promptText = rawContent.trim();
      }

      if (!promptText && rawContent.includes('uploaded 1 audio file')) {
        promptText = '[Audio Message from User - transcribed instructions]';
      }

      currentTurn = {
        turnIndex: turns.length + 1,
        timestamp: entry.created_at || new Date().toISOString(),
        userPrompt: promptText,
        assistantResponses: [],
        toolsUsed: [],
      };
    } else if (currentTurn) {
      if (entry.type === 'PLANNER_RESPONSE') {
        if (entry.content && typeof entry.content === 'string' && entry.content.trim()) {
          currentTurn.assistantResponses.push(entry.content.trim());
        }
        if (entry.tool_calls && Array.isArray(entry.tool_calls)) {
          for (const tc of entry.tool_calls) {
            currentTurn.toolsUsed.push({
              name: tc.name,
              summary: tc.args?.toolSummary || tc.args?.Description || tc.name,
              target: tc.args?.TargetFile || tc.args?.AbsolutePath || tc.args?.CommandLine || '',
            });
          }
        }
      }
    }
  }

  if (currentTurn) {
    turns.push(currentTurn);
  }

  let md = `# CodeYoung AI Pair Programming Session - Full Transcript\n\n`;
  md += `**Project**: CodeYoung Trial-Class Booking Platform\n`;
  md += `**Platform**: Google Antigravity Agentic AI Assistant\n`;
  md += `**Total Session Turns**: ${turns.length}\n`;
  md += `**Export Date**: ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  for (const turn of turns) {
    md += `## Turn ${turn.turnIndex}\n\n`;
    md += `**Timestamp**: \`${turn.timestamp}\`\n\n`;
    md += `### 👤 User Prompt\n\n`;
    md += `${turn.userPrompt || '_Empty / Audio prompt_'}\n\n`;

    if (turn.toolsUsed.length > 0) {
      md += `### 🛠️ Actions & Tools Executed\n\n`;
      const uniqueTools = [];
      const seen = new Set();
      for (const t of turn.toolsUsed) {
        const key = `${t.name}:${t.summary}:${t.target}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueTools.push(t);
        }
      }
      for (const tool of uniqueTools) {
        md += `- **${tool.name}**: ${tool.summary} ${tool.target ? `(\`${path.basename(tool.target)}\`)` : ''}\n`;
      }
      md += `\n`;
    }

    md += `### 🤖 AI Agent Response\n\n`;
    if (turn.assistantResponses.length > 0) {
      md += `${turn.assistantResponses.join('\n\n---\n\n')}\n\n`;
    } else {
      md += `_Completed automated actions and verified project state._\n\n`;
    }

    md += `---\n\n`;
  }

  fs.writeFileSync(OUTPUT_FILE, md, 'utf-8');
  console.log(`Exported ${turns.length} turns to ${OUTPUT_FILE}`);
}

generateTranscript();
