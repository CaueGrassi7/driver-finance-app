export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string | null;
  is_system: boolean;
}
