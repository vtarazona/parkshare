export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabsParamList = {
  MapTab: undefined;
  ShareTab: undefined;
  ActivityTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  SpotDetails: { spotId: string };
  Payment: { reservationId: string };
  PaymentSuccess: { reservationId: string; amount: number };
  RateSpot: { spotId: string; reservationId: string };
  EditProfile: undefined;
  Subscription: undefined;
  Wallet: undefined;
};
