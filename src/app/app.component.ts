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
    const programm = getParsedScript(programmString) as estree.Program;
    generateLexEnvRecursive(programm.body, 'global', 'null');

    const globaFirstStep = generateFirstStepLexEnv(programm.body);

    generateLexEnvLog(scopes[0].body, scopes[0].lexEnvLog[0]);

    // const a = scopes.map((scope) => {
    //   const copy = cloneDeep(scope.lexEnvLog[0]);
    //   return {
    //     ...scope,
    //     lexEnvLog: generateLexEnvLog(cloneDeep(scope.body), copy),
    //   };
    // });

    console.log('RESULT! ', this.addLexEnvLogs());
  }

  addLexEnvLogs() {
    console.log('addLexEnvLogs called');
    console.log('scopes: ', scopes);
    const a = scopes.map((scope, i, array) => {
      const copy = cloneDeep(scope.lexEnvLog[0]);
      console.log('gen logs: ', generateLexEnvLog(scope.body, copy));
      return {
        ...scope,
        lexEnvLog: generateLexEnvLog(scope.body, copy),
      };
    });

    console.log('aaaaaa: ', a);
  }
}

//event soursing (event driven approach) каждое распарсивание - это ивент
//хранить списком FD по uuid, и забить на вложенность

const log = [];
const scopes: any[] = [];

function generateLexEnvRecursive(
  body: Array<
    | estree.FunctionDeclaration
    | estree.Directive
    | estree.Statement
    | estree.ModuleDeclaration
  >,
  name: string,
  parent: string
) {
  const lexEnv = generateFirstStepLexEnv(body);
  scopes.push({ name, body, parent, lexEnvLog: [lexEnv] });
  body.forEach((entity) => {
    if (entity.type === ProgramBlockEnum.FunctionDeclaration) {
      generateLexEnvRecursive(entity!.body!.body, entity.id!.name, name);
    }
  });
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
): EnviromentRecordEntity[] {
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
    let loc = {};

    switch (entity.type) {
      case ProgramBlockEnum.FunctionDeclaration:
        name = entity.id!.name;
        type = entity.type;
        kind = entity.type;
        value = 'initialized';
        loc = entity.loc!;
        return { name, type, value, loc };
      case ProgramBlockEnum.VariableDeclaration:
        name = ((((entity as estree.VariableDeclaration)
          .declarations[0] as unknown) as estree.VariableDeclarator)
          .id as estree.Identifier).name;
        type = entity.type;
        kind = entity.kind;
        loc = (((entity as estree.VariableDeclaration)
          .declarations[0] as unknown) as estree.VariableDeclarator).loc!;
        if (entity.kind === 'var') {
          value = 'undefined';
        } else {
          value = 'ininitialized';
        }
        return { name, type, kind, value, loc };
      case ProgramBlockEnum.ExpressionStatement:
        name = (((((entity as unknown) as estree.Directive)
          .expression as unknown) as estree.BaseCallExpression)
          .callee as estree.Identifier).name;
        type = 'ExpressionStatement';
        loc = (((((entity as unknown) as estree.Directive)
          .expression as unknown) as estree.BaseCallExpression)
          .callee as estree.Identifier).loc!;
        return { name, type, kind, value, loc };
      default:
        return {
          name: 'lol',
          type: 'rofl',
          kind: 'come on',
          value: 'see ya',
          loc: 'hell yeag',
        };
    }
  });

  return firstStepLexEnv;
}

interface EnviromentRecordEntity {
  name: string;
  type: string;
  kind?: string;
  value: any;
}

function generateLexEnvLog(
  body: Array<
    | estree.FunctionDeclaration
    | estree.Directive
    | estree.Statement
    | estree.ModuleDeclaration
  >,
  lexEnvFirstStep: EnviromentRecordEntity[]
) {
  console.log('body: ', body, 'lexEnvFirstStep: ', lexEnvFirstStep);
  const resultLog: EnviromentRecordEntity[][] = [lexEnvFirstStep];

  lexEnvFirstStep.forEach((entity, i, array) => {
    if (entity.type === ProgramBlockEnum.VariableDeclaration) {
      const variable = body.find((block) => {
        return (
          block.type === ProgramBlockEnum.VariableDeclaration &&
          getVarName(block) === entity.name
        );
      });

      const newLexEnv = {
        ...entity,
        value: getVarValue(variable as estree.VariableDeclaration)
          ? getVarValue(variable as estree.VariableDeclaration)
          : entity.value,
      };

      const lexEnvCopy = cloneDeep(resultLog[resultLog.length - 1]);
      lexEnvCopy[i] = newLexEnv;
      resultLog.push((lexEnvCopy as unknown) as EnviromentRecordEntity[]);
    }
    console.log('resultLog: ', resultLog);
  });
  return resultLog;
}

function getVarValue(block: estree.VariableDeclaration) {
  return (block.declarations[0].init as estree.Literal).value;
}

function getVarName(block: estree.VariableDeclaration) {
  return (block.declarations[0].id as estree.Identifier).name;
}

function pushLexEnv(lexEnv: any, loc: any) {
  log.push({ lexEnv, loc });
}

interface LexEnvInterface {
  envRec: EnviromentRecordEntity[];
  outerEnv: LexEnvInterface;
}
