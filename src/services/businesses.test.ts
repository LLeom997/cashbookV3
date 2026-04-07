import { describe, expect, it } from 'vitest';
import { filterLedgersByAccess, mapBusiness } from './businesses';

describe('business permissions and totals', () => {
  it('filters ledgers for non-admin collaborators', () => {
    const ledgers = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(filterLedgersByAccess(ledgers, 'viewer', ['b'])).toEqual([{ id: 'b' }]);
  });

  it('keeps all ledgers for admins', () => {
    const ledgers = [{ id: 'a' }, { id: 'b' }];
    expect(filterLedgersByAccess(ledgers, 'admin', ['a'])).toEqual(ledgers);
  });

  it('derives business totals from accessible ledgers', () => {
    const business = mapBusiness(
      {
        id: 'project-1',
        owner_id: 'user-1',
        name: 'Project',
        currency: 'INR',
        created_at: '2026-04-07T00:00:00Z',
        ledgers: [
          { id: 'l1', name: 'Sales', created_at: '2026-04-07T00:00:00Z', total_in: 500, total_out: 100, balance: 400 },
          { id: 'l2', name: 'Ops', created_at: '2026-04-07T00:00:00Z', total_in: 200, total_out: 50, balance: 150 },
        ],
      },
      'viewer',
      true
    );

    expect(business.totalIn).toBe(700);
    expect(business.totalOut).toBe(150);
    expect(business.balance).toBe(550);
  });
});
