// Types de navigation partagés par les écrans
export type RootStackParamList = {
  SlotsList: undefined;
  SlotDetail: { slotId: string };
  InviteLanding: { token?: string; autoAccept?: boolean; inviteUrl?: string } | undefined;
};
