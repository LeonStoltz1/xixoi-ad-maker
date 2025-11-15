/**
 * Utility functions for detecting contact information in campaign descriptions
 */

export interface DetectedContact {
  phone?: string;
  email?: string;
}

/**
 * Detects phone numbers in text
 * Supports various formats: +1-555-123-4567, (555) 123-4567, 555.123.4567, etc.
 */
export function detectPhoneNumber(text: string): string | null {
  const phonePatterns = [
    // International format: +1-555-123-4567 or +1 (555) 123-4567
    /\+?\d{1,3}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    // US format: (555) 123-4567 or 555-123-4567
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    // Simple format: 5551234567
    /\b\d{10,11}\b/g,
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      // Return the first matched phone number
      return match[0].trim();
    }
  }

  return null;
}

/**
 * Detects email addresses in text
 */
export function detectEmail(text: string): string | null {
  // Standard email regex pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const match = text.match(emailPattern);
  
  if (match && match[0]) {
    return match[0].trim();
  }

  return null;
}

/**
 * Detects both phone and email in text
 */
export function detectContactInfo(text: string): DetectedContact {
  return {
    phone: detectPhoneNumber(text),
    email: detectEmail(text),
  };
}

/**
 * Removes detected contact info from text
 */
export function removeContactInfo(text: string, contact: DetectedContact): string {
  let cleanedText = text;

  if (contact.phone) {
    cleanedText = cleanedText.replace(contact.phone, '').trim();
  }

  if (contact.email) {
    cleanedText = cleanedText.replace(contact.email, '').trim();
  }

  // Clean up extra whitespace
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

  return cleanedText;
}
