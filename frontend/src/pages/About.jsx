function About() {

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Intelligent Personalized Learning Platform</h1>
          <p className="page-subtitle">
            This platform analyzes resumes or GitHub profiles to generate personalized learning paths, 
            track progress, and provide AI-powered assistance.
          </p>
        </div>

        {/* Key Features */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Key Features</h2>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '24px', minWidth: '32px', textAlign: 'center' }}>📄</div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Resume / GitHub Analysis
                  </h4>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    Upload your resume or connect your GitHub profile for intelligent skill analysis and personalized recommendations.
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '24px', minWidth: '32px', textAlign: 'center' }}>🗺️</div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Personalized Learning Roadmap
                  </h4>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    Get customized learning paths tailored to your skills, experience level, and career goals.
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '24px', minWidth: '32px', textAlign: 'center' }}>💬</div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    PDF Chat for Document Interaction
                  </h4>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    Interact with your documents through AI-powered chat. Ask questions and get instant answers.
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '24px', minWidth: '32px', textAlign: 'center' }}>📊</div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Progress Tracking Dashboard
                  </h4>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    Monitor your learning journey with comprehensive analytics and progress visualization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Our Mission</h2>
          </div>
          <div className="card" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: '1.8', margin: 0 }}>
              We believe that <span style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-semibold)' }}>efficient learning</span> should be accessible to everyone. 
              Our mission is to help learners upskill efficiently by providing <span style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-semibold)' }}>personalized, 
              data-driven learning experiences</span> that adapt to their unique needs and goals. 
              Whether you're a fresh graduate looking to enter the tech industry or a seasoned professional 
              seeking to expand your skillset, we're here to guide your learning journey with the power of AI.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
