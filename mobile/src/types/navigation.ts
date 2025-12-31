import { NativeStackScreenProps } from "@react-navigation/native-stack";

/**
 * Define os tipos das rotas de autenticação (não logado)
 */
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

/**
 * Define os tipos das rotas principais (logado)
 */
export type MainStackParamList = {
  Home: undefined;
  // Adicione mais rotas aqui no futuro, por exemplo:
  Profile: undefined;
  AddIncome: undefined;
  // Expenses: undefined;
  // Reports: undefined;
};

/**
 * Props tipadas para as telas de autenticação
 */
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

/**
 * Props tipadas para as telas principais
 */
export type MainScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;
