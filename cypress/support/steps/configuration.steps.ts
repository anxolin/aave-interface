import { ChainId } from '@aave/contract-helpers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';

import { CustomizedBridge } from '../tools/bridge';
import { DEFAULT_TEST_ACCOUNT, TenderlyVnet } from '../tools/tenderly';

const URL = Cypress.env('URL');
const PERSIST_FORK_AFTER_RUN = Cypress.env('PERSIST_FORK_AFTER_RUN') || false;

export const configEnvWithTenderly = ({
  chainId,
  market,
  tokens,
  unpause,
  wallet,
  enableTestnet = false,
  urlSuffix = '',
}: {
  chainId: number;
  market: string;
  tokens?: { tokenAddress: string; donorAddress?: string; tokenCount?: string }[];
  unpause?: boolean;
  wallet?: { address: string; privateKey: string };
  enableTestnet?: boolean;
  urlSuffix?: string;
}) => {
  const tenderly = new TenderlyVnet({ vnetNetworkID: chainId });
  const walletAddress: string = wallet != null ? wallet.address : DEFAULT_TEST_ACCOUNT.address;
  const privateKey: string = wallet != null ? wallet.privateKey : DEFAULT_TEST_ACCOUNT.privateKey;
  let provider: JsonRpcProvider;
  let signer: Wallet;
  let auth: Cypress.AUTWindow;
  before(async () => {
    await tenderly.init();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await tenderly.add_balance_rpc(walletAddress);
    if (unpause) {
      await tenderly.unpauseMarket();
    }

    if (tokens) {
      await Promise.all(
        tokens.map((token) =>
          tenderly.getERC20Token(
            walletAddress,
            token.tokenAddress,
            token.donorAddress,
            token.tokenCount
          )
        )
      );
    }
  });
  before('Open main page', () => {
    let url = URL as string;
    if (urlSuffix) {
      url = `${url}/${urlSuffix}`;
    }

    const rpc = tenderly.get_rpc_url();
    provider = new JsonRpcProvider(rpc, 3030);
    signer = new Wallet(privateKey, provider);
    cy.visit(url, {
      onBeforeLoad(win) {
        // eslint-disable-next-line
        (win as any).ethereum = new CustomizedBridge(signer, provider);
        auth = win;
        win.localStorage.setItem('forkEnabled', 'true');
        // forks are always expected to run on chainId 3030
        win.localStorage.setItem('forkNetworkId', '3030');
        win.localStorage.setItem('forkBaseChainId', chainId.toString());
        win.localStorage.setItem('forkRPCUrl', rpc);
        win.localStorage.setItem('walletProvider', 'injected');
        win.localStorage.setItem('selectedAccount', walletAddress.toLowerCase());
        win.localStorage.setItem('selectedMarket', market);
        win.localStorage.setItem('testnetsEnabled', enableTestnet.toString());
        // win.localStorage.setItem('userAcceptedAnalytics', 'true');
      },
    });
  });
  before('Save env variables', () => {
    window.tenderly = tenderly;
    window.address = walletAddress;
    window.chainId = chainId.toString();
    window.rpc = tenderly.get_rpc_url();
    window.market = market;
    window.testnetsEnabled = enableTestnet.toString();
    window.url = URL;
    window.privateKey = privateKey;
    window.provider = provider;
    window.signer = signer;
    window.auth = auth;
  });
  after(async () => {
    if (!PERSIST_FORK_AFTER_RUN) {
      cy.log('deleting vnet');
      await tenderly.deleteVnet();
    }
  });
};

const createConfigWithTenderlyFork =
  (chainId: number, defaultMarket: string) =>
  ({
    market = defaultMarket,
    tokens,
    v3,
    wallet,
    urlSuffix,
  }: {
    market?: string;
    tokens?: { tokenAddress: string }[];
    v3?: boolean;
    wallet?: { address: string; privateKey: string };
    urlSuffix?: string;
  }) =>
    configEnvWithTenderly({ chainId, market, tokens, unpause: v3, wallet, urlSuffix });

export const configEnvWithTenderlyMainnetFork = createConfigWithTenderlyFork(
  ChainId.mainnet,
  'fork_proto_mainnet'
);
export const configEnvWithTenderlyPolygonFork = createConfigWithTenderlyFork(
  ChainId.polygon,
  'fork_proto_polygon'
);
export const configEnvWithTenderlyAvalancheFork = createConfigWithTenderlyFork(
  ChainId.avalanche,
  'fork_proto_avalanche'
);
export const configEnvWithTenderlyAvalancheFujiFork = createConfigWithTenderlyFork(
  ChainId.fuji,
  'proto_fuji_v3'
);
export const configEnvWithTenderlyOptimismFork = createConfigWithTenderlyFork(
  ChainId.optimism,
  'fork_proto_optimism_v3'
);

export const configEnvWithTenderlyBaseFork = createConfigWithTenderlyFork(
  ChainId.base,
  'fork_proto_base_v3'
);
export const configEnvWithTenderlyArbitrumFork = createConfigWithTenderlyFork(
  ChainId.arbitrum_one,
  'fork_proto_arbitrum_v3'
);
export const configEnvWithTenderlyBnbFork = createConfigWithTenderlyFork(
  ChainId.bnb,
  'fork_proto_bnb_v3'
);
export const configEnvWithTenderlyAEthereumV3Fork = createConfigWithTenderlyFork(
  ChainId.mainnet,
  'fork_proto_mainnet_v3'
);
export const configEnvWithTenderlyGnosisFork = createConfigWithTenderlyFork(
  ChainId.xdai,
  'fork_proto_gnosis_v3'
);
export const configEnvWithTenderlyGoerliGhoFork = createConfigWithTenderlyFork(
  ChainId.goerli,
  'fork_proto_goerli_gho_v3'
);
export const configEnvWithTenderlySepoliaGhoFork = createConfigWithTenderlyFork(
  ChainId.sepolia,
  'fork_proto_sepolia_gho_v3'
);

const createConfigWithOrigin = (market: string, mockedAddress: string) => {
  before('Open main page', () => {
    cy.visit(URL, {
      onBeforeLoad(win) {
        // forks are always expected to run on chainId 3030
        win.localStorage.setItem('selectedMarket', market);
        win.localStorage.setItem('walletProvider', 'read_only_mode');
        win.localStorage.setItem('readOnlyModeAddress', mockedAddress);
      },
    });
  });
};

export const configEnvMetis = (mockedAddress: string) =>
  createConfigWithOrigin('proto_metis_v3', mockedAddress);
export const configEnvScroll = (mockedAddress: string) =>
  createConfigWithOrigin('proto_scroll_v3', mockedAddress);
