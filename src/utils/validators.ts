export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPrice(price: string): boolean {
  const num = parseFloat(price.replace(',', '.'));
  return !isNaN(num) && num > 0 && num <= 100;
}

export function priceToCents(priceStr: string): number {
  const num = parseFloat(priceStr.replace(',', '.'));
  return Math.round(num * 100);
}

export function isValidDescription(description: string): boolean {
  return description.trim().length >= 3 && description.trim().length <= 200;
}
