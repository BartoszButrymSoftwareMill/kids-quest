import type { SupabaseClient } from '../db/supabase.client';
import type { ContentViolation, ContentSuggestion } from '../types';

interface ContentValidationResult {
  isValid: boolean;
  violations: ContentViolation[];
  suggestions: ContentSuggestion[];
  sanitizedContent?: Record<string, string>;
}

/**
 * Content Safety Service
 * Validates user-generated content against content policy rules from the database
 * Implements caching for better performance
 */
interface ContentRule {
  id: number;
  rule_type: string;
  pattern: string;
  pattern_type: string;
  case_sensitive: boolean;
  replacement: string | null;
}

export class ContentSafetyService {
  private rules: Map<string, ContentRule> | null = null;
  private lastFetch = 0;
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(private supabase: SupabaseClient) {}

  /**
   * Loads content policy rules from database with caching
   */
  private async loadRules() {
    const now = Date.now();
    if (this.rules && now - this.lastFetch < this.cacheDuration) {
      return this.rules;
    }

    const { data, error } = await this.supabase.from('content_policy_rules').select('*').eq('is_active', true);

    if (error) {
      console.error('Failed to load content policy rules:', error);
      throw new Error('Failed to load content safety rules');
    }

    this.rules = new Map(data.map((rule) => [rule.id.toString(), rule]));
    this.lastFetch = now;
    return this.rules;
  }

  /**
   * Validates content against all active content policy rules
   * Returns violations, suggestions, and sanitized content if applicable
   */
  async validateContent(content: Record<string, string>): Promise<ContentValidationResult> {
    const rules = await this.loadRules();
    const violations: ContentViolation[] = [];
    const suggestions: ContentSuggestion[] = [];
    const sanitizedContent: Record<string, string> = { ...content };

    for (const [field, text] of Object.entries(content)) {
      if (!text) continue;

      for (const rule of rules.values()) {
        const matched = this.matchPattern(text, rule.pattern, rule.pattern_type, rule.case_sensitive);

        if (matched) {
          if (rule.rule_type === 'hard_ban') {
            violations.push({
              field,
              rule: rule.rule_type,
              pattern: rule.pattern,
            });
          } else if (rule.rule_type === 'soft_ban' && rule.replacement) {
            suggestions.push({
              field,
              original: rule.pattern,
              replacement: rule.replacement,
            });
          } else if (rule.rule_type === 'replacement' && rule.replacement) {
            sanitizedContent[field] = this.replacePattern(
              sanitizedContent[field],
              rule.pattern,
              rule.replacement,
              rule.pattern_type,
              rule.case_sensitive
            );
          }
        }
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions,
      sanitizedContent: violations.length === 0 ? sanitizedContent : undefined,
    };
  }

  /**
   * Matches text against a pattern based on pattern type
   */
  private matchPattern(text: string, pattern: string, patternType: string, caseSensitive: boolean): boolean {
    const flags = caseSensitive ? '' : 'i';

    switch (patternType) {
      case 'exact':
        return caseSensitive ? text.includes(pattern) : text.toLowerCase().includes(pattern.toLowerCase());

      case 'wildcard': {
        const regexPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*');
        return new RegExp(regexPattern, flags).test(text);
      }

      case 'regex':
        return new RegExp(pattern, flags).test(text);

      default:
        return false;
    }
  }

  /**
   * Replaces pattern matches in text with replacement string
   */
  private replacePattern(
    text: string,
    pattern: string,
    replacement: string,
    patternType: string,
    caseSensitive: boolean
  ): string {
    const flags = caseSensitive ? 'g' : 'gi';

    switch (patternType) {
      case 'exact': {
        const exactRegex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        return text.replace(exactRegex, replacement);
      }

      case 'wildcard': {
        const wildcardPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*');
        return text.replace(new RegExp(wildcardPattern, flags), replacement);
      }

      case 'regex':
        return text.replace(new RegExp(pattern, flags), replacement);

      default:
        return text;
    }
  }
}
