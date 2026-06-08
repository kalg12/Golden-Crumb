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
    id: 'classic-chocolate-chip',
    name: 'Classic Chocolate Chip',
    slug: 'classic-chocolate-chip',
    description: 'A soft, golden cookie loaded with rich chocolate chips.',
    price: 4,
    image: '/images/cookies/classic-chocolate-chip.jpg',
    allergens: ['milk', 'eggs', 'wheat'],
    featured: true,
  },
  {
    id: 'double-chocolate',
    name: 'Double Chocolate',
    slug: 'double-chocolate',
    description: 'Rich cocoa cookie with dark chocolate chunks.',
    price: 4.5,
    image: '/images/cookies/double-chocolate.jpg',
    allergens: ['milk', 'eggs', 'wheat'],
    featured: true,
  },
  {
    id: 'oatmeal-raisin',
    name: 'Oatmeal Raisin',
    slug: 'oatmeal-raisin',
    description: 'Hearty oats with plump raisins and a hint of cinnamon.',
    price: 4,
    image: '/images/cookies/oatmeal-raisin.jpg',
    allergens: ['milk', 'eggs', 'wheat', 'peanuts'],
    featured: true,
  },
  {
    id: 'snickerdoodle',
    name: 'Snickerdoodle',
    slug: 'snickerdoodle',
    description: 'Cinnamon-sugar coated with a soft, chewy center.',
    price: 3.5,
    image: '/images/cookies/snickerdoodle.jpg',
    allergens: ['milk', 'eggs', 'wheat'],
    featured: false,
  },
  {
    id: 'chocolate-peanut-butter',
    name: 'Chocolate Peanut Butter',
    slug: 'chocolate-peanut-butter',
    description: 'A decadent blend of chocolate and creamy peanut butter.',
    price: 4.5,
    image: '/images/cookies/chocolate-peanut-butter.jpg',
    allergens: ['milk', 'eggs', 'wheat', 'peanuts'],
    featured: false,
  },
  {
    id: 'lemon-drop',
    name: 'Lemon Drop',
    slug: 'lemon-drop',
    description: 'Bright, zesty lemon cookie with a light glaze.',
    price: 3.5,
    image: '/images/cookies/lemon-drop.jpg',
    allergens: ['milk', 'eggs', 'wheat'],
    featured: false,
  },
];
