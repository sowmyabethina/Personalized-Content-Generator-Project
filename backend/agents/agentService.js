console.log("🧠 agentService.js file loaded by Node");

/**
 * Agent Service - AI Academic Study Assistant
 * 
 * Provides academic tutoring capabilities:
 * - Answer doubts
 * - Summarize concepts
 * - Suggest learning plans
 */

import OpenAI from 'openai';

console.log("🤖 Agent Service module loaded");

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are an Academic Study Assistant for students. Your role is to help students learn effectively by:

1. Answering doubts and questions on any subject
2. Summarizing complex concepts in simple terms
3. Suggesting personalized learning plans
4. Explaining topics with examples
5. Helping with exam preparation

Be friendly, encouraging, and patient. Use simple language suitable for students. When appropriate, provide examples and practical applications.`;

/**
 * Fallback Tutor - Rule-based educational explanation
 * Used when OpenAI API fails (quota, network, or 429 errors)
 * @param {string} message - User's question or request
 * @returns {string} Educational explanation based on topic
 */
function fallbackTutor(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check for recursion topic
  if (lowerMessage.includes("recursion")) {
    return `📚 **Recursion Explained**\n\nRecursion is a programming concept where a function calls itself to solve a problem by breaking it down into smaller, similar subproblems.\n\n**Key Components:**\n1. **Base Case**: The condition that stops the recursion\n2. **Recursive Case**: The part where the function calls itself\n\n**Example: Factorial**\n\nThe factorial of n (n!) is the product of all positive integers from 1 to n.\n\n\nfunction factorial(n) {\n  // Base case\n  if (n <= 1) {\n    return 1;\n  }\n  // Recursive case\n  return n * factorial(n - 1);\n}\n\n// Example: factorial(5) = 5 * 4 * 3 * 2 * 1 = 120\n\n**How it works:**\n- factorial(5) calls factorial(4)\n- factorial(4) calls factorial(3)\n- factorial(3) calls factorial(2)\n- factorial(2) calls factorial(1)\n- factorial(1) returns 1 (base case)\n- The results multiply back up: 1→2→6→24→120\n\n**Remember:** Always include a base case to prevent infinite recursion!`;
  }
  
  // Check for array topic
  if (lowerMessage.includes("array")) {
    return `📚 **Arrays Explained**\n\nAn array is a data structure that stores a collection of elements of the same type in contiguous memory locations.\n\n**Key Concepts:**\n\n**1. Indexing:**\n- Arrays use zero-based indexing\n- The first element is at index 0\n- The last element is at index (length - 1)\n\n**Example:**\n\nconst numbers = [10, 20, 30, 40, 50];\n\nnumbers[0];  // 10 (first element)\nnumbers[2];  // 30 (third element)\nnumbers[4];  // 50 (last element)\n\n**2. Common Operations:**\n- Access: O(1) - very fast!\n- Search: O(n) - need to check each element\n- Insert/Delete: O(n) - may need to shift elements\n\n**3. Use Cases:**\n- Storing lists of related items\n- Maintaining ordered collections\n- Implementing other data structures (stacks, queues)\n\n**Tip:** Arrays are perfect when you need fast access to elements by their position!`;
  }
  
  // Check for stack topic
  if (lowerMessage.includes("stack")) {
    return `📚 **Stack Data Structure Explained**\n\nA stack is a linear data structure that follows the LIFO (Last In, First Out) principle. Think of it like a stack of plates - you add and remove from the top.\n\n**Key Operations:**\n\n**1. push(element)** - Add element to top\n**2. pop()** - Remove and return top element\n**3. peek()** - View top element without removing\n**4. isEmpty()** - Check if stack is empty\n\n**Example with push/pop:**\n\nconst stack = [];\n\n// Push elements onto stack\nstack.push("Book 1");  // stack: ["Book 1"]\nstack.push("Book 2");  // stack: ["Book 1", "Book 2"]\nstack.push("Book 3");  // stack: ["Book 1", "Book 2", "Book 3"]\n\n// Pop elements from stack (LIFO order)\nstack.pop();  // returns "Book 3", stack: ["Book 1", "Book 2"]\nstack.pop();  // returns "Book 2", stack: ["Book 1"]\nstack.pop();  // returns "Book 1", stack: []\n\n**Real-world Applications:**\n- Undo/Redo functionality in editors\n- Browser back button history\n- Function call management in programming\n- Expression evaluation (parentheses matching)\n\n**Remember:** Stack is like a vertical pile - last item added is the first one removed!`;
  }
  
  // Check for queue topic
  if (lowerMessage.includes("queue")) {
    return `📚 **Queue Data Structure Explained**\n\nA queue is a linear data structure that follows the FIFO (First In, First Out) principle. Think of it like a line at a store - the first person in line gets served first.\n\n**Key Operations:**\n\n**1. enqueue(element)** - Add element to the back\n**2. dequeue()** - Remove and return front element\n**3. front()** - View front element without removing\n**4. isEmpty()** - Check if queue is empty\n\n**Example:**\n\nconst queue = [];\n\n// Enqueue elements (add to back)\nqueue.enqueue("Customer 1");  // queue: ["Customer 1"]\nqueue.enqueue("Customer 2");  // queue: ["Customer 1", "Customer 2"]\nqueue.enqueue("Customer 3");  // queue: ["Customer 1", "Customer 2", "Customer 3"]\n\n// Dequeue elements (remove from front - FIFO)\nqueue.dequeue();  // returns "Customer 1", queue: ["Customer 2", "Customer 3"]\nqueue.dequeue();  // returns "Customer 2", queue: ["Customer 3"]\nqueue.dequeue();  // returns "Customer 3", queue: []\n\n**Real-world Applications:**\n- Print job spooling\n- Customer service call centers\n- Task scheduling in operating systems\n- Breadth-first search (BFS) in graphs\n- Message queues in web servers\n\n**Remember:** Queue is like a line - first person in line gets served first!`;
  }
  
  // Default fallback for any other topic
  return `📚 **Learning Support**\n\nI'm currently operating in offline mode, but I'm here to help you learn!\n\n**Study Tips:**\n\n1. **Break Down Concepts**: Divide complex topics into smaller, manageable parts\n\n2. **Practice Active Learning**:\n   - Try coding examples yourself\n   - Solve practice problems\n   - Teach the concept to someone else\n\n3. **Use Multiple Resources**:\n   - Watch video tutorials\n   - Read documentation\n   - Join study groups\n\n4. **Remember Key Patterns**:\n   - Look for similarities between concepts\n   - Understand "why" not just "how"\n   - Connect new knowledge to what you already know\n\n5. **Debugging Strategy**:\n   - Read error messages carefully\n   - Use console.log() to trace values\n   - Check one thing at a time\n\n**Keep Learning!** Even without AI, you can make progress by being systematic and patient. Would you like me to explain any specific programming concept? Try asking about: arrays, stacks, queues, recursion, loops, or functions!`;
}

/**
 * Process user message and return AI response
 * @param {string} message - User's question or request
 * @param {string} userId - Optional user ID for context
 * @returns {Promise<Object>} AI response
 */
export async function processMessage(message, userId = null) {
  console.log("📝 AgentService.processMessage called with:", message);
  console.log("📝 User ID:", userId);
  
  // Check if OpenAI is configured
  if (!openai) {
    console.log("⚠️ OpenAI not configured, using fallback tutor");
    console.log("OpenAI unavailable — using fallback tutor");
    return {
      success: true,
      message: fallbackTutor(message),
      service: "AI Academic Assistant",
      isFallback: true
    };
  }

  try {
    console.log("🚀 Calling OpenAI API...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: SYSTEM_PROMPT 
        },
        { 
          role: "user", 
          content: message 
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
    
    console.log("✅ OpenAI response received, length:", response.length);
    
    return {
      success: true,
      message: response,
      service: "AI Academic Assistant",
      isFallback: false
    };
    
  } catch (error) {
    console.error("❌ AgentService error:", error.message);
    
    // Check for specific error types that should trigger fallback
    const isRateLimit = error.status === 429;
    const isNetworkError = error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';
    const isTimeout = error.message?.includes('timeout');
    
    // Use fallback for any API failure
    if (isRateLimit || isNetworkError || isTimeout || error.message) {
      console.log("OpenAI unavailable — using fallback tutor");
      
      return {
        success: true,
        message: fallbackTutor(message),
        service: "AI Academic Assistant",
        isFallback: true
      };
    }
    
    // For any other errors, still use fallback (never return failure)
    console.log("OpenAI unavailable — using fallback tutor");
    
    return {
      success: true,
      message: fallbackTutor(message),
      service: "AI Academic Assistant",
      isFallback: true
    };
  }
}

/**
 * Get service status
 * @returns {Object} Service status
 */
export function getStatus() {
  const isConfigured = !!openai;
  
  return {
    status: isConfigured ? "Agent Active" : "Agent Inactive",
    service: "AI Academic Assistant",
    openaiConfigured: isConfigured,
    capabilities: [
      "Answer doubts",
      "Summarize concepts", 
      "Suggest learning plans",
      "Explain topics with examples"
    ]
  };
}

export default { processMessage, getStatus };
