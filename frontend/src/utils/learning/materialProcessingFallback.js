export const convertSectionsToLessons = (learningMaterial) => {
  const lessons = [];

  if (learningMaterial?.overview) {
    lessons.push({
      title: "Overview",
      estimatedTime: "5 min",
      sections: {
        summary: learningMaterial.overview,
        keyPoints: learningMaterial.keyConcepts 
          ? learningMaterial.keyConcepts.map(kc => kc.point || kc.explanation).filter(Boolean)
          : learningMaterial.learningTips || learningMaterial.bestPractices || [],
        realWorldApplications: learningMaterial.applications 
          ? learningMaterial.applications.map(app => ({ title: app.title, description: app.description }))
          : [],
        examples: learningMaterial.examples 
          ? learningMaterial.examples.map(ex => ({
              title: ex.title,
              description: ex.explanation,
              code: ex.code
            }))
          : [],
        practiceQuestions: [],
      },
    });
  }

  if (Array.isArray(learningMaterial?.sections)) {
    learningMaterial.sections.forEach((section) => {
      let examples = [];
      
      if (Array.isArray(section.examples)) {
        examples = section.examples.map((example) => {
          if (typeof example === 'string') {
            return { title: "Example", description: example, code: "" };
          }
          return {
            title: example?.title || "Example",
            description: example?.description || "",
            code: example?.code || example?.codeExample || "",
          };
        });
      } else if (section.codeExample) {
        examples = [{
          title: "Code Example",
          description: section.realWorldExample || "",
          code: section.codeExample
        }];
      }

      let keyPoints = [];
      if (Array.isArray(section.keyPoints)) {
        keyPoints = section.keyPoints.filter(kp => typeof kp === 'string');
      }

      const explanation = section.explanation || section.content || "";

      lessons.push({
        title: section.heading || section.title || `Section ${lessons.length + 1}`,
        estimatedTime: section.estimatedTime || "15 min",
        sections: {
          summary: explanation,
          keyPoints: keyPoints,
          realWorldApplications: section.realWorldExample 
            ? [{ title: "Real-World Use", description: section.realWorldExample }]
            : section.applications 
              ? section.applications.map(app => ({ title: app.title || "Application", description: app.description || app }))
              : [],
          examples: examples,
          practiceQuestions: section.practiceQuestions || [],
        },
      });
    });
  }

  if (learningMaterial?.applications?.length > 0) {
    const validApps = learningMaterial.applications.filter(
      app => app && (app.title || app.description) && typeof app === 'object'
    );
    if (validApps.length > 0) {
      lessons.push({
        title: "Real-World Applications",
        estimatedTime: "10 min",
        sections: {
          summary: "Understanding where this technology is used in the real world:",
          keyPoints: validApps.map(app => app.title || "").filter(Boolean),
          realWorldApplications: validApps.map(app => ({ title: app.title, description: app.description })),
          examples: [],
          practiceQuestions: [],
        },
      });
    }
  }

  if (learningMaterial?.examples?.length > 0) {
    const validExamples = learningMaterial.examples.filter(ex => ex && ex.title);
    if (validExamples.length > 0) {
      lessons.push({
        title: "Practical Examples",
        estimatedTime: "15 min",
        sections: {
          summary: "Hands-on examples to reinforce your learning:",
          keyPoints: [],
          realWorldApplications: [],
          examples: validExamples.map(ex => ({
            title: ex.title,
            description: ex.explanation,
            code: ex.code
          })),
          practiceQuestions: [],
        },
      });
    }
  }

  if (learningMaterial?.commonMistakes?.length > 0) {
    lessons.push({
      title: "Common Mistakes to Avoid",
      estimatedTime: "5 min",
      sections: {
        summary: "Learn from these common mistakes that developers often make when learning this topic:",
        keyPoints: learningMaterial.commonMistakes,
        realWorldApplications: [],
        examples: [],
        practiceQuestions: [],
      },
    });
  }

  if (learningMaterial?.bestPractices?.length > 0) {
    lessons.push({
      title: "Best Practices",
      estimatedTime: "5 min",
      sections: {
        summary: "Follow these industry-standard best practices:",
        keyPoints: learningMaterial.bestPractices,
        realWorldApplications: [],
        examples: [],
        practiceQuestions: [],
      },
    });
  }

  if (learningMaterial?.miniProject) {
    lessons.push({
      title: "Mini Project",
      estimatedTime: "30 min",
      sections: {
        summary: learningMaterial.miniProject.description || "Build a mini project to practice what you've learned:",
        keyPoints: learningMaterial.miniProject.steps || [],
        realWorldApplications: [
          {
            title: learningMaterial.miniProject.title || "Project",
            description: learningMaterial.miniProject.description || ""
          }
        ],
        examples: [],
        practiceQuestions: learningMaterial.miniProject.steps || [],
      },
    });
  }

  if (learningMaterial?.interviewQuestions?.length > 0) {
    const validIQs = learningMaterial.interviewQuestions.filter(iq => iq && iq.question);
    if (validIQs.length > 0) {
      lessons.push({
        title: "Interview Preparation",
        estimatedTime: "10 min",
        sections: {
          summary: "Practice these common interview questions:",
          keyPoints: validIQs.map(iq => `Q: ${iq.question}\nA: ${iq.answer}`),
          realWorldApplications: [],
          examples: [],
          practiceQuestions: [],
        },
      });
    }
  }

  return lessons;
};
