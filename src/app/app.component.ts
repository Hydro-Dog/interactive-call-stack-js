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

  onSubmit() {
    const programmString = this.userInput?.value;
    console.log('getParsedScript: ', getParsedScript(programmString));
    const programm = getParsedScript(programmString) as estree.Program;
    generateLexEnvRecursive(programm.body, 'global');

    const globaFirstStep = generateFirstStepLexEnv(programm.body);
    console.log('globaFirstStep: ', globaFirstStep);
  }
}

//event soursing (event driven approach) каждое распарсивание - это ивент
//хранить списком FD по uuid, и забить на вложенность

const scopes: any[] = [];

function generateLexEnvRecursive(
  body: Array<
    | estree.FunctionDeclaration
    | estree.Directive
    | estree.Statement
    | estree.ModuleDeclaration
  >,
  name: string
) {
  console.log('body: ', body);
  scopes.push({ name, body });
  body.forEach((entity) => {
    if (entity.type === ProgramBlockEnum.FunctionDeclaration) {
      console.log('entity: ', entity);
      generateLexEnvRecursive(entity!.body!.body, entity.id!.name);
    }
  });

  console.log('scopes: ', scopes);
}

function getParsedScript(code: string): esprima.Program {
  return esprima.parseScript(code, {
    tolerant: true,
    loc: true,
  });
}

function generateFirstStepLexEnv(
  body: Array<
    | estree.FunctionDeclaration
    | estree.Directive
    | estree.Statement
    | estree.ModuleDeclaration
  >
) {
  let firstStepLexEnvBody = [];
  let firstStepLexEnv = [];

  const functionDeclarations = body.filter(
    (entity) => entity.type === ProgramBlockEnum.FunctionDeclaration
  );

  const notFunctionDeclarations = body.filter(
    (entity) => entity.type !== ProgramBlockEnum.FunctionDeclaration
  );

  firstStepLexEnvBody = [...functionDeclarations, ...notFunctionDeclarations];

  firstStepLexEnv = firstStepLexEnvBody.map((entity) => {
    let name = '';
    let type = '';
    let kind = '';
    let value: any = '';

    switch (entity.type) {
      case ProgramBlockEnum.FunctionDeclaration:
        name = entity.id!.name;
        type = entity.type;
        kind = entity.type;
        value = 'initialized';
        return { name, type, value };
      case ProgramBlockEnum.VariableDeclaration:
        name = (((entity as estree.VariableDeclaration)
          .declarations[0] as unknown) as estree.Identifier).name;
        type = entity.type;
        kind = entity.kind;
        if (entity.kind === 'var') {
          value = 'undefined';
        } else {
          value = 'ininitialized';
        }
        return { name, type, kind, value };
      default:
        return { name: 'lol', type: 'rofl', kind: 'come on', value: 'see ya' };
    }
  });

  return firstStepLexEnv;
}
