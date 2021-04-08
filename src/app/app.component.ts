import { CompileShallowModuleMetadata } from '@angular/compiler';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { cloneDeep } from 'lodash';
import * as esprima from 'esprima';
import * as estree from 'estree';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { getFuncDeclarationsFromBody } from './helpers/getters/program-body-destructer';
import { FunctionDeclaration } from './interfaces/base-node.interface';
import { ProgramBlockInterface } from './interfaces/program-block.interface';
import {
  ProgramBlockEnum,
  ProgramBlock,
  lexEnvEmpty,
} from './interfaces/program-block.type';
import { VariableDeclarationInterface } from './interfaces/variable-declaration.interface';
import { ExecutionContextService } from './services/execution-context.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  codeForm = this.fb.group({
    userInput: '',
  });
  parsedSript!: estree.Program;
  currentStepIdx = 0;

  activeLineNum!: number[];
  numberOfLines!: number[];

  private userInput = this.codeForm.get('userInput');

  callStackHist$: any;
  currentProgramBlock!: LexEnvEntity[];
  lexEnvHist$: Observable<Array<LexEnvEntity[]>>;
  currentLexEnvFin$: Observable<LexEnvEntity[]>;

  constructor(
    private fb: FormBuilder,
    private executionContextService: ExecutionContextService
  ) {
    this.callStackHist$ = this.executionContextService.callStackHist$;
    this.lexEnvHist$ = this.executionContextService.lexEnvHist$;
    this.currentLexEnvFin$ = this.executionContextService.currentLexEnvFin$;
  }

  ngOnInit() {
    // this.numberOfLines = Array.from({ length: 30 }, (item, i) => i + 1);
    // this.activeLineNum = [2, 3, 4];
    // this.lexEnvHist$.subscribe((x: any) => {
    //   this.currentLexEnvFin$ = x;
    //   console.log('this.currentLexEnvFin: ', this.currentLexEnvFin$);
    // });
  }

  onSubmit() {
    this.parsedSript = esprima.parseScript(this.userInput?.value, {
      tolerant: true,
      loc: true,
    });

    const globalLexEnvFin = this.composeLexicalEnviroment(
      this.parsedSript.body
    );

    this.executionContextService.setCurrentLexEnvFin(globalLexEnvFin);

    const globalLexEnvFirstPhase = this.getFitstPhaseLexicalEnviroment(
      globalLexEnvFin
    );

    this.executionContextService.setCurrentLexEnvHist([globalLexEnvFirstPhase]);
  }

  isActiveLine(lineNum: unknown) {
    return this.activeLineNum.includes(lineNum as number);
  }

  goNextBlock() {
    const lexEnvHist = this.executionContextService.getCurrentLexEnvHist();
    const currentLexEnv = lexEnvHist[lexEnvHist.length - 1];
    const currentLexEnvFin = this.executionContextService.getCurrentLexEnvFin();

    const newLexEnv = currentLexEnv.map((codeBlock) => {
      if (
        codeBlock.name === currentLexEnvFin[this.currentStepIdx].name &&
        codeBlock.type === currentLexEnvFin[this.currentStepIdx].type
      ) {
        codeBlock = cloneDeep(currentLexEnvFin[this.currentStepIdx]);
      }

      return codeBlock;
    });

    this.currentStepIdx++;
    this.executionContextService.setCurrentLexEnvHist([
      ...lexEnvHist,
      newLexEnv,
    ]);

    console.log('hist: ', this.executionContextService.getCurrentLexEnvHist());
  }

  goPrevBlock() {}

  getFitstPhaseLexicalEnviroment(lexicalEnviromentEntityArray: LexEnvEntity[]) {
    const hoistedValues = cloneDeep(lexicalEnviromentEntityArray).filter(
      (bodyBlock) => {
        return (
          bodyBlock.type === ProgramBlockEnum.FunctionDeclaration ||
          bodyBlock.type === ProgramBlockEnum.ExpressionStatement ||
          bodyBlock.kind === 'var' ||
          bodyBlock.kind === 'let' ||
          bodyBlock.kind === 'const'
        );
      }
    );

    return hoistedValues.map((bodyBlock) => {
      if (bodyBlock.kind === 'var') {
        bodyBlock.value = 'undefined';
      } else if (bodyBlock.kind === 'let' || bodyBlock.kind === 'const') {
        bodyBlock.value = 'uninitialized';
      }
      if (bodyBlock.type === ProgramBlockEnum.ExpressionStatement) {
        bodyBlock.lexEnv = lexEnvEmpty;
        bodyBlock.scope = cloneDeep(
          this.executionContextService.getCurrentLexEnvFin()
        );
      }

      return bodyBlock;
    });
  }

  composeLexicalEnviroment(body: ProgramBlock[]): LexEnvEntity[] {
    const lexicalEnvArr: LexEnvEntity[] = [];

    body.forEach((bodyBlock: ProgramBlock, i: number, arr: ProgramBlock[]) => {
      if (bodyBlock.type === ProgramBlockEnum.VariableDeclaration) {
        const name = (bodyBlock.declarations[0].id as estree.Identifier).name;
        const value =
          (bodyBlock.declarations[0].init as estree.Literal).value ||
          (bodyBlock.declarations[0].init as estree.Expression).type;
        const type = bodyBlock.declarations[0].type;
        const kind = bodyBlock.kind;
        const loc = bodyBlock.loc;

        lexicalEnvArr.push({ name, type, kind, value, loc });
      }

      if (bodyBlock.type === ProgramBlockEnum.FunctionDeclaration) {
        const name = bodyBlock.id?.name;
        const value = null;
        const type = bodyBlock.type;
        const kind = null;
        const loc = bodyBlock.loc;

        lexicalEnvArr.push({ name, type, kind, value, loc });
      }

      if (bodyBlock.type === ProgramBlockEnum.ExpressionStatement) {
        const name = ((bodyBlock.expression as estree.CallExpression)
          .callee as estree.Identifier).name;
        const value = null;
        const type = bodyBlock.type;
        const kind = null;
        const loc = bodyBlock.loc;

        lexicalEnvArr.push({ name, type, kind, value, loc });
      }
    });
    console.log('lexicalEnvArr: ', lexicalEnvArr);

    return lexicalEnvArr;
  }
}

export interface LexEnvEntity {
  name: string | undefined;
  type:
    | 'ExpressionStatement'
    | 'FunctionDeclaration'
    | 'VariableDeclarator'
    | 'empty';
  kind: 'var' | 'let' | 'const' | 'empty' | null;
  value: string | number | bigint | true | RegExp | null | undefined | 'empty';
  loc: estree.SourceLocation | null | undefined | 'empty';
  lexEnv?: LexEnvEntity;
  scope?: LexEnvEntity[];
}
