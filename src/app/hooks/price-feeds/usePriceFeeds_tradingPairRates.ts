import { Asset } from 'types/asset';
import { getTokenContract } from 'utils/blockchain/contract-helpers';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectWalletProvider } from '../../containers/WalletProvider/selectors';
import { contractReader } from '../../../utils/sovryn/contract-reader';
import { AssetsDictionary } from '../../../utils/dictionaries/assets-dictionary';
import { CachedAssetRate } from '../../containers/WalletProvider/types';
import { actions } from 'app/containers/WalletProvider/slice';

export function usePriceFeeds_tradingPairRates() {
  const { syncBlockNumber, assetRates } = useSelector(selectWalletProvider);
  const dispatch = useDispatch();

  const getRate = useCallback(async (sourceAsset: Asset, destAsset: Asset) => {
    return await contractReader.call('priceFeed', 'queryRate', [
      getTokenContract(sourceAsset).address,
      getTokenContract(destAsset).address,
    ]);
  }, []);

  const getRates = useCallback(async () => {
    const assets = AssetsDictionary.list().map(item => item.asset);
    const items: CachedAssetRate[] = [];
    for (let i = 0; i < assets.length; i++) {
      const source = assets[i];
      for (let l = 0; l < assets.length; l++) {
        const target = assets[l];
        if (target === source) {
          continue;
        }
        const result = await getRate(source, target);
        items.push({
          source,
          target,
          value: result as any,
        });
      }
    }
    return items;
  }, [getRate]);

  useEffect(() => {
    getRates()
      .then(e => dispatch(actions.setPrices(JSON.parse(JSON.stringify(e)))))
      .catch(console.error);
  }, [dispatch, getRates, syncBlockNumber]);

  return assetRates;
}
