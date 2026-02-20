function About() {
  const styles = {
    container: {
      maxWidth: "900px",
      margin: "0 auto",
      padding: "40px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    header: {
      textAlign: "center",
      marginBottom: "40px",
    },
    title: {
      fontSize: "36px",
      fontWeight: "bold",
      color: "#1E293B",
      marginBottom: "16px",
    },
    subtitle: {
      fontSize: "18px",
      color: "#475569",
      maxWidth: "600px",
      margin: "0 auto",
      lineHeight: "1.6",
    },
    section: {
      marginBottom: "32px",
    },
    sectionTitle: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#1E293B",
      marginBottom: "20px",
      paddingBottom: "8px",
      borderBottom: "2px solid #E2E8F0",
    },
    card: {
      background: "#FFFFFF",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      border: "1px solid #E2E8F0",
    },
    cardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "16px",
    },
    featureItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "16px",
      background: "#F8FAFC",
      borderRadius: "8px",
      border: "1px solid #E2E8F0",
    },
    featureIcon: {
      fontSize: "24px",
      minWidth: "32px",
      textAlign: "center",
    },
    featureTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1E293B",
      marginBottom: "4px",
    },
    featureDescription: {
      fontSize: "14px",
      color: "#475569",
      lineHeight: "1.5",
    },
    missionText: {
      fontSize: "16px",
      color: "#475569",
      lineHeight: "1.8",
      textAlign: "center",
      maxWidth: "700px",
      margin: "0 auto",
    },
    highlight: {
      color: "#2563EB",
      fontWeight: "600",
    },
  };

  const features = [
    {
      icon: "📄",
      title: "Resume / GitHub Analysis",
      description: "Upload your resume or connect your GitHub profile for intelligent skill analysis and personalized recommendations.",
    },
    {
      icon: "🗺️",
      title: "Personalized Learning Roadmap",
      description: "Get customized learning paths tailored to your skills, experience level, and career goals.",
    },
    {
      icon: "💬",
      title: "PDF Chat for Document Interaction",
      description: "Interact with your documents through AI-powered chat. Ask questions and get instant answers.",
    },
    {
      icon: "📊",
      title: "Progress Tracking Dashboard",
      description: "Monitor your learning journey with comprehensive analytics and progress visualization.",
    },
  ];


  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Intelligent Personalized Learning Platform</h1>
        <p style={styles.subtitle}>
          This platform analyzes resumes or GitHub profiles to generate personalized learning paths, 
          track progress, and provide AI-powered assistance.
        </p>
      </div>

      {/* Key Features */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Key Features</h2>
        <div style={styles.cardGrid}>
          {features.map((feature, index) => (
            <div key={index} style={styles.featureItem}>
              <div style={styles.featureIcon}>{feature.icon}</div>
              <div>
                <div style={styles.featureTitle}>{feature.title}</div>
                <div style={styles.featureDescription}>{feature.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission Statement */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Our Mission</h2>
        <div style={styles.card}>
          <p style={styles.missionText}>
            We believe that <span style={styles.highlight}>efficient learning</span> should be accessible to everyone. 
            Our mission is to help learners upskill efficiently by providing <span style={styles.highlight}>personalized, 
            data-driven learning experiences</span> that adapt to their unique needs and goals. 
            Whether you're a fresh graduate looking to enter the tech industry or a seasoned professional 
            seeking to expand your skillset, we're here to guide your learning journey with the power of AI.
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;
