export function sanitizeForPDF(text: string): string {
    if (!text) return "";
  
    // 1. Normalisation unicode
    let cleaned = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
    // 2. Caractères typographiques non supportés -> ASCII
    cleaned = cleaned
      .replace(/’/g, "'")
      .replace(/“|”/g, '"')
      .replace(/–/g, "-")
      .replace(/•/g, "-")
      .replace(/…/g, "...")
      .replace(/\u00A0/g, " "); // espace insécable → espace normal
  
    // 3. Supprimer tout caractère non ASCII
    cleaned = cleaned.replace(/[^\x00-\x7F]/g, "");
  
    return cleaned;
  }
  