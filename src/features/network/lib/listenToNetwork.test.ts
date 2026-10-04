import { act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

import { listenToNetwork } from './listenToNetwork';
import { setOnline } from '../model/networkSlice';

const netInfo = NetInfo as unknown as { emit: () => void };

describe('listenToNetwork', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('publishes probe results and checks again on a timer', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true });
    const dispatch = jest.fn();
    const stop = listenToNetwork(dispatch);

    await act(async () => {
      await Promise.resolve();
    });
    expect(dispatch).toHaveBeenCalledWith(setOnline(true));

    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(dispatch).toHaveBeenCalledWith(setOnline(false));

    stop();
  });

  it('runs a follow-up probe when one is already in flight', async () => {
    const pending: Array<(value: Response | PromiseLike<Response>) => void> = [];
    globalThis.fetch = jest.fn(
      () =>
        new Promise(resolve => {
          pending.push(resolve);
        }),
    );
    const changes: Array<(state: string) => void> = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      changes.push(handler as (state: string) => void);
      return { remove: jest.fn() };
    });

    const dispatch = jest.fn();
    const stop = listenToNetwork(dispatch);
    netInfo.emit();
    changes[0]('background');
    changes[0]('active');

    pending[0]({ ok: true } as Response);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(dispatch).toHaveBeenCalledWith(setOnline(true));
    stop();
  });
});
