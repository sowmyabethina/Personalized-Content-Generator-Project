export const convertSectionsToLessons = (learningMaterial) => {
  const lessons = [];

  if (learningMaterial?.summary) {
    lessons.push({
      title: "Overview",
      estimatedTime: "5 min",
      sections: {
        summary: learningMaterial.summary,
        keyPoints: learningMaterial.learningTips || [],
        realWorldApplications: [],
        examples: [],
        practiceQuestions: [],
      },
    });
  }

  if (Array.isArray(learningMaterial?.sections)) {
    learningMaterial.sections.forEach((section) => {
      const examples = Array.isArray(section.examples)
        ? section.examples.map((example) => ({
            title: example.title || "Example",
            description: example.description || "",
            code: example.code || "",
          }))
        : [];

      lessons.push({
        title: section.title || `Section ${lessons.length + 1}`,
        estimatedTime: "10 min",
        sections: {
          summary: section.content || "",
          keyPoints: section.keyPoints || [],
          realWorldApplications: [],
          examples,
          practiceQuestions: [],
        },
      });
    });
  }

  if (learningMaterial?.learningTips?.length > 0) {
    lessons.push({
      title: "Learning Tips",
      estimatedTime: "3 min",
      sections: {
        summary: "Helpful tips to enhance your learning experience:",
        keyPoints: learningMaterial.learningTips,
        realWorldApplications: [],
        examples: [],
        practiceQuestions: [],
      },
    });
  }

  if (learningMaterial?.finalProject) {
    lessons.push({
      title: "Final Project",
      estimatedTime: "20 min",
      sections: {
        summary: learningMaterial.finalProject.description || "Complete this project to practice what you've learned.",
        keyPoints: [],
        realWorldApplications: [
          {
            title: learningMaterial.finalProject.title || "Project",
            description: learningMaterial.finalProject.description || "",
          },
        ],
        examples: [],
        practiceQuestions: learningMaterial.finalProject.steps || [],
      },
    });
  }

  return lessons;
};
