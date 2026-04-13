import { coerceDisplayString, coerceExampleRecord } from "./coerceDisplayString";

export const convertSectionsToLessons = (learningMaterial) => {
  const lessons = [];

  if (learningMaterial?.overview) {
    lessons.push({
      title: "Overview",
      estimatedTime: "5 min",
      sections: {
        summary: coerceDisplayString(learningMaterial.overview),
        keyPoints: learningMaterial.keyConcepts
          ? learningMaterial.keyConcepts
              .map((kc) => {
                const p = coerceDisplayString(kc?.point);
                const e = coerceDisplayString(kc?.explanation);
                if (p && e) return `${p}: ${e}`;
                return p || e;
              })
              .filter(Boolean)
          : (learningMaterial.learningTips || learningMaterial.bestPractices || []).map((x) =>
              coerceDisplayString(x)
            ),
        realWorldApplications: learningMaterial.applications
          ? learningMaterial.applications.map((app) => ({
              title: coerceDisplayString(app?.title),
              description: coerceDisplayString(app?.description),
            }))
          : [],
        examples: learningMaterial.examples
          ? learningMaterial.examples.map((ex) => ({
              title: coerceDisplayString(ex?.title),
              description: coerceDisplayString(ex?.explanation || ex?.description),
              code: coerceDisplayString(ex?.code || ex?.codeExample),
              output: coerceDisplayString(ex?.output),
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
          if (typeof example === "string") {
            return { title: "Example", description: example, code: "", output: "" };
          }
          const r = coerceExampleRecord(example);
          return {
            title: r.title || "Example",
            description: r.description,
            code: r.code,
            output: r.output,
          };
        });
      } else if (section.codeExample) {
        examples = [
          {
            title: "Code Example",
            description: coerceDisplayString(section.realWorldExample || ""),
            code: coerceDisplayString(section.codeExample),
            output: "",
          },
        ];
      }

      let keyPoints = [];
      if (Array.isArray(section.keyPoints)) {
        keyPoints = section.keyPoints
          .map((kp) => (typeof kp === "string" ? kp : coerceDisplayString(kp)))
          .filter(Boolean);
      }

      const summaryParts = [];
      if (section.conceptExplanation) {
        summaryParts.push(coerceDisplayString(section.conceptExplanation));
      }
      if (section.explanation || section.content) {
        summaryParts.push(coerceDisplayString(section.explanation || section.content));
      }
      if (Array.isArray(section.useCases) && section.useCases.length) {
        summaryParts.push(
          "Use cases:\n" +
            section.useCases
              .map((u, i) => `${i + 1}. ${coerceDisplayString(u)}`)
              .join("\n\n")
        );
      }
      const explanation = summaryParts.join("\n\n") || "";

      const practiceQuestions = Array.isArray(section.practiceQuestions)
        ? section.practiceQuestions.map((q) => coerceDisplayString(q)).filter(Boolean)
        : [];

      const keyPointsWithPractice = [
        ...keyPoints,
        ...practiceQuestions.map((q, i) => `Practice ${i + 1}: ${q}`),
      ];

      lessons.push({
        title: section.heading || section.title || `Section ${lessons.length + 1}`,
        estimatedTime: section.estimatedTime || "15 min",
        sections: {
          summary: explanation,
          keyPoints: keyPointsWithPractice,
          realWorldApplications: section.realWorldExample
            ? [{ title: "Real-World Use", description: coerceDisplayString(section.realWorldExample) }]
            : section.applications
              ? section.applications.map((app) => ({
                  title: coerceDisplayString(app.title || "Application"),
                  description: coerceDisplayString(app.description || app),
                }))
              : [],
          examples: examples,
          practiceQuestions,
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
          keyPoints: validApps.map((app) => coerceDisplayString(app.title || "")).filter(Boolean),
          realWorldApplications: validApps.map((app) => ({
            title: coerceDisplayString(app.title),
            description: coerceDisplayString(app.description),
          })),
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
          examples: validExamples.map((ex) => {
            const r = coerceExampleRecord(ex);
            return {
              title: r.title || coerceDisplayString(ex.title),
              description: r.description,
              code: r.code,
              output: r.output,
            };
          }),
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
        keyPoints: Array.isArray(learningMaterial.commonMistakes)
          ? learningMaterial.commonMistakes.map((m) => coerceDisplayString(m))
          : [],
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
        keyPoints: Array.isArray(learningMaterial.bestPractices)
          ? learningMaterial.bestPractices.map((m) => coerceDisplayString(m))
          : [],
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
        summary:
          coerceDisplayString(learningMaterial.miniProject.description) ||
          "Build a mini project to practice what you've learned:",
        keyPoints: (learningMaterial.miniProject.steps || []).map((s) => coerceDisplayString(s)),
        realWorldApplications: [
          {
            title: coerceDisplayString(learningMaterial.miniProject.title || "Project"),
            description: coerceDisplayString(learningMaterial.miniProject.description || ""),
          },
        ],
        examples: [],
        practiceQuestions: (learningMaterial.miniProject.steps || []).map((s) => coerceDisplayString(s)),
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
          keyPoints: validIQs.map(
            (iq) => `Q: ${coerceDisplayString(iq.question)}\nA: ${coerceDisplayString(iq.answer)}`
          ),
          realWorldApplications: [],
          examples: [],
          practiceQuestions: [],
        },
      });
    }
  }

  return lessons;
};
