import { Buffer } from "buffer";

export const API_VERSION = "v1";
const BASE_API_URL = `https://www.picketapi.com/api/${API_VERSION}`;

export interface NonceResponse {
  nonce: string;
}

export interface AuthRequirements {
  contractAddress?: string;
  minTokenBalance?: number;
}

export interface AuthRequest extends AuthRequirements {
  walletAddress: string;
  signature: string;
}

export interface TokenOwnershipRequest {
  walletAddress: string;
  contractAddress: string;
  minTokenBalance?: number;
}

export interface OwnershipResponse {
  allowed: boolean;
}

export interface AuthResponse {
  accessToken: string;
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
  async nonce(walletAddress: string): Promise<NonceResponse> {
    const url = `${this.baseURL}/auth/nonce`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify({
        walletAddress,
      }),
    });
    return await res.json();
  }

  /**
   * Auth
   * Function for initiating auth / token gating
   */
  async auth({
    walletAddress,
    signature,
    contractAddress,
    minTokenBalance,
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

    const requestBody = Boolean(contractAddress)
      ? { walletAddress, signature, contractAddress, minTokenBalance }
      : { walletAddress, signature };
    const url = `${this.baseURL}/auth`;
    const reqOptions = {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify(requestBody),
    };
    const res = await fetch(url, reqOptions);
    return await res.json();
  }

  /**
   * Ownership
   * Function for initiating auth / token gating
   */
  async tokenOwnership({
    walletAddress,
    contractAddress,
    minTokenBalance,
  }: TokenOwnershipRequest): Promise<OwnershipResponse> {
    if (!walletAddress) {
      throw new Error(
        "walletAddress parameter is required - see docs for reference."
      );
    }
    if (!contractAddress) {
      throw new Error(
        "contractAddress parameter is required - see docs for reference."
      );
    }

    const requestBody = { walletAddress, contractAddress, minTokenBalance };
    const url = `${this.baseURL}/wallets/${walletAddress}/tokenOwnership`;
    const reqOptions = {
      method: "POST",
      headers: this.#defaultHeaders(),
      body: JSON.stringify(requestBody),
    };
    const res = await fetch(url, reqOptions);
    // TODO HANDLE ERROR CODES

    return await res.json();
  }

  /**
   * Verify
   * Function for initiating auth / token gating
   */
  async verify(jwt: string): Promise<boolean> {
    if (!jwt) return false;

    const url = `${this.baseURL}/auth/verify`;

    const res = await fetch(url, {
      headers: this.#defaultHeaders(),
    });

    const { valid }: { valid: boolean } = await res.json();

    return valid;
  }
}

export default Picket;
