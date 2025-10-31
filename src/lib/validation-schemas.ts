/**
 * Zod Validation Schemas
 * 
 * Centralized validation schemas for API routes.
 * Provides consistent, type-safe input validation.
 */

import { z } from 'zod';

/**
 * Lead submission schema
 */
export const LeadSubmissionSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters')
    .trim(),
  
  language: z.enum(['en', 'fr']).optional().default('en'),
  
  timestamp: z.string().datetime().optional(),
});

export type LeadSubmission = z.infer<typeof LeadSubmissionSchema>;

/**
 * Client registration schema
 */
export const ClientRegistrationSchema = z.object({
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(200, 'Business name must be less than 200 characters')
    .trim(),
  
  contactName: z.string()
    .min(2, 'Contact name must be at least 2 characters')
    .max(100, 'Contact name must be less than 100 characters')
    .trim(),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  language: z.enum(['en', 'fr']).default('en'),
  
  leadSourceDescription: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  
  estimatedLeadsPerWeek: z.number()
    .int('Must be a whole number')
    .min(0, 'Must be 0 or greater')
    .max(10000, 'Must be less than 10000')
    .optional(),
});

export type ClientRegistration = z.infer<typeof ClientRegistrationSchema>;

/**
 * Client authentication schema
 */
export const ClientAuthSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255)
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(1, 'Password is required')
    .max(100),
});

export type ClientAuth = z.infer<typeof ClientAuthSchema>;

/**
 * Admin authentication schema
 */
export const AdminAuthSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .max(100),
});

export type AdminAuth = z.infer<typeof AdminAuthSchema>;

/**
 * Lead note schema
 */
export const LeadNoteSchema = z.object({
  leadId: z.string()
    .min(1, 'Lead ID is required')
    .max(100),
  
  content: z.string()
    .min(1, 'Note content is required')
    .max(5000, 'Note must be less than 5000 characters')
    .trim(),
  
  type: z.enum(['note', 'call', 'email', 'meeting', 'follow_up']).optional().default('note'),
});

export type LeadNote = z.infer<typeof LeadNoteSchema>;

/**
 * Lead tag update schema
 */
export const LeadTagSchema = z.object({
  leadId: z.string().min(1).max(100),
  tag: z.string().min(1).max(50).trim(),
});

export type LeadTag = z.infer<typeof LeadTagSchema>;

/**
 * Prospect scan configuration schema
 */
export const ProspectScanSchema = z.object({
  industries: z.array(z.string().min(1).max(100))
    .min(1, 'At least one industry is required')
    .max(10, 'Maximum 10 industries allowed')
    .optional()
    .default(['Construction', 'Real Estate', 'Marketing']),
  
  regions: z.array(z.string().length(2, 'Region code must be 2 characters'))
    .min(1, 'At least one region is required')
    .max(5, 'Maximum 5 regions allowed')
    .optional()
    .default(['CA']),
  
  minScore: z.number()
    .int()
    .min(0, 'Minimum score must be 0 or greater')
    .max(100, 'Maximum score must be 100 or less')
    .optional()
    .default(70),
  
  limit: z.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be 100 or less')
    .optional()
    .default(10),
});

export type ProspectScan = z.infer<typeof ProspectScanSchema>;

/**
 * Email template schema
 */
export const EmailTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be less than 100 characters')
    .trim(),
  
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10000 characters')
    .trim(),
  
  tone: z.enum(['professional', 'casual', 'urgent', 'friendly']).optional(),
  
  language: z.enum(['en', 'fr']).default('en'),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

/**
 * Helper function to validate and parse data with Zod
 * Returns parsed data or throws validation error
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; issues: any[] } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || [];
      const firstError = issues[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
        issues: issues,
      };
    }
    return {
      success: false,
      error: 'Validation failed',
      issues: [],
    };
  }
}

/**
 * Helper function for async validation (e.g., checking uniqueness)
 */
export async function validateDataAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: string; issues: any[] }> {
  try {
    const parsed = await schema.parseAsync(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || [];
      const firstError = issues[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
        issues: issues,
      };
    }
    return {
      success: false,
      error: 'Validation failed',
      issues: [],
    };
  }
}

