// Sample structured lessons for demonstration
export const SAMPLE_LESSONS = [
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
      ]
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
      ]
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

// Styles object
export const styles = {
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
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e2e8f0',
  },
  
  // Section header - clean minimal style
  sectionHeader: {
    marginBottom: '8px',
    borderBottom: '1px solid #eee',
    paddingBottom: '4px',
  },
  
  sectionTitle: {
    margin: 0,
    color: '#1e293b',
    fontSize: '18px',
    fontWeight: '600',
  },
  
  // Summary text styles - IMPROVED
  summaryText: {
    color: '#475569',
    fontSize: '17px',
    lineHeight: '1.85',
    margin: 0,
  },
  
  // Important Concept highlight box - PURPLE with left border (Card UI)
  importantConceptContainer: {
    background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    borderLeft: '5px solid #9333ea',
    borderRadius: '12px',
    padding: '20px 20px 20px 24px',
    marginBottom: '28px',
    boxShadow: '0 2px 8px rgba(147, 51, 234, 0.1)',
  },
  
  importantConceptHeader: {
    marginBottom: '8px',
    borderBottom: '1px solid #eee',
    paddingBottom: '4px',
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
    marginBottom: '8px',
    borderBottom: '1px solid #eee',
    paddingBottom: '4px',
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

// Dashboard CSS styles
export const dashboardStyles = `
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
  
  /* Smooth fade-in transition for sections */
  .section-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
