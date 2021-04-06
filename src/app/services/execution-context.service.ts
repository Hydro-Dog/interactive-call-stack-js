import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExecutionContextService {
  private callStack = new ReplaySubject();
  callStack$ = this.callStack.asObservable();

  private currentLexicalEnviroment = new ReplaySubject();
  currentLexicalEnviroment$ = this.currentLexicalEnviroment;

  setCallStack(val: any) {
    this.callStack.next(val);
  }

  setCurrentLexicalEnviroment(val: any) {
    this.currentLexicalEnviroment.next(val);
  }
}
