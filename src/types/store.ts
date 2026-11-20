export type CategoryId = 'shawl' | 'robe' | 'cap' | 'accessories';

export interface ProductOption {
  label: string;
  price: number;
}

export interface Product {
  id: string;
  category: CategoryId;
  branch: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  colorImages?: Record<string, string>;
    hideSizing?: boolean;
  hideCapDetails?: boolean;
  hideAmericanShawl?: boolean;

  americanShawlTitle?: string;
  americanShawlSubtitle?: string;
  americanShawlPrice?: number;

  options: ProductOption[];
  secondaryOptions?: string[];
  secondaryLabel?: string;
  supportsColorSwatches?: boolean;
  supportsHeadCircumference?: boolean;
}

export interface StoreCopy {
  brandName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  studioTitle: string;
  studioSubtitle: string;
  pricesTitle: string;
  pricesSubtitle: string;
}

export interface CapStyleOverride {
  label?: string;
  extraPrice?: number;
  imageUrl?: string;
}

export interface SectionOverride {
  title?: string;
  subtitle?: string;
  priceLabel?: string;
  buttonText?: string;
  imageUrl?: string;
}

export interface StoreState {
  version: number;
  logoUrl: string;
  studioBgUrl: string;
  copy: StoreCopy;
  products: Product[];
  sectionOrder?: string[];
  customTexts?: Record<string, string>;
  customImages?: Record<string, string>;
  capStyles?: Record<string, CapStyleOverride>;
  sectionMeta?: Record<string, SectionOverride>;
}

export interface CartItem {
  id: string;
  title: string;
  details?: string;
  unitPrice: number;
  quantity: number;
  category: CategoryId | 'custom-stole';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
  defaultThreadHex: string;
  defaultThreadName: string;
}
