import { CompileShallowModuleMetadata } from '@angular/compiler';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import * as esprima from 'esprima';
import * as estree from 'estree';
import { getFuncDeclarationsFromBody } from './helpers/getters/program-body-destructer';
import { FunctionDeclaration } from './interfaces/base-node.interface';
import { ProgramBlockInterface } from './interfaces/program-block.interface';
import {
  ProgramBlockEnum,
  ProgramBlock,
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

  lexicalEnviromentsArr: any[] = [];
  lexicalEnviromentsMap = new Map();
  // currentStepData: codeBlockInterface | undefined;

  activeLineNum!: number[];
  numberOfLines!: number[];

  private userInput = this.codeForm.get('userInput');

  callStack$: any;
  currentLexicalEnviroment$: any;
  currentProgramBlock!: LexicalEnviromentEntity[];

  constructor(
    private fb: FormBuilder,
    private executionContextService: ExecutionContextService
  ) {
    this.callStack$ = this.executionContextService.callStack$;
    this.currentLexicalEnviroment$ = this.executionContextService.currentLexicalEnviroment$;
  }

  ngOnInit() {
    this.numberOfLines = Array.from({ length: 30 }, (item, i) => i + 1);
    this.activeLineNum = [2, 3, 4];

    this.executionContextService.currentLexicalEnviroment$.subscribe((x) =>
      console.log('x: ', x)
    );
  }

  onSubmit() {
    this.parsedSript = esprima.parseScript(this.userInput?.value, {
      tolerant: true,
      loc: true,
    });

    const globalLE = this.composeLexicalEnviroment(this.parsedSript.body);

    const firstPhase = this.getFitstPhaseLexicalEnviroment(globalLE);

    this.executionContextService.setCurrentLexicalEnviroment(firstPhase);

    console.log('this.parsedSript: ', this.parsedSript);

    console.log('globalLE: ', globalLE);
    this.currentProgramBlock = [...globalLE];
    console.log('this.currentProgramBlock: ', this.currentProgramBlock);
  }

  isActiveLine(lineNum: unknown) {
    return this.activeLineNum.includes(lineNum as number);
  }

  goNextBlock() {
    console.log('curr step: ', this.currentProgramBlock[this.currentStepIdx++]);
  }

  goPrevBlock() {}

  getFitstPhaseLexicalEnviroment(
    lexicalEnviromentEntityArray: LexicalEnviromentEntity[]
  ) {
    const hoistedValues = lexicalEnviromentEntityArray.filter((bodyBlock) => {
      return (
        bodyBlock.type === ProgramBlockEnum.FunctionDeclaration ||
        bodyBlock.kind === 'var'
      );
    });

    return hoistedValues.map((bodyBlock) => {
      if (bodyBlock.kind === 'var') {
        bodyBlock.value = undefined;
      }

      return bodyBlock;
    });
  }

  composeLexicalEnviroment(body: ProgramBlock[]): LexicalEnviromentEntity[] {
    const lexicalEnvArr: LexicalEnviromentEntity[] = [];

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

interface LexicalEnviromentEntity {
  name: string | undefined;
  type: 'ExpressionStatement' | 'FunctionDeclaration' | 'VariableDeclarator';
  kind: 'var' | 'let' | 'const' | null;
  value: string | number | bigint | true | RegExp | null | undefined;
  loc: estree.SourceLocation | null | undefined;
}

// interface codeBlockInterface {
//   loc: any;
//   type: string;
//   body: any;
//   params?: any;
//   expression?: any;
// }
