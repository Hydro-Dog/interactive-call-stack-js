import {
  CompileShallowModuleMetadata,
  ExpressionStatement,
} from '@angular/compiler';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { cloneDeep } from 'lodash';
import * as esprima from 'esprima';
import * as estree from 'estree';
import { Observable } from 'rxjs';
import {
  ProgramBlockEnum,
  ProgramBlock,
  lexEnvEmpty,
} from './interfaces/program-block.type';
import {
  ExecutionContextService,
  LexEnvMapInterface,
} from './services/execution-context.service';

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
  programmString: any;

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

  getLexEnvHist(code: string, name: string, parent: string) {
    const parsedSript = esprima.parseScript(code, {
      tolerant: true,
      loc: true,
    });

    const currentLexEnvFin = this.composeLexicalEnviroment(parsedSript.body);
    this.executionContextService.setCurrentLexEnvFin(currentLexEnvFin);

    const currentLexEnvFirstPhase = this.getFitstPhaseLexicalEnviroment(
      currentLexEnvFin
    );

    this.executionContextService.setCurrentLexEnvHist([
      currentLexEnvFirstPhase,
    ]);

    let lexEnvHist = this.executionContextService.getCurrentLexEnvHist();
    const currentLexEnv = lexEnvHist[lexEnvHist.length - 1];

    // step over all FDs and set step index
    this.currentStepIdx = this.findStartIdx(currentLexEnv);

    //iterate over lex env with generated index

    while (this.currentStepIdx < currentLexEnv.length - 1) {
      lexEnvHist = this.executionContextService.getCurrentLexEnvHist();
      const newLexEnv = cloneDeep(lexEnvHist[lexEnvHist.length - 1]);
      const currItem = currentLexEnvFin.find((codeBlock) => {
        return (
          codeBlock.name === currentLexEnv[this.currentStepIdx].name &&
          codeBlock.type === currentLexEnv[this.currentStepIdx].type
        );
      });

      newLexEnv[this.currentStepIdx] = cloneDeep(currItem)!;
      this.currentStepIdx++;
      this.executionContextService.setCurrentLexEnvHist([
        ...lexEnvHist,
        newLexEnv,
      ]);
    }

    this.executionContextService.currentLexEnvName = name;

    console.log(
      'getCurrentLexEnvHist: ',
      this.executionContextService.getCurrentLexEnvHist()
    );

    const exprStatementsArr = [];
    const fdArr = new Map();
    exprStatementsArr.push(
      ...this.findAllExpressionStatements(currentLexEnvFin)
    );

    exprStatementsArr.forEach((exprStatement) => {
      const funcDecl = currentLexEnv.find((lexEnvBlock) => {
        return (
          lexEnvBlock.name === exprStatement.name &&
          (lexEnvBlock.type === ProgramBlockEnum.FunctionDeclaration ||
            lexEnvBlock.type === ProgramBlockEnum.VariableDeclarator)
        );
      });
      if (funcDecl) {
        const start = (funcDecl?.loc as estree.SourceLocation).start.line;
        const end = (funcDecl?.loc as estree.SourceLocation).end.line;
        fdArr.set(funcDecl!.name, { start, end });
      }
    });

    this.executionContextService.nestedLexEnviroments.set(name, {
      hist: this.executionContextService.getCurrentLexEnvHist(),
      idx: this.findStartIdx(currentLexEnv),
      parent,
      funcDeclarationsArr: fdArr,
    });
    console.log(
      'nestedLexEnviroments: ',
      this.executionContextService.nestedLexEnviroments
    );
  }

  findStartIdx(lexEnv: LexEnvEntity[]) {
    const a =
      lexEnv.filter(
        (codeBlock) => codeBlock.type === ProgramBlockEnum.FunctionDeclaration
      ).length - 1;
    return a > 0 ? a : 0;
  }

  getCodeByLines(start: number, end: number, code: string) {
    const codeArr = code.split('\n');
    return codeArr.splice(start, end - start - 1).join('\n');
  }

  findAllExpressionStatements(code: LexEnvEntity[]) {
    return code.filter(
      (codeBlock) => codeBlock.type === ProgramBlockEnum.ExpressionStatement
    );
  }

  getParsedScript(code: string): esprima.Program {
    return esprima.parseScript(code, {
      tolerant: true,
      loc: true,
    });
  }

  onSubmit() {
    this.programmString = this.userInput?.value;
    this.getLexEnvHist(this.programmString, 'global', 'null');
    this.currentStepIdx = this.findStartIdx(
      this.executionContextService.getCurrentLexEnvFin()
    );
  }

  isActiveLine(lineNum: unknown) {
    return this.activeLineNum.includes(lineNum as number);
  }

  goNextBlock() {
    const currLexEnv = this.executionContextService.nestedLexEnviroments.get(
      this.executionContextService.currentLexEnvName
    );

    if (
      currLexEnv?.hist[currLexEnv.idx][currLexEnv.idx].type ===
      ProgramBlockEnum.ExpressionStatement
    ) {
      const fdName = currLexEnv?.hist[currLexEnv.idx][currLexEnv.idx].name!;
      // const currFd = currLexEnv.funcDeclarationsArr.get(fdName!)!;
      const currFd = getCurrFdRecursive(
        currLexEnv,
        fdName,
        this.executionContextService.nestedLexEnviroments
      );
      console.log('fdName: ', fdName, 'currFd: ', currFd);
      if (currFd) {
        const fdCode = this.getCodeByLines(
          currFd.start,
          currFd.end,
          this.programmString
        );
        this.getLexEnvHist(
          fdCode,
          fdName,
          this.executionContextService.currentLexEnvName
        );
      } else {
        console.error('BBBBB');
      }
    }

    console.log('idx: ', currLexEnv!.idx);
    console.log(
      'global func generate currLexEnv hist: ',
      currLexEnv?.hist[currLexEnv.idx]
    );
    console.log('step: ', currLexEnv?.hist[currLexEnv.idx][currLexEnv?.idx]);
    currLexEnv!.idx++;
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

    const hoistedVariables = hoistedValues.map((bodyBlock) => {
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

    const FDs = hoistedVariables.filter(
      (codeBlock) => codeBlock.type === ProgramBlockEnum.FunctionDeclaration
    );
    const vars = hoistedVariables.filter(
      (codeBlock) => codeBlock.type !== ProgramBlockEnum.FunctionDeclaration
    );

    return FDs.concat(vars);
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

    return lexicalEnvArr;
  }
}

export interface LexEnvEntity {
  lexEnvCompleted?: boolean;
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

function getCurrFdRecursive(
  lexEnv: LexEnvMapInterface,
  fdName: string,
  lexEnvsMap: Map<string, LexEnvMapInterface>
) {
  const fd = lexEnv.funcDeclarationsArr.get(fdName);
  if (!fd && lexEnv.parent !== 'null') {
    const parent = lexEnvsMap.get(lexEnv.parent)!;
    getCurrFdRecursive(parent, fdName, lexEnvsMap);
  } else {
    console.error('AAAAAAAA');
  }
  return fd;
}
