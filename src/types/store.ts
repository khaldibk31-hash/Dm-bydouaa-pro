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

export interface StoreState {
  version: number;
  logoUrl: string;
  studioBgUrl: string;
  copy: StoreCopy;
  products: Product[];
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
