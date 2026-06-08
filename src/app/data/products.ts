export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  allergens?: string[];
  featured?: boolean;
};

export const products: Product[] = [
  {
    id: "classic-chocolate-chip",
    name: "Classic Chocolate Chip",
    slug: "classic-chocolate-chip",
    description: "A soft, golden cookie loaded with rich chocolate chips.",
    price: 4,
    image: "/images/cookies/classic-chocolate-chip.jpg",
    allergens: ["milk", "eggs", "wheat"],
    featured: true,
  },
];
