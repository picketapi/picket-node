import { Buffer } from "buffer";

export const API_VERSION = "v1";
const BASE_API_URL = `https://picketapi.com/api/${API_VERSION}`;

export interface ErrorResponse {
  code?: string;
  msg: string;
}

export enum ChainTypes {
  ETH = "ethereum",
  SOL = "solana",
}

export type ChainType = `${ChainTypes}`;

export type ChainInfo = {
  chainSlug: string;
  chainID: number;
  chainType: ChainTypes;
  chainName: string;
  publicRPC: string;
  authorizationSupported: boolean;
};

export interface NonceRequest {
  chain: string;
  walletAddress: string;
}

export interface NonceResponse {
  nonce: string;
}

export interface AuthRequirements {
  contractAddress?: string;
  tokenIds?: string[];
  minTokenBalance?: number | string;
}

export interface AuthRequest {
  chain: string;
  walletAddress: string;
  signature: string;
  requirements?: AuthRequirements;
}

export interface TokenOwnershipRequest {
  chain?: string;
  walletAddress: string;
  contractAddress: string;
  tokenIds?: string[];
  minTokenBalance?: number | string;
}

export interface TokenOwnershipResponse {
  allowed: boolean;
  walletAddress: string;
  tokenBalance: string;
}

export interface AuthenticatedUser {
  chain: string;
  walletAddress: string;
  displayAddress: string;
  contractAddress?: string;
  tokenIds?: string;
  tokenBalance?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface AuthState {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface AccessTokenPayload extends AuthenticatedUser {
  iat: number;
  ext: number;
  iss: string;
  sub: string;
  aud: string;
  tid: string;
}

export class Picket {
  baseURL = BASE_API_URL;
  #apiKey;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Missing secret key");
    }
    this.#apiKey = apiKey;
  }

  #defaultHeaders = () => {
    const base64SecretKey = Buffer.from(this.#apiKey).toString("base64");

    return {
      "User-Agent": "picket-node/0.0.5",
      "Content-Type": "application/json",
      Authorization: `Basic ${base64SecretKey}`,
    };
  };

  // -------------
  // API SDK
  // -------------

  /**
   * nonce
   * Function for retrieving nonce for a given user
   */
  async nonce({
    chain = ChainTypes.ETH,
    walletAddress,
  }: NonceRequest): Promise<NonceResponse> {
    const url = `${this.baseURL}/auth/nonce`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        chain,
        walletAddress,
      }),
    });
    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data);
    }

    return data as NonceResponse;
  }

  /**
   * auth
   * Function for initiating auth / token gating
   */
  async auth({
    chain = ChainTypes.ETH,
    walletAddress,
    signature,
    requirements,
  }: AuthRequest): Promise<AuthResponse> {
    if (!walletAddress) {
      throw new Error(
        "walletAddress parameter is required - see docs for reference."
      );
    }
    if (!signature) {
      throw new Error(
        "signature parameter is required - see docs for reference."
      );
    }

    const url = `${this.baseURL}/auth`;
    const reqOptions = {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        chain,
        walletAddress,
        signature,
        requirements,
      }),
    };

    const res = await fetch(url, reqOptions);
    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data as ErrorResponse);
    }

    return data as AuthResponse;
  }

  /**
   * Validate
   * Validate the given access token and requirements
   */
  async validate(
    accessToken: string,
    requirements?: AuthRequirements
  ): Promise<AccessTokenPayload> {
    if (!accessToken) {
      return Promise.reject("access token is empty");
    }

    const url = `${this.baseURL}/auth/validate`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        accessToken,
        requirements,
      }),
    });

    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data as ErrorResponse);
    }

    return data as AccessTokenPayload;
  }

  /**
   * Ownership
   * Function for initiating auth / token gating
   */
  async tokenOwnership({
    chain = ChainTypes.ETH,
    walletAddress,
    tokenIds,
    contractAddress,
    minTokenBalance,
  }: TokenOwnershipRequest): Promise<TokenOwnershipResponse> {
    if (!walletAddress) {
      throw new Error(
        "walletAddress parameter is required - see docs for reference."
      );
    }
    if (chain === ChainTypes.ETH && !contractAddress) {
      throw new Error(
        `contractAddress parameter is required for ${ChainTypes.ETH}- see docs for reference.`
      );
    }
    if (chain === ChainTypes.SOL && !tokenIds) {
      throw new Error(
        `tokenIds parameter is required for ${ChainTypes.SOL} - see docs for reference.`
      );
    }

    const requestBody = { contractAddress, minTokenBalance, tokenIds };
    const url = `${this.baseURL}/chains/${chain}/wallets/${walletAddress}/tokenOwnership`;
    const reqOptions = {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify(requestBody),
    };
    const res = await fetch(url, reqOptions);
    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data as ErrorResponse);
    }

    return data as TokenOwnershipResponse;
  }

  /**
   * chainInfo
   * Function for retrieving chain information
   */
  async chainInfo(chain: string): Promise<ChainInfo> {
    const url = `${this.baseURL}/chains/${chain}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.#defaultHeaders(),
    });
    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data as ErrorResponse);
    }

    return data as ChainInfo;
  }

  /**
   * chains
   * Function for retrieving information on supported chains
   */
  async chains(): Promise<ChainInfo[]> {
    const url = `${this.baseURL}/chains`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.#defaultHeaders(),
    });
    const data = await res.json();

    // reject any error code > 201
    if (res.status > 201) {
      return Promise.reject(data as ErrorResponse);
    }

    return data.data as ChainInfo[];
  }
}

export default Picket;
