import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import * as esprima from 'esprima';
import { getLexicalEnviroment } from './helpers/getters/lexical-enviroment.getter';
import { FunctionDeclaration } from './interfaces/base-node.interface';
import { ProgramBlockInterface } from './interfaces/program-block.interface';
import { ProgramBlockEnum } from './interfaces/program-block.type';
import { VariableDeclarationInterface } from './interfaces/variable-declaration.interface';

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
  parsedSript!: { body: ProgramBlockInterface[] };
  currentStepIdx = 0;
  currentStepData: codeBlockInterface | undefined;

  activeLineNum!: number[];
  numberOfLines!: number[];

  private userInput = this.codeForm.get('userInput');
  arrayedScript: any[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.numberOfLines = Array.from({ length: 30 }, (item, i) => i + 1);
    this.activeLineNum = [2, 3, 4];
  }

  onSubmit() {
    this.arrayedScript = [];
    console.log(
      'res parse: ',
      esprima.parseScript(this.userInput?.value, {
        tolerant: true,
        loc: true,
      })
    );

    this.parsedSript = esprima.parseScript(this.userInput?.value, {
      tolerant: true,
      loc: true,
    });

    this.parsedSript.body.forEach((bodyBlock: any, i: number) => {
      const newProgramBlock = {
        loc: bodyBlock.loc,
        type: bodyBlock.type,
        body: bodyBlock?.body,
        params: bodyBlock?.params,
        expression: bodyBlock?.expression,
      };
      this.arrayedScript.push(newProgramBlock);
      if (
        (bodyBlock as ProgramBlockInterface).type ===
        ProgramBlockEnum.FunctionDeclaration
      ) {
        console.log('bodyBlock: ', bodyBlock);
        console.log(
          'bodyBlock.body: ',
          (bodyBlock as FunctionDeclaration).body.body
        );
        console.log(
          `${bodyBlock.id.name} LE: `,
          getLexicalEnviroment((bodyBlock as FunctionDeclaration).body.body)
        );
      }
    });

    console.log('this.arrayedScript: ', this.arrayedScript);
    console.log(
      'global LE: ',
      getLexicalEnviroment(this.parsedSript.body as ProgramBlockInterface[])
    );
  }

  isActiveLine(lineNum: unknown) {
    return this.activeLineNum.includes(lineNum as number);
  }

  goNextBlock() {
    this.currentStepIdx++;
    this.currentStepData = this.arrayedScript[this.currentStepIdx];
    console.log('this.currentStepData: ', this.currentStepData);
  }

  goPrevBlock() {}
}

interface codeBlockInterface {
  loc: any;
  type: string;
  body: any;
  params?: any;
  expression?: any;
}
