import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { cloneDeep } from 'lodash';
import * as esprima from 'esprima';
import * as estree from 'estree';
import {
  ProgramBlockEnum,
  LexEnvEntity,
} from './interfaces/program-block.type';
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

  private userInput = this.codeForm.get('userInput');

  constructor(
    private fb: FormBuilder,
    private executionContextService: ExecutionContextService
  ) {}

  ngOnInit() {}

  getParsedScript(code: string): esprima.Program {
    return esprima.parseScript(code, {
      tolerant: true,
      loc: true,
    });
  }

  onSubmit() {
    const programmString = this.userInput?.value;
    console.log('getParsedScript: ', this.getParsedScript(programmString));
    const programm = this.getParsedScript(programmString) as estree.Program;
    generateLexEnvRecursive(programm.body);
  }
}

//event soursing (event driven approach) каждое распарсивание - это ивент
//хранить списком FD по uuid, и забить на вложенность

function generateLexEnvRecursive(
  body: Array<
    | estree.FunctionDeclaration
    | estree.Directive
    | estree.Statement
    | estree.ModuleDeclaration
  >
) {
  console.log('body: ', body);
  body.forEach((entity) => {
    if (entity.type === ProgramBlockEnum.FunctionDeclaration) {
      console.log('entity: ', entity);
      generateLexEnvRecursive(entity!.body!.body);
    }
  });
}
