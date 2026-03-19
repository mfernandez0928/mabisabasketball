import { parseISO, isValid } from 'date-fns';

/**
 * Safely parses a date string or Date object.
 * Returns a valid Date object or the current date as a fallback.
 */
export const safeParseDate = (dateInput: string | Date | undefined | null): Date => {
  if (!dateInput) return new Date();
  
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : new Date();
  }

  try {
    const parsedDate = parseISO(dateInput);
    if (isValid(parsedDate)) {
      return parsedDate;
    }
    
    const fallbackDate = new Date(dateInput);
    if (isValid(fallbackDate)) {
      return fallbackDate;
    }
  } catch (error) {
    console.warn('Failed to parse date:', dateInput, error);
  }

  return new Date();
};
