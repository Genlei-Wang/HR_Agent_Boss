/**
 * 候选人信息提取器
 */
import { DOM_SELECTORS, getCandidateId } from './dom-selectors';
import type { CandidateInfo } from '../shared/types';

/**
 * 候选人信息提取器
 */
export class CandidateExtractor {
  /**
   * 从候选人卡片中提取基本信息
   */
  static extractFromCard(cardElement: HTMLElement): CandidateInfo {
    const candidateId = getCandidateId(cardElement) || '';
    const name = this.extractName(cardElement);
    const baseInfo = this.extractBaseInfo(cardElement);
    const workExperience = this.extractWorkExperience(cardElement);
    const educationHistory = this.extractEducation(cardElement);
    const tags = this.extractTags(cardElement);
    const description = this.extractDescription(cardElement);
    
    return {
      id: candidateId,
      name,
      ...baseInfo,
      workExperience,
      educationHistory,
      tags,
      description,
    };
  }
  
  /**
   * 提取候选人姓名
   */
  private static extractName(element: HTMLElement): string {
    return element.querySelector(DOM_SELECTORS.CANDIDATE_NAME)?.textContent?.trim() || '未知';
  }
  
  /**
   * 提取基本信息（年龄、学历、工作年限等）
   */
  private static extractBaseInfo(element: HTMLElement) {
    const baseInfoText = element.querySelector(DOM_SELECTORS.BASE_INFO)?.textContent || '';
    
    // 解析格式: "28岁 | 3年 | 硕士 | 在职-月内到岗"
    const parts = baseInfoText.split('|').map(s => s.trim()).filter(Boolean);
    
    return {
      age: parts[0] || '',
      workYears: parts[1] || '',
      education: parts[2] || '',
      status: parts[3] || '',
    };
  }
  
  /**
   * 提取工作经历
   */
  private static extractWorkExperience(element: HTMLElement): string[] {
    const workTimeline = element.querySelector(DOM_SELECTORS.WORK_TIMELINE);
    if (!workTimeline) return [];
    
    const items = workTimeline.querySelectorAll(DOM_SELECTORS.TIMELINE_ITEM);
    return Array.from(items).map(item => item.textContent?.trim() || '').filter(Boolean);
  }
  
  /**
   * 提取教育经历
   */
  private static extractEducation(element: HTMLElement): string[] {
    const eduTimeline = element.querySelector(DOM_SELECTORS.EDU_TIMELINE);
    if (!eduTimeline) return [];
    
    const items = eduTimeline.querySelectorAll(DOM_SELECTORS.TIMELINE_ITEM);
    return Array.from(items).map(item => item.textContent?.trim() || '').filter(Boolean);
  }
  
  /**
   * 提取技能标签
   */
  private static extractTags(element: HTMLElement): string[] {
    const tagElements = element.querySelectorAll(DOM_SELECTORS.TAGS);
    return Array.from(tagElements).map(tag => tag.textContent?.trim() || '').filter(Boolean);
  }
  
  /**
   * 提取优势描述
   */
  private static extractDescription(element: HTMLElement): string {
    return element.querySelector(DOM_SELECTORS.GEEK_DESC)?.textContent?.trim() || '';
  }
}

