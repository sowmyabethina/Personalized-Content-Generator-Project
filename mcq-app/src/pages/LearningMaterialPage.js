import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ENDPOINTS from "../config/api";

// ============================================
// STRUCTURED LESSON DATA FORMAT
// ============================================
/**
 * Each lesson should follow this structure:
 * {
 *   title: "Lesson Title",
 *   estimatedTime: "10 min",  // Optional
 *   importantConcept: "Key concept to highlight after summary", // Optional
 *   thinkQuestion: "A reflective question for the learner", // Optional
 *   sections: {
 *     summary: "Main overview text...",
 *     keyPoints: ["Point 1", "Point 2", ...],  // Optional - highlighted box
 *     realWorldApplications: [  // Optional - card/grid format
 *       { title: "App 1", description: "..." },
 *       { title: "App 2", description: "..." }
 *     ],
 *     examples: [  // Optional - code block style
 *       { title: "Example 1", description: "...", code: "...", output: "..." }
 *     ],
 *     practiceQuestions: [  // Optional - separate box
 *       "Question 1?", "Question 2?"
 *     ],
 *     quickRevision: ["Point 1", "Point 2"] // Optional - end of lesson recap
 *   },
 *   checkpoint: { // Optional - Mini Checkpoint MCQ
 *     question: "What is...",
 *     options: ["A", "B", "C", "D"],
 *     correctAnswer: 0
 *   }
 * }
 */

// Sample structured lessons for demonstration
const SAMPLE_LESSONS = [
  {
    title: "Introduction to Variables",
    estimatedTime: "5 min",
    sections: {
      summary: "Variables are containers for storing data values. In programming, they act as labeled boxes that hold information which can be used and modified throughout your code. Understanding variables is fundamental to any programming language.",
      importantConcept: "A variable is like a labeled box - you can put something in it, look at what's inside, or replace its contents. The label (variable name) stays the same, but the contents (value) can change.",
      thinkQuestion: "How might you use variables in your daily life to remember important information?",
      keyPoints: [
        "Variables store data that can change during program execution",
        "Each variable has a name (identifier) and a value",
        "Different data types determine what kind of data a variable can hold",
        "Variables must be declared before use"
      ],
      realWorldApplications: [
        { title: "User Input Storage", description: "Storing username, password, and preferences entered by users" },
        { title: "Counter Variables", description: "Tracking number of items in a shopping cart" },
        { title: "Configuration Settings", description: "Saving app settings like theme, language preferences" }
      ],
      examples: [
        {
          title: "Declaring a Variable",
          description: "Creating a variable to store a user's name",
          code: "let userName = \"John Doe\";\nconsole.log(userName);",
          output: "John Doe"
        },
        {
          title: "Updating a Variable",
          description: "Modifying the value of an existing variable",
          code: "let count = 0;\ncount = count + 1;\nconsole.log(count);",
          output: "1"
        }
      ],
      practiceQuestions: [
        "What is the purpose of declaring a variable?",
        "Can variable names start with numbers?",
        "What happens if you try to use a variable before declaring it?"
      ],
      quickRevision: [
        "Variables store data that changes during execution",
        "They have a name (identifier) and hold a value",
        "Use 'let' or 'const' to declare variables in JavaScript"
      ],
      checkpoint: {
        question: "What is a variable in programming?",
        options: [
          "A container for storing data values",
          "A type of function",
          "A programming language",
          "A database"
        ],
        correctAnswer: 0
      }
    }
  },
  {
    title: "Data Types in Programming",
    estimatedTime: "8 min",
    sections: {
      summary: "Data types define the kind of data that can be stored in a variable. Different programming languages have different data types, but most include basic types like numbers, text (strings), and true/false (booleans). Understanding data types is crucial for writing correct and efficient code.",
      importantConcept: "Think of data types as different containers - a number container can only hold numbers, a text container can only hold strings. Using the right container (type) ensures your code works correctly.",
      thinkQuestion: "Why do you think programming languages have different data types? What problems does this prevent?",
      keyPoints: [
        "Numbers (integers and decimals) - for mathematical operations",
        "Strings - for text data enclosed in quotes",
        "Booleans - for true/false values",
        "Arrays - for storing multiple values in order",
        "Objects - for storing key-value pairs"
      ],
      realWorldApplications: [
        { title: "Form Validation", description: "Checking if email is string, age is number" },
        { title: "Database Fields", description: "Storing user profiles with various data types" },
        { title: "API Responses", description: "Processing JSON data with mixed types" }
      ],
      examples: [
        {
          title: "Common Data Types",
          description: "Examples of different data types in JavaScript",
          code: "// Number\nlet price = 19.99;\n\n// String\nlet productName = \"Laptop\";\n\n// Boolean\nlet isAvailable = true;\n\n// Array\nlet colors = [\"red\", \"green\", \"blue\"];\n\n// Object\nlet user = { name: \"Alice\", age: 25 };",
          output: "// Various data types stored in variables"
        }
      ],
      practiceQuestions: [
        "What is the difference between an integer and a decimal?",
        "How do you create a string in programming?",
        "What data type would you use to store whether a user is logged in?"
      ],
      quickRevision: [
        "Numbers for math, Strings for text, Booleans for true/false",
        "Arrays store ordered lists, Objects store key-value pairs",
        "Using correct data types prevents bugs"
      ],
      checkpoint: {
        question: "Which data type would you use to store a user's login status?",
        options: [
          "Boolean (true/false)",
          "String",
          "Number",
          "Array"
        ],
        correctAnswer: 0
      }
    }
  },
  {
    title: "Working with Functions",
    estimatedTime: "10 min",
    sections: {
      summary: "Functions are reusable blocks of code that perform specific tasks. They help organize code, reduce repetition, and make programs easier to maintain. A function can accept inputs (parameters), process them, and optionally return a result.",
      importantConcept: "A function is like a recipe - you define the steps once, then can follow (call) that recipe whenever needed. Parameters are ingredients, and the return value is the finished dish.",
      thinkQuestion: "What functions do you perform repeatedly in your daily routine? How could breaking them down help?",
      keyPoints: [
        "Functions encapsulate code into reusable units",
        "Parameters allow passing data into functions",
        "Return values allow functions to output results",
        "Functions can be called multiple times with different inputs",
        "Good function names describe what the function does"
      ],
      realWorldApplications: [
        { title: "Form Submission", description: "Validating user input before submitting to server" },
        { title: "Calculations", description: "Computing totals, taxes, shipping costs in e-commerce" },
        { title: "Event Handling", description: "Responding to button clicks, form changes" }
      ],
      examples: [
        {
          title: "Basic Function",
          description: "A simple function that greets a user",
          code: "function greet(name) {\n  return \"Hello, \" + name + \"!\";\n}\n\n// Calling the function\nlet message = greet(\"Alice\");\nconsole.log(message);",
          output: "Hello, Alice!"
        },
        {
          title: "Function with Multiple Parameters",
          description: "Calculating the area of a rectangle",
          code: "function calculateArea(width, height) {\n  return width * height;\n}\n\nlet area = calculateArea(5, 10);\nconsole.log(area);",
          output: "50"
        }
      ],
      practiceQuestions: [
        "Why should you use functions in your code?",
        "What is the difference between parameters and arguments?",
        "Can a function return multiple values?"
      ],
      quickRevision: [
        "Functions are reusable code blocks that perform specific tasks",
        "Parameters are inputs, return is the output",
        "Call a function by using its name with parentheses"
      ],
      checkpoint: {
        question: "What is the purpose of parameters in a function?",
        options: [
          "To pass data into the function",
          "To return a value",
          "To name the function",
          "To end the function"
        ],
        correctAnswer: 0
      }
    }
  },
  {
    title: "Conditional Logic",
    estimatedTime: "8 min",
    sections: {
      summary: "Conditional statements allow programs to make decisions based on certain conditions. Using if/else statements, your code can execute different blocks of code depending on whether conditions are true or false, enabling dynamic and responsive behavior.",
      importantConcept: "Conditional logic is like a fork in the road - your code checks a condition (true/false) and takes different paths based on what it finds. This is how programs make decisions.",
      thinkQuestion: "Think of a decision you make daily. What conditions trigger different choices?",
      keyPoints: [
        "if statements execute code when a condition is true",
        "else provides alternative code when condition is false",
        "else if handles multiple conditions in sequence",
        "Comparison operators (==, !=, <, >, <=, >=) create conditions",
        "Logical operators (&&, ||, !) combine multiple conditions"
      ],
      realWorldApplications: [
        { title: "Access Control", description: "Granting or denying access based on user role" },
        { title: "Discount Eligibility", description: "Applying discounts based on purchase amount" },
        { title: "Form Validation", description: "Showing error messages when input is invalid" }
      ],
      examples: [
        {
          title: "Simple If-Else",
          description: "Checking if a user is old enough to vote",
          code: "let age = 17;\n\nif (age >= 18) {\n  console.log(\"You can vote!\");\n} else {\n  console.log(\"You are too young.\");\n}",
          output: "You are too young."
        },
        {
          title: "Multiple Conditions",
          description: "Determining grade based on score",
          code: "let score = 85;\nlet grade;\n\nif (score >= 90) {\n  grade = \"A\";\n} else if (score >= 80) {\n  grade = \"B\";\n} else {\n  grade = \"F\";\n}\nconsole.log(\"Grade: \" + grade);",
          output: "Grade: B"
        }
      ],
      practiceQuestions: [
        "What happens if you don't provide an else block?",
        "How do you check multiple conditions at once?",
        "What is the difference between = and ==?"
      ],
      quickRevision: [
        "if executes when true, else when false",
        "Use else if for multiple conditions",
        "Comparison operators create conditions to check"
      ],
      checkpoint: {
        question: "What does the 'else' statement do in conditional logic?",
        options: [
          "Executes when the condition is false",
          "Executes when the condition is true",
          "Checks the condition",
          "Creates a loop"
        ],
        correctAnswer: 0
      }
    }
  },
  {
    title: "Loops and Iteration",
    estimatedTime: "10 min",
    sections: {
      summary: "Loops allow you to repeat code multiple times without writing it repeatedly. They are essential for processing collections of data like arrays, performing calculations, and automating repetitive tasks. Understanding different loop types helps you choose the best approach for each situation.",
      importantConcept: "Loops are like repeating instructions - instead of writing 'print' 100 times, you tell the computer to 'print' 100 times using a loop. This saves time and reduces errors.",
      thinkQuestion: "What tasks in your life are repetitive? How would automation change your approach?",
      keyPoints: [
        "for loops repeat code a specific number of times",
        "while loops repeat while a condition is true",
        "Arrays are commonly processed using loops",
        "Loop control: break exits the loop, continue skips to next iteration",
        "Infinite loops can crash your program - always set exit conditions"
      ],
      realWorldApplications: [
        { title: "Product Listings", description: "Displaying all products from a database" },
        { title: "Data Processing", description: "Analyzing batches of transactions" },
        { title: "Game Development", description: "Updating game state each frame" }
      ],
      examples: [
        {
          title: "For Loop",
          description: "Printing numbers from 1 to 5",
          code: "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
          output: "1\n2\n3\n4\n5"
        },
        {
          title: "Looping Through Array",
          description: "Finding the total of all items in an array",
          code: "let prices = [10, 20, 30, 40];\nlet total = 0;\n\nfor (let price of prices) {\n  total += price;\n}\n\nconsole.log(\"Total: $\" + total);",
          output: "Total: $100"
        }
      ],
      practiceQuestions: [
        "When should you use a for loop vs a while loop?",
        "What does the break statement do inside a loop?",
        "How can you skip the current iteration and move to the next one?"
      ],
      quickRevision: [
        "for loops are for known iteration counts",
        "while loops are for condition-based repetition",
        "break exits, continue skips to next iteration"
      ],
      checkpoint: {
        question: "What does the 'break' statement do in a loop?",
        options: [
          "Exits the loop completely",
          "Skips to the next iteration",
          "Starts the loop over",
          "Pauses the loop"
        ],
        correctAnswer: 0
      }
    }
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert legacy learning material to structured lessons format
 */
const convertSectionsToLessons = (learningMaterial) => {
  const lessons = [];
  
  // Add overview as first lesson if available
  if (learningMaterial?.summary) {
    lessons.push({
      title: "Overview",
      estimatedTime: "5 min",
      sections: {
        summary: learningMaterial.summary,
        keyPoints: learningMaterial.learningTips || [],
        realWorldApplications: [],
        examples: [],
        practiceQuestions: []
      }
    });
  }
  
  // Convert sections to structured lessons
  if (learningMaterial?.sections && Array.isArray(learningMaterial.sections)) {
    learningMaterial.sections.forEach((section) => {
      const examples = [];
      
      // Convert examples
      if (section.examples && Array.isArray(section.examples)) {
        section.examples.forEach((ex) => {
          examples.push({
            title: ex.title || "Example",
            description: ex.description || "",
            code: ex.code || ""
          });
        });
      }
      
      lessons.push({
        title: section.title || `Section ${lessons.length + 1}`,
        estimatedTime: "10 min",
        sections: {
          summary: section.content || "",
          keyPoints: section.keyPoints || [],
          realWorldApplications: [],
          examples: examples,
          practiceQuestions: []
        }
      });
    });
  }
  
  // Add learning tips if available
  if (learningMaterial?.learningTips && learningMaterial.learningTips.length > 0) {
    lessons.push({
      title: "Learning Tips",
      estimatedTime: "3 min",
      sections: {
        summary: "Helpful tips to enhance your learning experience:",
        keyPoints: learningMaterial.learningTips,
        realWorldApplications: [],
        examples: [],
        practiceQuestions: []
      }
    });
  }
  
  // Add final project if available
  if (learningMaterial?.finalProject) {
    const questions = learningMaterial.finalProject.steps || [];
    lessons.push({
      title: "Final Project",
      estimatedTime: "20 min",
      sections: {
        summary: learningMaterial.finalProject.description || "Complete this project to practice what you've learned.",
        keyPoints: [],
        realWorldApplications: [
          { title: learningMaterial.finalProject.title || "Project", description: learningMaterial.finalProject.description || "" }
        ],
        examples: [],
        practiceQuestions: questions
      }
    });
  }
  
  // If no lessons were created, use sample lessons
  return lessons.length > 0 ? lessons : SAMPLE_LESSONS;
};

// ============================================
// REUSABLE UI COMPONENTS
// ============================================

/**
 * Summary Section Component
 * Displays the main overview of the lesson
 */
const SummarySection = ({ content }) => (
  <div style={styles.sectionContainer}>
    <div style={styles.sectionHeader}>
      <span style={styles.sectionIcon}>📖</span>
      <h3 style={styles.sectionTitle}>Summary</h3>
    </div>
    <p style={styles.summaryText}>{content}</p>
  </div>
);

/**
 * Important Concept Component
 * Highlights a key concept in a purple/violet box after summary
 */
const ImportantConceptSection = ({ concept }) => {
  if (!concept) return null;
  
  return (
    <div style={styles.importantConceptContainer}>
      <div style={styles.importantConceptHeader}>
        <span style={styles.importantIcon}>💡</span>
        <span style={styles.importantTitle}>Important Concept</span>
      </div>
      <p style={styles.importantText}>{concept}</p>
    </div>
  );
};

/**
 * Key Points Component
 * Displays important points in a highlighted box
 */
const KeyPointsSection = ({ points }) => {
  if (!points || points.length === 0) return null;
  
  return (
    <div style={styles.keyPointsContainer}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>🎯</span>
        <h3 style={styles.sectionTitle}>Key Points</h3>
      </div>
      <ul style={styles.keyPointsList}>
        {points.map((point, idx) => (
          <li key={idx} style={styles.keyPointItem}>{point}</li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Real-World Applications Component
 * Displays applications in card/grid format
 */
const ApplicationsSection = ({ applications }) => {
  if (!applications || applications.length === 0) return null;
  
  return (
    <div style={styles.sectionContainer}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>🌍</span>
        <h3 style={styles.sectionTitle}>Real-World Applications</h3>
      </div>
      <div style={styles.applicationsGrid}>
        {applications.map((app, idx) => (
          <div key={idx} style={styles.applicationCard}>
            <h4 style={styles.applicationTitle}>{app.title}</h4>
            <p style={styles.applicationDescription}>{app.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Examples Component
 * Displays code examples with syntax highlighting style
 */
const ExamplesSection = ({ examples }) => {
  if (!examples || examples.length === 0) return null;
  
  return (
    <div style={styles.sectionContainer}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>💻</span>
        <h3 style={styles.sectionTitle}>Examples</h3>
      </div>
      {examples.map((example, idx) => (
        <div key={idx} style={styles.exampleCard}>
          <div style={styles.exampleHeader}>
            <span style={styles.exampleTitle}>{example.title}</span>
            {example.code && <CopyButton code={example.code} />}
          </div>
          {example.description && (
            <p style={styles.exampleDescription}>{example.description}</p>
          )}
          {example.code && (
            <pre style={styles.codeBlock}>
              <code>{example.code}</code>
            </pre>
          )}
          {example.output && (
            <div style={styles.outputContainer}>
              <span style={styles.outputLabel}>Output:</span>
              <code style={styles.outputText}>{example.output}</code>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Quick Revision Section Component
 * Displays a quick recap at the end of each lesson
 */
const QuickRevisionSection = ({ items }) => {
  if (!items || items.length === 0) return null;
  
  return (
    <div style={styles.quickRevisionContainer}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>🔄</span>
        <h3 style={styles.sectionTitle}>Quick Revision</h3>
      </div>
      <div style={styles.revisionItems}>
        {items.map((item, idx) => (
          <div key={idx} style={styles.revisionItem}>
            <span style={styles.revisionCheck}>✓</span>
            <span style={styles.revisionText}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Think Question Component
 * Displays a reflective question for deeper engagement
 */
const ThinkQuestionSection = ({ question }) => {
  if (!question) return null;
  
  return (
    <div style={styles.thinkQuestionContainer}>
      <div style={styles.thinkQuestionHeader}>
        <span style={styles.thinkIcon}>🤔</span>
        <span style={styles.thinkTitle}>Think About It</span>
      </div>
      <p style={styles.thinkQuestionText}>{question}</p>
    </div>
  );
};

/**
 * Copy Button Component
 * Small button to copy code to clipboard
 */
const CopyButton = ({ code }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button 
      onClick={handleCopy}
      style={styles.copyButton}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

/**
 * Practice Questions Component
 * Displays practice questions in a separate box
 */
const PracticeQuestionsSection = ({ questions }) => {
  if (!questions || questions.length === 0) return null;
  
  return (
    <div style={styles.practiceContainer}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>❓</span>
        <h3 style={styles.sectionTitle}>Practice Questions</h3>
      </div>
      <ul style={styles.questionsList}>
        {questions.map((question, idx) => (
          <li key={idx} style={styles.questionItem}>
            <span style={styles.questionNumber}>Q{idx + 1}:</span> {question}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Estimated Time Component
 * Displays the estimated time for the lesson
 */
const EstimatedTime = ({ time }) => {
  if (!time) return null;
  
  return (
    <div style={styles.timeContainer}>
      <span style={styles.timeIcon}>⏱️</span>
      <span style={styles.timeText}>Estimated Time: {time}</span>
    </div>
  );
};

/**
 * Main Lesson Content Component
 * Renders all sections of a structured lesson
 */
const LessonContent = ({ lesson, onAnswerSelect, selectedAnswer, showFeedback, isCorrect }) => {
  // Debug: log checkpoint to verify data
  console.log('Lesson checkpoint:', lesson.checkpoint);
  
  const { sections, checkpoint } = lesson;
  
  return (
    <div style={styles.lessonContent}>
      {/* Important Concept - First, with purple left border */}
      {sections?.importantConcept && <ImportantConceptSection concept={sections.importantConcept} />}
      
      {/* Summary Section */}
      {sections?.summary && <SummarySection content={sections.summary} />}
      
      {/* Think Question - After Important Concept, attention-grabbing orange */}
      {sections?.thinkQuestion && <ThinkQuestionSection question={sections.thinkQuestion} />}
      
      {/* Key Points Section */}
      {sections?.keyPoints && sections.keyPoints.length > 0 && <KeyPointsSection points={sections.keyPoints} />}
      
      {/* Real-World Applications Section */}
      {sections?.realWorldApplications && sections.realWorldApplications.length > 0 && <ApplicationsSection applications={sections.realWorldApplications} />}
      
      {/* Examples Section */}
      {sections?.examples && sections.examples.length > 0 && <ExamplesSection examples={sections.examples} />}
      
      {/* Practice Questions Section */}
      {sections?.practiceQuestions && sections.practiceQuestions.length > 0 && <PracticeQuestionsSection questions={sections.practiceQuestions} />}
      
      {/* Quick Revision - At the end */}
      {sections?.quickRevision && sections.quickRevision.length > 0 && <QuickRevisionSection items={sections.quickRevision} />}
      
      {/* Mini Checkpoint - MCQ at end of lesson */}
      {checkpoint && (
        <MiniCheckpoint 
          checkpoint={checkpoint}
          selectedAnswer={selectedAnswer}
          showFeedback={showFeedback}
          isCorrect={isCorrect}
          onSelect={onAnswerSelect}
        />
      )}
    </div>
  );
};

/**
 * Mini Checkpoint Component
 * Shows 1 simple MCQ at end of each lesson
 */
const MiniCheckpoint = ({ checkpoint, selectedAnswer, showFeedback, isCorrect, onSelect }) => {
  if (!checkpoint) return null;
  
  return (
    <div style={styles.checkpointContainer}>
      <div style={styles.checkpointHeader}>
        <span style={styles.checkpointIcon}>🎯</span>
        <h3 style={styles.checkpointTitle}>Mini Checkpoint</h3>
      </div>
      
      <p style={styles.checkpointQuestion}>{checkpoint.question}</p>
      
      <div style={styles.checkpointOptions}>
        {checkpoint.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrectAnswer = idx === checkpoint.correctAnswer;
          let optionStyle = { ...styles.checkpointOption };
          
          if (showFeedback) {
            if (isCorrectAnswer) {
              optionStyle = { ...optionStyle, ...styles.checkpointOptionCorrect };
            } else if (isSelected && !isCorrectAnswer) {
              optionStyle = { ...optionStyle, ...styles.checkpointOptionWrong };
            }
          } else if (isSelected) {
            optionStyle = { ...optionStyle, ...styles.checkpointOptionSelected };
          }
          
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              disabled={showFeedback}
              style={optionStyle}
            >
              <span style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
              <span style={styles.optionText}>{option}</span>
              {showFeedback && isCorrectAnswer && <span style={styles.correctIcon}>✓</span>}
              {showFeedback && isSelected && !isCorrectAnswer && <span style={styles.wrongIcon}>✗</span>}
            </button>
          );
        })}
      </div>
      
      {showFeedback && (
        <div style={isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}>
          {isCorrect ? '👍 Correct! Well done!' : '❌ Not quite — try again next time!'}
        </div>
      )}
    </div>
  );
};

/**
 * Completion Screen Component
 * Shows what user learned before final quiz
 */
const CompletionScreen = ({ lessons, onTakeQuiz, onGoBack }) => {
  const completedLessons = lessons.length;
  const totalLessons = lessons.length;
  
  // Gather all key points from lessons
  const allKeyPoints = lessons.flatMap(l => l.sections?.keyPoints || []).slice(0, 5);
  
  // Calculate total time
  const totalTime = lessons.reduce((acc, l) => {
    const time = parseInt(l.estimatedTime?.replace(/\D/g, '') || '0');
    return acc + time;
  }, 0);
  
  // Motivational messages
  const messages = [
    "Great job! You've built a solid foundation.",
    "Well done! You're making excellent progress.",
    "Impressive! Your dedication is paying off.",
    "Excellent work! Keep up the momentum."
  ];
  const motivationalMessage = messages[completedLessons % messages.length];
  
  return (
    <div style={styles.completionContainer}>
      <div style={styles.completionIcon}>🎉</div>
      <h2 style={styles.completionTitle}>Lesson Complete!</h2>
      <p style={styles.completionSubtitle}>{motivationalMessage}</p>
      
      {/* Progress Summary */}
      <div style={styles.progressSummary}>
        <div style={styles.progressStat}>
          <span style={styles.progressNumber}>{completedLessons}</span>
          <span style={styles.progressLabel}>Lessons</span>
        </div>
        <div style={styles.progressDivider} />
        <div style={styles.progressStat}>
          <span style={styles.progressNumber}>{totalTime}</span>
          <span style={styles.progressLabel}>Minutes</span>
        </div>
        <div style={styles.progressDivider} />
        <div style={styles.progressStat}>
          <span style={styles.progressNumber}>{allKeyPoints.length}</span>
          <span style={styles.progressLabel}>Concepts</span>
        </div>
      </div>
      
      <div style={styles.completionHighlights}>
        {allKeyPoints.map((point, idx) => (
          <div key={idx} style={styles.completionHighlightItem}>
            <span style={styles.completionCheck}>✓</span>
            <span>{point}</span>
          </div>
        ))}
      </div>
      
      <div style={styles.completionButtons}>
        <button 
          onClick={onTakeQuiz}
          style={styles.quizButton}
        >
          Take Final Quiz 🚀
        </button>
        <button 
          onClick={onGoBack}
          style={styles.reviewButton}
        >
          Review Lessons
        </button>
      </div>
    </div>
  );
};

// ============================================
// STYLES
// ============================================

const styles = {
  // Progress bar container - TALLER
  progressBarContainer: {
    width: '100%',
    height: '10px',
    background: '#e2e8f0',
    borderRadius: '5px',
    marginBottom: '8px',
    overflow: 'hidden',
  },
  
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
    borderRadius: '5px',
    transition: 'width 0.4s ease',
  },
  
  // Section container with consistent spacing
  sectionContainer: {
    marginBottom: '36px',
    paddingBottom: '28px',
    borderBottom: '1px solid #e2e8f0',
  },
  
  // Section header with icon and title - BOLDER
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  
  sectionIcon: {
    fontSize: '22px',
  },
  
  sectionTitle: {
    margin: 0,
    color: '#1e293b',
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.3px',
  },
  
  // Summary text styles - IMPROVED
  summaryText: {
    color: '#475569',
    fontSize: '17px',
    lineHeight: '1.85',
    margin: 0,
  },
  
  // Important Concept highlight box - PURPLE with left border
  importantConceptContainer: {
    background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    borderLeft: '5px solid #9333ea',
    borderRadius: '12px',
    padding: '20px 20px 20px 24px',
    marginBottom: '36px',
    boxShadow: '0 2px 8px rgba(147, 51, 234, 0.1)',
  },
  
  importantConceptHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  
  importantIcon: {
    fontSize: '20px',
  },
  
  importantTitle: {
    color: '#9333ea',
    fontSize: '13px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  
  importantText: {
    color: '#581c87',
    fontSize: '16px',
    lineHeight: '1.75',
    margin: 0,
    fontWeight: '500',
  },
  
  // Key Points highlighted box - SOFT BLUE improved
  keyPointsContainer: {
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '36px',
  },
  
  keyPointsList: {
    margin: 0,
    paddingLeft: '24px',
  },
  
  keyPointItem: {
    marginBottom: '12px',
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#1e40af',
  },
  
  // Real-World Applications grid
  applicationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  
  applicationCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '18px',
    transition: 'all 0.2s ease',
  },
  
  applicationTitle: {
    margin: '0 0 10px 0',
    color: '#059669',
    fontSize: '15px',
    fontWeight: '700',
  },
  
  applicationDescription: {
    margin: 0,
    color: '#475569',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  
  // Code block - PREMIUM look
  exampleCard: {
    background: '#1e293b',
    borderRadius: '14px',
    overflow: 'hidden',
    marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  
  exampleHeader: {
    background: '#334155',
    padding: '12px 18px',
    borderBottom: '1px solid #475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  exampleTitle: {
    margin: 0,
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '600',
  },
  
  exampleDescription: {
    padding: '16px 18px',
    margin: 0,
    color: '#94a3b8',
    fontSize: '14px',
    fontStyle: 'italic',
    borderBottom: '1px solid #334155',
    background: '#0f172a',
  },
  
  codeBlock: {
    margin: 0,
    padding: '20px',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: '14px',
    lineHeight: '1.8',
    overflow: 'auto',
    fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
  },
  
  // Code block output
  outputContainer: {
    background: '#064e3b',
    padding: '12px 16px',
    borderTop: '1px solid #065f46',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  
  outputLabel: {
    color: '#6ee7b7',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  
  outputText: {
    color: '#a7f3d0',
    fontSize: '13px',
    fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  
  // Practice Questions box
  practiceContainer: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    border: '1px solid #fcd34d',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '28px',
  },
  
  questionsList: {
    margin: 0,
    paddingLeft: '22px',
  },
  
  questionItem: {
    marginBottom: '12px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#78350f',
  },
  
  questionNumber: {
    fontWeight: '700',
    color: '#92400e',
  },
  
  // Time indicator
  timeContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: '#f1f5f9',
    borderRadius: '20px',
    marginBottom: '16px',
    transition: 'all 0.2s ease',
  },
  
  timeIcon: {
    fontSize: '14px',
  },
  
  timeText: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '600',
  },
  
  // Quick Revision section
  quickRevisionContainer: {
    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    border: '1px solid #6ee7b7',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '28px',
  },
  
  revisionItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  
  revisionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  
  revisionCheck: {
    color: '#059669',
    fontWeight: '700',
    fontSize: '14px',
  },
  
  revisionText: {
    color: '#065f46',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  
  // Think Question section - ATTENTION-GRABBING orange
  thinkQuestionContainer: {
    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    borderLeft: '5px solid #f97316',
    borderRadius: '12px',
    padding: '20px 20px 20px 24px',
    marginBottom: '36px',
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.1)',
  },
  
  thinkQuestionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  
  thinkIcon: {
    fontSize: '20px',
  },
  
  thinkTitle: {
    color: '#ea580c',
    fontSize: '13px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  
  thinkQuestionText: {
    color: '#9a3412',
    fontSize: '16px',
    lineHeight: '1.75',
    margin: 0,
    fontWeight: '500',
  },
  
  // Copy button - IMPROVED
  copyButton: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '8px',
    padding: '6px 14px',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  
  // Completion Screen
  completionContainer: {
    textAlign: 'center',
    padding: '48px 24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  
  completionIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  
  completionTitle: {
    color: '#1e293b',
    fontSize: '32px',
    fontWeight: '800',
    margin: '0 0 8px 0',
  },
  
  completionSubtitle: {
    color: '#64748b',
    fontSize: '16px',
    margin: '0 0 24px 0',
  },
  
  // Progress Summary
  progressSummary: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '24px',
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '20px 32px',
    marginBottom: '32px',
  },
  
  progressStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  
  progressNumber: {
    color: '#4f46e5',
    fontSize: '28px',
    fontWeight: '800',
  },
  
  progressLabel: {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  
  progressDivider: {
    width: '1px',
    height: '40px',
    background: '#e2e8f0',
  },
  
  completionHighlights: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '32px',
    textAlign: 'left',
  },
  
  completionHighlightItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '15px',
  },
  
  completionCheck: {
    color: '#34d399',
    fontWeight: '700',
    fontSize: '16px',
  },
  
  completionButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  
  quizButton: {
    padding: '16px 40px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
  },
  
  quizButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(79, 70, 229, 0.5)',
  },
  
  reviewButton: {
    padding: '16px 40px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    color: '#64748b',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  
  // Main lesson content wrapper with fade-in
  lessonContent: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  
  // Mini Checkpoint styles
  checkpointContainer: {
    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
    border: '1px solid #5eead4',
    borderRadius: '14px',
    padding: '24px',
    marginTop: '32px',
    marginBottom: '28px',
  },
  
  checkpointHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  
  checkpointIcon: {
    fontSize: '22px',
  },
  
  checkpointTitle: {
    margin: 0,
    color: '#0f766e',
    fontSize: '18px',
    fontWeight: '700',
  },
  
  checkpointQuestion: {
    color: '#134e4a',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    lineHeight: '1.6',
  },
  
  checkpointOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  
  checkpointOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  
  checkpointOptionSelected: {
    borderColor: '#0d9488',
    background: '#f0fdfa',
  },
  
  checkpointOptionCorrect: {
    borderColor: '#22c55e',
    background: '#f0fdf4',
  },
  
  checkpointOptionWrong: {
    borderColor: '#ef4444',
    background: '#fef2f2',
  },
  
  optionLetter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    background: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#64748b',
  },
  
  optionText: {
    flex: 1,
    color: '#334155',
    fontSize: '15px',
  },
  
  correctIcon: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: '18px',
  },
  
  wrongIcon: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: '18px',
  },
  
  feedbackCorrect: {
    marginTop: '16px',
    padding: '12px 16px',
    background: '#dcfce7',
    borderRadius: '8px',
    color: '#166534',
    fontWeight: '600',
    fontSize: '15px',
    textAlign: 'center',
  },
  
  feedbackWrong: {
    marginTop: '16px',
    padding: '12px 16px',
    background: '#fee2e2',
    borderRadius: '8px',
    color: '#991b1b',
    fontWeight: '600',
    fontSize: '15px',
    textAlign: 'center',
  },
  
  // Sticky navigation
  stickyNav: {
    position: 'sticky',
    bottom: '0',
    background: 'white',
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)',
    zIndex: '100',
  }
};

// Local styles for Learning Progress Dashboard
/* UI_REFRESH_V2_MUTED_THEME */
const dashboardStyles = `
  .lp-content-wrapper {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: block;
    padding: 40px 24px 60px;
  }
  
  .lp-page-container {
    min-height: 100vh;
    background: #f8fafc;
  }
  
  .summary-row {
    width: 100%;
    margin-bottom: 32px;
  }
  
  .main-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    width: 100%;
    align-items: start;
  }
  
  .lp-content-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    height: fit-content;
  }

  .roadmap-card-urgent {
    background: #fffcfc;
    border: 1px solid #fee2e2;
    border-left: 5px solid #f87171;
  }
  
  .roadmap-card-success {
    background: #fafffc;
    border: 1px solid #d1fae5;
    border-left: 5px solid #34d399;
  }

  .lp-enterprise-btn {
    padding: 12px 20px;
    background: #4f46e5;
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
  }

  .lp-enterprise-btn:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }

  .btn-outline-red {
    background: #fff5f5;
    color: #e53e3e;
    border: 1px solid #feb2b2;
  }

  .btn-outline-red:hover {
    background: #fff0f0;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .lesson-section {
    animation: fadeIn 0.3s ease;
  }
  
  .lp-enterprise-btn {
    transition: all 0.2s ease;
  }
  
  .lp-enterprise-btn:active {
    transform: scale(0.98);
  }
  
  .progress-dot {
    transition: all 0.3s ease;
  }
  
  .application-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .quiz-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
  }
  
  .review-button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  
  /* Fade in animation */
  .lesson-content-fade {
    animation: fadeIn 0.4s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 1024px) {
    .main-grid { grid-template-columns: 1fr; }
  }
  
  /* Responsive adjustments for structured content */
  @media (max-width: 768px) {
    .lesson-section {
      padding: 16px;
    }
  }
`;

function LearningProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we have learning material data passed via navigation state
  const { learningMaterial, topic, technicalLevel, learningStyle, analysisId } = location.state || {};
  
  // If we have learning material data, we're in "display material" mode
  const isDisplayingMaterial = !!learningMaterial;
  
  const { userId: rawUserId } = location.state || {};
  const userId = rawUserId && rawUserId !== "anonymous" ? rawUserId : null;

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllAssessments, setShowAllAssessments] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Deduplicate analyses - keep only the highest progress for each topic
  // Handle case differences (AI, ai, Ai), extra spaces (AI ), and different score fields
  const getScore = (item) =>
    item.technicalScore ?? item.progress ?? 0;

  const uniqueAnalyses = analyses.reduce((acc, current) => {
    const currentTopic = current.topic?.trim().toLowerCase();

    const existingIndex = acc.findIndex(
      (a) => a.topic?.trim().toLowerCase() === currentTopic
    );

    if (existingIndex === -1) {
      acc.push(current);
    } else {
      if (getScore(current) > getScore(acc[existingIndex])) {
        acc[existingIndex] = current;
      }
    }

    return acc;
  }, []);

  // Format topic name for display (capitalize first letter)
  const formatTopic = (topic) => {
    if (!topic) return 'Unknown';
    return topic.trim().charAt(0).toUpperCase() + topic.trim().slice(1);
  };

  // Step-by-step learning state
  const [currentStep, setCurrentStep] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  // Save progress to localStorage
  useEffect(() => {
    if (isDisplayingMaterial && topic) {
      localStorage.setItem(`lesson_progress_${topic}`, JSON.stringify({
        currentStep,
        completedAt: new Date().toISOString()
      }));
    }
  }, [currentStep, isDisplayingMaterial, topic]);
  
  // Handle exit with confirmation
  const handleExit = () => {
    setShowExitDialog(true);
  };
  
  const confirmExit = () => {
    // Progress already saved via useEffect
    navigate("/result", { state: { topic, technicalScore: parseInt(localStorage.getItem("technicalScore") || "0") } });
  };
  
  const cancelExit = () => {
    setShowExitDialog(false);
  };
  
  // Handle PDF download - generates a PDF file from lesson content
  const handleDownloadPDF = async () => {
    // Dynamically import jsPDF to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPos = 20;
    const lineHeight = 7;
    const titleFontSize = 18;
    const subtitleFontSize = 14;
    const bodyFontSize = 11;
    
    // Helper function to add new page if needed
    const checkNewPage = (neededSpace) => {
      if (yPos + neededSpace > 280) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };
    
    // Helper function to wrap text
    const wrapText = (text, maxWidth) => {
      return doc.splitTextToSize(text, maxWidth);
    };
    
    // Title
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    const title = topic || 'Learning Material';
    doc.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // Lessons content
    lessons.forEach((lesson, index) => {
      checkNewPage(30);
      
      // Lesson title
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(`Lesson ${index + 1}: ${lesson.title}`, margin, yPos);
      yPos += 8;
      
      // Estimated time
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(`Estimated Time: ${lesson.estimatedTime || 'N/A'}`, margin, yPos);
      yPos += 10;
      
      // Summary
      if (lesson.sections?.summary) {
        checkNewPage(20);
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const summaryLines = wrapText(lesson.sections.summary, maxWidth);
        doc.text(summaryLines, margin, yPos);
        yPos += (summaryLines.length * 5) + 8;
      }
      
      // Important Concept
      if (lesson.sections?.importantConcept) {
        checkNewPage(20);
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Important Concept', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const conceptLines = wrapText(lesson.sections.importantConcept, maxWidth);
        doc.text(conceptLines, margin, yPos);
        yPos += (conceptLines.length * 5) + 8;
      }
      
      // Key Points
      if (lesson.sections?.keyPoints && lesson.sections.keyPoints.length > 0) {
        checkNewPage(15 + (lesson.sections.keyPoints.length * 5));
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Points', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        lesson.sections.keyPoints.forEach((point, i) => {
          const pointLines = wrapText(`${i + 1}. ${point}`, maxWidth - 5);
          doc.text(pointLines, margin + 3, yPos);
          yPos += (pointLines.length * 5);
        });
        yPos += 5;
      }
      
      // Examples
      if (lesson.sections?.examples && lesson.sections.examples.length > 0) {
        checkNewPage(15 + (lesson.sections.examples.length * 5));
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Examples', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        lesson.sections.examples.forEach((ex, i) => {
          const exLines = wrapText(`${i + 1}. ${ex}`, maxWidth - 5);
          doc.text(exLines, margin + 3, yPos);
          yPos += (exLines.length * 5);
        });
        yPos += 5;
      }
      
      // Practice Questions
      if (lesson.sections?.practiceQuestions && lesson.sections.practiceQuestions.length > 0) {
        checkNewPage(15 + (lesson.sections.practiceQuestions.length * 5));
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Practice Questions', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        lesson.sections.practiceQuestions.forEach((q, i) => {
          const qLines = wrapText(`${i + 1}. ${q}`, maxWidth - 5);
          doc.text(qLines, margin + 3, yPos);
          yPos += (qLines.length * 5);
        });
        yPos += 5;
      }
      
      // Quick Revision
      if (lesson.sections?.quickRevision) {
        checkNewPage(20);
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Quick Revision', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const revisionLines = wrapText(lesson.sections.quickRevision, maxWidth);
        doc.text(revisionLines, margin, yPos);
        yPos += (revisionLines.length * 5) + 10;
      }
      
      // Separator line between lessons
      if (index < lessons.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
      }
    });
    
    // Save the PDF
    const filename = `${(topic || 'learning-material').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
    doc.save(filename);
  };
  
  // Mini Checkpoint state
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Reset checkpoint when step changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [currentStep]);
  
  // Handle answer selection
  const handleAnswerSelect = (index) => {
    if (showFeedback) return; // Don't allow change after answering
    setSelectedAnswer(index);
    const currentLesson = lessons[currentStep];
    if (currentLesson?.checkpoint) {
      const correct = index === currentLesson.checkpoint.correctAnswer;
      setIsCorrect(correct);
      setShowFeedback(true);
    }
  };
  
  // Scroll to top when step changes
  const handleStepChange = (newStep) => {
    setCurrentStep(newStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle going to completion screen
  const handleShowCompletion = () => {
    setShowCompletion(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle going back to lessons from completion
  const handleBackToLessons = () => {
    setShowCompletion(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Convert learning material to lessons array when displaying material
  useEffect(() => {
    if (isDisplayingMaterial && learningMaterial) {
      const convertedLessons = convertSectionsToLessons(learningMaterial);
      setLessons(convertedLessons);
      setCurrentStep(0);
    }
  }, [isDisplayingMaterial, learningMaterial]);

  useEffect(() => { loadAnalyses(); }, [userId]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      let url = ENDPOINTS.ANALYSIS.GET_ALL;
      if (userId) url += `?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnalyses((data.analyses || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (err) { setError("Failed to load data."); }
    setLoading(false);
  };

  const continueLearning = (a) => navigate("/result", { state: { ...a, mode: "saved" } });
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

  const latestAssessment = analyses[0] || null;
  const readiness = latestAssessment ? ((latestAssessment.technicalScore || 0) * 0.6 + (latestAssessment.learningScore || 0) * 0.4) : 0;

  if (loading) return <div style={{textAlign:'center', padding:'100px'}}>Loading...</div>;

  // If we have learning material data, display it instead of the progress dashboard
  if (isDisplayingMaterial) {
    const totalSteps = lessons.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    const currentLesson = lessons[currentStep] || { 
      title: "Loading...", 
      estimatedTime: "",
      sections: { summary: "", importantConcept: "", thinkQuestion: "", keyPoints: [], realWorldApplications: [], examples: [], practiceQuestions: [], quickRevision: [] }
    };
    
    // Calculate total estimated time
    const totalEstimatedTime = lessons.reduce((acc, l) => {
      const time = parseInt(l.estimatedTime?.replace(/\D/g, '') || '0');
      return acc + time;
    }, 0);
    
    // Progress percentage
    const progressPercent = ((currentStep + 1) / totalSteps) * 100;
    
    // Show completion screen before quiz
    if (showCompletion) {
      return (
        <div className="lp-page-container">
          <style>{dashboardStyles}</style>
          <div className="lp-content-wrapper">
            <CompletionScreen 
              lessons={lessons}
              onTakeQuiz={() => navigate("/quiz", { 
                state: { 
                  topic: topic || 'Learning Material Quiz', 
                  fromMaterial: true,
                  materialTopic: topic || 'Learning Material Quiz',
                  extractedText: learningMaterial?.sections?.map(s => s.content).join('\n\n') || learningMaterial?.summary || learningMaterial?.title || ''
                } 
              })}
              onGoBack={handleBackToLessons}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="lp-page-container">
        <style>{dashboardStyles}</style>
        <div className="lp-content-wrapper">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
              📚 Learning Material
            </h1>
            {topic && <p style={{ color: '#64748b', marginTop: '8px', fontSize: '16px' }}>Topic: {topic}</p>}
            
            {/* Total Estimated Time */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '6px 14px', 
                background: '#f1f5f9', 
                borderRadius: '20px', 
                fontSize: '13px', 
                color: '#64748b',
                fontWeight: '600'
              }}>
                ⏱️ Total: ~{totalEstimatedTime} min
              </span>
              {technicalLevel && (
                <span style={{ padding: '6px 16px', background: '#e0e7ff', color: '#4338ca', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  Level: {technicalLevel}
                </span>
              )}
              {learningStyle && (
                <span style={{ padding: '6px 16px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  Style: {learningStyle}
                </span>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ 
              maxWidth: '600px', 
              margin: '0 auto',
              padding: '0 16px'
            }}>
              <div style={styles.progressBarContainer}>
                <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <span style={{ 
                  color: '#4f46e5', 
                  fontWeight: '700',
                  fontSize: '15px'
                }}>
                  🔥 {Math.round(progressPercent)}% Done — Keep Going!
                </span>
                <span style={{ 
                  color: '#94a3b8', 
                  fontSize: '13px'
                }}>
                  Step {currentStep + 1} of {totalSteps}
                </span>
              </div>
            </div>
          </div>

          {/* Learning Material Content - Structured Display */}
          <div className="lp-content-card" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
            {/* Lesson Header */}
            <div style={{ 
              marginBottom: '24px', 
              paddingBottom: '20px', 
              borderBottom: '2px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: '#4f46e5',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  Lesson {currentStep + 1}
                </span>
                <EstimatedTime time={currentLesson.estimatedTime} />
              </div>
              <h2 style={{ color: '#1e293b', margin: 0, fontSize: '24px', fontWeight: '700' }}>
                {currentLesson.title}
              </h2>
            </div>
            
            {/* Structured Lesson Content */}
            <LessonContent 
              lesson={currentLesson}
              onAnswerSelect={handleAnswerSelect}
              selectedAnswer={selectedAnswer}
              showFeedback={showFeedback}
              isCorrect={isCorrect}
            />

            {/* Navigation Buttons - Sticky at bottom */}
            <div style={{ 
              position: 'sticky',
              bottom: '0',
              background: 'white',
              padding: '20px 24px',
              marginTop: 'auto',
              borderTop: '1px solid #e2e8f0',
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
              zIndex: '100'
            }}>
              {/* Previous Button */}
              <button 
                onClick={() => handleStepChange(Math.max(0, currentStep - 1))} 
                disabled={isFirstStep}
                className="lp-enterprise-btn"
                style={{ 
                  opacity: isFirstStep ? 0.5 : 1,
                  cursor: isFirstStep ? 'not-allowed' : 'pointer',
                  background: isFirstStep ? '#94a3b8' : '#64748b'
                }}
              >
                ← Previous
              </button>
              
              {/* Next/Finish Button */}
              {isLastStep ? (
                <button 
                  onClick={() => navigate("/quiz", { 
                    state: { 
                      topic: topic || 'Learning Material Quiz', 
                      fromMaterial: true,
                      materialTopic: topic || 'Learning Material Quiz',
                      extractedText: learningMaterial?.sections?.map(s => s.content).join('\n\n') || learningMaterial?.summary || learningMaterial?.title || ''
                    } 
                  })}
                  className="lp-enterprise-btn"
                  style={{ background: '#059669' }}
                >
                  Take Final Quiz 🚀
                </button>
              ) : (
                <button 
                  onClick={() => handleStepChange(currentStep + 1)}
                  className="lp-enterprise-btn"
                  style={{ background: '#4f46e5' }}
                >
                  Next →
                </button>
              )}
              
              {/* Exit Button - Secondary style */}
              <button 
                onClick={handleExit}
                style={{
                  padding: '12px 20px',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  color: '#64748b',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; }}
                onMouseOut={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = 'white'; }}
              >
                Exit
              </button>
              
              {/* Download PDF - Only on last step */}
              {isLastStep && (
                <button 
                  onClick={handleDownloadPDF}
                  style={{
                    padding: '12px 20px',
                    background: '#0ea5e9',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  📥 Download Full PDF
                </button>
              )}
            </div>
            
            {/* Exit Confirmation Dialog */}
            {showExitDialog && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '1000',
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  maxWidth: '400px',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '20px' }}>Exit Learning?</h3>
                  <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '15px' }}>Your progress will be saved and you can resume later.</p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                      onClick={cancelExit}
                      style={{
                        padding: '12px 24px',
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        color: '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmExit}
                      style={{
                        padding: '12px 24px',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the Learning Progress Dashboard (original behavior)
  return (
    <div className="lp-page-container">
      <style>{dashboardStyles}</style>
      <div className="lp-content-wrapper">

        {/* Tab Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#1e293b' }}>📚 Learning Workspace</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', background: '#f1f5f9', padding: '6px', borderRadius: '16px', width: 'fit-content', margin: '20px auto' }}>
            <button onClick={() => setActiveTab('overview')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: activeTab === 'overview' ? 'white' : 'transparent', color: activeTab === 'overview' ? '#4f46e5' : '#64748b', fontWeight: '600', boxShadow: activeTab === 'overview' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none' }}>Overview</button>
            <button onClick={() => setActiveTab('roadmap')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: activeTab === 'roadmap' ? 'white' : 'transparent', color: activeTab === 'roadmap' ? '#4f46e5' : '#64748b', fontWeight: '600', boxShadow: activeTab === 'roadmap' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none' }}>Roadmap</button>
          </div>
        </div>

        {/* 📊 OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <div className="summary-row">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[{l:'Assessments', v:uniqueAnalyses.length, bg:'#eff6ff', c:'#1e40af'}, {l:'Trend', v:'Stable', bg:'#ecfdf5', c:'#065f46'}, {l:'Latest Result', v:`${latestAssessment?.technicalScore || 0}%`, bg:'#fffbeb', c:'#92400e'}, {l:'Learning Type', v:latestAssessment?.learningStyle || 'N/A', bg:'#f5f3ff', c:'#5b21b6'}].map((s,i) => (
                   <div key={i} className="lp-content-card" style={{ background: s.bg, border: 'none', textAlign: 'center' }}>
                     <p style={{ margin: 0, fontSize: '13px', color: s.c, opacity: 0.7 }}>{s.l}</p>
                     <h2 style={{ margin: '8px 0 0 0', color: s.c, fontSize: i===3?'17px':'28px' }}>{s.v}</h2>
                   </div>
                ))}
              </div>
            </div>

            <div className="main-grid">
              <div className="column-flex">
                <div className="lp-content-card">
                  <h3>📈 Progress Trend</h3>
                  <div style={{height: 250, marginTop: 24}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={uniqueAnalyses.slice(0,5).reverse().map(a=>({d:formatDate(a.createdAt), s:a.technicalScore}))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="d" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="s" stroke="#4f46e5" strokeWidth={4} dot={{ r: 5, fill: '#4f46e5' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lp-content-card">
                  <h3>📋 History</h3>
                  <div style={{ marginTop: 16 }}>
                    {uniqueAnalyses.slice(0, showAllAssessments ? uniqueAnalyses.length : 1).map((a, i) => (
                      <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '700' }}>{formatTopic(a.topic)}</span>
                          <span style={{ color: '#4f46e5', fontWeight: '800' }}>{a.technicalScore}%</span>
                        </div>
                        <button onClick={() => continueLearning(a)} className="lp-enterprise-btn" style={{ marginTop: 12, padding: '8px' }}>View Detail</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="column-flex">
                <div className="lp-content-card" style={{ textAlign: 'center' }}>
                  <h3>🎯 Career Readiness</h3>
                  <div style={{ fontSize: '64px', fontWeight: '900', color: '#1e293b', margin: '16px 0' }}>{readiness.toFixed(0)}%</div>
                  <div style={{ padding: '6px 16px', background: '#dcfce7', color: '#166534', borderRadius: '20px', display: 'inline-block', fontSize: '13px', fontWeight: '700' }}>JOB READY</div>
                </div>
                <div className="lp-content-card">
                  <h3>📊 Quick Stats</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Source</span><strong>{latestAssessment?.sourceType}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Joined</span><strong>{formatDate(uniqueAnalyses[uniqueAnalyses.length-1]?.createdAt)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f0fdf4', borderRadius: '12px' }}><span style={{ color: '#166534' }}>Last Active</span><strong style={{ color: '#166534' }}>{formatDate(latestAssessment?.createdAt)}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 🗺️ ROADMAP TAB */}
        {activeTab === 'roadmap' && uniqueAnalyses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
             
             {/* 🚨 Red: Focus Areas */}
             {uniqueAnalyses.filter(a => (a.technicalScore || 0) < 45).length > 0 && (
                <div>
                   <h3 style={{ color: '#dc2626', marginBottom: '16px' }}>🚨 Foundational Skills to Master</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                      {uniqueAnalyses.filter(a => (a.technicalScore || 0) < 45).map((a, idx) => (
                        <div key={idx} className="lp-content-card roadmap-card-urgent">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, color: '#991b1b' }}>{formatTopic(a.topic)}</h4>
                              <span style={{ color: '#dc2626', fontWeight: '800' }}>{a.technicalScore}%</span>
                           </div>
                           <p style={{ color: '#7f1d1d', fontSize: '14px', margin: '16px 0', opacity: 0.8 }}>Master basics of {formatTopic(a.topic)} through the course below.</p>
                           <div style={{ display: 'flex', gap: '12px' }}>
                              <a href={`https://www.youtube.com/results?search_query=${formatTopic(a.topic)}+full+course`} target="_blank" className="lp-enterprise-btn" style={{ flex: 2 }}>📺 Course</a>
                              <button onClick={() => continueLearning(a)} className="lp-enterprise-btn btn-outline-red" style={{ flex: 1 }}>🔄 Retake</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {/* ✅ Green: Mastered Areas */}
             {uniqueAnalyses.filter(a => (a.technicalScore || 0) >= 45).length > 0 && (
                <div>
                   <h3 style={{ color: '#059669', marginBottom: '16px' }}>🏆 Proficiency Achieved</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                      {uniqueAnalyses.filter(a => (a.technicalScore || 0) >= 45).map((a, idx) => (
                        <div key={idx} className="lp-content-card roadmap-card-success">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, color: '#064e3b' }}>{formatTopic(a.topic)}</h4>
                              <span style={{ color: '#059669', fontWeight: '800' }}>{a.technicalScore}%</span>
                           </div>
                           <p style={{ color: '#064e3b', fontSize: '14px', margin: '16px 0', opacity: 0.8 }}>Excellent grasp! Challenge yourself with advanced projects.</p>
                           <button onClick={() => navigate("/pdf-chat")} className="lp-enterprise-btn" style={{ background: '#059669' }}>🔥 Advanced Practice</button>
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningProgressPage;
