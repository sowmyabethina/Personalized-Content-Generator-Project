/**
 * useLearningMaterial Hook
 * Custom hook for LearningMaterialPage state management
 */

import { useState, useEffect, useCallback } from 'react';
import * as learningService from '../services/learningService';


export const useLearningMaterial = (userId) => {
  // ========== STATE ==========
  const [topic, setTopic] = useState('');
  const [learningStyle, setLearningStyle] = useState('reading');
  const [technicalLevel, setTechnicalLevel] = useState('intermediate');
  const [learningMaterial, setLearningMaterial] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  
  // ========== ANALYSES ==========
  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await learningService.fetchAnalyses(userId);
      // Sort by createdAt with null safety
      const sorted = (data || []).sort((a, b) => {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setAnalyses(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  // Load on mount
  useEffect(() => {
    if (userId) {
      loadAnalyses();
    }
  }, [userId, loadAnalyses]);
  
  // ========== LEARNING MATERIAL ==========
  const generateMaterial = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const material = await learningService.generateLearningMaterial(
        topic,
        technicalLevel,
        learningStyle
      );
      setLearningMaterial(material);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [topic, technicalLevel, learningStyle]);
  
  // ========== SELECTED ANALYSIS ==========
  const handleSelectAnalysis = useCallback(async (id) => {
    if (!id) {
      setSelectedAnalysis(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await learningService.getAnalysisById(id);
      setSelectedAnalysis(analysis);
      
      if (analysis?.technicalLevel) {
        setTechnicalLevel(analysis.technicalLevel);
      }
      if (analysis?.learningStyle) {
        setLearningStyle(analysis.learningStyle);
      }
      if (analysis?.topic) {
        setTopic(analysis.topic);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // ========== UPDATE ANALYSIS ==========
  const handleUpdateAnalysis = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      await learningService.updateAnalysis(id, updateData);
      await loadAnalyses(); // Refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadAnalyses]);
  
  // ========== LAST ACTIVE ==========
  const updateLastActive = useCallback(async (id) => {
    try {
      await learningService.updateLastActive(id);
    } catch (err) {
      console.error('Failed to update last active:', err);
    }
  }, []);
  
  // ========== SAVE ANALYSIS ==========
  const handleSaveAnalysis = useCallback(async (analysisData) => {
    setLoading(true);
    setError(null);
    
    try {
      await learningService.saveAnalysis({
        ...analysisData,
        topic: analysisData.topic || topic,
        technicalLevel: analysisData.technicalLevel || technicalLevel,
        learningStyle: analysisData.learningStyle || learningStyle
      });
      await loadAnalyses(); // Refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [topic, technicalLevel, learningStyle, loadAnalyses]);
  
  // ========== DOWNLOAD PDF ==========
  const downloadPdf = useCallback(async (content) => {
    setLoading(true);
    setError(null);
    
    try {
      await learningService.downloadMaterialPdf(content, topic);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [topic]);
  
  // ========== CLEAR ==========
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const clearMaterial = useCallback(() => {
    setLearningMaterial(null);
    setTopic('');
  }, []);
  
  // ========== RETURN ==========
  return {
    // State
    topic,
    setTopic,
    learningStyle,
    setLearningStyle,
    technicalLevel,
    setTechnicalLevel,
    learningMaterial,
    analyses,
    loading,
    error,
    selectedAnalysis,
    
    // Actions
    generateMaterial,
    handleSelectAnalysis,
    handleUpdateAnalysis,
    handleSaveAnalysis,
    updateLastActive,
    downloadPdf,
    loadAnalyses,
    clearError,
    clearMaterial
  };
};

export default useLearningMaterial;