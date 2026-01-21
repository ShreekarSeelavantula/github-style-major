export interface ExtractedTopic {
  subject: string;
  name: string;
  subtopics: string[];
  order: number;
  difficulty: "Easy" | "Medium" | "Hard";
}

export function parseSyllabusText(text: string): ExtractedTopic[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const topics: ExtractedTopic[] = [];
  
  let currentSubject = "General";
  let currentTopic: Partial<ExtractedTopic> | null = null;
  let order = 1;

  // Simple heuristic parsing
  // Look for patterns like "Unit 1: Topic Name" or "Chapter 1"
  const unitRegex = /^(Unit|Chapter|Module)\s+\d+[:\s]+(.+)/i;
  
  for (const line of lines) {
    const match = line.match(unitRegex);
    
    if (match) {
      if (currentTopic && currentTopic.name) {
         topics.push(finalizeTopic(currentTopic, order++));
      }
      currentTopic = {
        subject: currentSubject,
        name: match[2].trim(),
        subtopics: [],
      };
    } else if (currentTopic) {
        // Assume subsequent lines are subtopics or descriptions
        // Basic filtering for noise
        if (line.length > 5 && !line.match(/^(Page|Copyright)/i)) {
             currentTopic.subtopics?.push(line);
        }
    }
  }
  
  if (currentTopic && currentTopic.name) {
     topics.push(finalizeTopic(currentTopic, order++));
  }
  
  // Fallback if regex failed (flat list)
  if (topics.length === 0) {
      // Split by likely headers
      // This is a naive fallback
      topics.push({
          subject: "General",
          name: "Extracted Content",
          subtopics: lines.slice(0, 20), // Take first 20 meaningful lines
          order: 1,
          difficulty: "Medium"
      });
  }

  return topics;
}

function finalizeTopic(topic: Partial<ExtractedTopic>, order: number): ExtractedTopic {
    const subtopics = topic.subtopics || [];
    // Rule-based difficulty
    // > 5 subtopics -> Hard
    // Keywords -> Hard/Easy
    let difficulty: "Easy" | "Medium" | "Hard" = "Medium";
    
    if (subtopics.length > 5) difficulty = "Hard";
    if (subtopics.length < 2) difficulty = "Easy";
    
    const hardKeywords = ["algorithm", "optimization", "calculus", "advanced", "architecture"];
    const easyKeywords = ["introduction", "overview", "basics", "definition", "history"];
    
    const textContent = (topic.name + " " + subtopics.join(" ")).toLowerCase();
    
    if (hardKeywords.some(k => textContent.includes(k))) difficulty = "Hard";
    else if (easyKeywords.some(k => textContent.includes(k))) difficulty = "Easy";

    return {
        subject: topic.subject || "General",
        name: topic.name || "Unknown Topic",
        subtopics: subtopics,
        order: order,
        difficulty: difficulty
    };
}
