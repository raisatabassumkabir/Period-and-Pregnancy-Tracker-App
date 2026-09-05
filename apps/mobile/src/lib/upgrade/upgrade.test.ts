import { getUpgradeState, hideUpgrade, showUpgrade } from './index';

beforeEach(() => {
  hideUpgrade();
});

describe('upgrade store', () => {
  it('starts hidden with no detail', () => {
    const state = getUpgradeState();
    expect(state.visible).toBe(false);
    expect(state.detail).toBeNull();
  });

  it('shows with detail when showUpgrade is dispatched', () => {
    showUpgrade({
      message: 'Upgrade for unlimited usage',
      feature: 'example_feature',
      current_usage: 15,
      limit: 15,
    });

    const state = getUpgradeState();
    expect(state.visible).toBe(true);
    expect(state.detail?.feature).toBe('example_feature');
    expect(state.detail?.message).toBe('Upgrade for unlimited usage');
  });

  it('hides without clearing detail (so the sheet can animate out)', () => {
    showUpgrade({ message: 'msg', feature: 'premium' });
    hideUpgrade();
    const state = getUpgradeState();
    expect(state.visible).toBe(false);
  });

  it('overwrites detail when a new feature triggers the sheet', () => {
    showUpgrade({ message: 'first', feature: 'feature_a' });
    showUpgrade({ message: 'second', feature: 'feature_b' });
    expect(getUpgradeState().detail?.feature).toBe('feature_b');
  });
});
