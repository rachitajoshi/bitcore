import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { ToastController } from 'ionic-angular';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { merge, shareReplay } from 'rxjs/operators';
import { ApiProvider, ChainNetwork } from '../api/api';
import { CurrencyProvider } from '../currency/currency';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/retry';

import {of} from "rxjs/observable/of";


export interface ApiBlock {
  height: number;
  nonce: number;
  size: number;
  confirmations: number;
  hash: string;
  nextBlockHash: string;
  previousBlockHash: string;
  transactionCount: number;
  reward: number;
  minedBy: string;
  time: Date;
  timeNormalized: Date;
}

export interface ApiUtxoCoinBlock extends ApiBlock {
  difficulty: number;
  merkleRoot: string;
  bits: number;
  version: number;
}

export interface ApiEthBlock extends ApiBlock {
  difficulty: number;
  totalDifficulty: number;
  gasUsed: number;
  gasLimit: number;
}
export interface AppBlock {
  height: number;
  nonce: number;
  size: number;
  confirmations: number;
  virtualSize: number;
  hash: string;
  time: number;
  tx: {
    length: number;
  };
  txlength: number;
  previousblockhash: string;
  nextblockhash: string;
  poolInfo: {
    poolName: string;
    url: string;
  };
  reward: number;
}

export interface AppUtxoCoinBlock extends AppBlock {
  difficulty: number;
  merkleroot: string;
  bits: string;
  version: number;
}

export interface AppEthBlock extends AppBlock {
  difficulty: number;
  totalDifficulty: number;
  gasUsed: number;
  gasLimit: number;
}

@Injectable()
export class BlocksProvider {
  public currentChainNetwork;
  public tipValue;

  constructor(
    public httpClient: HttpClient,
    public currency: CurrencyProvider,
    private api: ApiProvider,
    public toasty: ToastController
  ) {}

  public toEthAppBlock(block: ApiEthBlock): AppEthBlock {
    return {
      ...this.toAppBlock(block),
      gasLimit: block.gasLimit,
      gasUsed: block.gasUsed,
      difficulty: block.difficulty,
      totalDifficulty: block.totalDifficulty
    };
  }

  public toUtxoCoinAppBlock(block: ApiUtxoCoinBlock): AppUtxoCoinBlock {
    const difficulty: number = 0x1d00ffff / block.bits;
    return {
      ...this.toAppBlock(block),
      merkleroot: block.merkleRoot,
      version: block.version,
      bits: block.bits.toString(16),
      difficulty
    };
  }

  public toAppBlock(block: ApiBlock): AppBlock {
    return {
      height: block.height,
      confirmations: block.confirmations,
      nonce: block.nonce,
      size: block.size,
      virtualSize: block.size,
      hash: block.hash,
      time: new Date(block.time).getTime() / 1000,
      tx: {
        length: block.transactionCount
      },
      txlength: block.transactionCount,
      previousblockhash: block.previousBlockHash,
      nextblockhash: block.nextBlockHash,
      poolInfo: {
        poolName: block.minedBy,
        url: ''
      },
      reward: block.reward
    };
  }

  public getCurrentHeight(
    chainNetwork: ChainNetwork
  ): Observable<ApiEthBlock & ApiUtxoCoinBlock> {
    if (
      !this.tipValue ||
      !this.currentChainNetwork ||
      this.currentChainNetwork !== chainNetwork
    ) {
      this.tipValue = this.requestCurrentHeight(chainNetwork).pipe(
        merge(),
        shareReplay(1)
      );
      this.currentChainNetwork = chainNetwork;
    }
    return this.tipValue;
  }

  public requestCurrentHeight(
    chainNetwork: ChainNetwork
  ): Observable<ApiEthBlock & ApiUtxoCoinBlock> {
    const heightUrl = `${this.api.getUrl(chainNetwork)}/block/tip`;
    return this.httpClient.get<ApiEthBlock & ApiUtxoCoinBlock>(heightUrl);
  }

  public getBlocks(
    chainNetwork: ChainNetwork,
    numBlocks: number = 10
  ): Observable<ApiEthBlock[] & ApiUtxoCoinBlock[]> {
    const url = `${this.api.getUrl(chainNetwork)}/block?limit=${numBlocks}`;
    return this.httpClient.get<ApiEthBlock[] & ApiUtxoCoinBlock[]>(url)
      .retry(3) // optionally add the retry
      .catch((err: HttpErrorResponse) => {
        if (err.error instanceof Error) {
          // A client-side or network error occurred. Handle it accordingly.
          // console.error('An error occurred:', err.error.message);
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
const t = this.showToast();
// tslint:disable-next-line:no-console
console.log(t);

        }

        // ...optionally return a default fallback value so app can continue (pick one)
        // which could be a default value
        // return Observable.of<any>({my: "default value..."});
        // or simply an empty observable
        return of<[]>([]);
      });
  }

  async showToast() {
    const toast = await this.toasty.create({
      message: 'An error occurred while getting the latest block information.',
      duration: 4000
    });
    toast.present();
  }

  public getCoinsForBlockHash(
    blockHash: string,
    chainNetwork: ChainNetwork,
    limit: number,
    page: number
  ): Observable<any> {
    const url = `${this.api.getUrl(
      chainNetwork
    )}/block/${blockHash}/coins/${limit}/${page}`;
    return this.httpClient.get(url);
  }

  /**
   * example: http://localhost:8100/api/BTC/regtest/block?since=582&limit=100&paging=height&direction=1
   */
  public pageBlocks(
    since: number,
    numBlocks: number = 10,
    chainNetwork: ChainNetwork
  ): Observable<ApiEthBlock[] & ApiUtxoCoinBlock[]> {
    const url = `${this.api.getUrl(
      chainNetwork
    )}/block?since=${since}&limit=${numBlocks}&paging=height&direction=-1`;
    return this.httpClient.get<ApiEthBlock[] & ApiUtxoCoinBlock[]>(url);
  }

  public getBlock(
    hash: string,
    chainNetwork: ChainNetwork
  ): Observable<ApiEthBlock & ApiUtxoCoinBlock> {
    const url = `${this.api.getUrl(chainNetwork)}/block/${hash}`;
    return this.httpClient.get<ApiEthBlock & ApiUtxoCoinBlock>(url);
  }
}
