
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  type: 'photostrip' | 'merch';
}

export interface PhotostripTemplate {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  backgroundImage?: string;
}

export interface OrderData {
  customerName: string;
  customerWhatsApp: string;
  productName: string;
  templateName?: string;
  notes: string;
}
