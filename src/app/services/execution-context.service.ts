import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LexEnvEntity } from '../app.component';
import { lexEnvEmpty } from '../interfaces/program-block.type';

@Injectable({ providedIn: 'root' })
export class ExecutionContextService {
  private callStackHist = new BehaviorSubject([]);
  callStackHist$ = this.callStackHist.asObservable();

  private lexEnvHist = new BehaviorSubject<Array<LexEnvEntity[]>>([]);
  lexEnvHist$ = this.lexEnvHist.asObservable();

  private currentLexEnvFin = new BehaviorSubject<LexEnvEntity[]>([lexEnvEmpty]);
  currentLexEnvFin$ = this.currentLexEnvFin.asObservable();

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
