// app/module/data/products.ts

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export const products: Product[] = [
  { id: 1, name: 'Wireless Mouse', price: 19.99, stock: 120 },
  { id: 2, name: 'Mechanical Keyboard', price: 79.99, stock: 45 },
  { id: 3, name: 'HD Monitor 24"', price: 149.99, stock: 30 },
  { id: 4, name: 'USB-C Hub', price: 39.99, stock: 75 },
  { id: 5, name: 'Noise-Canceling Headphones', price: 129.99, stock: 25 },
  { id: 6, name: 'Webcam 1080p', price: 49.99, stock: 60 },
  { id: 7, name: 'Portable SSD 1TB', price: 99.99, stock: 40 },
  { id: 8, name: 'Smartphone Stand', price: 14.99, stock: 200 },
  { id: 9, name: 'Bluetooth Speaker', price: 59.99, stock: 55 },
  { id: 10, name: 'Gaming Chair', price: 249.99, stock: 15 },
];

// Simulated async fetch
export async function fetchProducts(): Promise<Product[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(products), 500); // mock delay
  });
}
