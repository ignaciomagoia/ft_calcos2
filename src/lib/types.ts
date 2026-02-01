export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number | null;
  created_at?: string | null;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  category_id: string;
  image_url: string | null;
  active: boolean;
  created_at?: string | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
};

export type Profile = {
  id: string;
  role: string;
  created_at?: string;
};

export type AdminLists = {
  categories: Category[];
  products: Product[];
};
