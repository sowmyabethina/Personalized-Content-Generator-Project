// Component-specific styles for Learning Material Page
// These styles are used by the LearningMaterialPage component

export const styles = {
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
};

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
  
  .lesson-content-fade {
    animation: fadeIn 0.4s ease;
  }

  @media (max-width: 1024px) {
    .main-grid { grid-template-columns: 1fr; }
  }
  
  @media (max-width: 768px) {
    .lesson-section {
      padding: 16px;
    }
  }
`;