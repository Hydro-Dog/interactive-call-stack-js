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

    const arr = getFuncDeclarationsFromBody(this.parsedSript.body, 'array');
    const map = getFuncDeclarationsFromBody(this.parsedSript.body, 'map');
    console.log('arr: ', arr);
    console.log('map: ', map);
    console.log('this.parsedSript: ', this.parsedSript);
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
