import { Buffer } from "buffer";

export const API_VERSION = "v1";
const BASE_API_URL = `https://picketapi.com/api/${API_VERSION}`;

export enum Chains {
  ETH = "ethereum",
  SOL = "solana",
}

export type Chain = `${Chains}`;

export interface ErrorResponse {
  code?: string;
  msg: string;
}

export interface NonceRequest {
  chain: Chain;
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
  chain: Chain;
  walletAddress: string;
  signature: string;
  requirements?: AuthRequirements;
}

export interface TokenOwnershipRequest {
  chain?: Chain;
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
  chain: Chain;
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
    chain = Chains.ETH,
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
    chain = Chains.ETH,
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
    chain = Chains.ETH,
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
    if (chain === Chains.ETH && !contractAddress) {
      throw new Error(
        `contractAddress parameter is required for ${Chains.ETH}- see docs for reference.`
      );
    }
    if (chain === Chains.SOL && !tokenIds) {
      throw new Error(
        `tokenId parameter is required for ${Chains.SOL} - see docs for reference.`
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
}

export default Picket;
