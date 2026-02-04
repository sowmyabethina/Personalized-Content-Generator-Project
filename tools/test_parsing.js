// Test parsing of Gemini-generated questions
const testText = `**Multiple-Choice Questions**

1.  Who is listed as the guide for the Collaborative Research Paper Management System project?
    A) Bethina Sowmya Sri Durga
    B) Deva Bhavya Sri Lakshmi
    C) G.Venkata Subbarao
    *Correct Answer: C*

2.  According to the "Specific Problem/Gap" section, which of the following is NOT identified as a problem?
    A) Confusing file versions
    B) Difficulty giving feedback
    C) Over-reliance on a single system
    *Correct Answer: C*

3.  In the proposed system architecture, which component enables real-time editing?
    A) React
    B) Node.js
    C) WebSockets
    D) Database
    *Correct Answer: C*

4.  Based on objectives, which two features overlap in development?
    A) Login system and task management
    B) Writing tool and testing
    C) Version tracking and references
    D) AI tools and workspace
    *Correct Answer: C*

5.  Which ethical consideration is mentioned for AI?
    A) Ensuring 100% original content
    B) Replacing researchers in writing
    C) Informing users AI assists writing
    D) Restricting to premium users
    *Correct Answer: C*`;

function parseQuestionsFromText(text) {
  const questions = [];
  if (!text || typeof text !== "string") return [];
  
  // Split by MCQ section header and extract MCQ section
  const sections = text.split(/\*\*Multiple-Choice Questions\*\*|\*\*Multiple Choice Questions\*\*/i);
  const mcqSection = sections.length > 1 ? sections[1] : text;
  
  // Split questions by numbered pattern (1., 2., 3., etc.)
  const questionBlocks = mcqSection.split(/\n(?=\d+\.)/);
  
  for (const block of questionBlocks) {
    const lines = block.trim().split("\n").filter(l => l.trim());
    if (lines.length < 4) continue;
    
    // Extract question text (first line, remove number)
    let questionText = lines[0].replace(/^\d+\.\s*/, "").trim();
    questionText = questionText.replace(/http[s]?:\/\/\S+/g, "").trim();
    
    // Extract options
    const options = [];
    let correctAnswer = null;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Match option pattern: A) or A.
      const optionMatch = line.match(/^([A-D])[.)]\s*(.+?)(?:\s*\*?Correct Answer:\*?.*)?$/i);
      if (optionMatch) {
        const optionLetter = optionMatch[1];
        let optionText = optionMatch[2].trim();
        
        optionText = optionText.replace(/\*?Correct Answer:\*?\s*[A-D]?\s*$/i, "").trim();
        
        if (optionText && optionText.length > 0) {
          options.push(optionText);
        }
        
        if (line.match(/\*?Correct Answer:\*?\s*([A-D])/i)) {
          const match = line.match(/\*?Correct Answer:\*?\s*([A-D])/i);
          correctAnswer = match[1];
        }
      }
    }
    
    if (questionText && options.length >= 3) {
      const finalOptions = options.slice(0, 4);
      
      let answerIndex = 0;
      if (correctAnswer) {
        answerIndex = correctAnswer.charCodeAt(0) - 65;
        if (answerIndex < 0 || answerIndex >= finalOptions.length) {
          answerIndex = 0;
        }
      }
      
      questions.push({
        question: questionText,
        options: finalOptions,
        answer: finalOptions[answerIndex] || finalOptions[0]
      });
    }
  }
  
  return questions;
}

const parsed = parseQuestionsFromText(testText);
console.log(`✅ Parsed ${parsed.length} questions\n`);

parsed.forEach((q, i) => {
  console.log(`Question ${i + 1}: ${q.question.substring(0, 50)}...`);
  console.log(`   Options: ${q.options.length}`);
  console.log(`   Answer: ${q.answer}`);
  console.log();
});
