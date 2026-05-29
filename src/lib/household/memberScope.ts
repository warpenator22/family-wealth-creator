import type { HouseholdAccount } from './accounts';
import type { Holding } from './types';

export type HoldingLike = Pick<Holding, 'accountId'>;

export const JOINT_MEMBER_ID = 'member-3';

export function isJointMember(memberId: string): boolean {
  return memberId === JOINT_MEMBER_ID;
}

/** Account visible when a household member pill is selected */
export function accountVisibleToMember(
  account: HouseholdAccount,
  activeMemberId: string
): boolean {
  const joint = account.ownership === 'joint';
  if (isJointMember(activeMemberId)) return joint;
  if (joint) return false;
  if (!account.ownerMemberId) return true;
  return account.ownerMemberId === activeMemberId;
}

export function holdingVisibleToMember(
  account: HouseholdAccount | undefined,
  activeMemberId: string
): boolean {
  if (!account) return false;
  return accountVisibleToMember(account, activeMemberId);
}

export function filterHoldingsForMember<T extends HoldingLike>(
  holdings: T[],
  accounts: HouseholdAccount[],
  activeMemberId: string
): T[] {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  return holdings.filter((h) =>
    holdingVisibleToMember(byId.get(h.accountId), activeMemberId)
  );
}

export function filterAccountsForMember(
  accounts: HouseholdAccount[],
  activeMemberId: string
): HouseholdAccount[] {
  return accounts.filter((a) => accountVisibleToMember(a, activeMemberId));
}
