import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { lexEnvEmpty, LexEnvEntity } from '../interfaces/program-block.type';

@Injectable({ providedIn: 'root' })
export class ExecutionContextService {
  private callStackHist = new BehaviorSubject([]);
  callStackHist$ = this.callStackHist.asObservable();

  private lexEnvHist = new BehaviorSubject<Array<LexEnvEntity[]>>([]);
  lexEnvHist$ = this.lexEnvHist.asObservable();

  private currentLexEnvFin = new BehaviorSubject<LexEnvEntity[]>([lexEnvEmpty]);
  currentLexEnvFin$ = this.currentLexEnvFin.asObservable();

  nestedLexEnviroments: Map<string, LexEnvMapInterface> = new Map();

  currentLexEnvName: string = '';

  setCallStack(val: any) {
    this.callStackHist.next(val);
  }

  setCurrentLexEnvHist(val: any) {
    this.lexEnvHist.next(val);
  }

  setCurrentLexEnvFin(val: any) {
    this.currentLexEnvFin.next(val);
  }

  getCallStack() {
    return this.callStackHist.value;
  }

  getCurrentLexEnvHist(): Array<LexEnvEntity[]> {
    return this.lexEnvHist.value;
  }

  getCurrentLexEnvFin(): LexEnvEntity[] {
    return this.currentLexEnvFin.value;
  }
}

export interface LexEnvMapInterface {
  hist: LexEnvEntity[][];
  idx: number;
  parent: string;
  funcDeclarationsArr: Map<string, { start: number; end: number }>;
}
