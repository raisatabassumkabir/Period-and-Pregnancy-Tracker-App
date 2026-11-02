import { signOut, useAuth } from '@/lib/auth';

import { queryClient } from './api-provider';
import { queryStorage } from './query-persister';

const PERSISTED_KEY = 'REACT_QUERY_OFFLINE_CACHE';

describe('signing out', () => {
  it("wipes the previous account's cached data, in memory and on disk", () => {
    useAuth.setState({
      status: 'signIn',
      token: { access: 'a', refresh: 'r' },
    });
    queryClient.setQueryData(['partner-invites'], [{ code: 'HW-7K3M-Q9XA' }]);
    queryStorage.set(PERSISTED_KEY, '{"clientState":{}}');

    signOut();

    expect(queryClient.getQueryData(['partner-invites'])).toBeUndefined();
    expect(queryStorage.getString(PERSISTED_KEY)).toBeUndefined();
  });
});
